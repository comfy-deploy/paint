#!/usr/bin/env bun
import { getImageSequence } from "./termimg.js";

import { log, text, spinner, isCancel, cancel, select, group } from '@clack/prompts';
import { SelectPrompt } from '@clack/core';
import { fal as falClient } from "@fal-ai/client";
import yargs from "yargs";
import { hideBin } from "yargs/helpers";
import path from "path";
import fs from "fs";

// Validate FAL_API_KEY early
function validateApiKey() {
  const apiKey = process.env.FAL_API_KEY;
  
  if (!apiKey) {
    log.error('FAL_API_KEY is not set!');
    log.info('To get your API key:');
    log.info('1. Visit https://fal.ai/dashboard/keys');
    log.info('2. Create a new API key');
    log.info('3. Run: paint config --api-key YOUR_KEY_HERE');
    log.info('   Or set it manually: export FAL_API_KEY="your-key"');
    process.exit(1);
  }
  
  return apiKey;
}

// Configure fal client - validation will happen in command handlers
falClient.config({
  credentials: process.env.FAL_API_KEY,
})

// Import additional dependencies for handlers
import { fal } from '@ai-sdk/fal';
import { experimental_generateImage as generateImage } from 'ai';

const reset = '\x1b[0m';
const bright = '\x1b[1m';
const cyan = '\x1b[36m';
const yellow = '\x1b[33m';
const green = '\x1b[32m';
const dim = '\x1b[2m';
const dim2x = '\x1b[90m';

// Helper functions
function indentBlock(content: string, spaces: number = 2, state: string = "active", checkLastLine = true): string {
  const lines = content.split('\n');
  return lines
    .map((line, index) => {
      const isLastLine = index === lines.length - 1;

      const symbol = state === 'submit' ? '│' : (isLastLine && checkLastLine ? '└' : '│').trim();
      const indent = `${dim2x}${symbol}${reset}` + ' '.repeat(spaces).trim();
      return `${indent}${line}`.trim();
    })
    .join('\n');
}

// Function to get the most recent image from outputs folder
function getLastImage(outputDir: string) {
  if (!fs.existsSync(outputDir)) {
    return null;
  }

  const files = fs.readdirSync(outputDir)
    .filter(file => file.startsWith('image-') && file.endsWith('.png'))
    .map(file => ({
      name: file,
      path: path.join(outputDir, file),
      stats: fs.statSync(path.join(outputDir, file))
    }))
    .sort((a, b) => b.stats.mtime.getTime() - a.stats.mtime.getTime());

  return files.length > 0 ? files[0] : null;
}

// Function to get all images for cycling (limited to 50 to prevent preview generation issues)
function getAllImages(outputDir: string) {
  if (!fs.existsSync(outputDir)) {
    return [];
  }

  const files = fs.readdirSync(outputDir)
    .filter(file => file.startsWith('image-') && file.endsWith('.png'))
    .map(file => ({
      name: file,
      path: path.join(outputDir, file),
      stats: fs.statSync(path.join(outputDir, file))
    }))
    .sort((a, b) => b.stats.mtime.getTime() - a.stats.mtime.getTime())
    .slice(0, 50); // Limit to 50 images to prevent preview generation issues

  return files;
}

// Command handlers
async function handleConfigCommand(argv: any) {
  const apiKey = argv.apiKey as string;
  const shell = process.env.SHELL || '/bin/bash';
  const isZsh = shell.includes('zsh');
  const isFish = shell.includes('fish');
  const isBash = shell.includes('bash');
  
  if (apiKey) {
    // Validate the provided API key
    if (!apiKey.startsWith('fal-') || apiKey.length < 20) {
      log.error('Invalid FAL_API_KEY format!');
      log.info('Your API key should start with "fal-" and be longer than 20 characters.');
      log.info('Get a valid key at: https://fal.ai/dashboard/keys');
      process.exit(1);
    }
    
    // Determine the appropriate shell config file
    let configFile: string;
    let exportCommand: string;
    
    if (isFish) {
      configFile = '~/.config/fish/config.fish';
      exportCommand = `set -gx FAL_API_KEY "${apiKey}"`;
    } else if (isZsh) {
      configFile = '~/.zshrc';
      exportCommand = `export FAL_API_KEY="${apiKey}"`;
    } else {
      configFile = '~/.bashrc';
      exportCommand = `export FAL_API_KEY="${apiKey}"`;
    }
    
    log.step('Setting up FAL_API_KEY...');
    log.info(`Add this line to your ${configFile}:`);
    log.info(`  ${exportCommand}`);
    log.info('');
    log.info('Then restart your terminal or run:');
    if (isFish) {
      log.info('  source ~/.config/fish/config.fish');
    } else if (isZsh) {
      log.info('  source ~/.zshrc');
    } else {
      log.info('  source ~/.bashrc');
    }
    log.info('');
    log.info('Or set it for this session only:');
    log.info(`  ${exportCommand}`);
    
    process.exit(0);
  } else {
    // Show current status and help
    const currentKey = process.env.FAL_API_KEY;
    
    if (currentKey) {
      const maskedKey = currentKey.substring(0, 8) + '...' + currentKey.substring(currentKey.length - 4);
      log.step(`FAL_API_KEY is set: ${maskedKey}`);
    } else {
      log.error('FAL_API_KEY is not set!');
    }
    
    log.info('');
    log.info('To configure your API key:');
    log.info('1. Get your key from: https://fal.ai/dashboard/keys');
    log.info('2. Run: paint config --api-key YOUR_KEY_HERE');
    log.info('');
    log.info('To set it manually:');
    if (isFish) {
      log.info('  echo \'set -gx FAL_API_KEY "your-key"\' >> ~/.config/fish/config.fish');
    } else if (isZsh) {
      log.info('  echo \'export FAL_API_KEY="your-key"\' >> ~/.zshrc');
    } else {
      log.info('  echo \'export FAL_API_KEY="your-key"\' >> ~/.bashrc');
    }
    
    process.exit(0);
  }
}

