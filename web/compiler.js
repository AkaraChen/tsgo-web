import { WASI, File, OpenFile, ConsoleStdout, PreopenDirectory } from './vendor/wasi/index.js';

export async function compile(module, source) {
  const encoder = new TextEncoder();
  const decoder = new TextDecoder();
  const files = new Map([['main.ts', new File(encoder.encode(source))]]);
  const output = [];
  const capture = ConsoleStdout.lineBuffered(line => output.push(line));
  const wasi = new WASI([
    'tsgo', '/main.ts', '--target', 'es2020', '--module', 'es2020',
    '--strict', '--singleThreaded', '--skipLibCheck', '--pretty', 'false',
  ], ['PWD=/'], [new OpenFile(new File([])), capture, capture, new PreopenDirectory('/', files)], { debug: false });
  const instance = await WebAssembly.instantiate(module, { wasi_snapshot_preview1: wasi.wasiImport });
  let exitCode;
  try { exitCode = wasi.start(instance); }
  catch (error) { throw new Error([output.join("\n"), error.message].filter(Boolean).join("\n")); }
  const emitted = files.get('main.js');
  return { exitCode, diagnostics: output.join('\n'), javascript: emitted ? decoder.decode(emitted.data) : '' };
}
