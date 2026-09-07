import { compile } from './compiler.js';
let module;
self.onmessage = async ({ data }) => {
  try {
    if (data.type === 'load') {
      const response = await fetch(new URL('./tsgo.wasm', import.meta.url));
      if (!response.ok) throw new Error(`Compiler download failed (${response.status})`);
      module = await WebAssembly.compile(await response.arrayBuffer());
      self.postMessage({ type: 'ready' });
    } else if (data.type === 'compile') {
      if (!module) throw new Error('Compiler is not ready');
      const start = performance.now();
      const result = await compile(module, data.source);
      self.postMessage({ type: 'result', ...result, elapsed: performance.now() - start });
    }
  } catch (error) {
    self.postMessage({ type: 'error', message: error.message });
  }
};