async function handleCompletionCommand(argv: any) {
  const completionShell = argv.shell as string;
  
  if (completionShell) {
    // Let yargs handle the completion script generation
    process.exit(0);
  } else {
    console.log(`
To install tab completion for paint:

For bash users:
  echo 'eval "$(paint --completion bash)"' >> ~/.bashrc

For zsh users:
  echo 'eval "$(paint --completion zsh)"' >> ~/.zshrc

For fish users:
  echo 'paint --completion fish | source' >> ~/.config/fish/config.fish

After adding the line, restart your terminal or run:
  source ~/.${process.env.SHELL?.includes('zsh') ? 'zshrc' : 'bashrc'}
`);
    process.exit(0);
  }
}

async function handleLastCommand(argv: any) {
  const currentDir = process.cwd();
  const outputDir = argv.output 
    ? path.resolve(argv.output)
    : path.join(currentDir, 'outputs');

  const lastImage = getLastImage(outputDir);

  if (!lastImage) {
    log.error('No images found in outputs folder');
    process.exit(1);
  }

  log.step(`Loading last image: ${lastImage.name}`);
  const sequence = await getImageSequence(lastImage.path, 500);
  log.step(sequence ?? '');
  process.exit(0);
}

async function handleEditCommand(argv: any) {
  // Validate API key for commands that need it
  validateApiKey();
  
  const currentDir = process.cwd();
  const outputDir = argv.output 
    ? path.resolve(argv.output)
    : path.join(currentDir, 'outputs');

  // ensure outputs directory exists
  fs.mkdirSync(outputDir, { recursive: true });

  // Extract positional arguments - yargs puts them in argv._ array
  const imageFile = argv.image as string || (argv._ && argv._[1]) as string;
  const promptFromArgs = argv.prompt as string || (argv._ && argv._[2]) as string;
  let selectedImage;

  // Check if imageFile parameter is provided
  if (imageFile) {
    // Validate that the provided file exists
    if (!fs.existsSync(imageFile)) {
      log.error(`Image file not found: ${imageFile}`);
      process.exit(1);
    }

    // Check if it's a valid image file (basic check by extension)
    const validExtensions = ['.png', '.jpg', '.jpeg', '.gif', '.bmp', '.webp'];
    const fileExtension = imageFile.toLowerCase().substring(imageFile.lastIndexOf('.'));
    
    if (!validExtensions.includes(fileExtension)) {
      log.error(`Invalid image file format: ${imageFile}. Supported formats: ${validExtensions.join(', ')}`);
      process.exit(1);
    }

    // Create image object for the provided file
    const stats = fs.statSync(imageFile);
    selectedImage = {
      name: imageFile.split('/').pop() || imageFile,
      path: imageFile,
      stats: stats
    };

    log.step(`Using provided image: ${selectedImage.name}`);
  } else {
    // Fall back to selecting from outputs folder
    const allImages = getAllImages(outputDir);

    if (allImages.length === 0) {
      log.error('No images found in outputs folder to edit');
      process.exit(1);
    }

    // Pre-generate image previews
    const imagePreviews = await Promise.all(
      allImages.map(async (img) => {
        const preview = await getImageSequence(img.path, 200);
        return { image: img, preview };
      })
    );

    const selectPrompt = new SelectPrompt<{ value: string }>({
      options: allImages.map((img, index) => ({
        value: index.toString(),
        label: `${img.name} (${new Date(img.stats.mtime).toLocaleString()})`,
      })),
      render: function () {
        const currentIndex = this.cursor;
        const currentImageData = imagePreviews[currentIndex];

        if (!currentImageData) {
          return "No image selected";
        }

        const optionsList = allImages.map((img, index) => {
          const isSelected = index === currentIndex;

          if (isSelected) {
            // Highlight the selected option
            const prefix = `${bright}${cyan}❯${reset} `;
            const label = `${bright}${yellow}${img.name}${reset} ${dim}(${new Date(img.stats.mtime).toLocaleString()})${reset}`;
            return `${prefix}${label}`;
          } else {
            // Regular styling for non-selected options
            const prefix = '  ';
            const label = `${img.name} ${dim}(${new Date(img.stats.mtime).toLocaleString()})${reset}`;
            return `${prefix}${label}`;
          }
        }).join('\n');

        // Clear screen and move cursor to top to prevent ghosting  
        const clearScreen = this.state == 'submit' ? '' : '\x1b[2J\x1b[H';

        let output = `${clearScreen}◆  Select Image\n`;

        output += indentBlock(optionsList, 2, this.state, false);

        output += '\n';
        output += indentBlock("  " + currentImageData.preview ?? '', 2, this.state, false);

        if (this.state !== 'submit') {
          output += '\n';
          output += indentBlock(`${dim}Use ↑↓ to select, Enter to confirm, Esc to cancel${reset}`, 2, this.state);
        }

        return output.trim();
      }
    });

    const selectedImageIndex = await selectPrompt.prompt();

    if (isCancel(selectedImageIndex)) {
      cancel('Edit operation cancelled.');
      process.exit(0);
    }

    selectedImage = allImages[parseInt(selectedImageIndex as string)];
    log.step(`Selected image: ${selectedImage.name}`);
  }

  // Show the selected image
  const currentSequence = await getImageSequence(selectedImage.path, 500);
  log.step('Current image:');
  log.step(currentSequence ?? '');

  // Get edit prompt - use from args if provided, otherwise prompt user
  const editPrompt = promptFromArgs || await text({
    message: 'Edit prompt',
    placeholder: 'Make the sky more dramatic, add some clouds',
    initialValue: '',
  });

  if (isCancel(editPrompt)) {
    cancel('Edit operation cancelled.');
    process.exit(0);
  }

  const s = spinner();
  s.start('Uploading image and editing...');

  // Upload the selected image to fal.ai storage
  const imageFileToUpload = new File([fs.readFileSync(selectedImage.path)], selectedImage.name, {
    type: 'image/png'
  });
  const imageUrl = await falClient.storage.upload(imageFileToUpload);

  // Use the uploaded image for editing
  const editModelName = argv.model as string || 'qwen-image-edit'; // Default for editing
  const fullEditModelName = editModelName.startsWith('fal-ai/') ? editModelName : `fal-ai/${editModelName}`;
  const { image: editedImage } = await generateImage({
    model: fal.image(fullEditModelName),
    prompt: editPrompt as string,
    providerOptions: {
      "fal": {
        image_url: imageUrl, // Pass the uploaded image URL
        image_urls: [imageUrl],
      }
    }
  });

  s.stop('Editing image');

  // Save the edited image
  const editFilename = `image-${Date.now()}-edited.png`;
  const editPath = path.join(outputDir, editFilename);
  fs.writeFileSync(editPath, editedImage.uint8Array);
  log.step(`Edited image saved to ${editFilename}`);

  // Display the edited image
  const editedSequence = await getImageSequence(editPath, 500);
  log.step(editedSequence ?? '');

  process.exit(0);
}

