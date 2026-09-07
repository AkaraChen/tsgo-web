#!/usr/bin/env bash
set -euo pipefail
ROOT=$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/.." && pwd)
REV=1f70213d4922b434345f639b441681e470c7cfc1
cd "$ROOT"
if [[ ! -d upstream ]]; then
  git init upstream
  git -C upstream remote add origin https://github.com/microsoft/TypeScript.git
  git -C upstream fetch --depth 1 origin "$REV"
  git -C upstream checkout --detach FETCH_HEAD
fi
if [[ $(git -C upstream rev-parse HEAD) != "$REV" ]]; then
  echo "Unexpected upstream revision; expected $REV" >&2
  exit 1
fi
if [[ ! -x .tools/tinygo/bin/tinygo ]]; then
  [[ $(uname -s) == Linux && $(uname -m) == x86_64 ]] || {
    echo 'Automatic toolchain setup supports Linux x86_64. Install TinyGo 0.42.0 and set TINYGO for scripts/build.sh.' >&2
    exit 1
  }
  mkdir -p .tools
  curl -fL https://github.com/tinygo-org/tinygo/releases/download/v0.42.0/tinygo0.42.0.linux-amd64.tar.gz -o .tools/tinygo.tar.gz
  echo 'b87688fa2e19cee7d813cad7fd7dadb71dff3198e47125aba66ba4af5e490438  .tools/tinygo.tar.gz' | sha256sum -c -
  tar -xzf .tools/tinygo.tar.gz -C .tools
fi
