// src/termimg.ts
import fs from 'node:fs';
import path from 'node:path';
import * as Jimp from 'jimp'; // or 'sharp' if you prefer

const ESC = '\x1b';
const BEL = '\x07';
const ST = '\x1b\\';

export type Protocol = 'kitty' | 'iterm2' | 'sixel' | 'ansi' | 'none';

export interface RenderOpts {
  width: number; // e.g. "auto" | "400px" | "50%" | "40" (cells for iTerm2)
  height?: number; // same units as width
}

/** Heuristic protocol detection with env overrides. */
export function detectProtocol(): Protocol {
  // explicit override
  const force = process.env.TERMIMG_PROTOCOL as Protocol | undefined;
  if (force) return force;

  const env = process.env;
  const term = env.TERM ?? '';
  const prog = env.TERM_PROGRAM ?? '';

  // Be more conservative about Kitty protocol support
  // Only use Kitty for actual Kitty terminal or when explicitly enabled
  if (
    env.KITTY_WINDOW_ID ||
    term.includes('xterm-kitty') ||
    env.WEZTERM_EXECUTABLE
  ) {
    return 'kitty';
  }

  //   console.log(process.env);

  //   console.log(prog);
  //   console.log(env.KITTY_WINDOW_ID);
  //   console.log(env.WEZTERM_EXECUTABLE);
  //   console.log(env.GHOSTTY_RESOURCES_DIR);
  //   console.log(env.SIXEL);
  //   console.log(env.COLORTERM);
  //   console.log(env.TERM_PROGRAM);
  //   console.log(env.TERM);

  // For Ghostty, try iTerm2 protocol first (more reliable)
  if (prog === 'ghostty' && term.includes('ghostty')) {
    return 'kitty';
  }

  // iTerm2 (WezTerm also implements iTerm2 image protocol)
  if (prog === 'iTerm.app' || prog === 'WezTerm') {
    return 'iterm2';
  }

  // Lightweight SIXEL "detection": user may enable via env or have a SIXEL-capable TERM
  if (/\bsixel\b/i.test(env.TERM ?? '') || env.SIXEL === '1') {
    return 'sixel';
  }

  // Fallback to colored blocks if we have a TTY with truecolor
  if (
    process.stdout.isTTY &&
    (env.COLORTERM?.includes('truecolor') || env.COLORTERM === '24bit')
  ) {
    return 'ansi';
  }

  //   console.log("none");

  return 'none';
}

/** Wrap raw escape sequences so they pass through tmux to the outer terminal. */
export function wrapForTmux(seq: string): string {
  if (!process.env.TMUX) return seq;
  // DCS passthrough: ESC P tmux; ESC <payload-with-ESC-doubled> ST
  const doubled = seq.replaceAll(ESC, ESC + ESC);
  return `${ESC}Ptmux;${ESC}${doubled}${ST}`;
  // Ref: https://unix.stackexchange.com/a/409072 (tmux passthrough)
}

/** ---------- iTerm2 (OSC 1337) ---------- */
export function iterm2SequenceFromFile(
  filePath: string,
  {
    width = 'auto',
    height = 'auto',
    preserveAspectRatio = true,
  }: RenderOpts = {}
): string {
  const name = path.basename(filePath);
  const data = fs.readFileSync(filePath);
  const b64Name = Buffer.from(name).toString('base64');
  const b64Data = Buffer.from(data).toString('base64');
  // OSC 1337;File=...:<base64> BEL
  const seq =
    `${ESC}]1337;File=` +
    `name=${b64Name};` +
    `inline=1;` +
    `width=${width};height=${height};` +
    `preserveAspectRatio=${preserveAspectRatio ? 1 : 0}:` +
    `${b64Data}${BEL}`;
  return wrapForTmux(seq);
  // Spec: https://iterm2.com/documentation-images.html
}

/** ---------- Kitty (APC _G … ; payload ST) ----------
 * We send PNG data (f=100) and chunk to <= 4096 bytes (m=1 .. m=0).
 */
function kittySerialize(
  params: Record<string, string | number>,
  payloadB64: string
) {
  const keys = Object.entries(params)
    .map(([k, v]) => `${k}=${v}`)
    .join(',');
  return `${ESC}_G${keys};${payloadB64}${ST}`;
}

