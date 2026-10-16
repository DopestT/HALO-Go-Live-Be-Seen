#!/bin/sh
set -eu

: "${DATABASE_URL:?DATABASE_URL is required}"

SCRIPT_DIR=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)
MIGRATIONS_DIR=${MIGRATIONS_DIR:-"$SCRIPT_DIR/../migrations"}

psql "$DATABASE_URL" -v ON_ERROR_STOP=1 <<'SQL'
CREATE TABLE IF NOT EXISTS schema_migrations (
    version TEXT PRIMARY KEY,
    applied_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);
SQL

for migration in "$MIGRATIONS_DIR"/*.sql; do
    [ -f "$migration" ] || continue
    version=$(basename "$migration")
    applied=$(psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -v version="$version" -At <<'SQL'
SELECT 1 FROM schema_migrations WHERE version = :'version';
SQL
)

    if [ "$applied" = "1" ]; then
        echo "Skipping already applied migration: $version"
        continue
    fi

    echo "Applying migration: $version"
    psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -v version="$version" <<SQL
BEGIN;
\i $migration
INSERT INTO schema_migrations(version) VALUES (:'version');
COMMIT;
SQL
done
