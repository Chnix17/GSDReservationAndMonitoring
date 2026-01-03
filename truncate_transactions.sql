-- ================================================================
-- TRUNCATE ALL RESERVATION TRANSACTIONS AND RELATED DATA
-- ================================================================
-- WARNING: This will permanently delete all reservation data!
-- Make sure to backup your database before running this script.
-- ================================================================

-- Disable foreign key checks to avoid constraint errors
SET FOREIGN_KEY_CHECKS = 0;

-- ================================================================
-- STEP 1: Truncate deepest child tables (condition tables)
-- ================================================================
TRUNCATE TABLE `tbl_reservation_condition_equipment`;
TRUNCATE TABLE `tbl_reservation_condition_unit`;
TRUNCATE TABLE `tbl_reservation_condition_vehicle`;
TRUNCATE TABLE `tbl_reservation_condition_venue`;

-- ================================================================
-- STEP 2: Truncate checklist tables
-- ================================================================
TRUNCATE TABLE `tbl_reservation_checklist_equipment`;
TRUNCATE TABLE `tbl_reservation_checklist_vehicle`;
TRUNCATE TABLE `tbl_reservation_checklist_venue`;

-- ================================================================
-- STEP 3: Truncate equipment-related child tables
-- ================================================================
TRUNCATE TABLE `tbl_reservation_unit`;
TRUNCATE TABLE `tbl_reservation_equipment`;

-- ================================================================
-- STEP 4: Truncate vehicle-related child tables
-- ================================================================
TRUNCATE TABLE `tbl_reservation_driver`;
TRUNCATE TABLE `tbl_reservation_vehicle`;

-- ================================================================
-- STEP 5: Truncate venue-related child tables
-- ================================================================
TRUNCATE TABLE `tbl_reservation_venue`;

-- ================================================================
-- STEP 6: Truncate other reservation child tables
-- ================================================================
TRUNCATE TABLE `tbl_reservation_passenger`;
TRUNCATE TABLE `tbl_reservation_status`;
TRUNCATE TABLE `tbl_notification_reservation`;
TRUNCATE TABLE `tbl_department_approval`;

-- ================================================================
-- STEP 7: Truncate main reservation table
-- ================================================================
TRUNCATE TABLE `tbl_reservation`;

-- ================================================================
-- STEP 8: Truncate chat and push notification tables
-- ================================================================
TRUNCATE TABLE `tbl_chat`;
TRUNCATE TABLE `tbl_push_subscriptions`;

-- ================================================================
-- STEP 9: Re-enable foreign key checks
-- ================================================================
SET FOREIGN_KEY_CHECKS = 1;

-- ================================================================
-- VERIFICATION QUERIES (Optional - Run these to verify truncation)
-- ================================================================
-- SELECT COUNT(*) AS reservation_count FROM tbl_reservation;
-- SELECT COUNT(*) AS department_approval_count FROM tbl_department_approval;
-- SELECT COUNT(*) AS chat_count FROM tbl_chat;
-- SELECT COUNT(*) AS push_count FROM tbl_push_subscriptions;

-- ================================================================
-- COMPLETED SUCCESSFULLY
-- ================================================================
SELECT 'All reservation transactions, department approvals, chat messages, and push subscriptions have been truncated.' AS Status;