export async function kittySequenceFromImage(
  filePath: string,
  { width, height }: RenderOpts = { width: 100 }
): Promise<string> {
  // Convert to PNG bytes in-memory (Jimp handles JPG/PNG/WebP/GIF, etc.)
  const image = await Jimp.Jimp.read(filePath);
  image.resize({ w: width });
  const png = await image.getBuffer('image/png');
  const payload = Buffer.from(png).toString('base64');

  const base: Record<string, string | number> = { f: 100, a: 'T' }; // PNG, transmit + place
  // If you want pixel-exact sizing, you can add 's' (width) / 'v' (height) in pixels.
  // Otherwise, Kitty will draw at image size scaled to cell metrics.
  // Spec: https://sw.kovidgoyal.net/kitty/graphics-protocol/
  const chunks: string[] = [];
  const CH = 4096;
  for (let i = 0; i < payload.length; i += CH) {
    const chunk = payload.slice(i, i + CH);
    const m = i + CH < payload.length ? 1 : 0;
    const params = i === 0 ? { ...base, m } : { m };
    chunks.push(kittySerialize(params, chunk));
  }

  let seq = chunks.join('');
  // Optional placement size hints via the text layout (see spec §Display images on screen).
  // For simplicity we rely on Kitty's placement at cursor.

  seq = wrapForTmux(seq);
  return seq;
}

/** ---------- SIXEL ----------
 * Easiest path in JS is to shell out to `img2sixel` if present.
 * You can also use `npm:sixel` to encode in-process.
 */
export function sixelCommand(filePath: string): string {
  // stdout will contain the SIXEL escape stream
  return `img2sixel "${filePath}"`;
}

/** ---------- ANSI "half-block" fallback ----------
 * Render using foreground (top pixel) + background (bottom pixel) + '▄'.
 * Width is in terminal cells; height is rows of cells (each cell = 2 image rows).
 */
export async function ansiHalfBlockFromImage(
  filePath: string,
  targetCols = Math.min(process.stdout.columns ?? 80, 120)
): Promise<string> {
  const img = await Jimp.Jimp.read(filePath);

  // Keep aspect: each cell encodes 2 vertical pixels
  const aspect = img.bitmap.width / img.bitmap.height;
  const cellCols = targetCols;
  const cellRows = Math.max(1, Math.round(cellCols / aspect / 2));

  img.resize({
    w: cellCols,
    h: cellRows * 2,
    mode: Jimp.ResizeStrategy.BILINEAR,
  });

  const lines: string[] = [];
  for (let y = 0; y < cellRows; y++) {
    let line = '';
    for (let x = 0; x < cellCols; x++) {
      const top = Jimp.intToRGBA(img.getPixelColor(x, y * 2));
      const bot = Jimp.intToRGBA(img.getPixelColor(x, y * 2 + 1));
      line +=
        `${ESC}[38;2;${top.r};${top.g};${top.b}m` + // fg
        `${ESC}[48;2;${bot.r};${bot.g};${bot.b}m` + // bg
        `▄`; // U+2584 lower half block
    }
    line += `${ESC}[0m`;
    lines.push(line);
  }
  return lines.join('\n');
}

export async function getImageSequence(tmpFile: string, size = 100) {
  const protocol = detectProtocol();

  // console.log(protocol);

  try {
    switch (protocol) {
      case 'kitty':
        const kittySeq = await kittySequenceFromImage(tmpFile, { width: size });
        // process.stdout.write(kittySeq);
        return kittySeq;
      case 'iterm2':
        const itermSeq = iterm2SequenceFromFile(tmpFile, { width: size });
        // process.stdout.write(itermSeq);
        return itermSeq;
      case 'ansi':
        const ansiSeq = await ansiHalfBlockFromImage(tmpFile, 40);
        // process.stdout.write(ansiSeq);
        return ansiSeq;
    }
  } finally {
    // Keep temp file for testing
    // console.log(`Temp file saved at: ${tmpFile}`);
  }

  return 'Image rendering not supported for this terminal: ' + tmpFile;

  // 4. Ensure we end with a newline
  // process.stdout.write('\n');
}
