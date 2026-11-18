#!/usr/bin/env bash
set -euo pipefail

HOST="${1:-tirelire-gcp}"
REMOTE_ROOT="/srv/bluesafe/site"
STAMP="$(date -u +%Y%m%dT%H%M%SZ)"
ARCHIVE="$(mktemp)"

trap 'rm -f "$ARCHIVE"' EXIT

npm run export:web
tar -C dist-web -czf "$ARCHIVE" .
scp -q "$ARCHIVE" "$HOST:/tmp/bluesafe-web-$STAMP.tar.gz"
ssh "$HOST" "set -e
release=$REMOTE_ROOT/releases/$STAMP
mkdir -p '$REMOTE_ROOT/releases' \"\$release\"
tar -xzf /tmp/bluesafe-web-$STAMP.tar.gz -C \"\$release\"
rm -f /tmp/bluesafe-web-$STAMP.tar.gz
if [ -L '$REMOTE_ROOT/app' ]; then
  ln -sfn \"\$release\" '$REMOTE_ROOT/app.next'
  mv -Tf '$REMOTE_ROOT/app.next' '$REMOTE_ROOT/app'
else
  mv '$REMOTE_ROOT/app' '$REMOTE_ROOT/app.pre-$STAMP'
  ln -s \"\$release\" '$REMOTE_ROOT/app'
fi
"
