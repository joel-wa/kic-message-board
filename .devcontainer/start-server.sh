#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."

# Keep one server running when the Codespace starts or resumes.
if curl --silent --fail http://127.0.0.1:3000/api/messages > /dev/null; then
  echo "The message board is already running on port 3000."
  exit 0
fi

node --check server.js
nohup node server.js > /tmp/kic-message-board.log 2>&1 < /dev/null &

for attempt in {1..15}; do
  if curl --silent --fail http://127.0.0.1:3000/api/messages > /dev/null; then
    echo "Message board ready. Open port 3000 from the Ports tab."
    exit 0
  fi
  sleep 1
done

cat /tmp/kic-message-board.log
exit 1
