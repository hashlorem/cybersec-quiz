#!/bin/sh
# Serve the quiz locally. Nothing here is needed for GitHub Pages.
cd "$(dirname "$0")" || exit 1
PORT="${1:-8000}"
echo "Serving on http://127.0.0.1:$PORT/"
exec python3 -m http.server "$PORT" --bind 127.0.0.1
