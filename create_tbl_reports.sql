-- ================================================================
-- CREATE TABLE FOR TBL_REPORTS
-- ================================================================
-- This table stores user-submitted issue and bug reports
-- Used by the fetchReports operation in faculty&staff.php
-- ================================================================

CREATE TABLE IF NOT EXISTS `tbl_reports` (
  `report_id` INT(11) NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(255) NOT NULL COMMENT 'Name of the person submitting the report',
  `issue` VARCHAR(500) NOT NULL COMMENT 'Brief description of the issue/bug',
  `description` TEXT DEFAULT NULL COMMENT 'Detailed description of the issue/bug',
  `date_reported` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'When the report was submitted',
  PRIMARY KEY (`report_id`),
  INDEX `idx_date_reported` (`date_reported`),
  INDEX `idx_name` (`name`),
  INDEX `idx_issue` (`issue`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Table for storing user-submitted issue and bug reports';

-- ================================================================
-- SAMPLE INSERT QUERIES (Optional - for testing)
-- ================================================================
-- INSERT INTO `tbl_reports` (`name`, `issue`, `description`) VALUES
-- ('John Doe', 'Login button not working', 'The login button on the homepage is not responding when clicked. Tested on Chrome browser.'),
-- ('Jane Smith', 'Calendar display issue', 'The reservation calendar is not showing events for the current month. Only previous month events are visible.'),
-- ('Admin User', 'Email notifications not sending', 'Users are not receiving email notifications for reservation confirmations. SMTP settings appear to be correct.');

-- ================================================================
-- VERIFICATION QUERY (Run to verify table creation)
-- ================================================================
-- DESCRIBE `tbl_reports`;
-- SELECT COUNT(*) AS total_reports FROM `tbl_reports`;

-- ================================================================
-- COMPLETED SUCCESSFULLY
-- ================================================================
SELECT 'tbl_reports table created successfully.' AS Status;
