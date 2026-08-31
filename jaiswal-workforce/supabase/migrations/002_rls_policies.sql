-- ========================================
-- 002_rls_policies.sql
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
-- SELECT: Users can only see their own workers
CREATE POLICY "Users can view own workers" 
    ON workers 
    FOR SELECT 
    USING (auth.uid() = owner_id);

-- INSERT: Users can only insert workers with their own owner_id
CREATE POLICY "Users can insert own workers" 
    ON workers 
    FOR INSERT 
    WITH CHECK (auth.uid() = owner_id);

-- UPDATE: Users can only update their own workers
CREATE POLICY "Users can update own workers" 
    ON workers 
    FOR UPDATE 
    USING (auth.uid() = owner_id);

-- DELETE: Users can only delete their own workers
CREATE POLICY "Users can delete own workers" 
    ON workers 
    FOR DELETE 
    USING (auth.uid() = owner_id);

-- ========================================
-- ATTENDANCE POLICIES
-- ========================================
CREATE POLICY "Users can view own attendance" 
    ON attendance 
    FOR SELECT 
    USING (auth.uid() = owner_id);

CREATE POLICY "Users can insert own attendance" 
    ON attendance 
    FOR INSERT 
    WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Users can update own attendance" 
    ON attendance 
    FOR UPDATE 
    USING (auth.uid() = owner_id);

CREATE POLICY "Users can delete own attendance" 
    ON attendance 
    FOR DELETE 
    USING (auth.uid() = owner_id);

-- ========================================
-- WORKER TRANSACTIONS POLICIES
-- ========================================
CREATE POLICY "Users can view own transactions" 
    ON worker_transactions 
    FOR SELECT 
    USING (auth.uid() = owner_id);

CREATE POLICY "Users can insert own transactions" 
    ON worker_transactions 
    FOR INSERT 
    WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Users can update own transactions" 
    ON worker_transactions 
    FOR UPDATE 
    USING (auth.uid() = owner_id);

CREATE POLICY "Users can delete own transactions" 
    ON worker_transactions 
    FOR DELETE 
    USING (auth.uid() = owner_id);

-- ========================================
-- AUDIT LOG POLICIES
-- ========================================
CREATE POLICY "Users can view own audit logs" 
    ON audit_log 
    FOR SELECT 
    USING (auth.uid() = owner_id);

CREATE POLICY "Users can insert own audit logs" 
    ON audit_log 
    FOR INSERT 
    WITH CHECK (auth.uid() = owner_id);