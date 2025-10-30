# AI Tools

CLI and web tools powered by AI models (Ollama, OpenAI, Anthropic).

## Quick Start

```bash
# Install dependencies
npm install

# Install globally (optional)
npm link

# Compress documentation
ai-tools compress input.md -o output.md

# Or with npx
npx ai-tools compress input.md
```

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

## Available Tools

### Compress

Compress verbose technical documentation while preserving accuracy.

```bash
ai-tools compress input.md -o output.md
ai-tools compress input.md --provider openai --model gpt-4
cat docs.md | ai-tools compress > compressed.md
```

## Development

```bash
npm run dev          # Run with auto-reload
npm run web          # Start web interface (coming soon)
```

## Requirements

- Node.js 18+
- Ollama (default) or API keys for OpenAI/Anthropic

## License

MIT
