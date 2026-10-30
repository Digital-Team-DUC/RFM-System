#!/bin/bash
set -e

echo "=========================================================="
echo "🚀 RFM Enterprise ERP — Automated AWS Ubuntu Deployment"
echo "=========================================================="

# 0. Setup 2GB Swap for low-RAM AWS instances (prevents build freeze/OOM)
if [ ! -f /swapfile ] && [ $(free -m | awk '/^Mem:/{print $2}') -le 2048 ]; then
    echo "⚡ Adding 2GB swap space for low-memory VPS..."
    sudo fallocate -l 2G /swapfile || sudo dd if=/dev/zero of=/swapfile bs=1M count=2048
    sudo chmod 600 /swapfile
    sudo mkswap /swapfile
    sudo swapon /swapfile || true
    echo "/swapfile swap swap defaults 0 0" | sudo tee -a /etc/fstab || true
fi

# 1. Update system packages
sudo apt-get update -y

# 2. Install Docker & Docker Compose if not installed
if ! command -v docker &> /dev/null; then
    echo "📦 Installing Docker & Docker Compose..."
    sudo apt-get install -y ca-certificates curl gnupg lsb-release git
    sudo mkdir -p /etc/apt/keyrings
    curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg --yes
    echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
    sudo apt-get update -y
    sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin
    sudo usermod -aG docker $USER || true
fi

# Ensure docker service is running
sudo systemctl enable docker || true
sudo systemctl start docker || true

# 3. Create .env file if it does not exist
if [ ! -f .env ]; then
    echo "⚙️ Creating .env configuration from .env.example..."
    cp .env.example .env
fi

# 4. Build and start containers
echo "🏗️ Building and starting all Docker containers..."
sudo docker compose down --remove-orphans || true
sudo docker compose up -d --build

# 5. Wait for database and backend
echo "⏳ Waiting for services to become healthy..."
sleep 15

# 6. Push database schema & seed initial users
echo "🔄 Pushing Prisma Database Schema to PostgreSQL..."
sudo docker compose exec -T backend npx prisma db push --accept-data-loss

echo "🌱 Seeding Initial Database Admin, Roles & Permissions..."
sudo docker compose exec -T backend npx prisma db seed || sudo docker compose exec -T backend npx ts-node prisma/seed.ts || true

echo "🧹 Ensuring Clean Financial Balances ($0.00)..."
sudo docker compose exec -T backend node scripts/clear-demo-data.cjs || true

# 7. Check container status
echo ""
echo "📊 Containers Status:"
sudo docker compose ps

echo "=========================================================="
echo "🎉 DEPLOYMENT COMPLETE!"
echo "🌐 Your customer can now access the system at:"
echo "   http://13.229.148.123"
echo ""
echo "Default Login Credentials:"
echo "Email:    admin@rfm.com"
echo "Password: Admin123!"
echo "=========================================================="

