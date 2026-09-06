-- ========================================
-- 005_documents.sql
-- Adds document management features
-- ========================================

-- ========================================
-- WORKER DOCUMENTS TABLE
-- ========================================
CREATE TABLE IF NOT EXISTS worker_documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    owner_id UUID NOT NULL,
    worker_id UUID NOT NULL REFERENCES workers(id) ON DELETE CASCADE,
    document_type TEXT NOT NULL CHECK (document_type IN ('aadhar', 'pan', 'bank', 'photo', 'other')),
    file_name TEXT NOT NULL,
    file_url TEXT NOT NULL,
    file_size INTEGER,
    mime_type TEXT,
    description TEXT,
    uploaded_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ========================================
-- SCHEDULED PAYMENTS TABLE
-- ========================================
CREATE TABLE IF NOT EXISTS scheduled_payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    owner_id UUID NOT NULL,
    worker_id UUID NOT NULL REFERENCES workers(id) ON DELETE CASCADE,
    amount DECIMAL(10,2) NOT NULL,
    payment_date DATE NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'cancelled')),
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    paid_at TIMESTAMPTZ
);

-- ========================================
-- INDEXES
-- ========================================
CREATE INDEX IF NOT EXISTS idx_documents_owner_id ON worker_documents(owner_id);
CREATE INDEX IF NOT EXISTS idx_documents_worker_id ON worker_documents(worker_id);
CREATE INDEX IF NOT EXISTS idx_scheduled_payments_owner_id ON scheduled_payments(owner_id);
CREATE INDEX IF NOT EXISTS idx_scheduled_payments_worker_id ON scheduled_payments(worker_id);
CREATE INDEX IF NOT EXISTS idx_scheduled_payments_date ON scheduled_payments(payment_date);

-- ========================================
-- RLS POLICIES
-- ========================================
ALTER TABLE worker_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE scheduled_payments ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
    -- Documents policies
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can view own documents' AND tablename = 'worker_documents') THEN
        CREATE POLICY "Users can view own documents" ON worker_documents FOR SELECT USING (auth.uid() = owner_id);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can insert own documents' AND tablename = 'worker_documents') THEN
        CREATE POLICY "Users can insert own documents" ON worker_documents FOR INSERT WITH CHECK (auth.uid() = owner_id);
    END IF;
    
    -- Scheduled payments policies
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can view own scheduled payments' AND tablename = 'scheduled_payments') THEN
        CREATE POLICY "Users can view own scheduled payments" ON scheduled_payments FOR SELECT USING (auth.uid() = owner_id);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can insert own scheduled payments' AND tablename = 'scheduled_payments') THEN
        CREATE POLICY "Users can insert own scheduled payments" ON scheduled_payments FOR INSERT WITH CHECK (auth.uid() = owner_id);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can update own scheduled payments' AND tablename = 'scheduled_payments') THEN
        CREATE POLICY "Users can update own scheduled payments" ON scheduled_payments FOR UPDATE USING (auth.uid() = owner_id);
    END IF;
END $$;