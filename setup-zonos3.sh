#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")"

ZONOS_DIR="$PWD/zonos3"

echo "🎙️ Setting up Zyphra/ZONOS3-Mini local natural TTS server (port 1919)..."

if [ ! -d "$ZONOS_DIR" ]; then
  echo "1/4 Cloning Zyphra/ZONOS3-Mini from GitHub..."
  git clone --recurse-submodules https://github.com/Zyphra/ZONOS3-Mini "$ZONOS_DIR"
fi

SERVER_BIN="$ZONOS_DIR/servers/ggml/build/zonos3-server"
if [ ! -x "$SERVER_BIN" ]; then
  CMAKE_BIN="cmake"
  if ! command -v cmake >/dev/null 2>&1; then
    echo "1b/4 cmake not found globally — installing cmake in local .venv..."
    if [ ! -d "$ZONOS_DIR/.venv" ]; then
      python3 -m venv "$ZONOS_DIR/.venv"
    fi
    "$ZONOS_DIR/.venv/bin/pip" install -q --upgrade cmake
    CMAKE_BIN="$ZONOS_DIR/.venv/bin/cmake"
  fi

  echo "2/4 Building GGML Metal server (Apple Silicon accelerated)..."
  pushd "$ZONOS_DIR/servers/ggml" >/dev/null
  "$CMAKE_BIN" -B build -DCMAKE_BUILD_TYPE=Release
  "$CMAKE_BIN" --build build -j"$(sysctl -n hw.ncpu)"
  popd >/dev/null
else
  echo "2/4 Found prebuilt zonos3-server binary."
fi

echo "3/4 Checking GGUF weights from Hugging Face (Zyphra/ZONOS3-Mini)..."
mkdir -p "$ZONOS_DIR/gguf"
for file in backbone-ptq.gguf zac-keep2.gguf spk-encoder.gguf; do
  if [ ! -f "$ZONOS_DIR/gguf/$file" ]; then
    echo "   Downloading gguf/$file ..."
    curl -fL "https://huggingface.co/Zyphra/ZONOS3-Mini/resolve/main/gguf/$file" -o "$ZONOS_DIR/gguf/$file"
  else
    echo "   Found cached gguf/$file"
  fi
done

echo "4/4 Starting ZONOS3-Mini server (Metal GPU) on http://127.0.0.1:1919 ..."
VOICES_DIR="$ZONOS_DIR/assets/default_voices"
ARGS=(
  "$ZONOS_DIR/gguf/backbone-ptq.gguf"
  --zac "$ZONOS_DIR/gguf/zac-keep2.gguf"
  --spk-encoder "$ZONOS_DIR/gguf/spk-encoder.gguf"
  --gpu
  --host 127.0.0.1
  --port 1919
)
if [ -d "$VOICES_DIR" ]; then
  ARGS+=(--tts-default-voices-dir "$VOICES_DIR")
fi

exec "$SERVER_BIN" "${ARGS[@]}"
