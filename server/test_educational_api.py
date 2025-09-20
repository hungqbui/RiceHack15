"""
Test script for Educational AI Flask App with Google GenAI and MongoDB
This script demonstrates how to use the educational endpoints
"""
import requests
import json

BASE_URL = "http://localhost:5000"

def test_health():
    """Test health endpoint"""
    print("🔍 Testing health endpoint...")
    response = requests.get(f"{BASE_URL}/health")
    print(f"Status: {response.status_code}")
    print(f"Response: {response.json()}")
    print()

def test_add_text():
    """Test adding text to MongoDB knowledge base"""
    print("📚 Testing add text to MongoDB knowledge base...")
    
    sample_text = """
    Photosynthesis is the process by which plants convert sunlight, carbon dioxide, and water into glucose and oxygen.
    This process occurs in the chloroplasts of plant cells and involves two main stages:
    1. Light-dependent reactions (occur in thylakoids)
    2. Light-independent reactions or Calvin cycle (occur in stroma)
    
    The overall equation for photosynthesis is:
    6CO2 + 6H2O + light energy → C6H12O6 + 6O2
    
    This process is fundamental to life on Earth as it produces oxygen and forms the base of most food chains.
    """
    
    data = {
        "text": sample_text,
        "source": "Biology Textbook - Chapter 8: Photosynthesis"
    }
    
    response = requests.post(f"{BASE_URL}/api/add-text", json=data)
    print(f"Status: {response.status_code}")
    print(f"Response: {response.json()}")
    print()

def test_educational_chat():
    """Test educational chat with Google Gemini"""
    print("🎓 Testing educational chat with Google Gemini...")
    
    questions = [
        "What is photosynthesis?",
        "Where does photosynthesis occur in plant cells?",
        "What are the main stages of photosynthesis?",
        "What is the chemical equation for photosynthesis?",
        "Why is photosynthesis important for life on Earth?"
    ]
    
    for question in questions:
        print(f"Question: {question}")
        data = {"question": question}
        response = requests.post(f"{BASE_URL}/api/educational-chat", json=data)
        
        if response.status_code == 200:
            result = response.json()
            print(f"Answer: {result.get('answer', 'No answer')[:200]}...")
            sources = result.get('sources', [])
            print(f"Sources: {len(sources)} found")
            if sources:
                for i, source in enumerate(sources[:2]):  # Show first 2 sources
                    print(f"  Source {i+1}: {source.get('source', 'Unknown')}")
        else:
            print(f"Error: {response.status_code} - {response.text}")
        print("-" * 50)

def test_knowledge_base_stats():
    """Test MongoDB knowledge base statistics"""
    print("📊 Testing MongoDB knowledge base stats...")
    response = requests.get(f"{BASE_URL}/api/knowledge-base/stats")
    print(f"Status: {response.status_code}")
    result = response.json()
    print(f"Response: {result}")
    
    if result.get('status') == 'ready':
        print(f"✅ MongoDB connected: {result.get('database')}")
        print(f"📄 Total documents: {result.get('total_documents')}")
    elif result.get('status') == 'empty':
        print("📭 Knowledge base is empty")
    else:
        print("⚠️  Knowledge base has issues")
    print()

def test_simple_chat():
    """Test simple chat with Google Gemini (without RAG)"""
    print("💬 Testing simple chat with Google Gemini...")
    
    data = {"message": "Hello! Can you tell me about artificial intelligence?"}
    response = requests.post(f"{BASE_URL}/api/chat", json=data)
    
    if response.status_code == 200:
        result = response.json()
        print(f"Response: {result.get('response', 'No response')[:200]}...")
        print(f"Status: {result.get('status')}")
    else:
        print(f"Error: {response.status_code} - {response.text}")
    print()

