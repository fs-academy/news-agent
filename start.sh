#!/bin/sh
# Start Next.js with explicit port
PORT=${PORT:-3000}
HOSTNAME=${HOSTNAME:-0.0.0.0}
exec node server.js --port $PORT --hostname $HOSTNAME
