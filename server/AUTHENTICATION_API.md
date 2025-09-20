# Educational AI API with Authentication

A comprehensive Flask-based educational AI application with user authentication, document management, and RAG (Retrieval-Augmented Generation) capabilities.

## 🔐 Authentication

All document and chat endpoints require authentication using JWT tokens.

### Authentication Endpoints

#### 1. User Registration
```http
POST /api/auth/register
Content-Type: application/json

Body:
{
  "username": "john_doe",
  "email": "john@example.com",
  "password": "securepassword123"
}
```

**Response:**
```json
{
  "message": "User registered successfully",
  "token": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...",
  "user": {
    "id": "60f7b3b8c9e6a1001c5d4e2a",
    "username": "john_doe",
    "email": "john@example.com"
  }
}
```

#### 2. User Login
```http
POST /api/auth/login
Content-Type: application/json

Body:
{
  "username": "john_doe",  // Can be username or email
  "password": "securepassword123"
}
```

**Response:**
```json
{
  "message": "Login successful",
  "token": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...",
  "user": {
    "id": "60f7b3b8c9e6a1001c5d4e2a",
    "username": "john_doe",
    "email": "john@example.com"
  }
}
```

#### 3. Verify Token
```http
GET /api/auth/verify
Authorization: Bearer <your_jwt_token>
```

**Response:**
```json
{
  "message": "Token is valid",
  "user": {
    "id": "60f7b3b8c9e6a1001c5d4e2a",
    "username": "john_doe",
    "email": "john@example.com",
    "created_at": "2024-01-01T12:00:00Z",
    "last_login": "2024-01-01T15:30:00Z"
  }
}
```

#### 4. Logout
```http
POST /api/auth/logout
Authorization: Bearer <your_jwt_token>
```

**Response:**
```json
{
  "message": "Logout successful. Please remove token from client."
}
```

## 🔒 Protected Endpoints

All endpoints below require authentication. Include the JWT token in the Authorization header:

```http
Authorization: Bearer <your_jwt_token>
```

### Document Management

#### 1. Upload Single File
```http
POST /api/upload
Authorization: Bearer <your_jwt_token>
Content-Type: multipart/form-data

Body:
file: <pdf_or_image_file>
```

**Response:**
```json
{
  "message": "PDF processed and added to knowledge base successfully",
  "filename": "document.pdf",
  "file_id": "20240101_120000_abc12345",
  "type": "pdf",
  "extraction_result": {
    "file_id": "20240101_120000_abc12345",
    "pages": 5,
    "method": "PyMuPDF",
    "text_length": 2547,
    "upload_timestamp": "2024-01-01T12:00:00"
  }
}
```

#### 2. Upload Multiple Files
```http
POST /api/upload/multiple
Authorization: Bearer <your_jwt_token>
Content-Type: multipart/form-data

Body:
files: <multiple_files>
```

#### 3. List User's Files
```http
GET /api/files
Authorization: Bearer <your_jwt_token>
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
      "pages": 5,
      "chunks": 12
    }
  ],
  "total_files": 1,
  "status": "success"
}
```

#### 4. Get Specific File Info
```http
GET /api/files/{file_id}
Authorization: Bearer <your_jwt_token>
```

### Chat and RAG

#### 1. General Chat
```http
POST /api/chat
Authorization: Bearer <your_jwt_token>
Content-Type: application/json

Body:
{
  "message": "What is quantum computing?",
  "file_ids": ["20240101_120000_abc12345"]  // Optional: specific files
}
```

**Response:**
```json
{
  "answer": "Quantum computing is a type of computation that harnesses...",
  "sources": [
    {
      "content": "Quantum computers use quantum bits (qubits)...",
      "source": "quantum_computing.pdf",
      "file_id": "20240101_120000_abc12345",
      "filename": "quantum_computing.pdf"
    }
  ],
  "selected_files": ["20240101_120000_abc12345"],
  "files_used": 1
}
```

#### 2. Chat with Specific File
```http
POST /api/chat/file/{file_id}
Authorization: Bearer <your_jwt_token>
Content-Type: application/json

Body:
{
  "message": "What is this document about?",
  "max_chunks": 4
}
```

