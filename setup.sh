#!/bin/bash

echo "🚀 Setting up AI Tools..."
echo ""

# Check Node version
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 24 ]; then
    echo "❌ Node.js 24+ required. You have v$NODE_VERSION"
    exit 1
fi
echo "✅ Node.js v$(node -v)"

# Install root dependencies
echo ""
echo "📦 Installing root dependencies..."
npm install

# Install server dependencies
echo ""
echo "📦 Installing server dependencies..."
cd src/web/server
npm install
cd ../../..

# Install client dependencies
echo ""
echo "📦 Installing client dependencies..."
cd src/web/client
npm install
cd ../../..

# Create uploads directory
echo ""
echo "📁 Creating uploads directory..."
mkdir -p src/web/server/uploads

# Check if Ollama is installed
echo ""
if command -v ollama &> /dev/null; then
    echo "✅ Ollama found"
    
    # Check if model is available
    if ollama list | grep -q "qwen2.5-coder:14b"; then
        echo "✅ qwen2.5-coder:14b model found"
    else
        echo "⚠️  qwen2.5-coder:14b model not found"
        echo "   Run: ollama pull qwen2.5-coder:14b"
    fi
else
    echo "⚠️  Ollama not found"
    echo "   Install from: https://ollama.ai"
    echo "   Then run: ollama pull qwen2.5-coder:14b"
fi

echo ""
echo "✨ Setup complete!"
echo ""
echo "To start the application:"
echo "  CLI:  ai-tools compress input.md"
echo "  Web:  npm run web:dev"
echo ""
echo "For CLI global access, run: npm link"
echo ""