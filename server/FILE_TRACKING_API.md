# File Tracking API Documentation

This document describes the new file tracking functionality that allows you to upload documents and perform file-specific RAG operations.

## Overview

The system now assigns a unique file ID to each uploaded document, enabling:
- Tracking of individual documents
- File-specific question answering
- Targeted RAG operations on single documents
- File metadata management

## API Endpoints

### 1. Single File Upload
```http
POST /api/upload
Content-Type: multipart/form-data

Body:
- file: (file) The document to upload (PDF, TXT, or image)
```

**Response:**
```json
{
  "message": "File processed and added to RAG successfully",
  "chunks_added": 5,
  "file_id": "20240101_120000_abc12345",
  "filename": "document.pdf",
  "status": "success"
}
```

### 2. Multiple Files Upload
```http
POST /api/upload/multiple
Content-Type: multipart/form-data

Body:
- files: (file[]) Multiple documents to upload
  OR
- files[0], files[1], files[2]...: Individual file fields
  OR  
- file0, file1, file2...: Numbered file fields
```

**Response:**
```json
{
  "message": "Processed 3 of 3 files successfully",
  "total_files_uploaded": 3,
  "successful_files": 3,
  "total_chunks_added": 15,
  "successful_results": [
    {
      "filename": "doc1.pdf",
      "file_id": "20240101_120000_abc12345",
      "type": "pdf",
      "chunks_added": 5,
      "text_length": 1500,
      "status": "success"
    }
  ],
  "failed_files": [],
  "status": "success"
}
```

### 3. List All Files
```http
POST /api/upload
Content-Type: multipart/form-data

Body:
- file: (file) The document to upload (PDF, TXT, or image)
```

**Response:**
```json
{
  "message": "File processed and added to RAG successfully",
  "chunks_added": 5,
  "file_id": "20240101_120000_abc12345",
  "filename": "document.pdf",
  "status": "success"
}
```

### 3. List All Files
```http
GET /api/files
```

**Response:**
```json
{
  "files": [
    {
      "file_id": "20240101_120000_abc12345",
      "filename": "document.pdf",
      "upload_timestamp": "2024-01-01T12:00:00",
      "file_type": "pdf",
      "document_count": 5
    }
  ],
  "total_files": 1,
  "status": "success"
}
```

### 4. Get Multiple Files Information (Batch)
```http
POST /api/files/batch
Content-Type: application/json

Body:
{
  "file_ids": ["20240101_120000_abc12345", "20240101_120100_def67890"]
}
```

**Response:**
```json
{
  "file_results": {
    "20240101_120000_abc12345": {
      "documents": [...],
      "count": 5,
      "status": "success"
    }
  },
  "summary": {
    "total_requested": 2,
    "found_files": 1,
    "not_found_files": 1,
    "total_documents": 5
  },
  "found_file_ids": ["20240101_120000_abc12345"],
  "not_found_file_ids": ["20240101_120100_def67890"],
  "status": "success"
}
```

### 5. Get Single File Information
```http
GET /api/files
```

**Response:**
```json
{
  "files": [
    {
      "file_id": "20240101_120000_abc12345",
      "filename": "document.pdf",
      "upload_timestamp": "2024-01-01T12:00:00",
      "file_type": "pdf",
      "document_count": 5
    }
  ],
  "total_files": 1,
  "status": "success"
}
```

### 5. Get Single File Information
```http
GET /api/files/{file_id}
```

**Response:**
```json
{
  "file_id": "20240101_120000_abc12345",
  "documents": [
    {
      "content": "Document chunk content...",
      "metadata": {
        "file_id": "20240101_120000_abc12345",
        "filename": "document.pdf",
        "upload_timestamp": "2024-01-01T12:00:00",
        "file_type": "pdf",
        "chunk_index": 0
      }
    }
  ],
  "count": 5,
  "status": "success"
}
```

### 6. Chat with Single File
```http
POST /api/chat/file/{file_id}
Content-Type: application/json

Body:
{
  "message": "What is this document about?",
  "max_chunks": 4
}
```

**Response:**
```json
{
  "file_id": "20240101_120000_abc12345",
  "answer": "Based on the document content, this appears to be about...",
  "context_chunks": 3,
  "sources": [
    {
      "content": "Relevant chunk content...",
      "metadata": {...}
    }
  ],
  "status": "success"
}
```

