# Database Configuration Guide

## Current Development Setup

The current development environment uses MongoDB **without authentication** for simplicity.

**Current Configuration:**
```env
MONGO_URL="mongodb://localhost:27017"
DB_NAME="dms_insight"
```

## Docker Deployment Configuration

When deploying with Docker, MongoDB authentication **is enabled** with the following credentials:

**Docker Configuration:**
```env
MONGO_ROOT_USERNAME=dms
MONGO_ROOT_PASSWORD=dms_password
DB_NAME=dms_insight
```

## Configuration Files

### Development (Current Emergent Environment)

**File: `/app/backend/.env`**
```env
MONGO_URL="mongodb://localhost:27017"
DB_NAME="dms_insight"
CORS_ORIGINS="*"
```

### Docker Deployment

**File: `/app/.env`** (for docker-compose)
```env
MONGO_ROOT_USERNAME=dms
MONGO_ROOT_PASSWORD=dms_password
DB_NAME=dms_insight
```

**File: `/app/docker-compose.yml`**
```yaml
mongodb:
  environment:
    MONGO_INITDB_ROOT_USERNAME: ${MONGO_ROOT_USERNAME:-dms}
    MONGO_INITDB_ROOT_PASSWORD: ${MONGO_ROOT_PASSWORD:-dms_password}
    MONGO_INITDB_DATABASE: ${DB_NAME:-dms_insight}

backend:
  environment:
    - MONGO_URL=mongodb://${MONGO_ROOT_USERNAME:-dms}:${MONGO_ROOT_PASSWORD:-dms_password}@mongodb:27017
    - DB_NAME=${DB_NAME:-dms_insight}
```

## Switching Between Configurations

### From Development to Docker

When you deploy with Docker, the configuration automatically switches to use authentication because:

1. Docker Compose creates MongoDB with authentication enabled
2. Backend connects using credentials from environment variables
3. No manual changes needed - just run `docker-compose up`

### From Docker to Development

If you need to run in development mode (Emergent environment):

1. MongoDB runs without authentication
2. Use connection string without credentials:
   ```env
   MONGO_URL="mongodb://localhost:27017"
   ```

## Connecting External Tools

### Development Environment
```bash
mongosh mongodb://localhost:27017/dms_insight
```

### Docker Environment
```bash
# From host machine
mongosh mongodb://dms:dms_password@localhost:27017/dms_insight

# From within Docker network
mongosh mongodb://dms:dms_password@mongodb:27017/dms_insight
```

## Migrating Data Between Environments

### Export from Development
```bash
mongodump --db dms_insight --out ./backup
```

### Import to Docker
```bash
# Copy to Docker container
docker cp ./backup dms-mongodb:/backup

# Restore in container
docker-compose exec mongodb mongorestore \
  --username dms \
  --password dms_password \
  --authenticationDatabase admin \
  --db dms_insight \
  /backup/dms_insight
```

## Security Notes

### Development (Current)
- ⚠️ No authentication required
- ✅ Suitable for local development only
- ❌ Never expose to public network

### Docker Deployment
- ✅ Authentication enabled by default
- ⚠️ **Change the default password before production!**
- ✅ Use strong passwords in production
- ✅ Restrict network access with firewall

### Production Recommendations

1. **Use Strong Passwords:**
   ```env
   MONGO_ROOT_PASSWORD=Use-A-Very-Strong-Random-Password-Here
   ```

2. **Enable SSL/TLS** for MongoDB connections

3. **Restrict Network Access:**
   - Only allow backend container to access MongoDB
   - Do not expose MongoDB port (27017) publicly
   - Use Docker networks for internal communication

4. **Regular Backups:**
   ```bash
   # Add to crontab for daily backups
   0 2 * * * docker-compose exec -T mongodb mongodump \
     --username dms \
     --password dms_password \
     --authenticationDatabase admin \
     --db dms_insight \
     --archive > /backups/dms-$(date +\%Y\%m\%d).archive
   ```

## Troubleshooting

### Authentication Failed Error

**Error:** `pymongo.errors.OperationFailure: Authentication failed.`

**Solution:**
1. Check credentials in `.env` file
2. Verify MongoDB user exists:
   ```bash
   docker-compose exec mongodb mongosh \
     --username dms \
     --password dms_password \
     --authenticationDatabase admin \
     --eval "db.getUsers()"
   ```

### Connection Refused

**Error:** `pymongo.errors.ServerSelectionTimeoutError`

**Solution:**
1. Check MongoDB is running:
   ```bash
   docker-compose ps mongodb
   ```
2. Check MongoDB logs:
   ```bash
   docker-compose logs mongodb
   ```

### Wrong Database Name

If data is not showing:
1. Verify database name in backend `.env`:
   ```env
   DB_NAME="dms_insight"
   ```
2. List available databases:
   ```bash
   docker-compose exec mongodb mongosh \
     --username dms \
     --password dms_password \
     --authenticationDatabase admin \
     --eval "db.adminCommand('listDatabases')"
   ```

## Summary

| Environment | Authentication | Connection String |
|-------------|----------------|-------------------|
| **Development (Emergent)** | No | `mongodb://localhost:27017` |
| **Docker Deployment** | Yes | `mongodb://dms:dms_password@mongodb:27017` |
| **Production** | Yes (Strong Password) | `mongodb://dms:STRONG_PASSWORD@mongodb:27017` |

The application is designed to work in both environments seamlessly. Docker deployment automatically handles authentication setup.
