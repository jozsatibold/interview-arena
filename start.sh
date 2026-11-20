#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")"

echo "🦉 Starting Interview Coach Arena..."
echo "👉 Open in browser: http://localhost:3333"
node server.mjs
