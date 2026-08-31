-- ========================================
-- 002_rls_policies.sql (Safe Version)
-- Enables Row Level Security and creates policies
-- ========================================

-- ========================================
-- ENABLE RLS ON ALL TABLES
-- ========================================
ALTER TABLE workers ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE worker_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;

-- ========================================
-- WORKERS POLICIES
-- ========================================
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can view own workers' AND tablename = 'workers') THEN
        CREATE POLICY "Users can view own workers" ON workers FOR SELECT USING (auth.uid() = owner_id);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can insert own workers' AND tablename = 'workers') THEN
        CREATE POLICY "Users can insert own workers" ON workers FOR INSERT WITH CHECK (auth.uid() = owner_id);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can update own workers' AND tablename = 'workers') THEN
        CREATE POLICY "Users can update own workers" ON workers FOR UPDATE USING (auth.uid() = owner_id);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can delete own workers' AND tablename = 'workers') THEN
        CREATE POLICY "Users can delete own workers" ON workers FOR DELETE USING (auth.uid() = owner_id);
    END IF;
END $$;

-- ========================================
-- ATTENDANCE POLICIES
-- ========================================
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can view own attendance' AND tablename = 'attendance') THEN
        CREATE POLICY "Users can view own attendance" ON attendance FOR SELECT USING (auth.uid() = owner_id);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can insert own attendance' AND tablename = 'attendance') THEN
        CREATE POLICY "Users can insert own attendance" ON attendance FOR INSERT WITH CHECK (auth.uid() = owner_id);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can update own attendance' AND tablename = 'attendance') THEN
        CREATE POLICY "Users can update own attendance" ON attendance FOR UPDATE USING (auth.uid() = owner_id);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can delete own attendance' AND tablename = 'attendance') THEN
        CREATE POLICY "Users can delete own attendance" ON attendance FOR DELETE USING (auth.uid() = owner_id);
    END IF;
END $$;

-- ========================================
-- WORKER TRANSACTIONS POLICIES
-- ========================================
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can view own transactions' AND tablename = 'worker_transactions') THEN
        CREATE POLICY "Users can view own transactions" ON worker_transactions FOR SELECT USING (auth.uid() = owner_id);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can insert own transactions' AND tablename = 'worker_transactions') THEN
        CREATE POLICY "Users can insert own transactions" ON worker_transactions FOR INSERT WITH CHECK (auth.uid() = owner_id);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can update own transactions' AND tablename = 'worker_transactions') THEN
        CREATE POLICY "Users can update own transactions" ON worker_transactions FOR UPDATE USING (auth.uid() = owner_id);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can delete own transactions' AND tablename = 'worker_transactions') THEN
        CREATE POLICY "Users can delete own transactions" ON worker_transactions FOR DELETE USING (auth.uid() = owner_id);
    END IF;
END $$;

-- ========================================
-- AUDIT LOG POLICIES
-- ========================================
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can view own audit logs' AND tablename = 'audit_log') THEN
        CREATE POLICY "Users can view own audit logs" ON audit_log FOR SELECT USING (auth.uid() = owner_id);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can insert own audit logs' AND tablename = 'audit_log') THEN
        CREATE POLICY "Users can insert own audit logs" ON audit_log FOR INSERT WITH CHECK (auth.uid() = owner_id);
    END IF;
END $$;
