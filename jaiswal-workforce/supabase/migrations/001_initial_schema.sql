-- ========================================
-- 001_initial_schema.sql
-- Creates all tables for Jaiswal Workforce Management
-- ========================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ========================================
-- WORKERS TABLE
-- ========================================
CREATE TABLE IF NOT EXISTS workers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    owner_id UUID NOT NULL,
    name TEXT NOT NULL,
    role TEXT DEFAULT 'Worker',
    daily_rate DECIMAL(10,2) DEFAULT 0,
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ========================================
-- ATTENDANCE TABLE
-- ========================================
CREATE TABLE IF NOT EXISTS attendance (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    owner_id UUID NOT NULL,
    worker_id UUID NOT NULL REFERENCES workers(id) ON DELETE CASCADE,
    work_date DATE NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('present', 'absent', 'half-day')),
    wage_amount DECIMAL(10,2) DEFAULT 0,
    payment_amount DECIMAL(10,2) DEFAULT 0,
    rate_snapshot DECIMAL(10,2) DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(worker_id, work_date)
);

-- ========================================
-- WORKER TRANSACTIONS TABLE (Financial Ledger)
-- ========================================
CREATE TABLE IF NOT EXISTS worker_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    owner_id UUID NOT NULL,
    worker_id UUID NOT NULL REFERENCES workers(id) ON DELETE CASCADE,
    transaction_type TEXT NOT NULL CHECK (transaction_type IN ('wage', 'advance', 'payment', 'adjustment')),
    amount DECIMAL(10,2) NOT NULL,
    description TEXT,
    reference_id UUID, -- Can reference attendance.id or other transaction ids
    transaction_date TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ========================================
-- AUDIT LOG TABLE
-- ========================================
CREATE TABLE IF NOT EXISTS audit_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    owner_id UUID NOT NULL,
    table_name TEXT NOT NULL,
    record_id UUID NOT NULL,
    action TEXT NOT NULL CHECK (action IN ('INSERT', 'UPDATE', 'DELETE')),
    old_data JSONB,
    new_data JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_workers_owner_id ON workers(owner_id);
CREATE INDEX idx_attendance_owner_id ON attendance(owner_id);
CREATE INDEX idx_attendance_worker_id ON attendance(worker_id);
CREATE INDEX idx_attendance_work_date ON attendance(work_date);
CREATE INDEX idx_transactions_owner_id ON worker_transactions(owner_id);
CREATE INDEX idx_transactions_worker_id ON worker_transactions(worker_id);
CREATE INDEX idx_audit_owner_id ON audit_log(owner_id);

-- Add comments for documentation
COMMENT ON TABLE workers IS 'Stores worker information';
COMMENT ON TABLE attendance IS 'Daily attendance records with wages';
COMMENT ON TABLE worker_transactions IS 'Financial transactions ledger';
COMMENT ON TABLE audit_log IS 'System audit trail for all changes';