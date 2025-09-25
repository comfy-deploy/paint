# Paint

AI-powered image generation and editing CLI tool built with Bun and Fal.ai.

## Features

- 🎨 Generate AI images from text prompts
- ✏️ Edit existing images with AI
- 🖼️ Display images directly in your terminal
- 📁 Manage generated images locally
- 🚀 Fast and lightweight

## Installation

### Local Development

1. Clone the repository:
```bash
git clone <your-repo-url>
cd paint
```

2. Install dependencies:
```bash
bun install
```

3. Set up your environment:
```bash
export FAL_API_KEY="your-fal-api-key"
```

4. Build the project:
```bash
bun run build
```

5. Install globally for local testing:
```bash
npm link
```

### Global Installation (when published)

```bash
npm install -g paint
```

## Usage

### Basic Commands

```bash
# Generate a new image (interactive)
paint

# Generate with a prompt
paint --prompt "a serene mountain landscape at sunset"

# Show the last generated image
paint l

# Edit mode (select from existing images)
paint e

# Edit a specific image
paint e image.png --prompt "add dramatic clouds"
```

### Options

- `-h, --help` - Show help message
- `-v, --version` - Show version
- `-d, --debug` - Enable debug mode
- `--prompt TEXT` - Provide prompt as argument
- `--type TYPE` - Set command type (i/l/e)

### Environment Variables

- `FAL_API_KEY` - Your Fal.ai API key (required)
- `TERM_PROGRAM` - Terminal program for image display

### Tab Completion

Enable tab completion for better user experience:

```bash
# Install completion
paint --completion install

# Follow the instructions to add the completion script to your shell config
# Then reload your shell or restart your terminal

# Test completion
paint <TAB>  # Should show available commands and options
paint e <TAB>  # Should show available image files for editing
```

To uninstall completion:
```bash
paint --completion uninstall
```

## Development

```bash
# Development mode with hot reload
bun run dev

# Run tests
bun run test

# Build for production
bun run build

# Uninstall global link
bun run uninstall-global
```

## Requirements

- [Bun](https://bun.sh) runtime
- Fal.ai API key
- Terminal that supports image display (iTerm2, Kitty, etc.)

## License

MIT