async function handleImageCommand(argv: any) {
  // Validate API key for commands that need it
  validateApiKey();
  
  const currentDir = process.cwd();
  const outputDir = argv.output 
    ? path.resolve(argv.output)
    : path.join(currentDir, 'outputs');

  // ensure outputs directory exists
  fs.mkdirSync(outputDir, { recursive: true });

  const promptFromArgs = argv.prompt as string;

  const prompt = promptFromArgs || await text({
    message: 'Prompt',
    placeholder: 'A serene mountain landscape at sunset',
    initialValue: 'A serene mountain landscape at sunset',
  });

  if (isCancel(prompt)) {
    cancel('Operation cancelled.');
    process.exit(0);
  }

  const s = spinner();
  s.start('Generating image');

  const modelName = argv.model as string || 'flux/dev'; // Default for generation
  const fullModelName = modelName.startsWith('fal-ai/') ? modelName : `fal-ai/${modelName}`;
  const { image, providerMetadata } = await generateImage({
    model: fal.image(fullModelName),
    prompt: prompt as string,
  });

  s.stop('Generating image');

  const filename = `image-${Date.now()}.png`;
  const filePath = path.join(outputDir, filename);
  fs.writeFileSync(filePath, image.uint8Array);
  log.step(`Image saved to ${filename}`);

  const sequence = await getImageSequence(filePath, 500);

  log.step(sequence ?? '');

  process.exit(0);
}