### 7. Chat with Multiple Files
```http
POST /api/chat/files
Content-Type: application/json

Body:
{
  "file_ids": ["20240101_120000_abc12345", "20240101_120100_def67890"],
  "message": "Compare the concepts in these documents",
  "max_chunks_per_file": 3
}
```

**Response:**
```json
{
  "file_ids": ["20240101_120000_abc12345", "20240101_120100_def67890"],
  "found_files": ["20240101_120000_abc12345"],
  "answer": "Based on the documents provided, the main concepts include...",
  "total_chunks": 6,
  "sources": [...],
  "context_summary": {
    "files_used": 1,
    "total_files_requested": 2,
    "chunks_per_file": 3
  },
  "status": "success"
}
```

### 8. General Chat (Existing)
```http
GET /api/files/{file_id}
```

**Response:**
```json
{
  "file_id": "20240101_120000_abc12345",
  "documents": [
    {
      "content": "Document chunk content...",
      "metadata": {
        "file_id": "20240101_120000_abc12345",
        "filename": "document.pdf",
        "upload_timestamp": "2024-01-01T12:00:00",
        "file_type": "pdf",
        "chunk_index": 0
      }
    }
  ],
  "count": 5,
  "status": "success"
}
```

### 8. General Chat with File Selection
```http
POST /api/chat
Content-Type: application/json

Body:
{
  "message": "Your question here",
  "max_chunks": 5,
  "file_ids": ["20240101_120000_abc12345", "20240101_120100_def67890"]  // Optional
}
```

**Response:**
```json
{
  "answer": "Based on the selected documents...",
  "sources": [...],
  "status": "success",
  "selected_files": ["20240101_120000_abc12345", "20240101_120100_def67890"],
  "files_used": 2
}
```

### 9. Generate Quiz/Mock Exam
```http
POST /api/quiz/generate
Content-Type: application/json

Body:
{
  "file_ids": ["20240101_120000_abc12345", "20240101_120100_def67890"],  // Optional
  "quiz_prompt": "Focus on calculation-based problems with formulas",     // Optional
  "quiz_type": "mixed",                                                   // Optional: multiple_choice, short_answer, essay, mixed
  "num_questions": 5                                                      // Optional: 1-20, default 5
}
```

**Response:**
```json
{
  "quiz": {
    "quiz_info": {
      "type": "mixed",
      "num_questions": 5,
      "difficulty": "mixed"
    },
    "questions": [
      {
        "id": 1,
        "type": "multiple_choice",
        "question": "What is Newton's second law of motion?",
        "options": [
          "F = ma",
          "F = mv",
          "F = mg", 
          "F = ma²"
        ],
        "correct_answer": "A",
        "explanation": "Newton's second law states that force equals mass times acceleration",
        "difficulty": "basic",
        "topic": "Classical Mechanics"
      },
      {
        "id": 2,
        "type": "short_answer",
        "question": "Explain the concept of kinetic energy and provide its formula.",
        "correct_answer": "Kinetic energy is the energy an object has due to its motion. Formula: KE = ½mv²",
        "explanation": "Kinetic energy depends on both mass and velocity squared",
        "difficulty": "intermediate",
        "topic": "Energy and Work"
      }
    ]
  },
  "sources": [...],
  "context_files": 2,
  "selected_files": ["20240101_120000_abc12345", "20240101_120100_def67890"],
  "custom_prompt": "Focus on calculation-based problems with formulas",
  "status": "success"
}

### Overview
Both text and audio chat now support optional file selection, allowing users to:
- Select specific documents via checkboxes on the client side
- Use the same RAG context for both text and audio interactions
- Get more targeted responses from selected materials

### WebSocket Events with File Selection

#### Text Message with File Selection
```javascript
socket.emit('text_message', {
  message: 'Explain Newton\'s laws',
  session_id: 'session_123',
  file_ids: ['physics_file_id', 'math_file_id']  // Optional
});
```

#### Audio Message with File Selection
```javascript
socket.emit('audio_message', {
  audio: base64AudioData,
  mime_type: 'audio/wav',
  session_id: 'session_123',
  file_ids: ['physics_file_id', 'math_file_id']  // Optional
});
```

### Implementation Details

#### Audio Chat Process
1. **Transcription**: Audio is first transcribed to extract the question text
2. **Context Retrieval**: The transcribed question is used to retrieve relevant context from selected files
3. **Response Generation**: Both the original audio and the retrieved context are used to generate the response

#### File Selection Logic
- **With file_ids**: Only content from specified files is used for context
- **Without file_ids**: All uploaded documents are searched for relevant context
- **Empty file_ids array**: Same as not providing file_ids (all documents)

## Multiple File Operations

### Use Cases

1. **Cross-Document Analysis**: Compare concepts across multiple textbooks or papers
2. **Comprehensive Research**: Get information from a collection of related documents
3. **Subject-Specific Queries**: Query all documents related to a specific topic
4. **Batch Processing**: Upload and process multiple documents simultaneously

### Multiple File Upload Methods

#### Method 1: HTML Form with Multiple File Input
```html
<form enctype="multipart/form-data">
  <input type="file" name="files" multiple>
