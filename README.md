# tsgo playground

一个最简 TypeScript playground：Tailwind CDN 装饰，TinyGo 编译的 TypeScript Go 编译器在浏览器 Web Worker 中运行。纯静态页面，无编译后端。

## 本地运行

需要 Node.js 24：

```sh
npm ci
npm run dev
```

打开 <http://127.0.0.1:3000>。仓库包含浏览器需要的 WASM 和 WASI shim，启动页面不需要安装 Go 或重新构建编译器。Tailwind 样式从 CDN 加载，需要联网。

- 左侧编辑 TypeScript，点击「编译」或按 Ctrl / ⌘ + Enter。
- 右侧查看、复制 JavaScript；下方显示类型错误与编译耗时。
- 提供普通代码、类型错误、泛型三个示例。
- 编译期间可以取消；加载失败、运行时错误或 120 秒超时后可以重试。
- 每次编译使用新的 WASI 实例和内存文件系统，输入代码不上传到服务器。
- 页面只展示编译结果，不执行生成的 JavaScript。

将 `web/` 整个目录放到静态文件服务器也能运行（通过 HTTP/HTTPS 打开，不能双击 HTML 使用 `file://`）。

## 验证

```sh
npm test
```

使用与浏览器相同的 WASI 内存文件系统，检查接口与函数调用、JavaScript 输出、TS2322 类型错误、泛型，以及连续编译之间的数据隔离。

已通过 Chrome 实际操作验证：默认接口示例、类型错误、泛型与复制输出。浏览器 WASM 约 17.5 MiB。

## 从源码构建 WASM

源自 [microsoft/TypeScript](https://github.com/microsoft/TypeScript)，固定提交 `1f70213d4922b434345f639b441681e470c7cfc1`，未修改 TypeScript 源码。

```sh
bash scripts/setup.sh
npm run build:wasm
```

`setup.sh` 自动下载固定版本 TinyGo 0.42.0（Linux x86_64），并校验 SHA-256。TypeScript 需要 Go 1.26，Go 的自动工具链下载需要联网。其他平台安装 TinyGo 后可设置 `TINYGO=/path/to/tinygo`。

默认 64 KiB goroutine 栈会在部分接口调用场景中造成内存越界；本项目增大到 1 MiB，并保留对应回归测试。

构建使用 `-p=2 -target=wasip1 -stack-size=1MB -opt=z -no-debug`。`scripts/prepare-web.mjs` 生成 `web/tsgo.wasm` 并复制锁定版本的 WASI shim。首次完整构建可能需要约 20–30 分钟和数 GB 内存；脚本限制并行度，并设置 `GOGC=50` 降低构建内存压力。

完整 CLI 构建后也可以在 Node WASI 中使用：

```sh
node scripts/run.mjs examples/hello.ts --target es2020 --outDir dist --singleThreaded --skipLibCheck
node dist/hello.js
npm run test:cli
```

## 范围

Playground 是单文件 `main.ts` 编译，固定使用 ES2020、ES module、strict、singleThreaded 和 skipLibCheck。标准库声明随编译器嵌入；skipLibCheck 跳过声明文件内部检查，仍然检查用户代码。

不支持上传项目、安装 npm 包、watch 或 LSP。TinyGo 移植仍属实验用途，未验证所有 TypeScript 特性和大型项目。

浏览器适配采用 [browser_wasi_shim 0.4.2](https://github.com/bjorn3/browser_wasi_shim)，样式按要求使用 [Tailwind Play CDN](https://tailwindcss.com/docs/installation/play-cdn)。第三方说明见 [web/THIRD-PARTY.md](web/THIRD-PARTY.md)。
