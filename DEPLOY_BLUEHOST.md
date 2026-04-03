# FlowFi AI - Bluehost Deployment Guide / Guia de Despliegue en Bluehost

> **Important / Importante:** Bluehost shared hosting is NOT designed for Node.js applications. This guide covers all options from best to most practical.
>
> El hosting compartido de Bluehost NO esta disenado para aplicaciones Node.js. Esta guia cubre todas las opciones, de la mejor a la mas practica.

---

## Table of Contents / Tabla de Contenidos

- [Option A: Bluehost VPS (Recommended)](#option-a-bluehost-vps-recommended)
- [Option B: Better Alternatives (Lower Cost)](#option-b-better-alternatives-lower-cost)
- [Option C: Bluehost for Domain Only + Deploy Elsewhere](#option-c-bluehost-for-domain-only--deploy-elsewhere)

---

## Option A: Bluehost VPS (Recommended)

### Opcion A: Bluehost VPS (Recomendado)

This is the only Bluehost plan that supports Node.js apps. You get root SSH access and full control.

Esta es la unica opcion de Bluehost que soporta apps Node.js. Tienes acceso root SSH y control total.

**Cost / Costo:** ~$19.99/month

---

### Step 1: Get a Bluehost VPS Plan / Paso 1: Obtener un plan VPS de Bluehost

1. Go to [bluehost.com/hosting/vps](https://www.bluehost.com/hosting/vps)
2. Select at least the **Standard** plan (2 CPU cores, 2GB RAM)
3. Complete the purchase and wait for provisioning email

---

### Step 2: SSH into the VPS / Paso 2: Conectarse por SSH al VPS

```bash
# Connect to your VPS / Conectarse al VPS
ssh root@YOUR_VPS_IP

# Or if you set up a user / O si configuraste un usuario
ssh your_user@YOUR_VPS_IP
```

---

### Step 3: Install Dependencies / Paso 3: Instalar dependencias

```bash
# Update system packages / Actualizar paquetes del sistema
sudo apt update && sudo apt upgrade -y

# Install essential tools / Instalar herramientas esenciales
sudo apt install -y curl wget git build-essential

# -------------------------------------------------------
# Install Node.js 18+ via nvm / Instalar Node.js 18+ con nvm
# -------------------------------------------------------
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash
source ~/.bashrc
nvm install 20
nvm use 20
nvm alias default 20

# Verify / Verificar
node --version   # Should be v20.x.x
npm --version

# -------------------------------------------------------
# Install PostgreSQL 15 / Instalar PostgreSQL 15
# -------------------------------------------------------
sudo apt install -y postgresql postgresql-contrib

# Start and enable PostgreSQL / Iniciar y habilitar PostgreSQL
sudo systemctl start postgresql
sudo systemctl enable postgresql

# Create database and user / Crear base de datos y usuario
sudo -u postgres psql <<EOF
CREATE USER flowfi WITH PASSWORD 'YOUR_SECURE_PASSWORD';
CREATE DATABASE flowfi_db OWNER flowfi;
GRANT ALL PRIVILEGES ON DATABASE flowfi_db TO flowfi;
EOF

# -------------------------------------------------------
# Install Redis / Instalar Redis
# -------------------------------------------------------
sudo apt install -y redis-server
sudo systemctl enable redis-server
sudo systemctl start redis-server

# Verify / Verificar
redis-cli ping   # Should return PONG

# -------------------------------------------------------
# Install Nginx / Instalar Nginx
# -------------------------------------------------------
sudo apt install -y nginx
sudo systemctl enable nginx
sudo systemctl start nginx

# -------------------------------------------------------
# Install PM2 (process manager) / Instalar PM2 (gestor de procesos)
# -------------------------------------------------------
npm install -g pm2
```

---

### Step 4: Clone the Repository / Paso 4: Clonar el repositorio

```bash
# Create app directory / Crear directorio de la app
mkdir -p /var/www
cd /var/www

# Clone the repo / Clonar el repo
git clone https://github.com/YOUR_ORG/flowfi-ai.git
cd flowfi-ai
```

---

### Step 5: Set Up Environment Variables / Paso 5: Configurar variables de entorno

#### Backend (.env) / Backend (.env)

```bash
cat > /var/www/flowfi-ai/backend/.env <<'EOF'
# Database / Base de datos
DATABASE_URL="postgresql://flowfi:YOUR_SECURE_PASSWORD@localhost:5432/flowfi_db"

# Redis
REDIS_URL="redis://localhost:6379"

# JWT Secret - generate with: openssl rand -base64 64
JWT_SECRET="YOUR_JWT_SECRET_HERE"

# App Config
PORT=3001
NODE_ENV=production

# OpenAI (for AI features / para funciones de IA)
OPENAI_API_KEY="sk-your-openai-key"

# Frontend URL (for CORS / para CORS)
FRONTEND_URL="https://yourdomain.com"
EOF
```

#### Frontend (.env.local) / Frontend (.env.local)

```bash
cat > /var/www/flowfi-ai/frontend/.env.local <<'EOF'
NEXT_PUBLIC_API_URL="https://yourdomain.com/api"
NEXT_PUBLIC_APP_URL="https://yourdomain.com"
NODE_ENV=production
EOF
```

---

### Step 6: Run Prisma Migrations / Paso 6: Ejecutar migraciones de Prisma

```bash
cd /var/www/flowfi-ai/backend

# Install dependencies / Instalar dependencias
npm install

# Generate Prisma client / Generar cliente de Prisma
npx prisma generate

# Run migrations / Ejecutar migraciones
npx prisma migrate deploy

# (Optional) Seed data / (Opcional) Datos iniciales
npx prisma db seed
```

---

### Step 7: Build the Applications / Paso 7: Compilar las aplicaciones

```bash
# -------------------------------------------------------
# Build Backend (NestJS) / Compilar Backend (NestJS)
# -------------------------------------------------------
cd /var/www/flowfi-ai/backend
npm install
npm run build

# -------------------------------------------------------
# Build Frontend (Next.js) / Compilar Frontend (Next.js)
# -------------------------------------------------------
cd /var/www/flowfi-ai/frontend
npm install
npm run build
```

---

### Step 8: Configure Nginx as Reverse Proxy / Paso 8: Configurar Nginx como proxy inverso

```bash
sudo nano /etc/nginx/sites-available/flowfi
```

Paste the following / Pegar lo siguiente:

```nginx
# /etc/nginx/sites-available/flowfi
# FlowFi AI - Nginx Reverse Proxy Configuration
# Configuracion de Proxy Inverso Nginx para FlowFi AI

upstream frontend {
    server 127.0.0.1:3000;
    keepalive 64;
}

upstream backend {
    server 127.0.0.1:3001;
    keepalive 64;
}

# Redirect HTTP to HTTPS / Redirigir HTTP a HTTPS
server {
    listen 80;
    listen [::]:80;
    server_name yourdomain.com www.yourdomain.com;
    return 301 https://$server_name$request_uri;
}

# Main HTTPS server / Servidor HTTPS principal
server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name yourdomain.com www.yourdomain.com;

    # SSL certificates (managed by Let's Encrypt / gestionados por Let's Encrypt)
    ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;
    include /etc/letsencrypt/options-ssl-nginx.conf;
    ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem;

    # Security headers / Cabeceras de seguridad
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
    add_header Strict-Transport-Security "max-age=63072000; includeSubDomains; preload" always;

    # Gzip compression / Compresion Gzip
    gzip on;
    gzip_vary on;
    gzip_proxied any;
    gzip_comp_level 6;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript image/svg+xml;

    # Max upload size / Tamano maximo de subida
    client_max_body_size 10M;

    # Backend API proxy / Proxy de API del backend
    # All /api requests go to NestJS on port 3001
    # Todas las solicitudes /api van a NestJS en el puerto 3001
    location /api/ {
        proxy_pass http://backend/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 60s;
        proxy_send_timeout 60s;
    }

    # Frontend proxy / Proxy del frontend
    # Everything else goes to Next.js on port 3000
    # Todo lo demas va a Next.js en el puerto 3000
    location / {
        proxy_pass http://frontend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # Static assets caching / Cache de recursos estaticos
    location /_next/static/ {
        proxy_pass http://frontend;
        proxy_cache_valid 200 365d;
        add_header Cache-Control "public, max-age=31536000, immutable";
    }
}
```

Enable the site / Habilitar el sitio:

```bash
# Enable site / Habilitar sitio
sudo ln -s /etc/nginx/sites-available/flowfi /etc/nginx/sites-enabled/

# Remove default site / Eliminar sitio por defecto
sudo rm /etc/nginx/sites-enabled/default

# Test config / Probar configuracion
sudo nginx -t

# Reload Nginx / Recargar Nginx
sudo systemctl reload nginx
```

---

### Step 9: Set Up PM2 Process Manager / Paso 9: Configurar PM2 como gestor de procesos

Create the ecosystem file / Crear el archivo de ecosistema:

```bash
cat > /var/www/flowfi-ai/ecosystem.config.js <<'EOF'
// PM2 Ecosystem Configuration for FlowFi AI
// Configuracion del Ecosistema PM2 para FlowFi AI

module.exports = {
  apps: [
    {
      name: 'flowfi-frontend',
      cwd: '/var/www/flowfi-ai/frontend',
      script: 'node_modules/.bin/next',
      args: 'start',
      instances: 1,
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'production',
        PORT: 3000,
      },
      // Auto restart settings / Configuracion de auto-reinicio
      max_memory_restart: '500M',
      restart_delay: 5000,
      max_restarts: 10,
      // Logs / Registros
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      error_file: '/var/log/pm2/flowfi-frontend-error.log',
      out_file: '/var/log/pm2/flowfi-frontend-out.log',
      merge_logs: true,
    },
    {
      name: 'flowfi-backend',
      cwd: '/var/www/flowfi-ai/backend',
      script: 'dist/main.js',
      instances: 1,
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'production',
        PORT: 3001,
      },
      // Auto restart settings / Configuracion de auto-reinicio
      max_memory_restart: '500M',
      restart_delay: 5000,
      max_restarts: 10,
      // Logs / Registros
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      error_file: '/var/log/pm2/flowfi-backend-error.log',
      out_file: '/var/log/pm2/flowfi-backend-out.log',
      merge_logs: true,
    },
  ],
};
EOF
```

Start the applications / Iniciar las aplicaciones:

```bash
# Create log directory / Crear directorio de logs
sudo mkdir -p /var/log/pm2
sudo chown $USER:$USER /var/log/pm2

# Start all apps / Iniciar todas las apps
cd /var/www/flowfi-ai
pm2 start ecosystem.config.js

# Save PM2 process list for auto-restart on reboot
# Guardar lista de procesos PM2 para auto-reinicio al reiniciar
pm2 save

# Set PM2 to start on boot / Configurar PM2 para iniciar al arrancar
pm2 startup
# Follow the command it outputs / Ejecutar el comando que muestra

# Check status / Verificar estado
pm2 status
pm2 logs
```

---

### Step 10: SSL with Let's Encrypt / Paso 10: SSL con Let's Encrypt

```bash
# Install Certbot / Instalar Certbot
sudo apt install -y certbot python3-certbot-nginx

# Get SSL certificate / Obtener certificado SSL
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com

# Auto-renewal is configured automatically / La renovacion automatica se configura sola
# Test it / Probarlo:
sudo certbot renew --dry-run
```

---

### Step 11: Domain Configuration / Paso 11: Configuracion de dominio

In your Bluehost DNS panel (or domain registrar), set:

En tu panel DNS de Bluehost (o registrador de dominio), configurar:

| Type / Tipo | Name / Nombre | Value / Valor       | TTL  |
| ----------- | ------------- | ------------------- | ---- |
| A            | @             | YOUR_VPS_IP         | 3600 |
| A            | www           | YOUR_VPS_IP         | 3600 |
| CNAME        | www           | yourdomain.com      | 3600 |

---

### Maintenance Commands / Comandos de mantenimiento

```bash
# View app status / Ver estado de las apps
pm2 status

# View logs / Ver logs
pm2 logs flowfi-frontend
pm2 logs flowfi-backend

# Restart apps / Reiniciar apps
pm2 restart all

# Update and redeploy / Actualizar y redesplegar
cd /var/www/flowfi-ai
git pull origin main

# Rebuild backend / Recompilar backend
cd backend
npm install
npx prisma migrate deploy
npm run build

# Rebuild frontend / Recompilar frontend
cd ../frontend
npm install
npm run build

# Restart processes / Reiniciar procesos
pm2 restart all
```

---

## Option B: Better Alternatives (Lower Cost)

### Opcion B: Mejores alternativas (menor costo)

Bluehost VPS at $19.99/month is expensive for what you get. These alternatives are cheaper and easier to manage.

Bluehost VPS a $19.99/mes es caro para lo que ofrece. Estas alternativas son mas baratas y faciles de administrar.

---

### 1. Vercel (FREE) + Railway ($5/mo) -- BEST OPTION / MEJOR OPCION

**Frontend on Vercel (Free) / Frontend en Vercel (Gratis)**
- Push your code to GitHub and connect to Vercel
- Automatic deployments on every push
- Built-in CDN, SSL, and edge network
- Perfect for Next.js (Vercel made Next.js)

**Backend on Railway ($5/mo) / Backend en Railway ($5/mes)**
- PostgreSQL + Redis + NestJS backend in one place
- Easy environment variable management
- Automatic deployments from GitHub

```bash
# Frontend: Connect to Vercel / Frontend: Conectar a Vercel
# 1. Go to vercel.com and sign in with GitHub
# 2. Import the flowfi-ai repo
# 3. Set root directory to "frontend"
# 4. Add environment variables:
#    NEXT_PUBLIC_API_URL = https://your-backend.railway.app

# Backend: Deploy to Railway / Backend: Desplegar en Railway
# 1. Go to railway.app and sign in with GitHub
# 2. New Project -> Deploy from GitHub Repo
# 3. Set root directory to "backend"
# 4. Add PostgreSQL and Redis services
# 5. Railway auto-detects NestJS and builds it
```

**Total cost / Costo total: ~$5/month**

---

### 2. Render.com (Free Tier) / Render.com (Plan gratuito)

Host both frontend and backend on Render with their free tier.

Aloja tanto frontend como backend en Render con su plan gratuito.

- Free web services (spin down after inactivity)
- Free PostgreSQL (90-day limit on free tier)
- Automatic SSL and custom domains
- Easy GitHub integration

**Total cost / Costo total: $0 (free tier) or ~$7/month (paid)**

---

### 3. DigitalOcean App Platform ($12/mo)

- Managed platform, no server maintenance
- Built-in PostgreSQL managed database
- Auto-scaling, SSL, and monitoring
- Good balance of control and convenience

**Total cost / Costo total: ~$12/month**

---

### 4. Fly.io (Free Tier)

- Run containers close to users globally
- Free tier includes 3 shared VMs and 1GB persistent storage
- Great for low-traffic apps
- Supports both Next.js and NestJS

**Total cost / Costo total: $0 (free tier) or ~$5/month (small scale)**

---

### Comparison Table / Tabla comparativa

| Option / Opcion           | Cost / Costo | Difficulty / Dificultad | SSL  | Auto Deploy | DB Included |
| ------------------------- | ------------ | ----------------------- | ---- | ----------- | ----------- |
| Bluehost VPS              | $19.99/mo    | Hard / Dificil          | Manual | No        | No          |
| Vercel + Railway          | ~$5/mo       | Easy / Facil            | Auto   | Yes       | Yes         |
| Render.com                | $0-7/mo      | Easy / Facil            | Auto   | Yes       | Yes         |
| DigitalOcean App Platform | ~$12/mo      | Medium / Medio          | Auto   | Yes       | Yes         |
| Fly.io                    | $0-5/mo      | Medium / Medio          | Auto   | Yes       | No          |

---

## Option C: Bluehost for Domain Only + Deploy Elsewhere

### Opcion C: Bluehost solo para dominio + desplegar en otro lado

If you already bought a domain on Bluehost, you can keep it there and point it to Vercel/Railway.

Si ya compraste un dominio en Bluehost, puedes mantenerlo ahi y apuntarlo a Vercel/Railway.

---

### Step 1: Deploy apps to Vercel + Railway / Paso 1: Desplegar apps en Vercel + Railway

Follow the Vercel + Railway setup from Option B above.

Sigue la configuracion de Vercel + Railway de la Opcion B arriba.

---

### Step 2: Get your deployment URLs / Paso 2: Obtener las URLs de despliegue

After deploying you will have / Despues de desplegar tendras:
- **Frontend:** `flowfi-ai.vercel.app` (from Vercel)
- **Backend:** `flowfi-backend.up.railway.app` (from Railway)

---

### Step 3: Configure DNS on Bluehost / Paso 3: Configurar DNS en Bluehost

1. Log in to Bluehost -> **Domains** -> **DNS**
2. Find your domain's DNS zone editor

**For Frontend (Vercel) / Para el Frontend (Vercel):**

| Type / Tipo | Name / Nombre | Value / Valor               | TTL  |
| ----------- | ------------- | --------------------------- | ---- |
| A            | @             | 76.76.21.21                 | 3600 |
| CNAME        | www           | cname.vercel-dns.com        | 3600 |

> These are Vercel's standard DNS values. Verify in your Vercel project dashboard under Settings -> Domains.
>
> Estos son los valores DNS estandar de Vercel. Verifica en tu dashboard de Vercel en Settings -> Domains.

**For Backend subdomain (Railway) / Para subdominio del Backend (Railway):**

| Type / Tipo | Name / Nombre | Value / Valor                        | TTL  |
| ----------- | ------------- | ------------------------------------ | ---- |
| CNAME        | api           | flowfi-backend.up.railway.app        | 3600 |

This makes `api.yourdomain.com` point to your Railway backend.

Esto hace que `api.tudominio.com` apunte a tu backend en Railway.

---

### Step 4: Configure custom domain in Vercel / Paso 4: Configurar dominio personalizado en Vercel

```
1. Go to Vercel Dashboard -> Your Project -> Settings -> Domains
   Ir a Dashboard de Vercel -> Tu Proyecto -> Settings -> Domains

2. Add your domain: yourdomain.com
   Agregar tu dominio: tudominio.com

3. Vercel will verify DNS and auto-provision SSL
   Vercel verificara el DNS y aprovisionara SSL automaticamente
```

---

### Step 5: Configure custom domain in Railway / Paso 5: Configurar dominio personalizado en Railway

```
1. Go to Railway Dashboard -> Your Service -> Settings -> Domains
   Ir a Dashboard de Railway -> Tu Servicio -> Settings -> Domains

2. Add custom domain: api.yourdomain.com
   Agregar dominio personalizado: api.tudominio.com

3. Railway will verify and provision SSL
   Railway verificara y aprovisionara SSL
```

---

### Step 6: Update environment variables / Paso 6: Actualizar variables de entorno

In Vercel, update / En Vercel, actualizar:
```
NEXT_PUBLIC_API_URL = https://api.yourdomain.com
NEXT_PUBLIC_APP_URL = https://yourdomain.com
```

In Railway, update / En Railway, actualizar:
```
FRONTEND_URL = https://yourdomain.com
```

Redeploy both services after updating variables.

Redesplegar ambos servicios despues de actualizar las variables.

---

### DNS Propagation / Propagacion DNS

DNS changes can take up to 48 hours to propagate worldwide, but usually complete within 1-4 hours.

Los cambios de DNS pueden tardar hasta 48 horas en propagarse mundialmente, pero generalmente se completan en 1-4 horas.

To check propagation / Para verificar la propagacion:
```bash
# Check A record / Verificar registro A
dig yourdomain.com A +short

# Check CNAME / Verificar CNAME
dig www.yourdomain.com CNAME +short
dig api.yourdomain.com CNAME +short

# Or use online tools / O usar herramientas en linea:
# https://dnschecker.org
```

---

## Summary / Resumen

| If you want / Si quieres...                          | Choose / Elige     |
| ---------------------------------------------------- | ------------------ |
| Full control, single server, more work               | Option A (VPS)     |
| Cheapest, easiest, best developer experience         | Option B (Vercel + Railway) |
| Already bought a Bluehost domain                     | Option C (Domain only) |

**Recommendation / Recomendacion:** Option B (Vercel + Railway) or Option C if you already have a Bluehost domain. The VPS route works but requires ongoing server maintenance (security updates, backups, monitoring).

**Recomendacion:** Opcion B (Vercel + Railway) u Opcion C si ya tienes un dominio en Bluehost. La ruta VPS funciona pero requiere mantenimiento continuo del servidor (actualizaciones de seguridad, respaldos, monitoreo).
