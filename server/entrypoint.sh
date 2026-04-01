#!/bin/sh
# Ensure data directories exist and are writable by the app user
mkdir -p /data/db /data/photos /data/backups
chown -R nodejs:nodejs /data 2>/dev/null || true

exec su-exec nodejs "$@"
