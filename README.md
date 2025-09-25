# Paint

AI-powered image generation and editing CLI tool built with Bun and Fal.ai.

## Features

- 🎨 Generate AI images from text prompts
- ✏️ Edit existing images with AI
- 🖼️ Display images directly in your terminal
- 📁 Manage generated images locally
- 🚀 Fast and lightweight
- 🔄 Automated versioning with conventional commits

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

### Global Installation

```bash
npm install -g paintai

# Set up your API key
paintai config --api-key YOUR_FAL_API_KEY_HERE
```

## Quick Start

1. **Install the CLI**:

   ```bash
   npm install -g paintai
   ```

2. **Get your API key**:
   - Visit [fal.ai/dashboard/keys](https://fal.ai/dashboard/keys)
   - Create a new API key

3. **Configure the CLI**:

   ```bash
   paintai config --api-key YOUR_FAL_API_KEY_HERE
   ```

4. **Generate your first image**:
   ```bash
   paintai --prompt "a beautiful sunset over mountains"
   ```

## Usage

### Basic Commands

```bash
# Generate a new image (interactive)
paintai

# Generate with a prompt
paintai --prompt "a serene mountain landscape at sunset"

# Show the last generated image
paintai l

# Edit mode (select from existing images)
paintai e

# Edit a specific image
paintai e image.png --prompt "add dramatic clouds"

# Configure your API key
paintai config

# Check API key status
paintai config
```

### Options

- `-h, --help` - Show help message
- `-v, --version` - Show version
- `-d, --debug` - Enable debug mode
- `--prompt TEXT` - Provide prompt as argument
- `--type TYPE` - Set command type (i/l/e)

### Configuration

The CLI stores your API key securely in a local config file (`~/.paintai/config.json`) with restricted permissions. This approach is more secure than using environment variables as it:

- ✅ Keeps your API key out of shell history
- ✅ Prevents exposure in process lists
- ✅ Uses file system permissions for security
- ✅ No need to modify shell configuration files

**Note**: Use `paintai config --api-key YOUR_KEY` to set up your API key securely!

### Environment Variables (Optional)

- `FAL_API_KEY` - Your Fal.ai API key (for backward compatibility)

The CLI will first check for a config file, then fall back to the environment variable if needed.

### Tab Completion

Enable tab completion for better user experience:

```bash
# Install completion
paintai --completion install

# Follow the instructions to add the completion script to your shell config
# Then reload your shell or restart your terminal

# Test completion
paintai <TAB>  # Should show available commands and options
paintai e <TAB>  # Should show available image files for editing
```

To uninstall completion:

```bash
paintai --completion uninstall
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
