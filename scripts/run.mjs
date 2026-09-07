import { WASI } from 'node:wasi';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

const wasmPath = fileURLToPath(new URL('../tsgo.wasm', import.meta.url));
const wasi = new WASI({
  version: 'preview1',
  args: ['tsgo', ...process.argv.slice(2)],
  env: { PWD: '/', HOME: '/', TMPDIR: '/tmp' },
  preopens: { '/': process.cwd() },
  returnOnExit: true,
});
const module = await WebAssembly.compile(await readFile(wasmPath));
const instance = await WebAssembly.instantiate(module, wasi.getImportObject());
process.exitCode = wasi.start(instance);
