# Educational AI Flask App with Google GenAI & MongoDB

A Flask backend application integrated with Google's Gemini AI and MongoDB vector database for educational conversational AI, featuring PDF processing, OCR for images, and Retrieval Augmented Generation (RAG) for context-aware responses.

## 🎓 Educational Features

- **PDF Processing**: Extract text from educational PDF materials
- **OCR Image Processing**: Convert images with text to searchable content using Tesseract
- **RAG System**: Context-aware educational chat using Google Gemini and MongoDB vector search
- **Knowledge Base Management**: Add, query, and manage educational content in MongoDB
- **Educational Chat**: AI tutor powered by Google's Gemini that answers questions based on uploaded materials

## 🚀 Core Features

- **Google Gemini Integration**: Advanced conversational AI using Google's latest Gemini models
- **MongoDB Vector Database**: Scalable document storage with vector search capabilities
- **Gemini Embeddings**: High-quality text embeddings for semantic search
- **Conversation with Memory**: Chat that remembers previous messages
- **Text Summarization**: Summarize long texts using Gemini
- **Memory Management**: Clear conversation history

## 🏗️ Architecture

- **Frontend**: React (client directory)
- **Backend**: Flask with Google GenAI integration
- **AI Models**: Google Gemini Pro for chat, Gemini embeddings for vector search
- **Database**: MongoDB with vector search capabilities
- **OCR**: Tesseract for image text extraction
- **PDF Processing**: PyPDF2 and pdfplumber for text extraction

## 📚 Educational API Endpoints

### File Upload & Processing
- `POST /api/upload-pdf` - Upload and process PDF materials
  ```json
  {
    "file": "educational_material.pdf"
  }
  ```

- `POST /api/upload-image` - Upload and OCR process images
  ```json
  {
    "file": "textbook_page.jpg"
  }
  ```

### Educational Chat (Powered by Google Gemini)
- `POST /api/educational-chat` - AI tutor using Gemini + MongoDB RAG
  ```json
  {
    "question": "Explain photosynthesis based on the uploaded materials"
  }
  ```

### Knowledge Base Management (MongoDB)
- `GET /api/knowledge-base/stats` - Get MongoDB knowledge base statistics
- `POST /api/knowledge-base/clear` - Clear all educational materials from MongoDB
- `POST /api/add-text` - Manually add text to MongoDB knowledge base
  ```json
  {
    "text": "Educational content...",
    "source": "Custom Source Name"
  }
  ```

## 🛠️ Setup

### Prerequisites
- Python 3.8+
- Google API key (for Gemini AI)
- MongoDB instance (local or MongoDB Atlas)
- Tesseract OCR (for image processing)

### MongoDB Setup

**Option 1: Local MongoDB**
1. Install MongoDB locally
2. Start MongoDB service
3. Use default connection: `mongodb://localhost:27017/`

**Option 2: MongoDB Atlas (Recommended)**
1. Create free MongoDB Atlas account
2. Create a cluster
3. Get connection string
4. Set up vector search index (see instructions below)

### Vector Search Index Setup (MongoDB Atlas)

Create a vector search index named `vector_index` with this configuration:
```json
{
  "fields": [
    {
      "type": "vector",
      "path": "embedding",
      "numDimensions": 768,
      "similarity": "cosine"
    },
    {
      "type": "filter",
      "path": "source"
    }
  ]
}
```

### Install Tesseract OCR

**Windows:**
1. Download from: https://github.com/UB-Mannheim/tesseract/wiki
2. Install and add to PATH

**macOS:**
```bash
brew install tesseract
```

**Ubuntu/Debian:**
```bash
sudo apt-get install tesseract-ocr
```

### Application Setup

1. **Install Dependencies**
   ```bash
   cd server
   pip install -r requirements.txt
   ```

2. **Environment Configuration**
   ```bash
   cp .env.example .env
   # Edit .env file and add your Google API key and MongoDB URI
   ```

3. **Run the Application**
   ```bash
   python app.py
   ```

The server will start on `http://localhost:5000`

## � Configuration

