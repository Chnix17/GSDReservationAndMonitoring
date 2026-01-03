# Idempotency and Data Integrity Testing Guide

This document describes how to test the idempotency and data integrity features of the auto-approval system.

## Requirements Being Tested

- **Requirement 6.1**: Script produces same result when executed multiple times
- **Requirement 6.2**: Database transactions ensure atomic updates
- **Requirement 6.3**: Transaction rollback on failure
- **Requirement 6.4**: Continue processing other reservations after individual failures
- **Requirement 6.5**: Track processed reservation IDs to prevent duplicate processing

## Test Scenarios

### Test 1: Idempotent Execution (Requirement 6.1)

**Setup:**
1. Create a test reservation with pending department approvals
2. Set the event date within the trigger window

**Test Steps:**
1. Run the cron script: `php backend/server/auto_approve_department_cron.php`
2. Verify approvals are updated to approved (department_is_approved = 1)
3. Run the script again immediately
4. Verify no additional updates occur (same result)
5. Check log file shows "No pending approvals found" on second run

**Expected Result:**
- First run: Approvals updated, notification created
- Second run: No changes, same database state
- Idempotency confirmed ✓

### Test 2: Transaction Atomicity (Requirement 6.2)

**Setup:**
1. Create a test reservation with multiple department approvals
2. Ensure database supports transactions (InnoDB engine)

**Test Steps:**
1. Monitor database during script execution
2. Verify all approvals for a reservation are updated together
3. Check that partial updates never occur

**Expected Result:**
- All approvals for a reservation are updated in one transaction
- No partial states visible in database
- Atomicity confirmed ✓

### Test 3: Transaction Rollback (Requirement 6.3)

**Setup:**
1. Create a test reservation with pending approvals
2. Temporarily modify the notification table to cause an error

**Test Steps:**
1. Run the cron script
2. Verify transaction rolls back when error occurs
3. Check that no approvals are updated despite processing attempt
4. Verify error is logged

**Expected Result:**
- Error triggers rollback
- No approvals updated (database unchanged)
- Error logged with details
- Rollback confirmed ✓

### Test 4: Error Isolation (Requirement 6.4)

**Setup:**
1. Create multiple test reservations (A, B, C)
2. Make reservation B cause an error (invalid data)

**Test Steps:**
1. Run the cron script
2. Verify reservation A processes successfully
3. Verify reservation B fails and logs error
4. Verify reservation C processes successfully despite B's failure

**Expected Result:**
- Reservation A: Success
- Reservation B: Error (logged)
- Reservation C: Success
- Error isolation confirmed ✓

### Test 5: Duplicate Prevention (Requirement 6.5)

**Setup:**
1. Create a test reservation that appears multiple times in the query result
2. This can happen if the reservation matches multiple criteria

**Test Steps:**
1. Run the cron script
2. Check log file for "already processed in this execution" message
3. Verify reservation is only processed once
4. Verify only one set of updates occurs

**Expected Result:**
- Reservation processed only once
- Subsequent occurrences skipped
- Log shows duplicate detection
- Duplicate prevention confirmed ✓

## Manual Testing Commands

### Run the script manually
```bash
php backend/server/auto_approve_department_cron.php
```

### Check log output
```bash
cat backend/server/auto_approve_department.log
```

### Verify database state
```sql
-- Check pending approvals before run
SELECT * FROM tbl_department_approval 
WHERE department_request_reservation_id = [TEST_RESERVATION_ID]
  AND (department_is_approved IS NULL OR department_is_approved = 0);

-- Check approved status after run
SELECT * FROM tbl_department_approval 
WHERE department_request_reservation_id = [TEST_RESERVATION_ID]
  AND department_is_approved = 1;

-- Check notifications created
SELECT * FROM tbl_notification_reservation 
WHERE notification_reservation_reservation_id = [TEST_RESERVATION_ID]
ORDER BY notification_created_at DESC;
```

### Test transaction support
```sql
-- Verify InnoDB engine (supports transactions)
SHOW TABLE STATUS WHERE Name = 'tbl_department_approval';
```

## Automated Testing

For automated testing, create test reservations with known states and verify:

1. **Idempotency**: Run script twice, compare database states
2. **Atomicity**: Check all approvals updated together
3. **Rollback**: Inject errors, verify no partial updates
4. **Isolation**: Multiple reservations, verify independent processing
5. **Duplicate Prevention**: Track processed IDs, verify single processing

## Success Criteria

All tests pass when:
- ✓ Running script multiple times produces identical results
- ✓ All updates within a transaction succeed or fail together
- ✓ Errors trigger complete rollback with no partial updates
- ✓ Individual reservation errors don't stop other processing
- ✓ Duplicate reservations are detected and skipped

## Implementation Details

### Idempotency Mechanisms

1. **WHERE Clause Filtering**
   ```sql
   WHERE department_approval_id = :approval_id
     AND (department_is_approved IS NULL OR department_is_approved = 0)
   ```
   - Only updates pending approvals
   - Already-approved records are excluded

2. **In-Memory Tracking**
   ```php
   $processedReservationIds = [];
   if (in_array($reservationId, $processedReservationIds)) {
       continue; // Skip duplicate
   }
   ```
   - Prevents duplicate processing in same execution

3. **Transaction Wrapping**
   ```php
   $conn->beginTransaction();
   // ... all updates ...
   $conn->commit(); // or rollback on error
   ```
   - Ensures atomic operations

### Error Handling Flow

```
For each reservation:
  BEGIN TRANSACTION
    Get pending approvals
    Update approvals
    Create notification
    Send push notification
  COMMIT TRANSACTION
  
  ON ERROR:
    ROLLBACK TRANSACTION
    Log error
    Continue to next reservation
```

This ensures data integrity and error isolation.
