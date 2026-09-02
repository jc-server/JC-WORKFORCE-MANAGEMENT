-- Database Diagnostic Check
-- Run this in Supabase SQL Editor

-- 1. Check if all tables exist
SELECT 'Workers Table' as check_name, COUNT(*) as row_count FROM workers
UNION ALL
SELECT 'Attendance Table', COUNT(*) FROM attendance
UNION ALL
SELECT 'Transactions Table', COUNT(*) FROM worker_transactions
UNION ALL
SELECT 'Audit Log Table', COUNT(*) FROM audit_log;

-- 2. Check RLS is enabled on all tables
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('workers', 'attendance', 'worker_transactions', 'audit_log');

-- 3. Check all policies exist
SELECT policyname, tablename 
FROM pg_policies 
ORDER BY tablename;

-- 4. Check if functions exist
SELECT proname 
FROM pg_proc 
WHERE proname IN ('apply_attendance_with_payment', 'issue_advance', 'get_today_summary');

-- 5. Test the apply_attendance_with_payment function
DO $$
DECLARE
    v_worker_id UUID;
    v_result JSON;
BEGIN
    -- Get first active worker
    SELECT id INTO v_worker_id 
    FROM workers 
    WHERE active = true 
    LIMIT 1;
    
    IF v_worker_id IS NULL THEN
        RAISE NOTICE '⚠️ No workers found - add a worker first';
    ELSE
        -- Test marking attendance for today
        BEGIN
            SELECT apply_attendance_with_payment(
                v_worker_id,
                CURRENT_DATE,
                'present',
                500,
                0
            ) INTO v_result;
            
            RAISE NOTICE '✅ Attendance function works! Result: %', v_result;
        EXCEPTION WHEN OTHERS THEN
            RAISE NOTICE '❌ Attendance function error: %', SQLERRM;
        END;
    END IF;
END $$;

-- 6. Check recent attendance records
SELECT 
    w.name,
    a.work_date,
    a.status,
    a.wage_amount,
    a.payment_amount,
    a.created_at
FROM attendance a
JOIN workers w ON a.worker_id = w.id
ORDER BY a.created_at DESC
LIMIT 10;

-- 7. Check recent transactions
SELECT 
    w.name,
    t.transaction_type,
    t.amount,
    t.description,
    t.transaction_date
FROM worker_transactions t
JOIN workers w ON t.worker_id = w.id
ORDER BY t.created_at DESC
LIMIT 10;

-- 8. Verify RLS policies are working
-- This should return data only for authenticated users
SELECT COUNT(*) as accessible_workers 
FROM workers 
WHERE owner_id = auth.uid();

-- 9. Check for any permission issues
SELECT 
    event_message,
    created_at
FROM audit_log
WHERE action = 'ERROR'
ORDER BY created_at DESC
LIMIT 10;

-- 10. Summary
SELECT 'Database check complete' as status;
