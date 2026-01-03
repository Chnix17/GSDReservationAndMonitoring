#!/bin/bash
# Auto-approve department cron job runner for Linux
# This script executes the auto-approve department PHP script

# Get the directory where this script is located
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Execute the PHP script
php "$SCRIPT_DIR/auto_approve_department_cron.php"
