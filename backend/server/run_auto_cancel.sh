#!/bin/bash
# Auto-cancel cron job runner for Linux
# This script executes the auto-cancel cron PHP script

# Get the directory where this script is located
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Execute the PHP script
php "$SCRIPT_DIR/auto_cancel_cron.php"
