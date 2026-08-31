-- ========================================
-- 003_financial_ledger.sql
-- Creates functions for financial operations
-- ========================================

-- ========================================
-- FUNCTION: apply_attendance_with_payment
-- Handles attendance with automatic payment recording
-- ========================================
CREATE OR REPLACE FUNCTION apply_attendance_with_payment(
    p_worker_id UUID,
    p_work_date DATE,
    p_status TEXT,
    p_wage_amount DECIMAL,
    p_payment_amount DECIMAL DEFAULT 0
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_owner_id UUID;
    v_attendance_id UUID;
    v_result JSON;
BEGIN
    -- Get the owner_id from the worker
    SELECT owner_id INTO v_owner_id 
    FROM workers 
    WHERE id = p_worker_id;
    
    IF v_owner_id IS NULL THEN
        RAISE EXCEPTION 'Worker not found';
    END IF;
    
    -- Check if the user owns this worker
    IF v_owner_id != auth.uid() THEN
        RAISE EXCEPTION 'Permission denied';
    END IF;
    
    -- Insert or update attendance
    INSERT INTO attendance (
        owner_id,
        worker_id,
        work_date,
        status,
        wage_amount,
        payment_amount,
        rate_snapshot
    ) VALUES (
        v_owner_id,
        p_worker_id,
        p_work_date,
        p_status,
        p_wage_amount,
        p_payment_amount,
        (SELECT daily_rate FROM workers WHERE id = p_worker_id)
    )
    ON CONFLICT (worker_id, work_date) 
    DO UPDATE SET
        status = EXCLUDED.status,
        wage_amount = EXCLUDED.wage_amount,
        payment_amount = EXCLUDED.payment_amount,
        rate_snapshot = EXCLUDED.rate_snapshot,
        updated_at = NOW()
    RETURNING id INTO v_attendance_id;
    
    -- Record transaction for wage
    IF p_wage_amount > 0 THEN
        INSERT INTO worker_transactions (
            owner_id,
            worker_id,
            transaction_type,
            amount,
            description,
            reference_id
        ) VALUES (
            v_owner_id,
            p_worker_id,
            'wage',
            p_wage_amount,
            'Wage for ' || p_work_date,
            v_attendance_id
        );
    END IF;
    
    -- Record transaction for payment
    IF p_payment_amount > 0 THEN
        INSERT INTO worker_transactions (
            owner_id,
            worker_id,
            transaction_type,
            amount,
            description,
            reference_id
        ) VALUES (
            v_owner_id,
            p_worker_id,
            'payment',
            p_payment_amount,
            'Payment for ' || p_work_date,
            v_attendance_id
        );
    END IF;
    
    -- Log the action
    INSERT INTO audit_log (
        owner_id,
        table_name,
        record_id,
        action,
        new_data
    ) VALUES (
        v_owner_id,
        'attendance',
        v_attendance_id,
        'INSERT',
        jsonb_build_object(
            'worker_id', p_worker_id,
            'work_date', p_work_date,
            'status', p_status,
            'wage_amount', p_wage_amount
        )
    );
    
    v_result = jsonb_build_object(
        'success', true,
        'attendance_id', v_attendance_id,
        'message', 'Attendance recorded successfully'
    );
    
    RETURN v_result;
END;
$$;

-- ========================================
-- FUNCTION: issue_advance
-- Issues an advance payment to a worker
-- ========================================
CREATE OR REPLACE FUNCTION issue_advance(
    p_worker_id UUID,
    p_amount DECIMAL,
    p_description TEXT DEFAULT NULL
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_owner_id UUID;
    v_transaction_id UUID;
    v_result JSON;
BEGIN
    -- Get the owner_id from the worker
    SELECT owner_id INTO v_owner_id 
    FROM workers 
    WHERE id = p_worker_id;
    
    IF v_owner_id IS NULL THEN
        RAISE EXCEPTION 'Worker not found';
    END IF;
    
    -- Check if the user owns this worker
    IF v_owner_id != auth.uid() THEN
        RAISE EXCEPTION 'Permission denied';
    END IF;
    
    -- Validate amount
    IF p_amount <= 0 THEN
        RAISE EXCEPTION 'Amount must be greater than 0';
    END IF;
    
    -- Insert transaction
    INSERT INTO worker_transactions (
        owner_id,
        worker_id,
        transaction_type,
        amount,
        description
    ) VALUES (
        v_owner_id,
        p_worker_id,
        'advance',
        p_amount,
        COALESCE(p_description, 'Advance payment')
    )
    RETURNING id INTO v_transaction_id;
    
    -- Log the action
    INSERT INTO audit_log (
        owner_id,
        table_name,
        record_id,
        action,
        new_data
    ) VALUES (
        v_owner_id,
        'worker_transactions',
        v_transaction_id,
        'INSERT',
        jsonb_build_object(
            'worker_id', p_worker_id,
            'amount', p_amount,
            'type', 'advance'
        )
    );
    
    v_result = jsonb_build_object(
        'success', true,
        'transaction_id', v_transaction_id,
        'message', 'Advance issued successfully'
    );
    
    RETURN v_result;
END;
$$;