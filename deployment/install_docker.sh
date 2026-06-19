#!/bin/bash
set -e

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
rm get-docker.sh

# Add ubuntu user to docker group
sudo usermod -aG docker ubuntu

# Install Docker Compose Plugin
sudo apt-get install -y docker-compose-plugin

echo "Docker installed successfully."
