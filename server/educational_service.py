"""
Educational service module for handling PDF processing, OCR, and RAG with Google GenAI and MongoDB
"""
import os
import io
import logging
from typing import Dict, List, Optional, Tuple
from werkzeug.utils import secure_filename
import PyPDF2
import pdfplumber
from PIL import Image
import pytesseract
import cv2
import numpy as np
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain_google_genai import GoogleGenerativeAIEmbeddings, ChatGoogleGenerativeAI
from langchain_mongodb import MongoDBAtlasVectorSearch
from langchain.chains import RetrievalQA
from langchain.prompts import PromptTemplate
from pymongo import MongoClient

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class EducationalService:
    def __init__(self):
        """Initialize educational service with Google GenAI and MongoDB components"""
        self.api_key = os.getenv('GOOGLE_API_KEY')
        self.mongodb_uri = os.getenv('MONGODB_URI', 'mongodb://localhost:27017/')
        self.db_name = os.getenv('MONGODB_DB_NAME', 'educational_ai')
        self.collection_name = os.getenv('MONGODB_COLLECTION_NAME', 'documents')
        
        if not self.api_key:
            logger.warning("Google API key not found. Some features may not work.")
        
        # Initialize components
        try:
            # Initialize Gemini embeddings
            self.embeddings = GoogleGenerativeAIEmbeddings(
                model="models/embedding-001",
                google_api_key=self.api_key
            )
            
            # Initialize Gemini chat model
            self.chat_model = ChatGoogleGenerativeAI(
                model="gemini-pro",
                google_api_key=self.api_key,
                temperature=0.3,  # Lower temperature for educational content
                convert_system_message_to_human=True
            )
            
            # Text splitter for educational content
            self.text_splitter = RecursiveCharacterTextSplitter(
                chunk_size=1000,
                chunk_overlap=200,
                separators=["\n\n", "\n", ". ", "! ", "? ", " ", ""]
            )
            
            # Initialize MongoDB connection
            self._init_mongodb()
            
            # Educational prompt template
            self.educational_prompt = PromptTemplate(
                input_variables=["context", "question"],
                template="""You are an educational AI assistant using Google's Gemini model. Use the following context from educational materials to answer the student's question. 
                
Be helpful, clear, and educational in your response. If you don't know the answer based on the context, say so clearly.

Context from educational materials:
{context}

Student's question: {question}

Educational response:"""
            )
            
            logger.info("Educational service initialized successfully with Google GenAI and MongoDB")
        except Exception as e:
            logger.error(f"Error initializing educational service: {str(e)}")
            self.embeddings = None
            self.chat_model = None
            self.vector_store = None
    
    def _init_mongodb(self):
        """Initialize MongoDB connection and vector store"""
        try:
            # Connect to MongoDB
            self.mongo_client = MongoClient(self.mongodb_uri)
            
            # Test connection
            self.mongo_client.admin.command('ping')
            logger.info("Successfully connected to MongoDB")
            
            # Initialize MongoDB Atlas Vector Search
            self.vector_store = MongoDBAtlasVectorSearch(
                collection=self.mongo_client[self.db_name][self.collection_name],
                embedding=self.embeddings,
                index_name="vector_index",
                text_key="text",
                embedding_key="embedding"
            )
            
            # Create/update QA chain
            self._create_qa_chain()
            
        except Exception as e:
            logger.error(f"Error connecting to MongoDB: {str(e)}")
            self.mongo_client = None
            self.vector_store = None
    
    def extract_text_from_pdf(self, pdf_file) -> Dict[str, str]:
        """
        Extract text from PDF file using both PyPDF2 and pdfplumber
        
        Args:
            pdf_file: File object or file path
            
        Returns:
            Dictionary with extracted text and metadata
        """
        try:
            extracted_text = ""
            metadata = {
                'pages': 0,
                'method': 'combined',
                'success': True
            }
            
            # Try pdfplumber first (better for complex layouts)
            try:
                with pdfplumber.open(pdf_file) as pdf:
                    metadata['pages'] = len(pdf.pages)
                    for page_num, page in enumerate(pdf.pages):
                        text = page.extract_text()
                        if text:
                            extracted_text += f"\n--- Page {page_num + 1} ---\n{text}\n"
                    
                    if extracted_text.strip():
                        metadata['method'] = 'pdfplumber'
                        return {
                            'text': extracted_text.strip(),
                            'metadata': metadata,
                            'status': 'success'
                        }
            except Exception as e:
                logger.warning(f"pdfplumber failed: {str(e)}, trying PyPDF2")
            
            # Fallback to PyPDF2
            if isinstance(pdf_file, str):
                with open(pdf_file, 'rb') as file:
                    pdf_reader = PyPDF2.PdfReader(file)
                    metadata['pages'] = len(pdf_reader.pages)
                    
                    for page_num, page in enumerate(pdf_reader.pages):
                        text = page.extract_text()
                        if text:
                            extracted_text += f"\n--- Page {page_num + 1} ---\n{text}\n"
            else:
                pdf_reader = PyPDF2.PdfReader(pdf_file)
                metadata['pages'] = len(pdf_reader.pages)
                
                for page_num, page in enumerate(pdf_reader.pages):
                    text = page.extract_text()
                    if text:
                        extracted_text += f"\n--- Page {page_num + 1} ---\n{text}\n"
            
            metadata['method'] = 'PyPDF2'
            
            if not extracted_text.strip():
                return {
                    'text': '',
                    'metadata': metadata,
                    'status': 'error',
                    'message': 'No text could be extracted from PDF'
                }
            
            return {
                'text': extracted_text.strip(),
                'metadata': metadata,
                'status': 'success'
            }
            
        except Exception as e:
            logger.error(f"Error extracting text from PDF: {str(e)}")
            return {
                'text': '',
                'metadata': {'pages': 0, 'method': 'failed', 'success': False},
                'status': 'error',
                'message': f'Error processing PDF: {str(e)}'
            }
    
    def preprocess_image_for_ocr(self, image: Image.Image) -> Image.Image:
        """
        Preprocess image for better OCR results
        
        Args:
            image: PIL Image object
            
        Returns:
            Preprocessed PIL Image
        """
        try:
            # Convert to OpenCV format
            opencv_image = cv2.cvtColor(np.array(image), cv2.COLOR_RGB2BGR)
            
            # Convert to grayscale
            gray = cv2.cvtColor(opencv_image, cv2.COLOR_BGR2GRAY)
            
            # Apply denoising
            denoised = cv2.fastNlMeansDenoising(gray)
            
            # Apply threshold to get better contrast
            _, thresh = cv2.threshold(denoised, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)
            
            # Convert back to PIL Image
            processed_image = Image.fromarray(thresh)
            
            return processed_image
        except Exception as e:
            logger.warning(f"Image preprocessing failed: {str(e)}, using original image")
            return image
    
    def extract_text_from_image(self, image_file) -> Dict[str, str]:
        """
        Extract text from image using OCR (Tesseract)
        
        Args:
            image_file: File object or file path
            
        Returns:
            Dictionary with extracted text and metadata
        """
        try:
            # Open and process image
            if isinstance(image_file, str):
                image = Image.open(image_file)
            else:
                image = Image.open(image_file)
            
            # Preprocess image for better OCR
            processed_image = self.preprocess_image_for_ocr(image)
            
            # Extract text using Tesseract
            extracted_text = pytesseract.image_to_string(processed_image, config='--psm 6')
            
            # Get additional info
            confidence_data = pytesseract.image_to_data(processed_image, output_type=pytesseract.Output.DICT)
            confidences = [int(conf) for conf in confidence_data['conf'] if int(conf) > 0]
            avg_confidence = sum(confidences) / len(confidences) if confidences else 0
            
            metadata = {
                'image_size': image.size,
                'mode': image.mode,
                'avg_confidence': round(avg_confidence, 2),
                'text_length': len(extracted_text.strip())
            }
            
            if not extracted_text.strip():
                return {
                    'text': '',
                    'metadata': metadata,
                    'status': 'warning',
                    'message': 'No text could be extracted from image'
                }
            
            return {
                'text': extracted_text.strip(),
                'metadata': metadata,
                'status': 'success'
            }
            
        except Exception as e:
            logger.error(f"Error extracting text from image: {str(e)}")
            return {
                'text': '',
                'metadata': {},
                'status': 'error',
                'message': f'Error processing image: {str(e)}'
            }
    
    def add_documents_to_rag(self, texts: List[str], sources: List[str] = None) -> Dict:
        """
        Add documents to MongoDB Vector RAG system
        
        Args:
            texts: List of document texts
            sources: List of source names for the documents
            
        Returns:
            Dictionary with processing status
        """
        try:
            if not self.embeddings or not self.vector_store:
                return {
                    'status': 'error',
                    'message': 'Embeddings or MongoDB vector store not available'
                }
            
            # Split texts into chunks
            all_chunks = []
            chunk_sources = []
            
            for i, text in enumerate(texts):
                chunks = self.text_splitter.split_text(text)
                all_chunks.extend(chunks)
                
                # Add source information
                source_name = sources[i] if sources and i < len(sources) else f"Document_{i+1}"
                chunk_sources.extend([source_name] * len(chunks))
            
            # Create metadata for chunks
            metadatas = [{'source': source} for source in chunk_sources]
            
            # Add texts to MongoDB vector store
            self.vector_store.add_texts(all_chunks, metadatas=metadatas)
            
            # Create/update QA chain
            self._create_qa_chain()
            
            return {
                'status': 'success',
                'message': f'Added {len(all_chunks)} chunks from {len(texts)} documents to MongoDB',
                'chunks_count': len(all_chunks),
                'documents_count': len(texts)
            }
            
        except Exception as e:
            logger.error(f"Error adding documents to MongoDB RAG: {str(e)}")
            return {
                'status': 'error',
                'message': f'Error adding documents: {str(e)}'
            }
    
    def _create_qa_chain(self):
        """Create QA chain for educational queries"""
        try:
            if self.vector_store and self.chat_model:
                retriever = self.vector_store.as_retriever(
                    search_kwargs={"k": 4}  # Retrieve top 4 relevant chunks
                )
                
                self.qa_chain = RetrievalQA.from_chain_type(
                    llm=self.chat_model,
                    chain_type="stuff",
                    retriever=retriever,
                    chain_type_kwargs={"prompt": self.educational_prompt},
                    return_source_documents=True
                )
        except Exception as e:
            logger.error(f"Error creating QA chain: {str(e)}")
    
    def educational_chat(self, question: str) -> Dict:
        """
        Answer educational questions using RAG
        
        Args:
            question: Student's question
            
        Returns:
            Dictionary with answer and source information
        """
        try:
            if not self.qa_chain:
                return {
                    'answer': 'No educational materials have been uploaded yet. Please upload PDF or image materials first.',
                    'sources': [],
                    'status': 'warning'
                }
            
            # Get answer using RAG
            result = self.qa_chain({"query": question})
            
            # Extract source information
            sources = []
            for doc in result.get('source_documents', []):
                source_info = {
                    'content': doc.page_content[:200] + "..." if len(doc.page_content) > 200 else doc.page_content,
                    'source': doc.metadata.get('source', 'Unknown')
                }
                sources.append(source_info)
            
            return {
                'answer': result['result'],
                'sources': sources,
                'status': 'success'
            }
            
        except Exception as e:
            logger.error(f"Error in educational chat: {str(e)}")
            return {
                'answer': f'Error processing question: {str(e)}',
                'sources': [],
                'status': 'error'
            }
    
    def educational_audio_chat(self, audio_data: bytes, mime_type: str) -> Dict:
        """
        Answer educational questions using direct audio input to Gemini
        
        Args:
            audio_data: Raw audio bytes
            mime_type: MIME type of the audio (e.g., 'audio/wav', 'audio/mp3')
            
        Returns:
            Dictionary with answer and source information
        """
        try:
            if not self.chat_model:
                return {
                    'answer': 'Educational AI service is not properly initialized.',
                    'sources': [],
                    'status': 'error'
                }
            
            # Import google.genai for direct audio handling
            try:
                from google.genai import types
                import google.generativeai as genai
                
                # Configure the client
                genai.configure(api_key=self.api_key)
                model = genai.GenerativeModel('gemini-2.0-flash')
                
                # Create audio part from bytes
                audio_part = types.Part.from_bytes(
                    data=audio_data,
                    mime_type=mime_type
                )
                
                # Get context from knowledge base if available
                context_prompt = """You are an educational AI assistant. Please answer the student's audio question clearly and helpfully. 
                
If you can understand the audio, provide a comprehensive educational response. If you need clarification, ask for it.
                
Please respond with educational content that helps the student learn."""
                
                # If we have a knowledge base, try to get relevant context
                if self.vector_store:
                    try:
                        # For audio, we can't do similarity search ahead of time
                        # So we'll rely on Gemini's understanding and our educational prompt
                        context_prompt += """
                        
You have access to educational materials that have been uploaded. Use your understanding to provide helpful educational responses."""
                    except Exception as e:
                        logger.warning(f"Could not retrieve context from knowledge base: {str(e)}")
                
                # Generate response with audio input
                response = model.generate_content([
                    context_prompt,
                    "Please analyze this audio and provide an educational response:",
                    audio_part
                ])
                
                return {
                    'answer': response.text,
                    'sources': [{'content': 'Direct audio processing with Gemini AI', 'source': 'Audio Input'}],
                    'status': 'success',
                    'audio_processed': True
                }
                
            except ImportError as ie:
                logger.error(f"Google GenAI library not available for direct audio: {str(ie)}")
                return {
                    'answer': 'Audio processing requires updated Google GenAI library.',
                    'sources': [],
                    'status': 'error'
                }
            
        except Exception as e:
            logger.error(f"Error in educational audio chat: {str(e)}")
            return {
                'answer': f'Error processing audio: {str(e)}',
                'sources': [],
                'status': 'error'
            }
    
    def get_knowledge_base_stats(self) -> Dict:
        """Get statistics about the current MongoDB knowledge base"""
        try:
            if not self.vector_store or not self.mongo_client:
                return {
                    'total_documents': 0,
                    'status': 'empty',
                    'database': 'MongoDB not connected'
                }
            
            # Get MongoDB collection statistics
            collection = self.mongo_client[self.db_name][self.collection_name]
            doc_count = collection.count_documents({})
            
            return {
                'total_documents': doc_count,
                'status': 'ready',
                'database': f'MongoDB - {self.db_name}.{self.collection_name}',
                'connection_uri': self.mongodb_uri.split('@')[-1] if '@' in self.mongodb_uri else self.mongodb_uri
            }
            
        except Exception as e:
            logger.error(f"Error getting MongoDB knowledge base stats: {str(e)}")
            return {
                'total_documents': 0,
                'status': 'error',
                'message': str(e),
                'database': 'MongoDB error'
            }
    
    def clear_knowledge_base(self) -> Dict:
        """Clear the MongoDB knowledge base"""
        try:
            if self.mongo_client:
                # Clear MongoDB collection
                collection = self.mongo_client[self.db_name][self.collection_name]
                result = collection.delete_many({})
                deleted_count = result.deleted_count
                
                # Reinitialize vector store
                self._init_mongodb()
                
                return {
                    'status': 'success',
                    'message': f'MongoDB knowledge base cleared successfully. Deleted {deleted_count} documents.',
                    'deleted_documents': deleted_count
                }
            else:
                return {
                    'status': 'error',
                    'message': 'MongoDB connection not available'
                }
        except Exception as e:
            logger.error(f"Error clearing MongoDB knowledge base: {str(e)}")
            return {
                'status': 'error',
                'message': f'Error clearing knowledge base: {str(e)}'
            }

# Global service instance
educational_service = EducationalService()