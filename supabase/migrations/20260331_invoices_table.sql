-- ═══════════════════════════════════════════════════════════════
-- Migration: Monthly Invoice Tracking System
-- Date: 2026-03-31
-- Description: Creates the invoices table for granular billing
--              month tracking and adds billing_month_reference
--              to the payments table for allocation traceability.
-- ═══════════════════════════════════════════════════════════════

-- 1. Create the invoices table
CREATE TABLE IF NOT EXISTS invoices (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  billing_month TEXT NOT NULL,           -- e.g. 'April 2026'
  amount_due DECIMAL(10, 2) NOT NULL DEFAULT 0,
  amount_paid DECIMAL(10, 2) NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'unpaid' CHECK (status IN ('unpaid', 'partial', 'paid')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Add indexes for fast lookups
CREATE INDEX IF NOT EXISTS idx_invoices_customer_id ON invoices(customer_id);
CREATE INDEX IF NOT EXISTS idx_invoices_status ON invoices(status);
CREATE INDEX IF NOT EXISTS idx_invoices_billing_month ON invoices(billing_month);

-- 3. Unique constraint: one invoice per customer per billing month
CREATE UNIQUE INDEX IF NOT EXISTS idx_invoices_customer_month 
  ON invoices(customer_id, billing_month);

-- 4. Add billing_month_reference column to the payments table
ALTER TABLE payments 
  ADD COLUMN IF NOT EXISTS billing_month_reference TEXT;

-- 5. Enable Row Level Security (match existing table patterns)
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;

-- 6. Allow service role full access (matches existing pattern)
CREATE POLICY "Service role full access on invoices"
  ON invoices FOR ALL
  USING (true)
  WITH CHECK (true);
