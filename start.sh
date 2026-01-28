#!/bin/sh
set -e

# Copy seed database if no database exists yet
if [ ! -f /data/mote.db ]; then
  echo "No database found, copying seed database..."
  cp /app/prisma/dev.db /data/mote.db
fi

# Ensure uploads directory exists
mkdir -p /data/uploads

# Start the application
exec node server.js
