# Deployment Guide

This guide covers deploying the Canton Network Tokenization Demo to various platforms.

## Prerequisites

- Node.js 18+ runtime environment
- PostgreSQL database
- Canton Network Testnet access
- Environment variables configured

## Environment Variables

Ensure all required environment variables are set:

```env
# Canton Network Configuration
CANTON_TESTNET_URL=https://your-canton-testnet-url.com
CANTON_API_KEY=your_canton_api_key_here
CANTON_PARTICIPANT_ID=your_participant_id

# Database Configuration
DATABASE_URL="postgresql://username:password@host:port/database"

# Next.js Configuration
NEXTAUTH_SECRET=your_nextauth_secret_here
NEXTAUTH_URL=https://your-domain.com

# Application Configuration
NODE_ENV=production
```

## Deployment Options

### 1. Vercel (Recommended for Next.js)

Vercel provides seamless Next.js deployment with automatic builds and deployments.

#### Setup Steps:

1. **Install Vercel CLI**
   ```bash
   npm install -g vercel
   ```

2. **Login to Vercel**
   ```bash
   vercel login
   ```

3. **Deploy**
   ```bash
   vercel --prod
   ```

4. **Configure Environment Variables**
   - Go to Vercel Dashboard → Project → Settings → Environment Variables
   - Add all required environment variables
   - Redeploy after adding variables

#### Database Setup:
- Use Vercel Postgres or external PostgreSQL service
- Update DATABASE_URL in environment variables
- Run migrations: `npx prisma db push`

### 2. Railway

Railway offers simple deployment with built-in PostgreSQL.

#### Setup Steps:

1. **Install Railway CLI**
   ```bash
   npm install -g @railway/cli
   ```

2. **Login and Initialize**
   ```bash
   railway login
   railway init
   ```

3. **Add PostgreSQL Service**
   ```bash
   railway add postgresql
   ```

4. **Deploy**
   ```bash
   railway up
   ```

5. **Set Environment Variables**
   ```bash
   railway variables set CANTON_TESTNET_URL=your_url
   railway variables set CANTON_API_KEY=your_key
   # ... add other variables
   ```

### 3. Docker Deployment

Use Docker for containerized deployment on any platform.

#### Dockerfile:
```dockerfile
FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./
RUN npm ci --only=production

# Copy source code
COPY . .

# Generate Prisma client
RUN npx prisma generate

# Build application
RUN npm run build

EXPOSE 3000

CMD ["npm", "start"]
```

#### Docker Compose (with PostgreSQL):
```yaml
version: '3.8'

services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - DATABASE_URL=postgresql://postgres:password@db:5432/canton_tokenization
      - CANTON_TESTNET_URL=${CANTON_TESTNET_URL}
      - CANTON_API_KEY=${CANTON_API_KEY}
      - CANTON_PARTICIPANT_ID=${CANTON_PARTICIPANT_ID}
    depends_on:
      - db

  db:
    image: postgres:15
    environment:
      - POSTGRES_DB=canton_tokenization
      - POSTGRES_USER=postgres
      - POSTGRES_PASSWORD=password
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"

volumes:
  postgres_data:
```

#### Deploy with Docker:
```bash
# Build and run
docker-compose up -d

# Run database migrations
docker-compose exec app npx prisma db push
```

### 4. AWS Deployment

Deploy on AWS using Elastic Beanstalk or ECS.

#### Elastic Beanstalk:

1. **Install EB CLI**
   ```bash
   pip install awsebcli
   ```

2. **Initialize and Deploy**
   ```bash
   eb init
   eb create production
   eb deploy
   ```

3. **Configure Environment Variables**
   ```bash
   eb setenv CANTON_TESTNET_URL=your_url CANTON_API_KEY=your_key
   ```

#### RDS Database Setup:
- Create PostgreSQL RDS instance
- Update DATABASE_URL environment variable
- Configure security groups for database access

### 5. Google Cloud Platform

Deploy using Cloud Run for serverless deployment.

#### Setup Steps:

1. **Build Container**
   ```bash
   gcloud builds submit --tag gcr.io/PROJECT_ID/canton-demo
   ```

