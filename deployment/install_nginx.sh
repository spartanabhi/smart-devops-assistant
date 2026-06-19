#!/bin/bash
set -e

# Install Nginx
sudo apt-get install -y nginx

# Copy Nginx configuration
sudo cp nginx.conf /etc/nginx/sites-available/smart_devops
sudo ln -sf /etc/nginx/sites-available/smart_devops /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default

# Test and reload
sudo nginx -t
sudo systemctl reload nginx

echo "Nginx installed and configured successfully."
