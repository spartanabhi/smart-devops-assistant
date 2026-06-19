#!/bin/bash
set -e

echo "======================================"
echo " AWS EC2 Setup - Smart DevOps Assistant"
echo "======================================"

echo "1. Updating system packages..."
sudo apt-get update -y && sudo apt-get upgrade -y

echo "2. Installing Docker..."
bash ./install_docker.sh

echo "3. Installing Nginx Reverse Proxy..."
bash ./install_nginx.sh

echo "4. EC2 Instance Prepared!"
echo "Please clone your repository, populate backend/.env, and run:"
echo "docker compose up -d --build"
echo "After containers are healthy, run ./setup_ssl.sh to configure HTTPS."