2. **Deploy to Cloud Run**
   ```bash
   gcloud run deploy canton-demo \
     --image gcr.io/PROJECT_ID/canton-demo \
     --platform managed \
     --region us-central1 \
     --allow-unauthenticated
   ```

3. **Set Environment Variables**
   ```bash
   gcloud run services update canton-demo \
     --set-env-vars CANTON_TESTNET_URL=your_url,CANTON_API_KEY=your_key
   ```

## Database Migration

For production deployments, ensure database schema is properly set up:

```bash
# Generate Prisma client
npx prisma generate

# Push schema to database
npx prisma db push

# Or use migrations (recommended for production)
npx prisma migrate deploy
```

## Health Checks

Add health check endpoints for monitoring:

```typescript
// src/app/api/health/route.ts
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET() {
  try {
    // Check database connection
    await prisma.$queryRaw`SELECT 1`
    
    return NextResponse.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      database: 'connected'
    })
  } catch (error) {
    return NextResponse.json(
      {
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        database: 'disconnected',
        error: error.message
      },
      { status: 503 }
    )
  }
}
```

## Monitoring and Logging

### Application Monitoring:
- Use Vercel Analytics for Vercel deployments
- Implement custom logging with Winston or similar
- Set up error tracking with Sentry

### Database Monitoring:
- Monitor connection pool usage
- Set up query performance monitoring
- Configure backup strategies

## Security Considerations

### Production Security Checklist:

1. **Environment Variables**
   - Never commit secrets to version control
   - Use secure secret management services
   - Rotate API keys regularly

2. **Database Security**
   - Use connection pooling
   - Enable SSL connections
   - Implement proper access controls

3. **Application Security**
   - Enable HTTPS only
   - Implement rate limiting
   - Add CORS configuration
   - Use security headers

4. **Canton Network Security**
   - Secure API key storage
   - Implement proper authentication
   - Monitor transaction patterns

### Security Headers:
```typescript
// next.config.ts
const nextConfig = {
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin',
          },
        ],
      },
    ]
  },
}
```

## Performance Optimization

### Build Optimization:
```bash
# Analyze bundle size
npm run build
npx @next/bundle-analyzer
```

### Database Optimization:
- Implement connection pooling
- Add database indexes for frequently queried fields
- Use read replicas for heavy read operations

### Caching Strategy:
- Implement Redis for session storage
- Use CDN for static assets
- Cache API responses where appropriate

## Backup and Recovery

### Database Backups:
```bash
# Automated backup script
pg_dump $DATABASE_URL > backup_$(date +%Y%m%d_%H%M%S).sql
```

### Application Backups:
- Version control for code
- Environment variable backups
- Configuration file backups

## Troubleshooting

### Common Deployment Issues:

1. **Build Failures**
   - Check Node.js version compatibility
   - Verify all dependencies are installed
   - Review build logs for specific errors

2. **Database Connection Issues**
   - Verify DATABASE_URL format
   - Check network connectivity
   - Ensure database exists and is accessible

3. **Environment Variable Issues**
   - Verify all required variables are set
   - Check for typos in variable names
   - Ensure proper escaping of special characters

4. **Canton Network Issues**
   - Verify API key and participant ID
   - Check network connectivity to testnet
   - Review Canton Network status

### Debugging Commands:
```bash
# Check application logs
docker logs container_name

# Test database connection
npx prisma db pull

# Verify environment variables
printenv | grep CANTON
```

## Scaling Considerations

### Horizontal Scaling:
- Use load balancers for multiple instances
- Implement session storage (Redis)
- Consider microservices architecture

### Database Scaling:
- Implement read replicas
- Use connection pooling
- Consider database sharding for large datasets

### Monitoring Scaling:
- Set up auto-scaling based on metrics
- Monitor response times and error rates
- Implement alerting for critical issues

## Maintenance

### Regular Maintenance Tasks:
- Update dependencies regularly
- Monitor security vulnerabilities
- Review and rotate API keys
- Backup database regularly
- Monitor application performance
- Review error logs and fix issues

### Update Process:
1. Test updates in staging environment
2. Create database backup
3. Deploy to production
4. Verify functionality
5. Monitor for issues
6. Rollback if necessary