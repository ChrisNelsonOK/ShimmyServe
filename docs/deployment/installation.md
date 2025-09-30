# ShimmyServe Installation & Deployment Guide

This guide covers various deployment scenarios for ShimmyServe, from simple desktop installation to enterprise containerized deployments.

## 📋 Prerequisites

### System Requirements

**Minimum Requirements:**
- **CPU**: 2 cores, 2.0 GHz
- **RAM**: 8 GB (4 GB for app + 4 GB for models)
- **Storage**: 10 GB free space
- **Network**: Internet connection for downloads

**Recommended Requirements:**
- **CPU**: 4+ cores, 3.0 GHz (Intel i5/AMD Ryzen 5 or better)
- **RAM**: 16 GB+ (8 GB for app + 8+ GB for models)
- **Storage**: 50 GB+ SSD storage
- **GPU**: NVIDIA GPU with 8+ GB VRAM (for accelerated inference)
- **Network**: Broadband connection (100+ Mbps)

### Operating System Support

| OS | Version | Architecture | Status |
|---|---|---|---|
| **macOS** | 10.15+ (Catalina) | x64, ARM64 | ✅ Fully Supported |
| **Windows** | 10 (1903+), 11 | x64, ARM64 | ✅ Fully Supported |
| **Linux** | Ubuntu 18.04+, CentOS 8+, Debian 10+ | x64, ARM64 | ✅ Fully Supported |

## 🖥️ Desktop Installation

### Option 1: Pre-built Binaries (Recommended)

#### macOS Installation

1. **Download the installer**
   ```bash
   curl -L https://github.com/your-org/shimmy-serve/releases/latest/download/ShimmyServe-mac.dmg -o ShimmyServe.dmg
   ```

2. **Install the application**
   - Open the downloaded `.dmg` file
   - Drag ShimmyServe to the Applications folder
   - Launch from Applications or Spotlight

3. **First run setup**
   - Allow the app in System Preferences > Security & Privacy if prompted
   - Follow the setup wizard for initial configuration

#### Windows Installation

1. **Download the installer**
   ```powershell
   Invoke-WebRequest -Uri "https://github.com/your-org/shimmy-serve/releases/latest/download/ShimmyServe-win.exe" -OutFile "ShimmyServe-Setup.exe"
   ```

2. **Run the installer**
   - Double-click `ShimmyServe-Setup.exe`
   - Follow the installation wizard
   - Choose installation directory (default: `C:\Program Files\ShimmyServe`)

3. **Launch the application**
   - Find ShimmyServe in Start Menu or Desktop
   - Run as Administrator if needed for first setup

#### Linux Installation

**Ubuntu/Debian (.deb package):**
```bash
# Download and install
wget https://github.com/your-org/shimmy-serve/releases/latest/download/shimmy-serve_amd64.deb
sudo dpkg -i shimmy-serve_amd64.deb
sudo apt-get install -f  # Fix dependencies if needed

# Launch
shimmy-serve
```

**AppImage (Universal):**
```bash
# Download
wget https://github.com/your-org/shimmy-serve/releases/latest/download/ShimmyServe-linux.AppImage

# Make executable and run
chmod +x ShimmyServe-linux.AppImage
./ShimmyServe-linux.AppImage
```

**Snap Package:**
```bash
sudo snap install shimmy-serve
shimmy-serve
```

### Option 2: Build from Source

#### Prerequisites
- **Node.js** 18+ and npm
- **Python** 3.8+ (for native modules)
- **Git**
- **Build tools** (Xcode on macOS, Visual Studio on Windows, build-essential on Linux)

#### Build Process

1. **Clone the repository**
   ```bash
   git clone https://github.com/your-org/shimmy-serve.git
   cd shimmy-serve
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Build the application**
   ```bash
   # Development build
   npm run build:dev
   
   # Production build
   npm run build
   ```

4. **Package for distribution**
   ```bash
   # Package for current platform
   npm run build:electron
   
   # Package for all platforms (requires additional setup)
   npm run build:all
   ```

5. **Install the built package**
   - Find the built package in `dist/` directory
   - Install using platform-specific method above

## 🐳 Docker Deployment

### Quick Start with Docker

1. **Pull the image**
   ```bash
   docker pull shimmyserve/shimmy-serve:latest
   ```

2. **Run the container**
   ```bash
   docker run -d \
     --name shimmy-serve \
     -p 3000:3000 \
     -p 8080:8080 \
     -v shimmy-data:/app/data \
     -v shimmy-models:/app/models \
     shimmyserve/shimmy-serve:latest
   ```

3. **Access the application**
   - Open browser to `http://localhost:3000`
   - Follow setup wizard