// Configure yargs
const argv = await yargs(hideBin(process.argv))
  .scriptName('paint')
  .usage('$0 [COMMAND] [OPTIONS]')
  .command(['image', 'i'], 'Generate a new image', (yargs) => {
    return yargs
      .positional('prompt', {
        type: 'string',
        describe: 'Prompt for image generation'
      })
  }, async (argv) => {
    await handleImageCommand(argv);
  })
  .command(['last', 'l'], 'Display the last generated image', {}, async (argv) => {
    await handleLastCommand(argv);
  })
  .command(['edit', 'e'], 'Edit an existing image', (yargs) => {
    return yargs
      .positional('image', {
        type: 'string',
        describe: 'Path to image file to edit'
      })
      .positional('prompt', {
        type: 'string',
        describe: 'Prompt for image editing'
      })
      .strict(false) // Allow positional arguments
  }, async (argv) => {
    await handleEditCommand(argv);
  })
  .command('config', 'Configure your FAL API key', (yargs) => {
    return yargs
      .option('api-key', {
        type: 'string',
        describe: 'Your Fal.ai API key'
      })
  }, async (argv) => {
    await handleConfigCommand(argv);
  })
  .command('completion [shell]', 'Generate completion script', (yargs) => {
    return yargs
      .positional('shell', {
        type: 'string',
        describe: 'Shell type (bash, zsh, fish)',
        choices: ['bash', 'zsh', 'fish']
      })
  }, async (argv) => {
    await handleCompletionCommand(argv);
  })
  .option('output', {
    alias: 'o',
    type: 'string',
    describe: 'Output directory (default: ./outputs)',
    default: './outputs'
  })
  .option('prompt', {
    type: 'string',
    describe: 'Provide prompt as argument'
  })
  .option('model', {
    alias: 'm',
    type: 'string',
    describe: 'Model to use (default: flux/dev for generation, qwen-image-edit for editing)'
  })
  .option('debug', {
    alias: 'd',
    type: 'boolean',
    describe: 'Enable debug mode',
    default: false
  })
  .completion('completion', async (current, argv) => {
    // Handle completion for different contexts
    const prev = argv._[argv._.length - 1];
    
    // Completion for edit command - show available images
    if (prev === 'edit' || prev === 'e' || argv._.includes('edit') || argv._.includes('e')) {
      if (fs.existsSync('./outputs')) {
        return fs.readdirSync('./outputs')
          .filter(file => file.endsWith('.png'))
          .map(file => `./outputs/${file}`);
      }
      return [];
    }
    
    // Completion for --output option - show directories
    if (current.startsWith('-') && current.includes('output')) {
      return fs.readdirSync('.')
        .filter(item => fs.statSync(item).isDirectory())
        .map(dir => `./${dir}/`);
    }
    
    // Don't provide completions for --prompt option to avoid weird suggestions
    if (current.startsWith('--prompt') || current.includes('prompt')) {
      return [];
    }
    
    // Default completions - only commands and flags, no prompt suggestions
    return ['image', 'i', 'last', 'l', 'edit', 'e', 'config', '--help', '--version', '--debug', '--output', '--model', '-m'];
  })
  .help('help')
  .alias('help', 'h')
  .version('version')
  .alias('version', 'v')
  .example('$0', 'Interactive image generation')
  .example('$0 --prompt "a sunset over mountains"', 'Generate with prompt')
  .example('$0 -m "flux/pro" --prompt "a sunset over mountains"', 'Generate with specific model')
  .example('$0 -o ./my-images', 'Save to custom directory')
  .example('$0 last', 'Show last image')
  .example('$0 edit', 'Edit mode (select image)')
  .example('$0 edit image.png --prompt "add clouds"', 'Edit specific image')
  .example('$0 config', 'Check API key status')
  .example('$0 config --api-key fal-xxx', 'Set up API key')
  .parse();

// Extract values from yargs for debug mode
const debug = argv.debug as boolean;

if (debug) {
  console.log('All argv:', argv);
}

// Default command handler - if no command is specified, default to image generation
// But don't run if this is a completion request
if (!argv._[0] && !argv['get-yargs-completions']) {
  await handleImageCommand(argv);
}
