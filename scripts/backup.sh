#!/bin/bash
# Backup script for student_db
# This script must be run on the host machine or inside a container with docker CLI

set -e

BACKUP_DIR="backups"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILE="${BACKUP_DIR}/student_db_${TIMESTAMP}.sql"

# Create backup directory if it doesn't exist
mkdir -p "${BACKUP_DIR}"

echo "Starting database backup to ${BACKUP_FILE}..."

# Execute dump inside the db container
docker exec htpl_db mysqldump -u root -prootpassword student_db > "${BACKUP_FILE}"

if [ $? -eq 0 ]; then
    echo "Backup completed successfully!"
    echo "File saved at: ${BACKUP_FILE}"
else
    echo "Error: Backup failed!"
    exit 1
fi
