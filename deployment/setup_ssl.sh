#!/bin/bash
set -e

if [ -z "$1" ]; then
    echo "Usage: ./setup_ssl.sh <your-domain-name.com>"
    exit 1
fi

DOMAIN=$1

echo "Installing Certbot..."
sudo apt-get install -y certbot python3-certbot-nginx

echo "Configuring SSL for $DOMAIN..."
sudo certbot --nginx -d $DOMAIN --non-interactive --agree-tos -m admin@$DOMAIN

echo "SSL successfully configured! HTTPS is now active."