def test_conversation_memory():
    """Test conversation with memory"""
    print("🧠 Testing conversation with memory...")
    
    # First message
    data1 = {"message": "My name is Alice and I'm studying biology."}
    response1 = requests.post(f"{BASE_URL}/api/conversation", json=data1)
    
    if response1.status_code == 200:
        result1 = response1.json()
        print(f"First message response: {result1.get('response', 'No response')[:150]}...")
    
    # Second message to test memory
    data2 = {"message": "What's my name and what am I studying?"}
    response2 = requests.post(f"{BASE_URL}/api/conversation", json=data2)
    
    if response2.status_code == 200:
        result2 = response2.json()
        print(f"Memory test response: {result2.get('response', 'No response')[:150]}...")
    
    print()

def test_upload_simulation():
    """Simulate file upload testing (without actual files)"""
    print("📁 File upload endpoints available:")
    print("- POST /api/upload-pdf (for PDF files)")
    print("- POST /api/upload-image (for image files)")
    print("- Use curl or a form to test file uploads")
    print()
    
    print("Example curl commands:")
    print("curl -X POST -F \"file=@document.pdf\" http://localhost:5000/api/upload-pdf")
    print("curl -X POST -F \"file=@image.jpg\" http://localhost:5000/api/upload-image")
    print()

def test_google_genai_features():
    """Test Google GenAI specific features"""
    print("🤖 Testing Google GenAI Features...")
    print("=" * 40)
    
    # Test text summarization with Gemini
    print("📄 Testing text summarization with Gemini...")
    long_text = """
    Artificial intelligence (AI) is intelligence demonstrated by machines, in contrast to the natural intelligence displayed by humans and animals. Leading AI textbooks define the field as the study of "intelligent agents": any device that perceives its environment and takes actions that maximize its chance of successfully achieving its goals. Colloquially, the term "artificial intelligence" is often used to describe machines that mimic "cognitive" functions that humans associate with the human mind, such as "learning" and "problem solving".
    
    The traditional problems (or goals) of AI research include reasoning, knowledge representation, planning, learning, natural language processing, perception and the ability to move and manipulate objects. General intelligence is among the field's long-term goals. Approaches include statistical methods, computational intelligence, and traditional symbolic AI. Many tools are used in AI, including versions of search and mathematical optimization, artificial neural networks, and methods based on statistics, probability and economics.
    """
    
    data = {"text": long_text}
    response = requests.post(f"{BASE_URL}/api/summarize", json=data)
    
    if response.status_code == 200:
        result = response.json()
        print(f"Summary: {result.get('summary', 'No summary')}")
        print(f"Status: {result.get('status')}")
    else:
        print(f"Error: {response.status_code} - {response.text}")
    print()

def main():
    """Run all tests"""
    print("🚀 Educational AI Flask App Test Suite")
    print("Google GenAI + MongoDB Integration")
    print("=" * 50)
    
    try:
        # Basic connectivity tests
        test_health()
        test_knowledge_base_stats()
        
        # Google GenAI feature tests
        test_simple_chat()
        test_conversation_memory()
        test_google_genai_features()
        
        # Educational features
        test_add_text()
        test_knowledge_base_stats()  # Check stats after adding content
        test_educational_chat()
        
        # File upload information
        test_upload_simulation()
        
        print("✅ All tests completed!")
        print()
        print("🔧 System Information:")
        print("- AI Model: Google Gemini Pro")
        print("- Embeddings: Google Gemini Embeddings (768d)")
        print("- Vector DB: MongoDB with Atlas Vector Search")
        print("- OCR: Tesseract")
        print("- PDF Processing: PyPDF2 + pdfplumber")
        
    except requests.exceptions.ConnectionError:
        print("❌ Error: Cannot connect to the Flask app")
        print("Make sure the Flask app is running on http://localhost:5000")
        print("Run: python app.py")
        print()
        print("Also ensure:")
        print("- Google API key is set in .env file")
        print("- MongoDB is connected and running")
        print("- Vector search index is created in MongoDB Atlas")
    except Exception as e:
        print(f"❌ Error: {str(e)}")

if __name__ == "__main__":
    main()