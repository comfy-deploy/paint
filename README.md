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

3. Set up your API key:
```bash
# Get your API key from https://fal.ai/dashboard/keys
paint config --api-key YOUR_FAL_API_KEY_HERE
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

# Set up your API key
paint config --api-key YOUR_FAL_API_KEY_HERE
```

## Quick Start

1. **Install the CLI** (when published):
   ```bash
   npm install -g paint
   ```

2. **Get your API key**:
   - Visit [fal.ai/dashboard/keys](https://fal.ai/dashboard/keys)
   - Create a new API key

3. **Configure the CLI**:
   ```bash
   paint config --api-key YOUR_FAL_API_KEY_HERE
   ```

4. **Generate your first image**:
   ```bash
   paint --prompt "a beautiful sunset over mountains"
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

# Configure your API key
paint config

# Check API key status
paint config
```

### Options

- `-h, --help` - Show help message
- `-v, --version` - Show version
- `-d, --debug` - Enable debug mode
- `--prompt TEXT` - Provide prompt as argument
- `--type TYPE` - Set command type (i/l/e)

### Environment Variables

- `FAL_API_KEY` - Your Fal.ai API key (required)

**Note**: Use `paint config --api-key YOUR_KEY` to set up your API key easily!

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

- [Bun](https://bun.sh) runtime (for development)
- Fal.ai API key (get one at [fal.ai/dashboard/keys](https://fal.ai/dashboard/keys))
- Terminal that supports image display (iTerm2, Kitty, etc.)

## License

MIT
