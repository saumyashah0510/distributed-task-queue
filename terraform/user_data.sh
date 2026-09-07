#!/bin/bash
# user_data.sh - Automatic startup script to install Docker and prepare EC2


set -e # Exit immediately if a command exits with a non-zero status

# 1. Update package list and install prerequisites
apt-get update -y
apt-get install -y apt-transport-https ca-certificates curl software-properties-common git

# 2. Install docker
apt-get install -y docker.io

# 3. Install official Docker Compose V2 binary
mkdir -p /usr/local/lib/docker/cli-plugins
curl -SL https://github.com/docker/compose/releases/download/v2.29.1/docker-compose-linux-x86_64 -o /usr/local/lib/docker/cli-plugins/docker-compose
chmod +x /usr/local/lib/docker/cli-plugins/docker-compose
ln -sf /usr/local/lib/docker/cli-plugins/docker-compose /usr/bin/docker-compose

# 4. Start and enable Docker service on boot
systemctl start docker
systemctl enable docker

# 5. Add 'ubuntu' user to docker group so sudo is not required for docker commands
usermod -aG docker ubuntu

# 6. Clone your Distributed Task Queue repository into /home/ubuntu/distributed-task-queue
cd /home/ubuntu
if [ ! -d "distributed-task-queue" ]; then
  git clone https://github.com/saumyashah0510/distributed-task-queue.git
  chown -R ubuntu:ubuntu distributed-task-queue
fi

cd /home/ubuntu/distributed-task-queue
cp docker-compose.prod.yml docker-compose.yml