</form>
```

#### Method 2: JavaScript with Array Notation
```javascript
const formData = new FormData();
files.forEach((file, index) => {
  formData.append(`files[${index}]`, file);
});
```

#### Method 3: Individual File Fields
```javascript
const formData = new FormData();
formData.append('file0', file1);
formData.append('file1', file2);
formData.append('file2', file3);
```

### Batch Query Strategies

#### Strategy 1: Target Specific Files
```javascript
// Query only documents you know contain relevant information
const response = await fetch('/api/chat/files', {
  method: 'POST',
  headers: {'Content-Type': 'application/json'},
  body: JSON.stringify({
    file_ids: ['math_textbook_id', 'physics_notes_id'],
    message: 'Compare mathematical formulas used in physics',
    max_chunks_per_file: 3
  })
});
```

#### Strategy 2: Filter by File Type or Topic
```javascript
// First get all files, then filter by type
const filesResponse = await fetch('/api/files');
const allFiles = await filesResponse.json();
const pdfFiles = allFiles.files.filter(f => f.file_type === 'pdf');
const pdfFileIds = pdfFiles.map(f => f.file_id);

// Then query the filtered files
const chatResponse = await fetch('/api/chat/files', {
  method: 'POST',
  headers: {'Content-Type': 'application/json'},
  body: JSON.stringify({
    file_ids: pdfFileIds,
    message: 'What are the main topics in these PDF documents?'
  })
});
```

## File ID Format
```http
POST /api/chat/file/{file_id}
Content-Type: application/json

Body:
{
  "message": "What is this document about?",
  "max_chunks": 4
}
```

**Response:**
```json
{
  "file_id": "20240101_120000_abc12345",
  "answer": "Based on the document content, this appears to be about...",
  "context_chunks": 3,
  "sources": [
    {
      "content": "Relevant chunk content...",
      "metadata": {...}
    }
  ],
  "status": "success"
}
```

### 5. General Chat (Existing)
```http
POST /api/chat
Content-Type: application/json

Body:
{
  "message": "Your question here",
  "max_chunks": 5
}
```

## File ID Format

File IDs are generated using the format:
```
YYYYMMDD_HHMMSS_{8-char-uuid}
```

Example: `20240115_143022_a1b2c3d4`

This ensures:
- Chronological ordering
- Uniqueness
- Human-readable timestamps

## Usage Examples

### Multiple File Upload Example
```python
import requests

# Upload multiple files
files = [
  ('files', ('math.pdf', open('math.pdf', 'rb'), 'application/pdf')),
  ('files', ('physics.pdf', open('physics.pdf', 'rb'), 'application/pdf')),
  ('files', ('cs.txt', open('cs.txt', 'rb'), 'text/plain'))
]

response = requests.post('http://localhost:5000/api/upload/multiple', files=files)
result = response.json()

# Extract file IDs
file_ids = [f['file_id'] for f in result['successful_results']]
print(f"Uploaded {len(file_ids)} files: {file_ids}")

# Close file handles
for _, file_handle in files:
    file_handle[1].close()
```

### Multi-File Chat Example
```python
# Chat with multiple files
chat_data = {
    "file_ids": file_ids,
    "message": "What are the key formulas and equations mentioned across these documents?",
    "max_chunks_per_file": 2
}

response = requests.post(
    'http://localhost:5000/api/chat/files',
    json=chat_data
)
result = response.json()

print(f"Answer from {result['context_summary']['files_used']} files:")
print(result['answer'])
```

### Batch File Information Example
```python
# Get information about multiple files
batch_data = {"file_ids": file_ids}

response = requests.post(
    'http://localhost:5000/api/files/batch',
    json=batch_data
)
result = response.json()

print(f"Found {result['summary']['found_files']} files:")
for file_id in result['found_file_ids']:
    file_info = result['file_results'][file_id]
    print(f"- {file_id}: {file_info['count']} chunks")
