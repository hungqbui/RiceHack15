#!/bin/bash

echo "🎓 Educational AI Flask App Setup"
echo "================================="

# Check if Python is installed
if ! command -v python &> /dev/null; then
    echo "❌ Python is not installed. Please install Python 3.8+ first."
    exit 1
fi

echo "✅ Python found: $(python --version)"

# Check if pip is installed
if ! command -v pip &> /dev/null; then
    echo "❌ pip is not installed. Please install pip first."
    exit 1
fi

echo "✅ pip found: $(pip --version)"

# Install Python dependencies
echo "📦 Installing Python dependencies..."
pip install -r requirements.txt

if [ $? -eq 0 ]; then
    echo "✅ Python dependencies installed successfully"
else
    echo "❌ Error installing Python dependencies"
    exit 1
fi

# Check for Tesseract OCR
echo "🔍 Checking for Tesseract OCR..."
if command -v tesseract &> /dev/null; then
    echo "✅ Tesseract OCR found: $(tesseract --version | head -n1)"
else
    echo "⚠️  Tesseract OCR not found. Image processing may not work."
    echo "Please install Tesseract OCR:"
    echo "  - Windows: Download from https://github.com/UB-Mannheim/tesseract/wiki"
    echo "  - macOS: brew install tesseract"
    echo "  - Ubuntu/Debian: sudo apt-get install tesseract-ocr"
fi

# Create .env file if it doesn't exist
if [ ! -f .env ]; then
    echo "📝 Creating .env file from template..."
    cp .env.example .env
    echo "✅ .env file created. Please edit it and add your OpenAI API key."
else
    echo "✅ .env file already exists"
fi

# Create uploads directory
if [ ! -d uploads ]; then
    mkdir uploads
    echo "✅ Created uploads directory"
else
    echo "✅ Uploads directory already exists"
fi

echo ""
echo "🚀 Setup complete! Next steps:"
echo "1. Edit .env file and add your OpenAI API key"
echo "2. Run the app: python app.py"
echo "3. Test the API: python test_educational_api.py"
echo ""
echo "📚 Educational features available:"
echo "- PDF text extraction"
echo "- Image OCR processing"
echo "- RAG-based educational chat"
echo "- Knowledge base management"