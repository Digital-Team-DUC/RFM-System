#!/bin/bash
set -e

DOMAIN=$1

if [ -z "$DOMAIN" ]; then
    echo "=========================================================="
    echo "❌ Please provide your DuckDNS domain!"
    echo "Usage: sudo ./setup-ssl.sh your-domain.duckdns.org"
    echo "=========================================================="
    exit 1
fi

echo "=========================================================="
echo "🔒 RFM Enterprise ERP — Automated HTTPS / SSL Setup"
echo "🌐 Domain: $DOMAIN"
echo "=========================================================="

# 1. Install Certbot
echo "📦 Installing Certbot..."
sudo apt-get update -y
sudo apt-get install -y certbot

# 2. Stop Proxy temporarily to free port 80 for Certbot verification
echo "🛑 Temporarily stopping proxy container for SSL verification..."
sudo docker compose stop proxy || true

# 3. Generate Let's Encrypt SSL Certificate
echo "🔑 Requesting Let's Encrypt SSL certificate for $DOMAIN..."
sudo certbot certonly --standalone \
    -d "$DOMAIN" \
    --agree-tos \
    --email "admin@rfm.com" \
    --non-interactive \
    --preferred-challenges http

if [ ! -d "/etc/letsencrypt/live/$DOMAIN" ]; then
    echo "❌ Certificate generation failed. Please ensure $DOMAIN points to 3.1.209.86 in DuckDNS."
    sudo docker compose start proxy || true
    exit 1
fi

echo "✅ SSL Certificate generated successfully!"

# 4. Generate SSL Nginx Configuration
echo "⚙️ Configuring Nginx with HTTPS..."
cat <<NGINX_CONF | sudo tee ./infrastructure/nginx/nginx.conf > /dev/null
user nginx;
worker_processes auto;
error_log /var/log/nginx/error.log warn;
pid /var/run/nginx.pid;

events {
    worker_connections 1024;
}

http {
    include /etc/nginx/mime.types;
    default_type application/octet-stream;

    log_format main '\$remote_addr - \$remote_user [\$time_local] "\$request" '
                    '\$status \$body_bytes_sent "\$http_referer" '
                    '"\$http_user_agent" "\$http_x_forwarded_for"';

    access_log /var/log/nginx/access.log main;

    sendfile on;
    tcp_nopush on;
    tcp_nodelay on;
    keepalive_timeout 65;
    types_hash_max_size 2048;

    gzip on;
    gzip_vary on;
    gzip_proxied any;
    gzip_comp_level 6;
    gzip_types text/plain text/css text/xml application/json application/javascript application/rss+xml application/atom+xml image/svg+xml;

    upstream backend_upstream {
        server backend:4000;
    }

    upstream frontend_upstream {
        server frontend:80;
    }

    # HTTP Server: Redirect all traffic to HTTPS
    server {
        listen 80;
        server_name $DOMAIN localhost;

        location /.well-known/acme-challenge/ {
            root /var/www/certbot;
        }

        location / {
            return 301 https://\$host\$request_uri;
        }
    }

    # HTTPS Server
    server {
        listen 443 ssl;
        server_name $DOMAIN;

        ssl_certificate /etc/letsencrypt/live/$DOMAIN/fullchain.pem;
        ssl_certificate_key /etc/letsencrypt/live/$DOMAIN/privkey.pem;

        ssl_protocols TLSv1.2 TLSv1.3;
        ssl_ciphers HIGH:!aNULL:!MD5;
        ssl_prefer_server_ciphers on;

        client_max_body_size 25M;

        # Backend API
        location /api/ {
            proxy_pass http://backend_upstream;
            proxy_http_version 1.1;
            proxy_set_header Upgrade \$http_upgrade;
            proxy_set_header Connection 'upgrade';
            proxy_set_header Host \$host;
            proxy_cache_bypass \$http_upgrade;
            proxy_set_header X-Real-IP \$remote_addr;
            proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto https;
        }

        # WebSocket real-time events proxy
        location /socket.io/ {
            proxy_pass http://backend_upstream;
            proxy_http_version 1.1;
            proxy_set_header Upgrade \$http_upgrade;
            proxy_set_header Connection "upgrade";
            proxy_set_header Host \$host;
            proxy_cache_bypass \$http_upgrade;
            proxy_read_timeout 86400;
        }

        # Frontend SPA
        location / {
            proxy_pass http://frontend_upstream;
            proxy_set_header Host \$host;
            proxy_set_header X-Real-IP \$remote_addr;
            proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto https;
        }
    }
}
NGINX_CONF

# 5. Update docker-compose.yml to expose port 443 and mount /etc/letsencrypt
echo "⚙️ Updating docker-compose.yml with Port 443 and SSL volumes..."
node -e "
const fs = require('fs');
let dc = fs.readFileSync('docker-compose.yml', 'utf8').replace(/\\r\\n/g, '\n');

if (!dc.includes('443:443')) {
  dc = dc.replace(
    '    ports:\n      - \"80:80\"',
    '    ports:\n      - \"80:80\"\n      - \"443:443\"'
  );
}

if (!dc.includes('/etc/letsencrypt:/etc/letsencrypt:ro')) {
  dc = dc.replace(
    '    volumes:\n      - ./infrastructure/nginx/nginx.conf:/etc/nginx/nginx.conf:ro',
    '    volumes:\n      - ./infrastructure/nginx/nginx.conf:/etc/nginx/nginx.conf:ro\n      - /etc/letsencrypt:/etc/letsencrypt:ro'
  );
}

fs.writeFileSync('docker-compose.yml', dc, 'utf8');
"

# 6. Restart Proxy with SSL
echo "🚀 Starting containers with full SSL..."
sudo docker compose up -d proxy

# 7. Setup automated certificate renewal cron job
echo "🔄 Configuring automatic SSL renewal..."
CRON_JOB="0 3 * * * certbot renew --quiet --deploy-hook 'docker compose -f /home/ubuntu/RFM-System/docker-compose.yml exec -T proxy nginx -s reload'"
(crontab -l 2>/dev/null | grep -F -v "certbot renew"; echo "$CRON_JOB") | crontab - || true

echo "=========================================================="
echo "🎉 HTTPS SETUP COMPLETE!"
echo "🌐 Your secure system is now live at:"
echo "   https://$DOMAIN"
echo "=========================================================="
