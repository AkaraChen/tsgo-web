const $ = id => document.getElementById(id);
const examples = {
  hello: `interface User {\n  name: string;\n  language: string;\n}\n\nconst greet = (user: User): string => {\n  return \`Hello, \${user.name}!\`;\n};\n\nconsole.log(greet({\n  name: "TinyGo",\n  language: "TypeScript",\n}));\n`,
  types: `// 把 "hello" 改成一个数字，再编译试试。\nconst count: number = "hello";\n\nconsole.log(count);\n`,
  generics: `function first<T>(items: T[]): T | undefined {\n  return items[0];\n}\n\nconst language = first(["TypeScript", "Go", "TinyGo"]);\nconst number = first([1, 2, 3]);\n\nconsole.log(language, number);\n`,
};
let worker, ready = false, busy = false, failed = false, timeout;
function status(text) { $('status').textContent = text; }
function controls() {
  $('compile').disabled = busy || (!ready && !failed);
  $('compile').textContent = busy ? '编译中…' : ready ? '编译' : failed ? '重试' : '加载中…';
  $('cancel').hidden = !busy;
  $('source').readOnly = busy;
  $('example').disabled = busy;
  $('copy').disabled = !$('output').value;
}
function fail(message) {
  clearTimeout(timeout);
  busy = false;
  ready = false;
  failed = true;
  worker?.terminate();
  $('diagnostics').textContent = message;
  status('加载或编译失败');
  controls();
}
function startWorker() {
  clearTimeout(timeout);
  failed = false;
  worker?.terminate();
  ready = false;
  busy = false;
  controls();
  status('正在下载并准备编译器…');
  timeout = setTimeout(() => fail('加载超时，请检查网络后重试。'), 120_000);
  worker = new Worker(new URL('./worker.js', import.meta.url), { type: 'module' });
  worker.onmessage = ({ data }) => {
    if (data.type === 'loading') {
      status(data.message);
    } else if (data.type === 'ready') {
      clearTimeout(timeout);
      ready = true;
      status('就绪');
    } else if (data.type === 'result') {
      clearTimeout(timeout);
      busy = false;
      $('output').value = data.javascript;
      $('diagnostics').textContent = data.diagnostics || (data.exitCode === 0 ? '没有类型错误。' : `编译退出码：${data.exitCode}`);
      $('diagnostics').classList.toggle('text-red-600', data.exitCode !== 0);
      status(`${data.exitCode === 0 ? '编译成功' : '发现错误'} · ${(data.elapsed / 1000).toFixed(2)} s`);
    } else if (data.type === 'error') {
      fail(data.message);
      return;
    }
    controls();
  };
  worker.onerror = event => { event.preventDefault(); fail(event.message || '编译器无法启动，请重试。'); };
  worker.postMessage({ type: 'load' });
}
function compile() {
  if (busy) return;
  if (!ready) { startWorker(); return; }
  busy = true;
  $('output').value = '';
  $('diagnostics').textContent = '正在检查类型并生成 JavaScript…';
  $('diagnostics').classList.remove('text-red-600');
  status('编译中…');
  controls();
  timeout = setTimeout(() => fail('编译超过 120 秒，请简化代码后重试。'), 120_000);
  worker.postMessage({ type: 'compile', source: $('source').value });
}
$('source').value = examples.hello;
$('example').onchange = () => {
  $('source').value = examples[$('example').value];
  $('output').value = '';
  $('diagnostics').textContent = '点击「编译」查看这个示例的结果。';
  $('diagnostics').classList.remove('text-red-600');
  if (ready) status('尚未编译');
  controls();
};
$('source').oninput = () => {
  $('output').value = '';
  $('diagnostics').textContent = '代码已修改，请重新编译。';
  if (ready) status('尚未编译');
  controls();
};
$('compile').onclick = compile;
$('cancel').onclick = () => {
  clearTimeout(timeout);
  $('diagnostics').textContent = '已取消编译。';
  startWorker();
};
$('copy').onclick = async () => {
  try {
    await navigator.clipboard.writeText($('output').value);
    $('copy').textContent = '已复制';
    setTimeout(() => { $('copy').textContent = '复制 JavaScript'; }, 1500);
  } catch { status('复制失败，请在输出框内手动复制。'); }
};
document.addEventListener('keydown', event => {
  if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') {
    event.preventDefault();
    if (ready && !busy) compile();
  }
});
startWorker();
