#!/usr/bin/env bash
# Per-boot reconciliation for Cursor Cloud Agents: start local services and apply
# any migrations added on the checked-out branch. Must tolerate restarts.
set -euo pipefail

# Avoid interactive Corepack download prompts on non-interactive boots.
export COREPACK_ENABLE_DOWNLOAD_PROMPT=0

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$REPO_ROOT"

PGVER="$(ls /etc/postgresql 2>/dev/null | sort -V | tail -1 || true)"

echo "==> Starting PostgreSQL"
if [ -n "$PGVER" ]; then
  # A snapshot/restart can leave a stale postmaster.pid whose PID is dead or now
  # belongs to another process; remove it so the cluster start is deterministic.
  PID_FILE="/var/lib/postgresql/$PGVER/main/postmaster.pid"
  if [ -f "$PID_FILE" ] && ! sudo -u postgres pg_isready -q; then
    sudo rm -f "$PID_FILE"
  fi
  # pg_ctlcluster exits non-zero if already running; treat that as success.
  sudo pg_ctlcluster "$PGVER" main start 2>/dev/null || true
  for _ in $(seq 1 30); do
    sudo -u postgres pg_isready -q && break
    sleep 1
  done
else
  echo "WARN: PostgreSQL cluster not found; run .cursor/install.sh first" >&2
fi

# Ensure the local env file exists on a fresh boot from a base image/snapshot.
[ -f .env.local ] || cp .env.example .env.local

echo "==> Applying pending database migrations"
pnpm db:migrate || echo "WARN: db:migrate failed (is PostgreSQL running?)" >&2
pnpm db:seed || echo "WARN: db:seed failed (is PostgreSQL running?)" >&2

echo "==> Starting Mailpit"
if command -v mailpit >/dev/null 2>&1; then
  if ! pgrep -x mailpit >/dev/null 2>&1; then
    mkdir -p "$HOME/.local/share/mailpit"
    nohup mailpit \
      --db-file "$HOME/.local/share/mailpit/mailpit.db" \
      --smtp 0.0.0.0:1025 \
      --listen 0.0.0.0:8025 \
      >/tmp/mailpit.log 2>&1 &
  fi
else
  echo "WARN: Mailpit binary not installed; skipping email capture" >&2
fi

echo "==> Start complete"
