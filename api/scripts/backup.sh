#!/bin/bash

# Backup script for Event Management API
set -e

BACKUP_DIR="./backups"
DATE=$(date +%Y-%m-%d_%H-%M-%S)

echo "📦 Starting backup..."

# Create backup directory
mkdir -p $BACKUP_DIR

# Backup PostgreSQL database
echo "🗄️ Backing up PostgreSQL database..."
docker-compose exec -T postgres pg_dump -U eventapp eventapp > $BACKUP_DIR/postgres_$DATE.sql

# Backup Redis data
echo "💾 Backing up Redis data..."
docker-compose exec redis redis-cli BGSAVE
docker cp eventapp-redis-prod:/data/dump.rdb $BACKUP_DIR/redis_$DATE.rdb

# Backup application files
echo "📁 Backing up application files..."
tar -czf $BACKUP_DIR/uploads_$DATE.tar.gz uploads/

# Backup configuration files
echo "⚙️ Backing up configuration files..."
tar -czf $BACKUP_DIR/config_$DATE.tar.gz .env.production docker-compose.prod.yml nginx.conf

# Clean up old backups (keep last 7 days)
echo "🧹 Cleaning up old backups..."
find $BACKUP_DIR -name "*.sql" -mtime +7 -delete
find $BACKUP_DIR -name "*.rdb" -mtime +7 -delete
find $BACKUP_DIR -name "*.tar.gz" -mtime +7 -delete

echo "✅ Backup completed successfully!"
echo "📂 Backups stored in: $BACKUP_DIR"
