import { compile } from './compiler.js';
import { loadCompiler } from './load-compiler.js';
let module;
self.onmessage = async ({ data }) => {
  try {
    if (data.type === 'load') {
      module = await loadCompiler(message => self.postMessage({ type: 'loading', message }));
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
