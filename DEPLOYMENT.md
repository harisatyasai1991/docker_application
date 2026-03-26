# DMS Insight - Docker Deployment Guide

## Quick Start

### Prerequisites
- Docker (20.10+)
- Docker Compose (2.0+)
- Git

### Installation

1. **Clone the repository**
   ```bash
   git clone <your-repository-url>
   cd dms-insight
   ```

2. **Configure environment variables (Optional - defaults are set)**
   ```bash
   # The .env file is already configured with:
   # User: dms
   # Password: dms_password
   # Database: dms_insight
   
   # You can modify if needed:
   nano .env
   ```

3. **Build and start all services**
   ```bash
   docker-compose up -d --build
   ```

4. **Check services status**
   ```bash
   docker-compose ps
   ```

5. **Access the application**
   - Frontend: http://localhost (or http://localhost:80)
   - Backend API: http://localhost:8001
   - API Documentation: http://localhost:8001/docs

---

## Database Credentials

**Default credentials (configured):**
- Username: `dms`
- Password: `dms_password`
- Database: `dms_insight`

⚠️ **For production, change the password in `.env` file before deployment!**

---

## Detailed Configuration

### Environment Variables

The `.env` file contains:

**MongoDB Settings:**
```env
MONGO_ROOT_USERNAME=dms
MONGO_ROOT_PASSWORD=dms_password
DB_NAME=dms_insight
```

**Backend Settings:**
```env
CORS_ORIGINS=*
```

**Frontend Settings:**
```env
REACT_APP_BACKEND_URL=http://localhost:8001
FRONTEND_PORT=80
```

---

## Production Deployment

### 1. Update Environment Variables

**IMPORTANT: Change the password for production!**

```env
# Use strong passwords
MONGO_ROOT_USERNAME=dms
MONGO_ROOT_PASSWORD=your_very_secure_password_here
DB_NAME=dms_insight

# Set proper CORS origins
CORS_ORIGINS=https://yourdomain.com

# Use production domain
REACT_APP_BACKEND_URL=https://yourdomain.com/api
FRONTEND_PORT=80
```

### 2. SSL/HTTPS Setup

For production, you'll need SSL certificates. Two options:

**Option A: Using Let's Encrypt with Nginx Proxy**

Add this to `docker-compose.yml`:

```yaml
  nginx-proxy:
    image: nginxproxy/nginx-proxy
    container_name: nginx-proxy
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - /var/run/docker.sock:/tmp/docker.sock:ro
      - ./certs:/etc/nginx/certs
    networks:
      - dms-network

  letsencrypt:
    image: nginxproxy/acme-companion
    container_name: letsencrypt
    volumes:
      - /var/run/docker.sock:/var/run/docker.sock:ro
      - ./certs:/etc/nginx/certs
    environment:
      - DEFAULT_EMAIL=your-email@example.com
    depends_on:
      - nginx-proxy
```

**Option B: Use external load balancer** (AWS ELB, Cloudflare, etc.)

### 3. Deploy to Production Server

```bash
# SSH into your server
ssh user@your-server-ip

# Clone repository
git clone <your-repository-url>
cd dms-insight

# Update .env with production values
nano .env

# Deploy
docker-compose up -d --build

# Verify
docker-compose ps
docker-compose logs -f
```

---

## Common Commands

### Start Services
```bash
docker-compose up -d
```

### Stop Services
```bash
docker-compose down
```

### View Logs
```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f backend
docker-compose logs -f frontend
docker-compose logs -f mongodb
```

### Restart Services
```bash
# All services
docker-compose restart

# Specific service
docker-compose restart backend
```

### Rebuild After Code Changes
```bash
# Rebuild all
docker-compose up -d --build

# Rebuild specific service
docker-compose up -d --build backend
```

### Check Service Status
```bash
docker-compose ps
```

### Access Container Shell
```bash
# Backend
docker-compose exec backend sh

# Frontend
docker-compose exec frontend sh

# MongoDB
docker-compose exec mongodb mongosh
```

---

## Database Operations

### Backup Database
```bash
# Create backup directory
mkdir -p backups

# Backup MongoDB
docker-compose exec -T mongodb mongodump \
  --username dms \
  --password dms_password \
  --authenticationDatabase admin \
  --db dms_insight \
  --archive > backups/dms-backup-$(date +%Y%m%d-%H%M%S).archive
```

### Restore Database
```bash
docker-compose exec -T mongodb mongorestore \
  --username dms \
  --password dms_password \
  --authenticationDatabase admin \
  --archive < backups/dms-backup-YYYYMMDD-HHMMSS.archive
```

### Access MongoDB Shell
```bash
docker-compose exec mongodb mongosh \
  --username dms \
  --password dms_password \
  --authenticationDatabase admin \
  dms_insight
```

### Connect to MongoDB from Host
```bash
# Using mongosh (if installed locally)
mongosh mongodb://dms:dms_password@localhost:27017/dms_insight

# Using connection string in your code
mongodb://dms:dms_password@localhost:27017/dms_insight
```

---

## Connecting External Backend