### Environment Variables
- `GOOGLE_API_KEY`: Your Google AI API key (required)
- `MONGODB_URI`: MongoDB connection string (default: mongodb://localhost:27017/)
- `MONGODB_DB_NAME`: Database name (default: educational_ai)
- `MONGODB_COLLECTION_NAME`: Collection name (default: documents)
- `FLASK_DEBUG`: Enable debug mode (default: True)
- `SECRET_KEY`: Flask secret key
- `PORT`: Server port (default: 5000)

### Google AI Setup
1. Go to [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Create a new API key
3. Add it to your `.env` file as `GOOGLE_API_KEY`

### Educational Settings
- Chunk size: 1000 characters with 200 character overlap
- Temperature: 0.3 (lower for more consistent educational responses)
- Retrieval: Top 4 relevant chunks per query
- Model: Gemini Pro for conversations, embedding-001 for vectors

## 📊 Response Format

### Educational Chat Response
```json
{
  "answer": "Based on the uploaded materials and Google Gemini's analysis, quantum mechanics has several key principles...",
  "sources": [
    {
      "content": "Relevant excerpt from uploaded material...",
      "source": "quantum_physics.pdf"
    }
  ],
  "status": "success"
}
```

### Knowledge Base Stats Response
```json
{
  "total_documents": 150,
  "status": "ready",
  "database": "MongoDB - educational_ai.documents",
  "connection_uri": "cluster0.mongodb.net"
}
```

## 🔒 Security Features

- File type validation
- Secure filename handling
- File size limits
- CORS enabled for client integration
- MongoDB connection security

## 🐛 Error Handling

All endpoints return appropriate HTTP status codes and detailed error messages:
- 400: Bad Request (missing parameters, invalid files)
- 500: Internal Server Error (processing failures, MongoDB connection issues)

## 🚀 Performance Tips

1. **MongoDB Atlas**: Use MongoDB Atlas for better performance and built-in vector search
2. **Optimize PDFs**: Use text-based PDFs when possible
3. **Image Quality**: Higher resolution images provide better OCR results
4. **Index Management**: Ensure vector search index is properly configured
5. **Connection Pooling**: MongoDB connections are automatically managed
6. **File Sizes**: Keep files under recommended limits for faster processing

## 🔍 Usage Examples

### 1. Upload Educational PDF
```bash
curl -X POST -F "file=@textbook.pdf" http://localhost:5000/api/upload-pdf
```

### 2. Process Image with Text
```bash
curl -X POST -F "file=@notes.jpg" http://localhost:5000/api/upload-image
```

### 3. Ask Educational Question (Powered by Gemini)
```bash
curl -X POST -H "Content-Type: application/json" \
  -d '{"question": "What are the main principles of quantum mechanics?"}' \
  http://localhost:5000/api/educational-chat
```

### 4. Check MongoDB Knowledge Base Stats
```bash
curl http://localhost:5000/api/knowledge-base/stats
```

## 📁 File Upload Specifications

### Supported File Types
- **PDFs**: `.pdf`
- **Images**: `.png`, `.jpg`, `.jpeg`, `.gif`, `.bmp`, `.tiff`

### File Size Limits
- Maximum file size: 16MB
- Recommended PDF size: Under 10MB for optimal processing

### Image Processing
- Automatic image preprocessing for better OCR
- Grayscale conversion and noise reduction
- Optimal text recognition for educational materials

## 🧠 AI Capabilities (Google Gemini)

### PDF Processing
- Extracts text from complex PDF layouts
- Maintains page structure information
- Handles both text and scanned PDFs

### OCR (Optical Character Recognition)
- Processes handwritten and printed text
- Image preprocessing for better accuracy
- Confidence scoring for text quality

### RAG with MongoDB Vector Search
- Context-aware responses using Google Gemini
- Intelligent document chunking and embedding
- MongoDB Atlas vector search for scalability
- Source attribution for answers
- Educational prompt optimization

## 💾 MongoDB Integration

### Collection Structure
```javascript
{
  "_id": ObjectId("..."),
  "text": "Document content chunk...",
  "embedding": [0.1, 0.2, 0.3, ...], // 768-dimensional vector
  "source": "document_name.pdf",
  "metadata": {
    "chunk_index": 0,
    "total_chunks": 15
  }
}
```

### Vector Search Index
The system requires a vector search index named `vector_index` with:
- 768 dimensions (for Gemini embeddings)
- Cosine similarity
- Text filtering on source field

## 🔧 Troubleshooting

### Common Issues

1. **Google API Key Issues**
   - Ensure API key is valid and has Gemini API access
   - Check quota limits in Google AI Studio

2. **MongoDB Connection Issues**
   - Verify MongoDB URI format
   - Check network connectivity
   - Ensure proper authentication credentials

3. **Vector Search Issues**
   - Confirm vector search index is created
   - Check index name matches configuration
   - Verify embedding dimensions (768 for Gemini)

4. **Tesseract OCR Issues**
   - Ensure Tesseract is installed and in PATH
   - Check image quality and format

### Error Messages
- `Google API key not found`: Add `GOOGLE_API_KEY` to .env file
- `MongoDB connection failed`: Check `MONGODB_URI` and network access
- `Vector index not found`: Create vector search index in MongoDB Atlas
- `Tesseract not found`: Install Tesseract OCR

## 🆕 Migration from OpenAI to Google GenAI

If migrating from the previous OpenAI version:

1. **Update Environment Variables**
   ```bash
   # Remove
   OPENAI_API_KEY=...
   
   # Add
   GOOGLE_API_KEY=your_google_api_key
   MONGODB_URI=your_mongodb_connection_string
   ```

2. **Install New Dependencies**
   ```bash
   pip install -r requirements.txt
   ```

3. **Set Up MongoDB**
   - Create MongoDB instance
   - Configure vector search index
   - Update connection settings

4. **Test Migration**
   ```bash
   python test_educational_api.py
   ```

The new system provides better performance, scalability, and cost-effectiveness compared to the OpenAI + FAISS setup.