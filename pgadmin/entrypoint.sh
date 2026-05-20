#!/bin/sh
set -e

# Générer le fichier pgpass pour connexion automatique
cat > /tmp/pgpass << EOF
postgresql:5432:*:${POSTGRES_USER}:${POSTGRES_PASSWORD}
EOF
chmod 600 /tmp/pgpass

# Générer le fichier servers.json avec les vraies valeurs des variables d'env
cat > /tmp/servers.json << EOF
{
  "Servers": {
    "1": {
      "Name": "DB Support Master",
      "Group": "NodeJS API",
      "Host": "postgresql",
      "Port": 5432,
      "MaintenanceDB": "postgres",
      "Username": "${POSTGRES_USER}",
      "SSLMode": "prefer",
      "PassFile": "/tmp/pgpass"
    }
  }
}
EOF

export PGADMIN_SERVER_JSON_FILE=/tmp/servers.json

exec /entrypoint.sh
