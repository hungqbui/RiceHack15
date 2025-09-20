"""
Educational service module for handling PDF processing, OCR, and RAG with Google GenAI and MongoDB
"""
import os
import io
import logging
import re
import uuid
from datetime import datetime
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
# Removed problematic RetrievalQA import
from langchain.prompts import PromptTemplate
from pymongo import MongoClient
import google.generativeai as genai

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
                model="gemini-2.5-pro",
                google_api_key=self.api_key,
                temperature=0.3,  # Lower temperature for educational content
                convert_system_message_to_human=True
            )
            
            # Text splitter for educational content
            self.text_splitter = RecursiveCharacterTextSplitter(
                chunk_size=1000,
                chunk_overlap=200,
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
    
    def _clean_extracted_text(self, text: str) -> str:
        """Clean and normalize extracted text from PDFs to fix spacing issues"""
        if not text:
            return text
        
        try:
            # Remove excessive whitespace and normalize line breaks
            text = re.sub(r'\s+', ' ', text)
            
            # Fix common PDF extraction issues
            # Add space before capital letters that follow lowercase letters (likely word boundaries)
            text = re.sub(r'([a-z])([A-Z])', r'\1 \2', text)
            
            # Add space before numbers that follow letters
            text = re.sub(r'([a-zA-Z])([0-9])', r'\1 \2', text)
            
            # Add space after periods, commas, etc. if missing
            text = re.sub(r'([.!?])([A-Z])', r'\1 \2', text)
            text = re.sub(r'([,;])([a-zA-Z])', r'\1 \2', text)
            
            # Fix common concatenated words patterns
            text = re.sub(r'([a-z])([A-Z][a-z])', r'\1 \2', text)
            
            # Add space after common word endings before new words
            text = re.sub(r'(ing|tion|ness|ment|able|ible)([A-Z][a-z])', r'\1 \2', text)
            
            # Handle common all-lowercase concatenated words in tech/AI context
            # Split common compound words that are often concatenated
            tech_patterns = [
                (r'machinelearning', 'machine learning'),
                (r'artificialintelligence', 'artificial intelligence'),
                (r'deeplearning', 'deep learning'),
                (r'naturallanguageprocessing', 'natural language processing'),
                (r'computervision', 'computer vision'),
                (r'datascience', 'data science'),
                (r'neuralnetwork', 'neural network'),
                (r'datastorage', 'data storage'),
                (r'filesystem', 'file system'),
                (r'database', 'database'),  # Keep as is
                (r'software', 'software'),  # Keep as is
                (r'hardware', 'hardware'),  # Keep as is
            ]
            
            for pattern, replacement in tech_patterns:
                if pattern != replacement:  # Only replace if different
                    text = re.sub(pattern, replacement, text, flags=re.IGNORECASE)
            
            # Handle common word patterns for educational content
            # Add space after common prefixes
            text = re.sub(r'(pre|post|anti|multi|inter|over|under|super|sub|meta)([a-z]{4,})', r'\1 \2', text)
            
            # Add space before common suffixes when preceded by long words
            text = re.sub(r'([a-z]{4,})(processing|development|management|implementation|applications)', r'\1 \2', text)
            
            # Clean up multiple spaces
            text = re.sub(r'\s+', ' ', text)
            
            # Remove leading/trailing whitespace
            text = text.strip()
            
            return text
        except Exception as e:
            logger.warning(f"Text cleaning failed: {str(e)}, returning original text")
            return text
            
            # Remove leading/trailing whitespace
            text = text.strip()
            
            return text
        except Exception as e:
            logger.warning(f"Text cleaning failed: {str(e)}, returning original text")
            return text
    
    def _generate_file_id(self, filename: str = None) -> str:
        """Generate a unique file ID for document tracking"""
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        unique_id = str(uuid.uuid4())[:8]  # Short UUID
        
        if filename:
            # Clean filename for ID (remove extension and special chars)
            clean_name = re.sub(r'[^a-zA-Z0-9_-]', '_', filename.rsplit('.', 1)[0])
            clean_name = clean_name[:20]  # Limit length
            return f"{clean_name}_{timestamp}_{unique_id}"
        else:
            return f"doc_{timestamp}_{unique_id}"
    
    def extract_text_from_pdf(self, pdf_file, filename: str = None, user_id: str = None) -> Dict[str, str]:
        """
        Extract text from PDF file using PyMuPDF (fitz) with proper FileStorage handling
        
        Args:
            pdf_file: File object, FileStorage object, or file path
            
        Returns:
            Dictionary with extracted text and metadata
        """
        try:
            extracted_text = ""
            file_id = self._generate_file_id(filename)
            metadata = {
                'file_id': file_id,
                'filename': filename or 'unknown.pdf',
                'pages': 0,
                'method': 'combined',
                'success': True,
                'upload_timestamp': datetime.now().isoformat(),
                'file_type': 'pdf',
                'user_id': user_id
            }
            
            # Handle different input types
            pdf_bytes = None
            
            # Check if it's a Flask FileStorage object
            if hasattr(pdf_file, 'read') and hasattr(pdf_file, 'stream'):
                # Flask FileStorage object
                logger.info(f"Processing FileStorage object: {type(pdf_file)}")
                pdf_file.stream.seek(0)  # Reset stream position
                pdf_bytes = pdf_file.read()
                pdf_file.stream.seek(0)  # Reset for potential reuse
            elif hasattr(pdf_file, 'read'):
                # File-like object
                logger.info(f"Processing file-like object: {type(pdf_file)}")
                pdf_bytes = pdf_file.read()
            elif isinstance(pdf_file, str):
                # File path
                logger.info(f"Processing file path: {pdf_file}")
                with open(pdf_file, 'rb') as f:
                    pdf_bytes = f.read()
            elif isinstance(pdf_file, bytes):
                # Already bytes
                pdf_bytes = pdf_file
            else:
                raise ValueError(f"Unsupported file type: {type(pdf_file)}")
            
            if not pdf_bytes:
                raise ValueError("No PDF data could be read")
            
            # Try PyMuPDF (fitz) first - best for text extraction
            try:
                import fitz
                logger.info(f"Using PyMuPDF to process {len(pdf_bytes)} bytes")
                
                with fitz.open(stream=pdf_bytes, filetype="pdf") as pdf:
                    metadata['pages'] = len(pdf)
                    for page_num, page in enumerate(pdf):
                        text = page.get_text()
                        if text:
                            extracted_text += f"{text}\n"
                    
                    if extracted_text.strip():
                        # Clean the extracted text to fix spacing issues
                        cleaned_text = self._clean_extracted_text(extracted_text.strip())
                        metadata['method'] = 'PyMuPDF'
                        metadata['original_length'] = len(extracted_text)
                        metadata['cleaned_length'] = len(cleaned_text)
                        return {
                            'text': cleaned_text,
                            'metadata': metadata,
                            'status': 'success'
                        }
            except ImportError:
                logger.warning("PyMuPDF (fitz) not available, falling back to other methods")
            except Exception as e:
                logger.warning(f"PyMuPDF failed: {str(e)}, trying fallback methods")
            
            # Fallback to pdfplumber
            try:
                import io
                with pdfplumber.open(io.BytesIO(pdf_bytes)) as pdf:
                    metadata['pages'] = len(pdf.pages)
                    for page_num, page in enumerate(pdf.pages):
                        text = page.extract_text()
                        if text:
                            extracted_text += f"\n--- Page {page_num + 1} ---\n{text}\n"
                    
                    if extracted_text.strip():
                        cleaned_text = self._clean_extracted_text(extracted_text.strip())
                        metadata['method'] = 'pdfplumber'
                        metadata['original_length'] = len(extracted_text)
                        metadata['cleaned_length'] = len(cleaned_text)
                        return {
                            'text': cleaned_text,
                            'metadata': metadata,
                            'status': 'success'
                        }
            except Exception as e:
                logger.warning(f"pdfplumber failed: {str(e)}, trying PyPDF2")
            
            # Final fallback to PyPDF2
            try:
                import io
                pdf_reader = PyPDF2.PdfReader(io.BytesIO(pdf_bytes))
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
                
                # Clean the extracted text to fix spacing issues
                cleaned_text = self._clean_extracted_text(extracted_text.strip())
                metadata['original_length'] = len(extracted_text)
                metadata['cleaned_length'] = len(cleaned_text)
                
                return {
                    'text': cleaned_text,
                    'metadata': metadata,
                    'status': 'success'
                }
                
            except Exception as e:
                logger.error(f"All PDF extraction methods failed. Last error: {str(e)}")
                return {
                    'text': '',
                    'metadata': {'pages': 0, 'method': 'failed', 'success': False},
                    'status': 'error',
                    'message': f'Error processing PDF: {str(e)}'
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
    
    def extract_text_from_image(self, image_file, filename: str = None, user_id: str = None) -> Dict[str, str]:
        """
        Extract text from image using OCR (Tesseract)
        
        Args:
            image_file: File object or file path
            filename: Original filename for tracking
            
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
            
            file_id = self._generate_file_id(filename)
            metadata = {
                'file_id': file_id,
                'filename': filename or 'unknown_image',
                'image_size': image.size,
                'mode': image.mode,
                'avg_confidence': round(avg_confidence, 2),
                'text_length': len(extracted_text.strip()),
                'upload_timestamp': datetime.now().isoformat(),
                'file_type': 'image',
                'user_id': user_id
            }
            
            if not extracted_text.strip():
                return {
                    'text': '',
                    'metadata': metadata,
                    'status': 'warning',
                    'message': 'No text could be extracted from image'
                }
            
            # Clean the extracted OCR text
            cleaned_text = extracted_text.strip()
            metadata['original_length'] = len(extracted_text)
            metadata['cleaned_length'] = len(cleaned_text)
            
            return {
                'text': cleaned_text,
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
    
    def add_documents_to_rag(self, texts: List[str], sources: List[str] = None, file_ids: List[str] = None, extra_metadata: List[Dict] = None, user_id: str = None) -> Dict:
        """
        Add documents to MongoDB Vector RAG system with enhanced metadata
        
        Args:
            texts: List of document texts
            sources: List of source names for the documents
            file_ids: List of unique file IDs for tracking
            extra_metadata: List of additional metadata dictionaries
            
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
            chunk_metadatas = []
            
            for i, text in enumerate(texts):
                chunks = self.text_splitter.split_text(text)
                all_chunks.extend(chunks)
                
                # Prepare metadata for each chunk
                source_name = sources[i] if sources and i < len(sources) else f"Document_{i+1}"
                file_id = file_ids[i] if file_ids and i < len(file_ids) else self._generate_file_id(source_name)
                base_metadata = extra_metadata[i] if extra_metadata and i < len(extra_metadata) else {}
                
                # Create metadata for each chunk
                for chunk_idx, chunk in enumerate(chunks):
                    chunk_metadata = {
                        'source': source_name,
                        'file_id': file_id,
                        'chunk_index': chunk_idx,
                        'total_chunks': len(chunks),
                        'chunk_length': len(chunk),
                        'timestamp': datetime.now().isoformat(),
                        'user_id': user_id,
                        **base_metadata  # Include any extra metadata
                    }
                    chunk_metadatas.append(chunk_metadata)
            
            # Add texts to MongoDB vector store
            self.vector_store.add_texts(all_chunks, metadatas=chunk_metadatas)
            
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
    
    def get_documents_by_file_id(self, file_id: str, limit: int = 10, user_id: str = None) -> Dict:
        """
        Retrieve documents from the vector store by file ID
        
        Args:
            file_id: Unique file identifier
            limit: Maximum number of chunks to return
            
        Returns:
            Dictionary with retrieved documents and metadata
        """
        try:
            if not self.vector_store or not self.mongo_client:
                return {
                    'status': 'error',
                    'message': 'Vector store not available',
                    'documents': []
                }
            
            # Query MongoDB collection directly for file-specific documents
            collection = self.mongo_client[self.db_name][self.collection_name]
            
            # Find documents with matching file_id and user_id
            query_filter = {'file_id': file_id}
            if user_id:
                query_filter['user_id'] = user_id
                
            cursor = collection.find(
                query_filter,
                limit=limit
            ).sort('chunk_index', 1)  # Sort by chunk index
            
            documents = list(cursor)
            
            return {
                'status': 'success',
                'file_id': file_id,
                'documents': documents,
                'count': len(documents)
            }
            
        except Exception as e:
            logger.error(f"Error retrieving documents by file ID: {str(e)}")
            return {
                'status': 'error',
                'message': f'Error retrieving documents: {str(e)}',
                'documents': []
            }
    
    def get_file_specific_context(self, file_id: str, question: str, max_chunks: int = 4, user_id: str = None) -> Dict:
        """
        Get context from a specific file for RAG
        
        Args:
            file_id: Unique file identifier
            question: Query to search for relevant chunks
            max_chunks: Maximum number of chunks to return
            
        Returns:
            Dictionary with relevant context from the specific file
        """
        try:
            if not self.vector_store:
                return {
                    'status': 'error',
                    'message': 'Vector store not available',
                    'context': ''
                }
            
            # Perform similarity search with file_id and user_id filter
            search_filter = {'file_id': file_id}
            if user_id:
                search_filter['user_id'] = user_id
                
            relevant_docs = self.vector_store.similarity_search(
                question,
                k=max_chunks * 2,  # Get more docs to filter by file_id
                filter=search_filter  # Filter by specific file and user
            )
            
            # Take only the requested number of chunks
            relevant_docs = relevant_docs[:max_chunks]
            
            if not relevant_docs:
                return {
                    'status': 'warning',
                    'message': f'No relevant content found in file {file_id}',
                    'context': '',
                    'file_id': file_id
                }
            
            # Build context from relevant chunks
            context_parts = []
            for doc in relevant_docs:
                chunk_info = f"[Chunk {doc.metadata.get('chunk_index', '?')}]"
                context_parts.append(f"{chunk_info} {doc.page_content}")
            
            context = "\n\n".join(context_parts)
            
            return {
                'status': 'success',
                'file_id': file_id,
                'context': context,
                'chunks_found': len(relevant_docs),
                'chunks_metadata': [doc.metadata for doc in relevant_docs]
            }
            
        except Exception as e:
            logger.error(f"Error getting file-specific context: {str(e)}")
            return {
                'status': 'error',
                'message': f'Error getting context: {str(e)}',
                'context': ''
            }
    
    def _create_qa_chain(self):
        """Create QA chain for educational queries using direct MongoDB retrieval"""
        try:
            if self.vector_store and self.chat_model:
                # Just mark that we have a working retrieval setup
                self.qa_chain = True  # Simple flag to indicate retrieval is available
                logger.info("Direct retrieval system initialized successfully")
            else:
                self.qa_chain = None
        except Exception as e:
            logger.error(f"Error creating retrieval system: {str(e)}")
            self.qa_chain = None
    
    def educational_chat(self, question: str, file_ids: list = None, user_id: str = None) -> Dict:
        """
        Answer educational questions using direct MongoDB retrieval + Gemini
        
        Args:
            question: Student's question
            file_ids: Optional list of file IDs to limit context to specific documents
            
        Returns:
            Dictionary with answer and source information
        """
        try:
            if not self.qa_chain or not self.vector_store:
                return {
                    'answer': 'No educational materials have been uploaded yet. Please upload PDF or image materials first.',
                    'sources': [],
                    'status': 'warning'
                }
            
            # Direct retrieval from MongoDB vector store
            if file_ids:
                # Use file-specific context when file IDs are provided
                context_result = self.get_multiple_files_context(file_ids, question, max_chunks_per_file=3)
                if context_result['status'] == 'success':
                    context = context_result['combined_context']
                    # Get sources from the file-specific context
                    sources = context_result.get('chunks_metadata', [])
                    sources = [{
                        'content': src.get('chunk_content', '')[:200] + "..." if len(src.get('chunk_content', '')) > 200 else src.get('chunk_content', ''),
                        'source': src.get('source', 'Unknown'),
                        'file_id': src.get('file_id', 'Unknown'),
                        'filename': src.get('filename', 'Unknown')
                    } for src in sources]
                else:
                    context = ""
                    sources = []
                relevant_docs = []  # We already have the context
            else:
                # Use all documents when no specific files are selected, filter by user
                search_filter = {}
                if user_id:
                    search_filter['user_id'] = user_id
                
                if search_filter:
                    relevant_docs = self.vector_store.similarity_search(question, k=10, filter=search_filter)
                else:
                    relevant_docs = self.vector_store.similarity_search(question, k=10)
            
            # if not relevant_docs:
            #     return {
            #         'answer': 'I could not find relevant information in the uploaded materials to answer your question.',
            #         'sources': [],
            #         'status': 'warning'
            #     }
            
            # Build context from retrieved documents (only if not already set by file-specific search)
            if not file_ids:
                context = "\n\n".join([doc.page_content for doc in relevant_docs])
            
            # Create the educational prompt
            prompt = f"""You are an educational AI assistant using Google's Gemini model. Use the following context from educational materials to answer the student's question.

Be helpful, clear, and educational in your response. If you don't know the answer based on the context, say so clearly.

Context from educational materials:
{context}

Student's question: {question}

Educational response:"""
            
            # Generate response using Gemini
            response = self.chat_model.invoke(prompt)
            
            # Extract source information (only if not already set by file-specific search)
            if not file_ids:
                sources = []
                for doc in relevant_docs:
                    source_info = {
                        'content': doc.page_content[:200] + "..." if len(doc.page_content) > 200 else doc.page_content,
                        'source': doc.metadata.get('source', 'Unknown'),
                        'file_id': doc.metadata.get('file_id', 'Unknown'),
                        'filename': doc.metadata.get('filename', 'Unknown')
                    }
                    sources.append(source_info)
            
            return {
                'answer': response.content if hasattr(response, 'content') else str(response),
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
    
    def educational_audio_chat(self, audio_data: bytes, mime_type: str, file_ids: list = None, user_id: str = None) -> Dict:
        """
        Answer educational questions using direct audio input to Gemini with RAG context
        
        Args:
            audio_data: Raw audio bytes
            mime_type: MIME type of the audio (e.g., 'audio/wav', 'audio/mp3')
            file_ids: Optional list of file IDs to limit context to specific documents
            
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
                import google.generativeai as genai
                
                # Configure the client
                genai.configure(api_key=self.api_key)
                model = genai.GenerativeModel('gemini-2.5-pro')
                
                # Create audio part from bytes
                audio_part = {
                    "mime_type": mime_type,
                    "data": audio_data
                }
                
                # Step 1: First transcribe the audio to get the question text for RAG
                transcription_prompt = """Please transcribe this audio and extract the main question or topic being asked. 
Respond with just the transcribed text, focusing on the key question or learning objective."""
                
                transcription_response = model.generate_content([
                    transcription_prompt,
                    audio_part
                ])
                
                transcribed_question = transcription_response.text.strip()
                logger.info(f"Transcribed audio question: {transcribed_question}")
                
                # Step 2: Get relevant context using the same logic as text chat
                context = ""
                sources = []
                
                if self.vector_store and transcribed_question:
                    try:
                        if file_ids:
                            # Use selected files for context
                            context_result = self.get_multiple_files_context(file_ids, transcribed_question, max_chunks_per_file=3)
                            if context_result['status'] == 'success':
                                context = context_result['combined_context']
                                sources = context_result.get('chunks_metadata', [])
                                sources = [{
                                    'content': src.get('chunk_content', '')[:200] + "..." if len(src.get('chunk_content', '')) > 200 else src.get('chunk_content', ''),
                                    'source': src.get('source', 'Unknown'),
                                    'file_id': src.get('file_id', 'Unknown'),
                                    'filename': src.get('filename', 'Unknown')
                                } for src in sources]
                                logger.info(f"Retrieved context from {len(file_ids)} selected files for audio question")
                        else:
                            # Use all documents when no specific files are selected, filter by user
                            search_filter = {}
                            if user_id:
                                search_filter['user_id'] = user_id
                            
                            if search_filter:
                                relevant_docs = self.vector_store.similarity_search(transcribed_question, k=8, filter=search_filter)
                            else:
                                relevant_docs = self.vector_store.similarity_search(transcribed_question, k=8)
                            if relevant_docs:
                                context = "\n\n".join([doc.page_content for doc in relevant_docs])
                                sources = [{
                                    'content': doc.page_content[:200] + "..." if len(doc.page_content) > 200 else doc.page_content,
                                    'source': doc.metadata.get('source', 'Unknown'),
                                    'file_id': doc.metadata.get('file_id', 'Unknown'),
                                    'filename': doc.metadata.get('filename', 'Unknown')
                                } for doc in relevant_docs]
                                logger.info(f"Retrieved {len(relevant_docs)} relevant documents for audio question")
                    except Exception as e:
                        logger.warning(f"Could not retrieve context from knowledge base: {str(e)}")
                
                # Step 3: Create comprehensive prompt with context
                if context:
                    context_prompt = f"""You are an educational AI assistant. The student has asked a question via audio. Use the following context from uploaded educational materials to answer their question.

Be helpful, clear, and educational in your response. Reference the specific materials when relevant.

Context from educational materials:
{context}

Transcribed question: {transcribed_question}

Please provide a comprehensive educational response that addresses the audio question using the available context:"""
                else:
                    context_prompt = f"""You are an educational AI assistant. The student has asked a question via audio.

Transcribed question: {transcribed_question}

Since no specific educational materials are available in the knowledge base, please provide a helpful educational response based on your general knowledge:"""
                
                # Step 4: Generate final response with both audio and context
                final_response = model.generate_content([
                    context_prompt,
                    "Here is the original audio question for additional context:",
                    audio_part
                ])
                
                # Add audio processing indicator to sources
                audio_source = {
                    'content': f'Audio transcription: {transcribed_question}',
                    'source': 'Audio Input',
                    'type': 'audio_transcription'
                }
                sources.insert(0, audio_source)
                
                print({
                    'answer': final_response.text,
                    'sources': sources,
                    'status': 'success',
                    'audio_processed': True,
                    'transcribed_question': transcribed_question,
                    'context_used': len(context) > 0,
                    'selected_files': file_ids or [],
                    'relevant_documents': len(sources) - 1  # Subtract 1 for audio source
                })

                return {
                    'answer': final_response.text,
                    'sources': sources,
                    'status': 'success',
                    'audio_processed': True,
                    'transcribed_question': transcribed_question,
                    'context_used': len(context) > 0,
                    'selected_files': file_ids or [],
                    'relevant_documents': len(sources) - 1  # Subtract 1 for audio source
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
    
    def get_multiple_files_context(self, file_ids, query, max_chunks_per_file=3, user_id: str = None):
        """
        Get context from multiple files for a query
        
        Args:
            file_ids (list): List of file IDs to search
            query (str): Search query
            max_chunks_per_file (int): Maximum chunks to retrieve per file
            
        Returns:
            dict: Combined context results
        """
        try:
            all_contexts = []
            all_metadata = []
            total_chunks = 0
            successful_files = []
            failed_files = []
            
            for file_id in file_ids:
                try:
                    context_result = self.get_file_specific_context(
                        file_id, query, max_chunks_per_file, user_id
                    )
                    
                    if context_result['status'] == 'success':
                        all_contexts.append({
                            'file_id': file_id,
                            'context': context_result['context'],
                            'chunks_found': context_result['chunks_found']
                        })
                        all_metadata.extend(context_result.get('chunks_metadata', []))
                        total_chunks += context_result['chunks_found']
                        successful_files.append(file_id)
                    else:
                        failed_files.append({
                            'file_id': file_id,
                            'error': context_result.get('message', 'No content found')
                        })
                        
                except Exception as e:
                    failed_files.append({
                        'file_id': file_id,
                        'error': str(e)
                    })
            
            if not all_contexts:
                return {
                    'status': 'warning',
                    'message': 'No content found in any of the specified files',
                    'failed_files': failed_files
                }
            
            # Combine contexts
            combined_context = "\n\n".join([
                f"[From file {ctx['file_id']}]:\n{ctx['context']}" 
                for ctx in all_contexts
            ])
            
            return {
                'status': 'success',
                'combined_context': combined_context,
                'file_contexts': all_contexts,
                'total_chunks': total_chunks,
                'successful_files': successful_files,
                'failed_files': failed_files,
                'chunks_metadata': all_metadata
            }
            
        except Exception as e:
            logger.error(f"Error getting multiple files context: {str(e)}")
            return {
                'status': 'error',
                'message': f'Error getting multiple files context: {str(e)}'
            }
    
    def get_files_summary(self, file_ids, user_id: str = None):
        """
        Get summary information for multiple files
        
        Args:
            file_ids (list): List of file IDs
            
        Returns:
            dict: Summary of all files
        """
        try:
            files_info = {}
            total_documents = 0
            found_files = []
            not_found_files = []
            
            for file_id in file_ids:
                try:
                    result = self.get_documents_by_file_id(file_id, user_id=user_id)
                    
                    if result['status'] == 'success':
                        # Get basic file metadata from first document
                        first_doc = result['documents'][0] if result['documents'] else {}
                        metadata = first_doc.get('metadata', {})
                        
                        files_info[file_id] = {
                            'filename': metadata.get('filename', 'Unknown'),
                            'file_type': metadata.get('file_type', 'unknown'),
                            'upload_timestamp': metadata.get('upload_timestamp'),
                            'document_count': result['count'],
                            'status': 'found'
                        }
                        total_documents += result['count']
                        found_files.append(file_id)
                    else:
                        files_info[file_id] = {
                            'status': 'not_found',
                            'error': result.get('message', 'File not found')
                        }
                        not_found_files.append(file_id)
                        
                except Exception as e:
                    files_info[file_id] = {
                        'status': 'error',
                        'error': str(e)
                    }
                    not_found_files.append(file_id)
            
            return {
                'status': 'success',
                'files_info': files_info,
                'summary': {
                    'total_requested': len(file_ids),
                    'found_files': len(found_files),
                    'not_found_files': len(not_found_files),
                    'total_documents': total_documents
                },
                'found_file_ids': found_files,
                'not_found_file_ids': not_found_files
            }
            
        except Exception as e:
            logger.error(f"Error getting files summary: {str(e)}")
            return {
                'status': 'error',
                'message': f'Error getting files summary: {str(e)}'
            }
    
    def generate_quiz(self, file_ids: list = None, quiz_prompt: str = None, quiz_type: str = "mixed", num_questions: int = 5, user_id: str = None) -> Dict:
        """
        Generate a quiz or mock exam based on selected context
        
        Args:
            file_ids: Optional list of file IDs to generate quiz from
            quiz_prompt: Optional specific instructions for quiz generation
            quiz_type: Type of quiz ("multiple_choice", "short_answer", "essay", "mixed")
            num_questions: Number of questions to generate
            
        Returns:
            Dictionary with generated quiz questions and answers
        """
        try:
            if not self.chat_model:
                return {
                    'quiz': [],
                    'status': 'error',
                    'message': 'Educational AI service is not properly initialized.'
                }
            
            # Get context from selected files or all files
            context = ""
            sources = []
            
            if self.vector_store:
                if file_ids:
                    # Use specific files for quiz generation
                    context_result = self.get_files_summary(file_ids, user_id)
                    if context_result['status'] == 'success':
                        # Get actual content from the files
                        all_content = []
                        for file_id in file_ids:
                            file_result = self.get_documents_by_file_id(file_id, user_id=user_id)
                            if file_result['status'] == 'success':
                                file_content = "\n".join([doc.get('content', '') for doc in file_result['documents']])
                                filename = file_result['documents'][0].get('metadata', {}).get('filename', 'Unknown') if file_result['documents'] else 'Unknown'
                                all_content.append(f"From {filename}:\n{file_content}")
                                sources.append({
                                    'file_id': file_id,
                                    'filename': filename,
                                    'document_count': len(file_result['documents'])
                                })
                        context = "\n\n" + "="*50 + "\n\n".join(all_content)
                else:
                    # Use a broad search to get representative content
                    search_terms = ["definition", "concept", "theory", "formula", "principle", "method"]
                    relevant_docs = []
                    search_filter = {}
                    if user_id:
                        search_filter['user_id'] = user_id
                        
                    for term in search_terms:
                        if search_filter:
                            docs = self.vector_store.similarity_search(term, k=3, filter=search_filter)
                        else:
                            docs = self.vector_store.similarity_search(term, k=3)
                        relevant_docs.extend(docs)
                    
                    # Remove duplicates and limit
                    seen_content = set()
                    unique_docs = []
                    for doc in relevant_docs:
                        if doc.page_content not in seen_content:
                            seen_content.add(doc.page_content)
                            unique_docs.append(doc)
                    
                    relevant_docs = unique_docs[:15]  # Limit to 15 documents
                    context = "\n\n".join([doc.page_content for doc in relevant_docs])
                    sources = [{
                        'content': doc.page_content[:100] + "...",
                        'source': doc.metadata.get('source', 'Unknown'),
                        'file_id': doc.metadata.get('file_id', 'Unknown')
                    } for doc in relevant_docs]
            
            if not context.strip():
                return {
                    'quiz': [],
                    'status': 'warning',
                    'message': 'No educational content available to generate quiz from. Please upload some materials first.'
                }
            
            # Define quiz type templates
            quiz_templates = {
                "multiple_choice": "multiple choice questions with 4 options (A, B, C, D) and indicate the correct answer",
                "short_answer": "short answer questions that require 1-3 sentence responses",
                "essay": "essay questions that require detailed explanations and analysis",
                "mixed": "a mix of multiple choice, short answer, and essay questions"
            }
            
            quiz_format = quiz_templates.get(quiz_type, quiz_templates["mixed"])
            
            # Create quiz generation prompt
            base_prompt = f"""You are an educational quiz generator. Based on the following course material, create {num_questions} {quiz_format}.

Guidelines:
- Focus on key concepts, definitions, formulas, and important principles
- Ensure questions test understanding, not just memorization
- Include a variety of difficulty levels (basic, intermediate, advanced)
- For multiple choice: provide clear, unambiguous options with only one correct answer
- For short answer: ask for specific concepts or brief explanations
- For essay: require critical thinking and comprehensive understanding
- Provide correct answers and brief explanations for each question

Format your response as a JSON object with this structure:
{{
  "quiz_info": {{
    "type": "{quiz_type}",
    "num_questions": {num_questions},
    "difficulty": "mixed"
  }},
  "questions": [
    {{
      "id": 1,
      "type": "multiple_choice|short_answer|essay",
      "question": "Question text here",
      "options": ["A", "B", "C", "D"],  // Only for multiple choice
      "correct_answer": "A" or "Answer text",
      "explanation": "Brief explanation of the answer",
      "difficulty": "basic|intermediate|advanced",
      "topic": "Main topic this question covers"
    }}
  ]
}}

Course Material:
{context}"""
            
            # Add custom prompt if provided
            if quiz_prompt:
                base_prompt += f"\n\nAdditional Instructions: {quiz_prompt}"
            
            # Generate quiz using the language model
            response = self.chat_model.invoke(base_prompt)
            quiz_response = response.content if hasattr(response, 'content') else str(response)
            
            # Try to parse JSON response
            try:
                import json
                # Extract JSON from response if it's embedded in text
                start_idx = quiz_response.find('{')
                end_idx = quiz_response.rfind('}') + 1
                if start_idx >= 0 and end_idx > start_idx:
                    json_str = quiz_response[start_idx:end_idx]
                    quiz_data = json.loads(json_str)
                else:
                    # Fallback: try to parse the entire response
                    quiz_data = json.loads(quiz_response)
            except json.JSONDecodeError:
                # If JSON parsing fails, return the raw response
                quiz_data = {
                    "quiz_info": {
                        "type": quiz_type,
                        "num_questions": num_questions,
                        "difficulty": "mixed"
                    },
                    "raw_response": quiz_response,
                    "note": "Could not parse as structured JSON, returning raw response"
                }
            
            return {
                'quiz': quiz_data,
                'sources': sources,
                'context_files': len(file_ids) if file_ids else "all",
                'selected_files': file_ids or [],
                'custom_prompt': quiz_prompt,
                'status': 'success'
            }
            
        except Exception as e:
            logger.error(f"Error generating quiz: {str(e)}")
            return {
                'quiz': [],
                'status': 'error',
                'message': f'Error generating quiz: {str(e)}'
            }

# Global service instance - using lazy initialization
educational_service = None

def get_educational_service():
    """Get or create the educational service instance"""
    global educational_service
    if educational_service is None:
        educational_service = EducationalService()
    return educational_service