If you want to use a different backend (e.g., PostgreSQL-based) with the same database credentials:

### Update Your External Backend Configuration

Use these credentials in your external backend:

```env
# For MongoDB connection
DB_HOST=localhost  # or Docker service name if in same network
DB_PORT=27017
DB_USER=dms
DB_PASSWORD=dms_password
DB_NAME=dms_insight

# Connection string format
MONGO_URL=mongodb://dms:dms_password@localhost:27017/dms_insight
```

### Switch Frontend to External Backend

Update `.env`:
```env
REACT_APP_BACKEND_URL=http://your-external-backend-url:port
```

Then restart frontend:
```bash
docker-compose restart frontend
# or
docker-compose up -d --build frontend
```

---

## Troubleshooting

### Services Won't Start

1. Check logs:
   ```bash
   docker-compose logs
   ```

2. Check port conflicts:
   ```bash
   sudo netstat -tulpn | grep -E ':(80|8001|27017)'
   ```

3. Remove and recreate:
   ```bash
   docker-compose down -v
   docker-compose up -d --build
   ```

### Database Authentication Failed

1. Check credentials in `.env` file
2. Verify MongoDB container is running:
   ```bash
   docker-compose ps mongodb
   ```
3. Check backend logs:
   ```bash
   docker-compose logs backend | grep -i mongo
   ```
4. Try connecting directly:
   ```bash
   docker-compose exec mongodb mongosh \
     --username dms \
     --password dms_password \
     --authenticationDatabase admin
   ```

### Frontend Can't Connect to Backend

1. Check `REACT_APP_BACKEND_URL` in `.env`
2. Verify backend is running: `curl http://localhost:8001/health`
3. Check CORS settings in backend `.env`
4. Review nginx logs:
   ```bash
   docker-compose logs frontend
   ```

### Database Connection Issues

1. Check MongoDB is running:
   ```bash
   docker-compose ps mongodb
   ```

2. Verify credentials match in:
   - `/app/.env` (root config)
   - `/app/backend/.env` (backend config)

3. Test connection:
   ```bash
   docker-compose exec backend python -c "from motor.motor_asyncio import AsyncIOMotorClient; import asyncio; client = AsyncIOMotorClient('mongodb://dms:dms_password@mongodb:27017'); print('Connected:', asyncio.run(client.server_info()))"
   ```

### Out of Disk Space

```bash
# Clean up Docker resources
docker system prune -a --volumes

# Check disk usage
df -h
du -sh /var/lib/docker
```

---

## Updating the Application

```bash
# Pull latest code
git pull origin main

# Rebuild and restart
docker-compose down
docker-compose up -d --build

# Check logs
docker-compose logs -f
```

---

## Monitoring

### Check Resource Usage
```bash
docker stats
```

### Health Checks
```bash
# Backend health
curl http://localhost:8001/health

# Frontend
curl http://localhost/

# Database
docker-compose exec mongodb mongosh \
  --username dms \
  --password dms_password \
  --authenticationDatabase admin \
  --eval "db.adminCommand('ping')"

# All services
docker-compose ps
```

---

## Security Considerations

1. **Change Default Passwords**: 
   - ⚠️ **CRITICAL**: Change `dms_password` to a strong password in production!
   - Use password generators for secure passwords
   - Never commit `.env` with production passwords to Git

2. **Use HTTPS**: Never run production without SSL

3. **Restrict CORS**: Set specific domains in `.env`, not `*`

4. **Firewall**: Only expose necessary ports (80, 443)
   ```bash
   # Example: Block direct MongoDB access from outside
   sudo ufw deny 27017
   sudo ufw allow 80
   sudo ufw allow 443
   ```

5. **Keep Updated**: Regularly update Docker images
   ```bash
   docker-compose pull
   docker-compose up -d
   ```

6. **Backup Regularly**: Automate database backups

7. **Use Docker Secrets** (advanced):
   Instead of environment variables, use Docker secrets for passwords

---

## Database Credentials Summary

```
┌─────────────────────────────────────┐
│   DMS Insight Database Config       │
├─────────────────────────────────────┤
│ Username:  dms                      │
│ Password:  dms_password             │
│ Database:  dms_insight              │
│ Port:      27017                    │
│ Host:      localhost (or mongodb)   │
└─────────────────────────────────────┘

Connection String:
mongodb://dms:dms_password@localhost:27017/dms_insight
```

---

## Support

For issues or questions:
- Check logs: `docker-compose logs -f`
- Review this guide
- Check GitHub issues
- Contact: support@dmscbm.com

---

## Architecture

```
┌──────────────────┐
│  Load Balancer  │ (Optional: Nginx/Cloudflare)
└────────┬─────────┘
         │
    ┌────▼────┐
    │ Frontend│ :80
    │ (React) │
    └────┬────┘
         │
    ┌────▼────┐
    │ Backend │ :8001
    │(FastAPI)│ User: dms
    └────┬────┘ Pass: dms_password
         │
    ┌────▼────┐
    │ MongoDB │ :27017
    │Database │ DB: dms_insight
    └─────────┘
```

All services run in isolated Docker containers connected via `dms-network`.