#### 3. Chat with Multiple Files
```http
POST /api/chat/files
Authorization: Bearer <your_jwt_token>
Content-Type: application/json

Body:
{
  "file_ids": ["file_id_1", "file_id_2"],
  "message": "Compare the approaches in these documents",
  "max_chunks_per_file": 2
}
```

### Quiz Generation

#### Generate Quiz/Mock Exam
```http
POST /api/quiz/generate
Authorization: Bearer <your_jwt_token>
Content-Type: application/json

Body:
{
  "file_ids": ["20240101_120000_abc12345", "20240101_120100_def67890"],  // Optional
  "quiz_prompt": "Focus on calculation-based problems with formulas",     // Optional
  "quiz_type": "mixed",                                                   // Optional
  "num_questions": 5                                                      // Optional: 1-20
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
        "options": ["F = ma", "F = mv", "F = mg", "F = ma²"],
        "correct_answer": "A",
        "explanation": "Newton's second law states that force equals mass times acceleration",
        "difficulty": "basic",
        "topic": "Classical Mechanics"
      }
    ]
  },
  "sources": [...],
  "selected_files": ["20240101_120000_abc12345", "20240101_120100_def67890"],
  "custom_prompt": "Focus on calculation-based problems with formulas",
  "status": "success"
}
```

## 🔐 Authentication Features

### JWT Token Management
- **Token Expiration**: Tokens expire after 24 hours
- **Token Format**: Bearer token in Authorization header
- **Secure Storage**: Passwords hashed with bcrypt
- **User Isolation**: Each user can only access their own documents

### User Management
- **Unique Usernames**: Usernames must be unique across the system
- **Unique Emails**: Email addresses must be unique across the system
- **Password Requirements**: Minimum 6 characters
- **Account Creation**: Automatic token generation on registration
- **Login Tracking**: Last login timestamp tracking

### Security Features
- **Protected Endpoints**: All document and chat endpoints require authentication
- **User Isolation**: Users can only access their own uploaded documents
- **Token Validation**: All requests validated with JWT tokens
- **Error Handling**: Secure error messages that don't leak sensitive information

## 🚦 Error Responses

### Authentication Errors
```json
// 401 Unauthorized
{
  "error": "No authorization header provided"
}

// 401 Unauthorized  
{
  "error": "Invalid or expired token"
}

// 400 Bad Request
{
  "error": "Username already exists"
}

// 401 Unauthorized
{
  "error": "Invalid credentials"
}
```

### Document Access Errors
```json
// 404 Not Found (when accessing another user's document)
{
  "error": "File not found",
  "file_id": "requested_file_id"
}

// 403 Forbidden
{
  "error": "Access denied to this resource"
}
```

## 🛠️ Usage Examples

### Complete Authentication Flow

1. **Register a new user:**
```bash
curl -X POST http://localhost:5000/api/auth/register \\
  -H "Content-Type: application/json" \\
  -d '{"username": "alice", "email": "alice@example.com", "password": "password123"}'
```

2. **Login and get token:**
```bash
curl -X POST http://localhost:5000/api/auth/login \\
  -H "Content-Type: application/json" \\
  -d '{"username": "alice", "password": "password123"}'
```

3. **Upload a document:**
```bash
curl -X POST http://localhost:5000/api/upload \\
  -H "Authorization: Bearer <your_token>" \\
  -F "file=@document.pdf"
```

4. **Chat with your documents:**
```bash
curl -X POST http://localhost:5000/api/chat \\
  -H "Authorization: Bearer <your_token>" \\
  -H "Content-Type: application/json" \\
  -d '{"message": "Summarize the main points from my documents"}'
```

## 🔄 Migration from Previous Version

If upgrading from a version without authentication:

1. **Existing Documents**: Previously uploaded documents will need to be re-uploaded by authenticated users
2. **API Changes**: All endpoints now require authentication headers
3. **Client Updates**: Update client applications to handle JWT tokens
4. **Database**: New user collection will be created automatically

## ⚡ WebSocket Authentication

WebSocket connections for real-time audio chat will require token-based authentication. Pass the JWT token during the WebSocket handshake:

```javascript
const socket = io('http://localhost:5000', {
  auth: {
    token: 'your_jwt_token_here'
  }
});
```

*Note: WebSocket authentication implementation is planned for future updates.*