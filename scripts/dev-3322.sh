#!/usr/bin/env bash
# Stop any Next.js dev server for this repo (any port), free 3322, then start there.
set -euo pipefail

PORT=3322
REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$REPO_ROOT"
LOCK_FILE=".next/dev/lock"

kill_pid() {
  local pid="$1"
  [ -n "$pid" ] || return 0
  kill -0 "$pid" 2>/dev/null || return 0

  local child
  for child in $(pgrep -P "$pid" 2>/dev/null || true); do
    kill_pid "$child"
  done

  echo "==> Stopping PID ${pid}"
  kill -TERM "$pid" 2>/dev/null || true
  sleep 0.5
  kill -KILL "$pid" 2>/dev/null || true
}

kill_port() {
  local port="$1"
  local pids
  pids="$(lsof -tiTCP:"${port}" -sTCP:LISTEN 2>/dev/null || true)"
  if [ -z "$pids" ]; then
    pids="$(lsof -ti :"${port}" 2>/dev/null || true)"
  fi
  if [ -n "$pids" ]; then
    echo "==> Stopping port ${port}"
    local pid
    for pid in $pids; do
      kill_pid "$pid"
    done
  fi
}

stop_repo_next_dev() {
  local locked_pid="" locked_port=""

  if [ -f "$LOCK_FILE" ]; then
    while IFS='=' read -r key value; do
      case "$key" in
        pid) locked_pid="$value" ;;
        port) locked_port="$value" ;;
      esac
    done < <(
      node -e "
        const fs = require('fs');
        try {
          const lock = JSON.parse(fs.readFileSync('${LOCK_FILE}', 'utf8'));
          if (lock.pid) console.log('pid=' + lock.pid);
          if (lock.port) console.log('port=' + lock.port);
        } catch {}
      "
    )
  fi

  if [ -n "$locked_pid" ]; then
    echo "==> Found Next.js dev lock (PID ${locked_pid}${locked_port:+, port ${locked_port}})"
    kill_pid "$locked_pid"
  fi

  if [ -n "$locked_port" ]; then
    kill_port "$locked_port"
  fi

  local pid cwd
  while IFS= read -r pid; do
    [ -n "$pid" ] || continue
    cwd="$(lsof -a -p "$pid" -d cwd -Fn 2>/dev/null | sed -n 's/^n//p' | head -1 || true)"
    if [ "$cwd" = "$REPO_ROOT" ]; then
      echo "==> Stopping next dev in ${REPO_ROOT}"
      kill_pid "$pid"
    fi
  done < <(pgrep -f "next/dist/bin/next dev" 2>/dev/null || true)

  while IFS= read -r pid; do
    [ -n "$pid" ] || continue
    cwd="$(lsof -a -p "$pid" -d cwd -Fn 2>/dev/null | sed -n 's/^n//p' | head -1 || true)"
    if [ "$cwd" = "$REPO_ROOT" ]; then
      echo "==> Stopping next-server in ${REPO_ROOT}"
      kill_pid "$pid"
    fi
  done < <(pgrep -f "next-server" 2>/dev/null || true)

  sleep 1

  if [ -f "$LOCK_FILE" ]; then
    locked_pid="$(node -e "
      const fs = require('fs');
      try {
        const lock = JSON.parse(fs.readFileSync('${LOCK_FILE}', 'utf8'));
        process.stdout.write(String(lock.pid || ''));
      } catch {}
    ")"
    if [ -n "$locked_pid" ] && kill -0 "$locked_pid" 2>/dev/null; then
      echo "ERROR: Next.js dev server still running (PID ${locked_pid})." >&2
      exit 1
    fi
    rm -f "$LOCK_FILE"
  fi
}

stop_repo_next_dev
kill_port "${PORT}"

if lsof -ti :"${PORT}" >/dev/null 2>&1; then
  echo "ERROR: port ${PORT} is still in use:" >&2
  lsof -nP -iTCP:"${PORT}" -sTCP:LISTEN >&2 || lsof -nP -i :"${PORT}" >&2
  exit 1
fi

echo "==> Starting http://localhost:${PORT}"
exec pnpm dev --port "${PORT}"
