-- ========================================
-- 004_indexes_views.sql
-- Creates views and additional indexes
-- ========================================

-- ========================================
-- VIEW: worker_financial_summary
-- Shows financial summary for each worker
-- ========================================
CREATE OR REPLACE VIEW worker_financial_summary AS
SELECT 
    w.id AS worker_id,
    w.owner_id,
    w.name,
    w.role,
    w.daily_rate,
    COALESCE(SUM(CASE WHEN t.transaction_type = 'wage' THEN t.amount ELSE 0 END), 0) AS total_wages,
    COALESCE(SUM(CASE WHEN t.transaction_type = 'advance' THEN t.amount ELSE 0 END), 0) AS total_advances,
    COALESCE(SUM(CASE WHEN t.transaction_type = 'payment' THEN t.amount ELSE 0 END), 0) AS total_payments,
    COALESCE(SUM(CASE WHEN t.transaction_type = 'wage' THEN t.amount ELSE 0 END), 0) 
    - COALESCE(SUM(CASE WHEN t.transaction_type IN ('advance', 'payment') THEN t.amount ELSE 0 END), 0) AS net_balance,
    COUNT(DISTINCT a.id) AS attendance_count,
    COUNT(DISTINCT CASE WHEN a.status = 'present' THEN a.id END) AS present_count
FROM 
    workers w
LEFT JOIN 
    attendance a ON w.id = a.worker_id
LEFT JOIN 
    worker_transactions t ON w.id = t.worker_id
WHERE 
    w.active = true
GROUP BY 
    w.id, w.owner_id, w.name, w.role, w.daily_rate;

-- ========================================
-- FUNCTION: get_today_summary
-- Gets today's attendance summary
-- ========================================
CREATE OR REPLACE FUNCTION get_today_summary()
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_result JSON;
    v_today DATE := CURRENT_DATE;
BEGIN
    SELECT jsonb_build_object(
        'total_count', COUNT(DISTINCT w.id),
        'present_count', COUNT(DISTINCT CASE WHEN a.status = 'present' THEN a.worker_id END),
        'absent_count', COUNT(DISTINCT CASE WHEN a.status = 'absent' THEN a.worker_id END),
        'halfday_count', COUNT(DISTINCT CASE WHEN a.status = 'half-day' THEN a.worker_id END),
        'total_wages', COALESCE(SUM(a.wage_amount), 0),
        'total_payments', COALESCE(SUM(a.payment_amount), 0)
    )
    INTO v_result
    FROM 
        workers w
    LEFT JOIN 
        attendance a ON w.id = a.worker_id AND a.work_date = v_today
    WHERE 
        w.active = true 
        AND w.owner_id = auth.uid();
    
    RETURN v_result;
END;
$$;

-- ========================================
-- FUNCTION: get_monthly_attendance
-- Gets attendance for a specific month
-- ========================================
CREATE OR REPLACE FUNCTION get_monthly_attendance(
    p_worker_id UUID,
    p_year INT,
    p_month INT
)
RETURNS TABLE(
    work_date DATE,
    status TEXT,
    wage_amount DECIMAL
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        a.work_date,
        a.status,
        a.wage_amount
    FROM 
        attendance a
    WHERE 
        a.worker_id = p_worker_id
        AND EXTRACT(YEAR FROM a.work_date) = p_year
        AND EXTRACT(MONTH FROM a.work_date) = p_month
        AND a.owner_id = auth.uid()
    ORDER BY 
        a.work_date;
END;
$$;

-- ========================================
-- ADDITIONAL INDEXES FOR PERFORMANCE
-- ========================================
CREATE INDEX IF NOT EXISTS idx_attendance_owner_workdate 
    ON attendance(owner_id, work_date);
CREATE INDEX IF NOT EXISTS idx_transactions_owner_date 
    ON worker_transactions(owner_id, transaction_date);
CREATE INDEX IF NOT EXISTS idx_workers_owner_active 
    ON workers(owner_id, active);