```

### Python Client Example
```python
import requests
import json

# Upload a file
with open('document.pdf', 'rb') as f:
    response = requests.post('http://localhost:5000/api/upload', files={'file': f})
    result = response.json()
    file_id = result['file_id']

# Chat with the specific file
chat_data = {
    "message": "What are the main topics in this document?",
    "max_chunks": 3
}
response = requests.post(
    f'http://localhost:5000/api/chat/file/{file_id}',
    json=chat_data
)
answer = response.json()['answer']
```

### Single File Upload Example (Backward Compatibility)
```python
import requests
import json

# Upload a single file (original method)
with open('document.pdf', 'rb') as f:
    response = requests.post('http://localhost:5000/api/upload', files={'file': f})
    result = response.json()
    file_id = result['file_id']

# Chat with the specific file
chat_data = {
    "message": "What are the main topics in this document?",
    "max_chunks": 3
}
response = requests.post(
    f'http://localhost:5000/api/chat/file/{file_id}',
    json=chat_data
)
answer = response.json()['answer']
```

### JavaScript Multiple File Example
```javascript
// Upload file
const formData = new FormData();
formData.append('file', fileInput.files[0]);

const uploadResponse = await fetch('/api/upload', {
    method: 'POST',
    body: formData
});
const uploadResult = await uploadResponse.json();
const fileId = uploadResult.file_id;

// Chat with specific file
const chatResponse = await fetch(`/api/chat/file/${fileId}`, {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({
        message: "Explain the key concepts in this document",
        max_chunks: 4
    })
});
const chatResult = await chatResponse.json();
```

## Error Handling

All endpoints return consistent error responses:

```json
{
  "error": "Error description",
  "status": "error"
}
```

Common error codes:
- `400`: Bad Request (missing parameters)
- `404`: File not found
- `500`: Internal server error

## Features

### File-Specific RAG
- Each uploaded document gets a unique identifier
- Questions can be asked specifically about one document
- Context is retrieved only from the specified file
- Metadata tracking for all document chunks

### Metadata Enhancement
Each document chunk includes:
- `file_id`: Unique identifier for the source file
- `filename`: Original filename
- `upload_timestamp`: When the file was uploaded
- `file_type`: Type of file (pdf, txt, image)
- `chunk_index`: Position within the document

### Backward Compatibility
- Existing `/api/chat` endpoint continues to work with all documents
- Previous uploads (without file IDs) remain accessible through general chat
- No breaking changes to existing functionality

## Testing

Run the comprehensive test suite to verify all functionality:

### Single File Testing
```bash
python test_file_tracking.py
```

### Multiple File Testing  
```bash
python test_multiple_files.py
```

This will test:
- Single file upload with ID generation
- Multiple file upload with batch processing
- Single file information retrieval
- Batch file information retrieval
- Single file-specific chat functionality
- Multi-file chat with aggregated context
- Error handling for invalid file IDs
- Performance comparison between single and multi-file operations

## Performance Considerations

### Chunking Strategy
- Each file is processed into smaller chunks for better retrieval
- `max_chunks_per_file` parameter controls context size per file
- Balance between comprehensiveness and response time

### Batch Operations
- Multi-file queries aggregate context from multiple sources
- File-specific filters improve query precision
- Parallel processing for better performance

### Memory Management
- Vector embeddings are stored efficiently in MongoDB
- File metadata includes tracking for resource management
- Cleanup utilities available for removing old files

## New Features Summary

### Multi-File Support
✅ **Multiple File Upload** - Upload several documents simultaneously  
✅ **Batch File Operations** - Query multiple files with single API call  
✅ **Cross-Document Analysis** - Compare and analyze content across files  
✅ **Aggregated Context** - Combine relevant chunks from multiple sources  

### Enhanced API Endpoints
✅ **`/api/upload/multiple`** - Batch file upload with detailed results  
✅ **`/api/files/batch`** - Get information about multiple files  
✅ **`/api/chat/files`** - Chat with multiple files simultaneously  
✅ **`/api/quiz/generate`** - Generate quizzes and mock exams from educational content  
✅ **Enhanced Error Handling** - Comprehensive error responses and validation  

### Backward Compatibility
✅ **Original Endpoints** - All existing functionality preserved  
✅ **Single File Operations** - Individual file upload and chat still supported  
✅ **Existing Client Code** - No breaking changes to current implementations