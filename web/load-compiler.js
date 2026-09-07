import { compilerAsset } from './compiler-asset.js';

export async function loadCompiler(report = () => {}) {
  const compressed = typeof DecompressionStream !== 'undefined';
  const url = new URL(compressed ? './tsgo.wasm.gz' : './tsgo.wasm', import.meta.url);
  url.searchParams.set('v', compilerAsset.version);
  let cache;
  try { cache = await caches.open(`tsgo-compiler:${new URL('./', import.meta.url).pathname}`); } catch { /* Storage is optional. */ }
  let response;
  try { response = await cache?.match(url); } catch { /* Fall back to the network. */ }
  const cached = !!response;
  const size = ((compressed ? compilerAsset.gzipBytes : compilerAsset.bytes) / 1048576).toFixed(1);
  report(cached ? '正在读取本地缓存…' : `正在下载编译器（${size} MiB）…`);
  response ??= await fetch(url);
  if (!response.ok) throw new Error(`Compiler download failed (${response.status})`);
  const saved = response.clone();
  let bytes;
  try {
    bytes = compressed
      ? await new Response(response.body.pipeThrough(new DecompressionStream('gzip'))).arrayBuffer()
      : await response.arrayBuffer();
  } catch (error) {
    try { await cache?.delete(url); } catch { /* Storage is optional. */ }
    throw error;
  }
  // Prevent a partial download or stale deployment from entering the persistent cache.
  const hash = globalThis.crypto?.subtle
    ? Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256', bytes)), b => b.toString(16).padStart(2, '0')).join('')
    : null;
  if (bytes.byteLength !== compilerAsset.bytes || (hash !== null && hash !== compilerAsset.version)) {
    try { await cache?.delete(url); } catch { /* Storage is optional. */ }
    throw new Error('编译器文件校验失败，请重试。');
  }
  report('正在准备编译器…');
  const module = await WebAssembly.compile(bytes);
  if (!cached) {
    try { await cache?.put(url, saved); } catch { /* Quota/private mode must not block compilation. */ }
  }
  return module;
}
