#!/bin/bash

# Script to restore from the 2nd to last backup
echo "Finding and restoring from the 2nd to last backup..."

# List all backup directories in chronological order
BACKUP_DIRS=($(ls -td backups/*/ 2>/dev/null))

# Check if we have enough backups
if [ ${#BACKUP_DIRS[@]} -lt 2 ]; then
  echo "Error: Not enough backups found. Only ${#BACKUP_DIRS[@]} backup directories exist."
  exit 1
fi

# Get the 2nd to last backup
TARGET_BACKUP="${BACKUP_DIRS[1]}"
echo "Restoring from backup directory: $TARGET_BACKUP"

# Restore all files from that backup
for file in "$TARGET_BACKUP"/*.bak; do
  if [ -f "$file" ]; then
    # Extract the original filename
    original_filename=$(basename "$file" .bak)
    
    # Try to guess the original path
    if [[ $original_filename == *"attack-map"* ]]; then
      restore_path="components/dashboard/$original_filename"
    elif [[ $original_filename == *"header"* || $original_filename == *"nav"* || $original_filename == *"sidebar"* ]]; then
      restore_path="components/layout/$original_filename"
    elif [[ $original_filename == *"stats-grid"* ]]; then
      restore_path="components/dashboard/$original_filename"
    else
      # Default path - you may need to adjust this
      restore_path="$original_filename"
    fi
    
    echo "Restoring $file to $restore_path"
    cp "$file" "$restore_path"
  fi
done

echo "Restoration complete. You may need to manually fix any remaining issues."