### Docker Compose Deployment

Create `docker-compose.yml`:

```yaml
version: '3.8'

services:
  shimmy-serve:
    image: shimmyserve/shimmy-serve:latest
    container_name: shimmy-serve
    ports:
      - "3000:3000"    # Web interface
      - "8080:8080"    # Shimmy API
    volumes:
      - shimmy-data:/app/data
      - shimmy-models:/app/models
      - ./config:/app/config
    environment:
      - NODE_ENV=production
      - SHIMMY_SERVER_URL=http://localhost:8080
      - DATABASE_PATH=/app/data/shimmy.db
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000/health"]
      interval: 30s
      timeout: 10s
      retries: 3

  # Optional: Separate Shimmy server
  shimmy-server:
    image: shimmy/shimmy:latest
    container_name: shimmy-server
    ports:
      - "8080:8080"
    volumes:
      - shimmy-models:/app/models
    environment:
      - SHIMMY_HOST=0.0.0.0
      - SHIMMY_PORT=8080
    restart: unless-stopped

volumes:
  shimmy-data:
  shimmy-models:
```

Deploy with:
```bash
docker-compose up -d
```

### Custom Docker Build

1. **Create Dockerfile**
   ```dockerfile
   FROM node:18-alpine AS builder
   
   WORKDIR /app
   COPY package*.json ./
   RUN npm ci --only=production
   
   COPY . .
   RUN npm run build
   
   FROM node:18-alpine AS runtime
   
   WORKDIR /app
   COPY --from=builder /app/dist ./dist
   COPY --from=builder /app/node_modules ./node_modules
   COPY --from=builder /app/package.json ./
   
   EXPOSE 3000 8080
   
   CMD ["npm", "start"]
   ```

2. **Build and run**
   ```bash
   docker build -t my-shimmy-serve .
   docker run -p 3000:3000 -p 8080:8080 my-shimmy-serve
   ```

## ☸️ Kubernetes Deployment

### Basic Kubernetes Deployment

1. **Create namespace**
   ```yaml
   # namespace.yaml
   apiVersion: v1
   kind: Namespace
   metadata:
     name: shimmy-serve
   ```

2. **Create deployment**
   ```yaml
   # deployment.yaml
   apiVersion: apps/v1
   kind: Deployment
   metadata:
     name: shimmy-serve
     namespace: shimmy-serve
   spec:
     replicas: 1
     selector:
       matchLabels:
         app: shimmy-serve
     template:
       metadata:
         labels:
           app: shimmy-serve
       spec:
         containers:
         - name: shimmy-serve
           image: shimmyserve/shimmy-serve:latest
           ports:
           - containerPort: 3000
           - containerPort: 8080
           env:
           - name: NODE_ENV
             value: "production"
           volumeMounts:
           - name: data-volume
             mountPath: /app/data
           - name: models-volume
             mountPath: /app/models
         volumes:
         - name: data-volume
           persistentVolumeClaim:
             claimName: shimmy-data-pvc
         - name: models-volume
           persistentVolumeClaim:
             claimName: shimmy-models-pvc
   ```

3. **Create services**
   ```yaml
   # service.yaml
   apiVersion: v1
   kind: Service
   metadata:
     name: shimmy-serve-service
     namespace: shimmy-serve
   spec:
     selector:
       app: shimmy-serve
     ports:
     - name: web
       port: 3000
       targetPort: 3000
     - name: api
       port: 8080
       targetPort: 8080
     type: LoadBalancer
   ```

4. **Deploy to cluster**
   ```bash
   kubectl apply -f namespace.yaml
   kubectl apply -f deployment.yaml
   kubectl apply -f service.yaml
   ```

### Helm Chart Deployment

1. **Add Helm repository**
   ```bash
   helm repo add shimmy-serve https://charts.shimmyserve.com
   helm repo update
   ```

2. **Install with Helm**
   ```bash
   helm install shimmy-serve shimmy-serve/shimmy-serve \
     --namespace shimmy-serve \
     --create-namespace \
     --set image.tag=latest \
     --set persistence.enabled=true \
     --set persistence.size=50Gi
   ```

