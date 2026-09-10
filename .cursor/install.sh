#!/usr/bin/env bash
# Idempotent repository bootstrap for Cursor Cloud Agents.
# Installs system + Node dependencies, provisions local PostgreSQL and Mailpit,
# and applies committed migrations. Safe to run repeatedly.
set -euo pipefail

# Never prompt for a Corepack package-manager download; boots are non-interactive
# and an unanswered prompt would hang the install indefinitely.
export COREPACK_ENABLE_DOWNLOAD_PROMPT=0

# Resolve repo root regardless of the caller's working directory.
REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$REPO_ROOT"

MAILPIT_VERSION="v1.27.0"

echo "==> Installing system packages (PostgreSQL)"
if ! command -v pg_ctlcluster >/dev/null 2>&1; then
  sudo apt-get update -y
  sudo DEBIAN_FRONTEND=noninteractive apt-get install -y --no-install-recommends \
    postgresql postgresql-client
fi

# Ubuntu ships a versioned cluster directory (e.g. /etc/postgresql/16); detect it
# instead of hardcoding a major version so the script survives base-image upgrades.
PGVER="$(ls /etc/postgresql 2>/dev/null | sort -V | tail -1 || true)"
if [ -z "$PGVER" ]; then
  echo "ERROR: no PostgreSQL cluster directory found under /etc/postgresql" >&2
  exit 1
fi

echo "==> Installing Node dependencies"
corepack enable >/dev/null 2>&1 || true
pnpm install --frozen-lockfile

echo "==> Installing Playwright Chromium (for e2e tests)"
pnpm exec playwright install --with-deps chromium

echo "==> Installing Mailpit (local email capture, best effort)"
if ! command -v mailpit >/dev/null 2>&1; then
  TMP_DIR="$(mktemp -d)"
  if curl -fsSL \
    "https://github.com/axllent/mailpit/releases/download/${MAILPIT_VERSION}/mailpit-linux-amd64.tar.gz" \
    -o "$TMP_DIR/mailpit.tar.gz"; then
    tar -xzf "$TMP_DIR/mailpit.tar.gz" -C "$TMP_DIR" mailpit
    sudo install -m 0755 "$TMP_DIR/mailpit" /usr/local/bin/mailpit
  else
    echo "WARN: Mailpit download failed; local email capture will be unavailable" >&2
  fi
  rm -rf "$TMP_DIR"
fi

echo "==> Ensuring local environment file"
# .env.local is gitignored; seed it from the committed template of dev defaults.
if [ ! -f .env.local ]; then
  cp .env.example .env.local
fi

echo "==> Provisioning PostgreSQL role and database"
sudo pg_ctlcluster "$PGVER" main start 2>/dev/null || true
for _ in $(seq 1 30); do
  sudo -u postgres pg_isready -q && break
  sleep 1
done

# Create the mhp login role expected by DATABASE_URL if it is missing.
sudo -u postgres psql -v ON_ERROR_STOP=1 <<'SQL'
DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'mhp') THEN
    CREATE ROLE mhp LOGIN PASSWORD 'mhp';
  END IF;
END
$$;
SQL

# Create the mhp database owned by that role if it is missing.
sudo -u postgres bash -c \
  "psql -tAc \"SELECT 1 FROM pg_database WHERE datname='mhp'\" | grep -q 1 \
    || createdb -O mhp mhp"

echo "==> Applying database migrations"
pnpm db:migrate
pnpm db:seed

# Stop PostgreSQL so an environment build's snapshot does not capture a running
# server (a stale postmaster.pid would otherwise make the first boot start
# unreliable). The per-boot start.sh brings the cluster back up cleanly.
echo "==> Stopping PostgreSQL for a clean snapshot"
sudo pg_ctlcluster "$PGVER" main stop 2>/dev/null || true

echo "==> Install complete"
