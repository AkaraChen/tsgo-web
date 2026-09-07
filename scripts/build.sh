#!/usr/bin/env bash
set -euo pipefail
ROOT=$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/.." && pwd)
TINYGO=${TINYGO:-"$ROOT/.tools/tinygo/bin/tinygo"}
cd "$ROOT/upstream/tsc"
GOGC=50 "$TINYGO" build -p=2 -target=wasip1 -stack-size=1MB -opt=z -no-debug -o "$ROOT/tsgo.wasm" ./cmd/tsc
