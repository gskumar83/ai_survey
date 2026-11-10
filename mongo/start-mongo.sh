#!/bin/bash
# Starts mongod as a single-member replica set with auth, then initiates rs0 once.
set -euo pipefail
echo "[start-mongo] starting (rs host: ${RAILWAY_PRIVATE_DOMAIN:-localhost})"

: "${MONGO_INITDB_ROOT_USERNAME:?MONGO_INITDB_ROOT_USERNAME is required}"
: "${MONGO_INITDB_ROOT_PASSWORD:?MONGO_INITDB_ROOT_PASSWORD is required}"

# Internal-auth keyfile (required when auth + replSet). Single member, so regenerating per boot is safe.
KEYFILE=/etc/mongo-keyfile
head -c 600 /dev/urandom | base64 | tr -d '\n=+/' > "$KEYFILE"
chmod 400 "$KEYFILE"
chown 999:999 "$KEYFILE"

RS_HOST="${RAILWAY_PRIVATE_DOMAIN:-localhost}:27017"

# Background: wait for the real (replSet) mongod and initiate the replica set if needed.
(
  for _ in $(seq 1 180); do
    out=$(mongosh --quiet --host 127.0.0.1 \
      -u "$MONGO_INITDB_ROOT_USERNAME" -p "$MONGO_INITDB_ROOT_PASSWORD" --authenticationDatabase admin \
      --eval "try { rs.status().ok } catch (e) { if (e.codeName === 'NotYetInitialized') { rs.initiate({ _id: 'rs0', members: [{ _id: 0, host: '$RS_HOST' }] }).ok } else { 0 } }" \
      2>/dev/null || true)
    if [ "$out" = "1" ]; then
      echo "[start-mongo] replica set rs0 ready (host $RS_HOST)"
      exit 0
    fi
    sleep 2
  done
  echo "[start-mongo] WARNING: replica set not initiated after timeout"
) &

exec docker-entrypoint.sh mongod --replSet rs0 --keyFile "$KEYFILE" --bind_ip_all --ipv6