3. **Custom values file**
   ```yaml
   # values.yaml
   image:
     repository: shimmyserve/shimmy-serve
     tag: "latest"
     pullPolicy: IfNotPresent
   
   service:
     type: LoadBalancer
     port: 3000
     apiPort: 8080
   
   persistence:
     enabled: true
     storageClass: "fast-ssd"
     size: 100Gi
   
   resources:
     limits:
       cpu: 4000m
       memory: 16Gi
     requests:
       cpu: 2000m
       memory: 8Gi
   
   nodeSelector:
     gpu: "nvidia"
   
   tolerations:
   - key: "gpu"
     operator: "Equal"
     value: "nvidia"
     effect: "NoSchedule"
   ```

   Deploy with custom values:
   ```bash
   helm install shimmy-serve shimmy-serve/shimmy-serve -f values.yaml
   ```

## 🌐 Cloud Deployment

### AWS Deployment

#### EC2 Instance

1. **Launch EC2 instance**
   - Instance type: `m5.xlarge` or larger
   - AMI: Ubuntu 20.04 LTS
   - Security groups: Allow ports 22, 3000, 8080

2. **Install Docker**
   ```bash
   sudo apt update
   sudo apt install docker.io docker-compose
   sudo usermod -aG docker ubuntu
   ```

3. **Deploy with Docker Compose**
   ```bash
   wget https://raw.githubusercontent.com/your-org/shimmy-serve/main/docker-compose.prod.yml
   docker-compose -f docker-compose.prod.yml up -d
   ```

#### ECS Deployment

1. **Create task definition**
   ```json
   {
     "family": "shimmy-serve",
     "networkMode": "awsvpc",
     "requiresCompatibilities": ["FARGATE"],
     "cpu": "2048",
     "memory": "8192",
     "containerDefinitions": [
       {
         "name": "shimmy-serve",
         "image": "shimmyserve/shimmy-serve:latest",
         "portMappings": [
           {"containerPort": 3000, "protocol": "tcp"},
           {"containerPort": 8080, "protocol": "tcp"}
         ],
         "environment": [
           {"name": "NODE_ENV", "value": "production"}
         ]
       }
     ]
   }
   ```

2. **Create ECS service**
   ```bash
   aws ecs create-service \
     --cluster shimmy-cluster \
     --service-name shimmy-serve \
     --task-definition shimmy-serve:1 \
     --desired-count 1 \
     --launch-type FARGATE
   ```

### Google Cloud Platform

#### Compute Engine

1. **Create VM instance**
   ```bash
   gcloud compute instances create shimmy-serve-vm \
     --image-family=ubuntu-2004-lts \
     --image-project=ubuntu-os-cloud \
     --machine-type=n1-standard-4 \
     --boot-disk-size=100GB \
     --tags=shimmy-serve
   ```

2. **Configure firewall**
   ```bash
   gcloud compute firewall-rules create allow-shimmy-serve \
     --allow tcp:3000,tcp:8080 \
     --source-ranges 0.0.0.0/0 \
     --target-tags shimmy-serve
   ```

#### Google Kubernetes Engine (GKE)

1. **Create GKE cluster**
   ```bash
   gcloud container clusters create shimmy-cluster \
     --num-nodes=3 \
     --machine-type=n1-standard-4 \
     --enable-autoscaling \
     --min-nodes=1 \
     --max-nodes=10
   ```

2. **Deploy application**
   ```bash
   kubectl apply -f k8s/
   ```

### Microsoft Azure

#### Container Instances

1. **Create resource group**
   ```bash
   az group create --name shimmy-serve-rg --location eastus
   ```

2. **Deploy container**
   ```bash
   az container create \
     --resource-group shimmy-serve-rg \
     --name shimmy-serve \
     --image shimmyserve/shimmy-serve:latest \
     --ports 3000 8080 \
     --cpu 2 \
     --memory 8 \
     --dns-name-label shimmy-serve-unique
   ```

## 🔧 Configuration

### Environment Variables

```bash
# Application settings
NODE_ENV=production
PORT=3000
HOST=0.0.0.0

# Shimmy server settings
SHIMMY_SERVER_URL=http://localhost:8080
SHIMMY_API_KEY=your-api-key-here

# Database settings
DATABASE_PATH=/app/data/shimmy.db
DATABASE_BACKUP_INTERVAL=3600

# Security settings
JWT_SECRET=your-jwt-secret-here
SESSION_TIMEOUT=3600
ENABLE_2FA=true

# Logging settings
LOG_LEVEL=info
LOG_FILE=/app/logs/shimmy-serve.log
LOG_MAX_SIZE=100MB
LOG_MAX_FILES=10

# Performance settings
MAX_CONCURRENT_REQUESTS=100
REQUEST_TIMEOUT=30000
CACHE_TTL=300
```

### Configuration Files

