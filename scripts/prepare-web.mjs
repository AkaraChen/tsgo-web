import { readFile, writeFile, mkdir, cp } from 'node:fs/promises';
const root = new URL('../', import.meta.url);
const wasm = await readFile(new URL('tsgo.wasm', root));
let offset = 8;
function leb() {
  let result = 0, shift = 0, byte;
  do { byte = wasm[offset++]; result += (byte & 127) * 2 ** shift; shift += 7; } while (byte & 128);
  return result;
}
const parts = [wasm.subarray(0, 8)];
while (offset < wasm.length) {
  const start = offset;
  const id = wasm[offset++];
  const size = leb();
  const end = offset + size;
  let omit = false;
  if (id === 0) {
    const length = leb();
    const name = wasm.subarray(offset, offset + length).toString();
    omit = name === 'name' || name.startsWith('.debug_');
  }
  if (!omit) parts.push(wasm.subarray(start, end));
  offset = end;
}
const stripped = Buffer.concat(parts);
if (!WebAssembly.validate(stripped)) throw new Error('Invalid WebAssembly output');
await mkdir(new URL('web/vendor', root), { recursive: true });
await writeFile(new URL('web/tsgo.wasm', root), stripped);
await cp(new URL('node_modules/@bjorn3/browser_wasi_shim/dist', root), new URL('web/vendor/wasi', root), { recursive: true });
await cp(new URL('node_modules/@bjorn3/browser_wasi_shim/LICENSE-MIT', root), new URL('web/vendor/WASI-LICENSE-MIT', root));
await cp(new URL('upstream/LICENSE.txt', root), new URL('web/TYPESCRIPT-LICENSE.txt', root));
await cp(new URL('upstream/NOTICE.txt', root), new URL('web/TYPESCRIPT-NOTICE.txt', root));
console.log(`Browser WASM: ${(stripped.length / 1024 / 1024).toFixed(1)} MiB`);
