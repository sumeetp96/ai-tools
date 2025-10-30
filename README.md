# AI Tools

Pluggable CLI and web interface for AI-powered tools. Currently supports document compression with plans for more tools.

## Features

- 🔧 **Pluggable Architecture** - Easy to add new tools
- 🌐 **Dual Interface** - CLI and modern web UI
- 🔄 **Multi-Provider Support** - Ollama (ready), OpenAI & Anthropic (coming soon)
- 📦 **File Upload** - Support for text, code, PDF, and images with OCR
- 🎨 **Dark Mode** - Beautiful UI with light/dark themes
- 📊 **Diff Viewer** - Visual comparison of changes
- 💾 **History & Presets** - Save and reuse configurations
- ⚡ **Streaming** - Real-time output generation

## Quick Start

### Installation

```bash
# Clone the repository
git clone <your-repo-url>
cd ai-tools

# Install root dependencies (CLI)
npm install

# Install web server dependencies
cd src/web/server
npm install
cd ../../..

# Install web client dependencies
cd src/web/client
npm install
cd ../../..

# Install CLI globally (optional)
npm link
```

### Prerequisites

- Node.js 18+
- Ollama (default provider)

**Install Ollama:**

```bash
# Visit https://ollama.ai for installation
# Then pull recommended model
ollama pull qwen2.5-coder:14b
```

## Usage

### CLI

```bash
# Compress documentation
ai-tools compress input.md -o output.md

# With specific provider and model
ai-tools compress input.md --provider ollama --model llama3.1:8b

# From stdin
cat docs.md | ai-tools compress > compressed.md

# With streaming
ai-tools compress input.md --stream

# List available tools and providers
ai-tools list

# Manage configuration
ai-tools config show
ai-tools config init
ai-tools config set provider ollama
```

### Web Interface

```bash
# Start both server and client (recommended)
npm run web:dev

# Or start separately
npm run web:server  # Backend on port 3842
npm run web:client  # Frontend on port 5847

# Then open http://localhost:5847
```

**Web Features:**

- Drag & drop file upload
- Real-time streaming output
- Side-by-side and diff views
- Save presets for quick access
- History of recent compressions
- Provider/model configuration

## Configuration

Create `.ai-toolsrc` in your home directory or project root:

```json
{
  "provider": "ollama",
  "models": {
    "ollama": "qwen2.5-coder:14b",
    "openai": "gpt-4-turbo",
    "anthropic": "claude-sonnet-4"
  },
  "temperature": 0.2,
  "maxTokens": 8192
}
```

**Config priority:**

1. CLI flags (highest)
2. `.ai-toolsrc` file
3. Default to Ollama

## Available Tools

### Compress

Compress verbose technical documentation while preserving accuracy.

**Features:**

- Removes marketing language and fluff
- Preserves all code, commands, and technical details
- Maintains structure and formatting
- Optimizes for information density

**CLI:**

```bash
ai-tools compress docs.md -o compressed.md --target-length 50
```

**API:**

```javascript
import { execute } from "ai-tools";

const result = await execute("compress", inputText, {
  provider: "ollama",
  model: "qwen2.5-coder:14b",
});
```

## Project Structure

```
ai-tools/
├── src/
│   ├── core/                 # Shared AI provider logic
│   │   ├── config.js
│   │   ├── ai-provider.js
│   │   ├── provider-factory.js
│   │   └── providers/
│   │       ├── ollama-provider.js
│   │       ├── openai-provider.js  (stub)
│   │       └── anthropic-provider.js  (stub)
│   ├── tools/                # Tool definitions
│   │   ├── tool-base.js
│   │   ├── compress.js
│   │   └── index.js
│   ├── cli.js                # CLI interface
│   ├── index.js              # Programmatic API
│   └── web/
│       ├── server/           # Express backend (port 3842)
│       │   ├── routes/
│       │   ├── services/
│       │   ├── middleware/
│       │   └── server.js
│       └── client/           # React frontend (port 5847)
│           ├── src/
│           │   ├── components/
│           │   ├── pages/
│           │   ├── services/
│           │   └── context/
│           └── vite.config.js
├── package.json
└── README.md
```

## Adding New Tools

### 1. Create Tool Class

```javascript
// src/tools/your-tool.js
import ToolBase from "./tool-base.js";

class YourTool extends ToolBase {
  getName() {
    return "your-tool";
  }

  getDescription() {
    return "Description of what your tool does";
  }

  getSystemPrompt() {
    return "System prompt for the AI...";
  }

  buildUserPrompt(input, options) {
    return `Process this: ${input}`;
  }
}

export default YourTool;
```

### 2. Register Tool

```javascript
// src/tools/index.js
import YourTool from "./your-tool.js";

const TOOLS = {
  compress: CompressTool,
  "your-tool": YourTool, // Add here
};
```

### 3. Done! Tool is now available in CLI and web

```bash
ai-tools your-tool input.md
```

## API Reference

### Programmatic Usage

```javascript
import { execute, executeStream } from "ai-tools";

// Execute tool
const result = await execute("compress", input, {
  provider: "ollama",
  model: "qwen2.5-coder:14b",
  temperature: 0.2,
});

// Stream output
const stream = await executeStream("compress", input);
for await (const chunk of stream) {
  console.log(chunk.message.content);
}
```

### Web API Endpoints

```
POST   /api/tools/:toolName/execute
POST   /api/tools/:toolName/upload
GET    /api/tools/:toolName/stream    (SSE)
GET    /api/tools
GET    /api/config
PUT    /api/config
POST   /api/config/test-provider
GET    /api/providers
GET    /api/providers/:name/models
GET    /api/health
```

## Development

```bash
# Run CLI with auto-reload
npm run dev

# Run web with auto-reload
npm run web:dev

# Build web client for production
npm run web:build

# Preview production build
npm run web:preview
```

## Supported File Formats

**Upload Support:**

- Text: .txt, .md, .json, .yaml, .xml, .csv, .log, etc.
- Code: .js, .py, .java, .cpp, .rs, .go, and 50+ more
- Documents: .pdf (text extraction)
- Images: .png, .jpg, .gif (OCR via Tesseract)

**Max File Sizes:**

- Text/Code: 10MB (configurable)
- PDF: 20MB (configurable)
- Images: 5MB (configurable)

## Roadmap

- [ ] OpenAI provider implementation
- [ ] Anthropic provider implementation
- [ ] More tools (summarize, translate, refactor, etc.)
- [ ] History export/import
- [ ] Batch processing
- [ ] API authentication
- [ ] Database persistence
- [ ] Tool marketplace

## License

MIT

## Contributing

Contributions welcome! The pluggable architecture makes it easy to add new tools and providers.