Create `config/production.json`:
```json
{
  "server": {
    "port": 3000,
    "host": "0.0.0.0"
  },
  "shimmy": {
    "serverUrl": "http://localhost:8080",
    "apiKey": "${SHIMMY_API_KEY}",
    "timeout": 30000
  },
  "database": {
    "path": "/app/data/shimmy.db",
    "backupInterval": 3600,
    "maxConnections": 10
  },
  "security": {
    "jwtSecret": "${JWT_SECRET}",
    "sessionTimeout": 3600,
    "enable2FA": true,
    "corsOrigins": ["https://yourdomain.com"]
  },
  "logging": {
    "level": "info",
    "file": "/app/logs/shimmy-serve.log",
    "maxSize": "100MB",
    "maxFiles": 10
  }
}
```

## 🔒 Security Considerations

### SSL/TLS Configuration

1. **Generate certificates**
   ```bash
   # Self-signed for testing
   openssl req -x509 -newkey rsa:4096 -keyout key.pem -out cert.pem -days 365 -nodes
   
   # Let's Encrypt for production
   certbot certonly --standalone -d yourdomain.com
   ```

2. **Configure HTTPS**
   ```javascript
   // In production config
   {
     "server": {
       "https": {
         "enabled": true,
         "cert": "/path/to/cert.pem",
         "key": "/path/to/key.pem"
       }
     }
   }
   ```

### Firewall Configuration

```bash
# Ubuntu/Debian
sudo ufw allow 22/tcp    # SSH
sudo ufw allow 3000/tcp  # ShimmyServe web
sudo ufw allow 8080/tcp  # Shimmy API
sudo ufw enable

# CentOS/RHEL
sudo firewall-cmd --permanent --add-port=3000/tcp
sudo firewall-cmd --permanent --add-port=8080/tcp
sudo firewall-cmd --reload
```

### Reverse Proxy Setup (Nginx)

```nginx
# /etc/nginx/sites-available/shimmy-serve
server {
    listen 80;
    server_name yourdomain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name yourdomain.com;
    
    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;
    
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
    
    location /api/ {
        proxy_pass http://localhost:8080/;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

## 📊 Monitoring & Maintenance

### Health Checks

```bash
# Application health
curl -f http://localhost:3000/health

# Shimmy server health
curl -f http://localhost:8080/v1/health

# Database health
sqlite3 /app/data/shimmy.db "SELECT 1;"
```

### Backup Strategy

```bash
#!/bin/bash
# backup.sh

DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/backups"

# Backup database
sqlite3 /app/data/shimmy.db ".backup $BACKUP_DIR/shimmy_$DATE.db"

# Backup configuration
tar -czf "$BACKUP_DIR/config_$DATE.tar.gz" /app/config/

# Backup logs (last 7 days)
find /app/logs -name "*.log" -mtime -7 -exec tar -czf "$BACKUP_DIR/logs_$DATE.tar.gz" {} +

# Clean old backups (keep 30 days)
find $BACKUP_DIR -name "*.db" -mtime +30 -delete
find $BACKUP_DIR -name "*.tar.gz" -mtime +30 -delete
```

### Log Rotation

```bash
# /etc/logrotate.d/shimmy-serve
/app/logs/*.log {
    daily
    rotate 30
    compress
    delaycompress
    missingok
    notifempty
    create 644 shimmy shimmy
    postrotate
        systemctl reload shimmy-serve
    endscript
}
```

## 🚀 Performance Optimization

### System Tuning

```bash
# Increase file descriptor limits
echo "shimmy soft nofile 65536" >> /etc/security/limits.conf
echo "shimmy hard nofile 65536" >> /etc/security/limits.conf

# Optimize kernel parameters
echo "net.core.somaxconn = 65536" >> /etc/sysctl.conf
echo "net.ipv4.tcp_max_syn_backlog = 65536" >> /etc/sysctl.conf
sysctl -p
```

### Database Optimization

```sql
-- SQLite optimization
PRAGMA journal_mode = WAL;
PRAGMA synchronous = NORMAL;
PRAGMA cache_size = 10000;
PRAGMA temp_store = memory;
```

### Caching Configuration

```json
{
  "cache": {
    "redis": {
      "enabled": true,
      "host": "localhost",
      "port": 6379,
      "ttl": 300
    },
    "memory": {
      "maxSize": "500MB",
      "ttl": 60
    }
  }
}
```

---

This installation guide covers the most common deployment scenarios. For specific requirements or advanced configurations, consult the [Configuration Reference](configuration.md) or contact support.
