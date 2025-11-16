# Deployment Guide

This guide explains how to deploy the Event Management API to production using Docker.

## Prerequisites

- Docker and Docker Compose installed
- SSL certificates for HTTPS (optional but recommended)
- Environment variables configured

## Environment Variables

Create a `.env.production` file with the following variables:

```bash
# Database
POSTGRES_DB=eventapp
POSTGRES_USER=eventapp
POSTGRES_PASSWORD=your-secure-password

# JWT
JWT_SECRET=your-super-secret-jwt-key
JWT_REFRESH_SECRET=your-super-secret-refresh-key

# Payment Gateways
STRIPE_SECRET_KEY=sk_live_your-stripe-secret-key
PAYSTACK_SECRET_KEY=sk_live_your-paystack-secret-key

# Frontend
FRONTEND_URL=https://yourdomain.com

# Monitoring (optional)
PROMETHEUS_URL=http://prometheus:9090
GRAFANA_URL=http://grafana:3001
```

## Quick Start

### 1. Clone the Repository

```bash
git clone <repository-url>
cd event-app-comprehensive/backend/api
```

### 2. Configure Environment

```bash
cp .env.example .env.production
# Edit .env.production with your values
```

### 3. Deploy

```bash
chmod +x scripts/deploy.sh
./scripts/deploy.sh
```

## Manual Deployment Steps

### 1. Build Docker Images

```bash
docker-compose -f docker-compose.prod.yml build
```

### 2. Start Services

```bash
docker-compose -f docker-compose.prod.yml up -d
```

### 3. Run Database Migrations

```bash
docker-compose -f docker-compose.prod.yml exec -T api npx prisma migrate deploy
```

### 4. Verify Deployment

```bash
curl -f http://localhost:3000/health
```

## SSL Configuration

### 1. Generate SSL Certificates

```bash
# Using Let's Encrypt (recommended)
certbot certonly --standalone -d yourdomain.com

# Or generate self-signed certificates
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout ssl/private.key \
  -out ssl/certificate.crt
```

### 2. Place Certificates

```bash
mkdir -p ssl
cp your-certificate.crt ssl/cert.pem
cp your-private.key ssl/key.pem
```

### 3. Update Nginx Configuration

The nginx.conf file is already configured for SSL. Make sure the certificate paths are correct.

## Monitoring Setup

### 1. Start Monitoring Stack

```bash
docker-compose -f monitoring/docker-compose.monitoring.yml up -d
```

### 2. Access Monitoring Tools

- **Prometheus**: http://localhost:9090
- **Grafana**: http://localhost:3001 (admin/admin123)
- **Node Exporter**: http://localhost:9100/metrics
- **cAdvisor**: http://localhost:8080

### 3. Configure Grafana Dashboards

1. Log in to Grafana
2. Add Prometheus as a data source
3. Import dashboards from the `monitoring/grafana/dashboards` directory

## Backup and Restore

### Backup

```bash
chmod +x scripts/backup.sh
./scripts/backup.sh
```

### Restore

```bash
# Restore database
docker-compose exec -T postgres psql -U eventapp eventapp < backups/postgres_YYYY-MM-DD_HH-MM-SS.sql

# Restore Redis
docker-compose exec redis redis-cli FLUSHALL
docker cp backups/redis_YYYY-MM-DD_HH-MM-SS.rdb eventapp-redis-prod:/data/dump.rdb
docker-compose restart redis

# Restore uploads
tar -xzf backups/uploads_YYYY-MM-DD_HH-MM-SS.tar.gz
```

## Scaling

### Horizontal Scaling

```bash
# Scale API service
docker-compose -f docker-compose.prod.yml up -d --scale api=3

# Add load balancer
# Configure nginx or use cloud load balancer
```

### Vertical Scaling

Update resource limits in `docker-compose.prod.yml`:

```yaml
services:
  api:
    deploy:
      resources:
        limits:
          cpus: '2'
          memory: 4G
        reservations:
          cpus: '1'
          memory: 2G
```

## CI/CD Integration

### GitHub Actions

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2

      - name: Set up Docker Buildx
        uses: docker/setup-buildx-action@v1

      - name: Login to Docker Hub
        uses: docker/login-action@v1
        with:
          username: ${{ secrets.DOCKER_USERNAME }}
          password: ${{ secrets.DOCKER_PASSWORD }}

      - name: Build and push
        uses: docker/build-push-action@v2
        with:
          context: .
          file: ./Dockerfile
          push: true
          tags: ${{ secrets.DOCKER_USERNAME }}/eventapp-api:latest

      - name: Deploy to server
        uses: appleboy/ssh-action@v0.1.5
        with:
          host: ${{ secrets.HOST }}
          username: ${{ secrets.USERNAME }}
          key: ${{ secrets.SSH_KEY }}
          script: |
            cd /path/to/app
            docker-compose -f docker-compose.prod.yml pull
            docker-compose -f docker-compose.prod.yml up -d
```

## Troubleshooting

### Common Issues

1. **Database Connection Failed**
   - Check DATABASE_URL in environment variables
   - Verify PostgreSQL container is running
   - Check network connectivity

2. **Redis Connection Failed**
   - Check REDIS_URL in environment variables
   - Verify Redis container is running
   - Check network connectivity

3. **Health Check Failed**
   - Check application logs: `docker-compose logs api`
   - Verify all dependencies are running
   - Check port conflicts

4. **SSL Certificate Issues**
   - Verify certificate paths in nginx.conf
   - Check certificate validity
   - Ensure proper file permissions

### Logs

```bash
# View all logs
docker-compose -f docker-compose.prod.yml logs

# View specific service logs
docker-compose -f docker-compose.prod.yml logs api

# Follow logs in real-time
docker-compose -f docker-compose.prod.yml logs -f api
```

### Performance Tuning

1. **Database Optimization**
   - Configure connection pooling
   - Add indexes for frequently queried fields
   - Use read replicas for read-heavy operations

2. **Caching**
   - Implement Redis caching for frequently accessed data
   - Use CDN for static assets
   - Enable browser caching

3. **Load Balancing**
   - Use nginx or cloud load balancer
   - Implement health checks
   - Configure sticky sessions if needed

## Security Best Practices

1. **Environment Variables**
   - Never commit secrets to version control
   - Use different secrets for development/staging/production
   - Rotate secrets regularly

2. **Network Security**
   - Use HTTPS in production
   - Implement proper CORS configuration
   - Use firewall rules to restrict access

3. **Container Security**
   - Use non-root users in containers
   - Limit container capabilities
   - Regularly update base images

4. **Application Security**
   - Validate all inputs
   - Implement rate limiting
   - Use secure headers (HSTS, CSP, etc.)

## Maintenance

### Regular Tasks

1. **Backups**: Run backup script daily
2. **Updates**: Update dependencies regularly
3. **Monitoring**: Check dashboards for issues
4. **Logs**: Review and archive logs
5. **Security**: Scan for vulnerabilities

### Health Checks

- Application health: `/health`
- Database connectivity: Check connection strings
- Redis connectivity: Test Redis operations
- SSL certificates: Check expiration dates

## Support

For deployment issues or questions:

1. Check the troubleshooting section
2. Review application logs
3. Consult the monitoring dashboards
4. Create an issue in the repository
