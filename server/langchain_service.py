"""
LangChain service module for handling language model interactions with Google GenAI
"""
import os
from typing import Dict, List, Optional
from langchain_google_genai import ChatGoogleGenerativeAI, GoogleGenerativeAIEmbeddings
from langchain.schema import HumanMessage, SystemMessage, AIMessage
from langchain.chains import LLMChain, ConversationChain
from langchain.memory import ConversationBufferMemory
from langchain.prompts import PromptTemplate, ChatPromptTemplate
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain_mongodb import MongoDBAtlasVectorSearch
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class LangChainService:
    def __init__(self):
        """Initialize LangChain service with Google GenAI models"""
        self.api_key = os.getenv('GOOGLE_API_KEY')
        if not self.api_key:
            logger.warning("Google API key not found. Some features may not work.")
        
        # Initialize language models
        try:
            # Use Gemini models instead of OpenAI
            self.chat_model = ChatGoogleGenerativeAI(
                model="gemini-2.5-flash",
                google_api_key=self.api_key,
                temperature=0.7,
                convert_system_message_to_human=True
            )
            
            # Initialize Gemini embeddings
            self.embeddings = GoogleGenerativeAIEmbeddings(
                model="models/embedding-001",
                google_api_key=self.api_key
            )
            
            # Initialize conversation memory
            self.memory = ConversationBufferMemory()
            
            # Initialize conversation chain
            self.conversation = ConversationChain(
                llm=self.chat_model,
                memory=self.memory,
                verbose=True
            )
            
            logger.info("LangChain service initialized successfully with Google GenAI")
        except Exception as e:
            logger.error(f"Error initializing LangChain service: {str(e)}")
            self.chat_model = None
            self.embeddings = None
    
    def simple_chat(self, message: str) -> Dict[str, str]:
        """
        Simple chat completion using OpenAI
        
        Args:
            message: User input message
            
        Returns:
            Dictionary with response and status
        """
        try:
            if not self.chat_model:
                return {
                    'response': 'LangChain service not properly initialized',
                    'status': 'error'
                }
            
            response = self.chat_model.predict(message)
            return {
                'response': response,
                'status': 'success'
            }
        except Exception as e:
            logger.error(f"Error in simple_chat: {str(e)}")
            return {
                'response': f'Error processing request: {str(e)}',
                'status': 'error'
            }
    
    def conversation_chat(self, message: str) -> Dict[str, str]:
        """
        Chat with conversation memory
        
        Args:
            message: User input message
            
        Returns:
            Dictionary with response and status
        """
        try:
            if not self.conversation:
                return {
                    'response': 'Conversation service not available',
                    'status': 'error'
                }
            
            response = self.conversation.predict(input=message)
            return {
                'response': response,
                'status': 'success'
            }
        except Exception as e:
            logger.error(f"Error in conversation_chat: {str(e)}")
            return {
                'response': f'Error processing conversation: {str(e)}',
                'status': 'error'
            }
    
    def summarize_text(self, text: str) -> Dict[str, str]:
        """
        Summarize long text using Google GenAI
        
        Args:
            text: Text to summarize
            
        Returns:
            Dictionary with summary and status
        """
        try:
            if not self.chat_model:
                return {
                    'summary': 'Summarization service not available',
                    'status': 'error'
                }
            
            prompt = PromptTemplate(
                input_variables=["text"],
                template="Please provide a concise summary of the following text:\n\n{text}\n\nSummary:"
            )
            
            chain = LLMChain(llm=self.chat_model, prompt=prompt)
            summary = chain.run(text)
            
            return {
                'summary': summary.strip(),
                'status': 'success'
            }
        except Exception as e:
            logger.error(f"Error in summarize_text: {str(e)}")
            return {
                'summary': f'Error summarizing text: {str(e)}',
                'status': 'error'
            }
    
    def process_documents(self, documents: List[str]) -> Dict:
        """
        Process documents for basic text storage (FAISS removed for MongoDB migration)
        
        Args:
            documents: List of document texts
            
        Returns:
            Dictionary with processing status and document count
        """
        try:
            if not self.embeddings:
                return {
                    'message': 'Embeddings service not available',
                    'status': 'error'
                }
            
            # Split documents into chunks
            text_splitter = RecursiveCharacterTextSplitter(
                chunk_size=1000,
                chunk_overlap=200
            )
            
            texts = []
            for doc in documents:
                chunks = text_splitter.split_text(doc)
                texts.extend(chunks)
            
            # Store texts for basic processing (MongoDB implementation in educational_service)
            self.processed_texts = texts
            
            return {
                'message': f'Processed {len(texts)} document chunks',
                'chunks_count': len(texts),
                'status': 'success'
            }
        except Exception as e:
            logger.error(f"Error processing documents: {str(e)}")
            return {
                'message': f'Error processing documents: {str(e)}',
                'status': 'error'
            }
    
    def semantic_search(self, query: str, k: int = 5) -> Dict:
        """
        Perform basic text search on processed documents (use educational_service for MongoDB vector search)
        
        Args:
            query: Search query
            k: Number of results to return
            
        Returns:
            Dictionary with search results and status
        """
        try:
            if not hasattr(self, 'processed_texts') or not self.processed_texts:
                return {
                    'results': [],
                    'message': 'No documents processed for search. Use educational service for advanced search.',
                    'status': 'warning'
                }
            
            # Basic text search (for demonstration)
            query_lower = query.lower()
            results = []
            for text in self.processed_texts:
                if query_lower in text.lower():
                    results.append(text)
                    if len(results) >= k:
                        break
            
            return {
                'results': results[:k],
                'query': query,
                'status': 'success'
            }
        except Exception as e:
            logger.error(f"Error in semantic search: {str(e)}")
            return {
                'results': [],
                'message': f'Error performing search: {str(e)}',
                'status': 'error'
            }
    
    def clear_conversation_memory(self) -> Dict[str, str]:
        """Clear conversation memory"""
        try:
            if self.memory:
                self.memory.clear()
                return {
                    'message': 'Conversation memory cleared',
                    'status': 'success'
                }
            else:
                return {
                    'message': 'Memory service not available',
                    'status': 'error'
                }
        except Exception as e:
            logger.error(f"Error clearing memory: {str(e)}")
            return {
                'message': f'Error clearing memory: {str(e)}',
                'status': 'error'
            }

# Global service instance
langchain_service = LangChainService()