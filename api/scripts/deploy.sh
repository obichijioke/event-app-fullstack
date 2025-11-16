#!/bin/bash

# Deployment script for Event Management API
set -e

echo "🚀 Starting deployment..."

# Load environment variables
if [ -f .env.production ]; then
    export $(cat .env.production | xargs)
else
    echo "❌ .env.production file not found"
    exit 1
fi

# Check required environment variables
required_vars=("POSTGRES_DB" "POSTGRES_USER" "POSTGRES_PASSWORD" "JWT_SECRET" "JWT_REFRESH_SECRET" "STRIPE_SECRET_KEY" "PAYSTACK_SECRET_KEY" "FRONTEND_URL")

for var in "${required_vars[@]}"; do
    if [ -z "${!var}" ]; then
        echo "❌ Required environment variable $var is not set"
        exit 1
    fi
done

# Build and start services
echo "📦 Building and starting services..."
docker-compose -f docker-compose.prod.yml down
docker-compose -f docker-compose.prod.yml build --no-cache
docker-compose -f docker-compose.prod.yml up -d

# Wait for services to be ready
echo "⏳ Waiting for services to be ready..."
sleep 30

# Run database migrations
echo "🗄️ Running database migrations..."
docker-compose -f docker-compose.prod.yml exec -T api npx prisma migrate deploy

# Check health
echo "🏥 Checking application health..."
for i in {1..30}; do
    if curl -f http://localhost:3000/health > /dev/null 2>&1; then
        echo "✅ Application is healthy"
        break
    else
        echo "⏳ Waiting for application to be ready... ($i/30)"
        sleep 2
    fi
done

if [ $i -eq 30 ]; then
    echo "❌ Application health check failed"
    docker-compose -f docker-compose.prod.yml logs api
    exit 1
fi

echo "✅ Deployment completed successfully!"
echo "🌐 Application is running at: https://localhost"
echo "📚 API documentation is available at: https://localhost/api"
