-- TABELA DE INVESTIMENTOS MENSAIS E CONTROLE DE RENDIMENTOS
-- Execute este script no SQL Editor do Supabase se desejar criar a tabela na nuvem

CREATE TABLE IF NOT EXISTS home_investments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    date DATE NOT NULL,
    month_ref TEXT NOT NULL,
    wallet_name TEXT NOT NULL DEFAULT 'Reserva Mensal (R$ 300)',
    previous_balance DECIMAL(12,2) NOT NULL DEFAULT 0,
    checked_balance DECIMAL(12,2) NOT NULL DEFAULT 0,
    balance_timing TEXT DEFAULT 'before_deposit' CHECK (balance_timing IN ('before_deposit', 'after_deposit')),
    deposit_amount DECIMAL(12,2) NOT NULL DEFAULT 300,
    yield_amount DECIMAL(12,2) NOT NULL DEFAULT 0,
    yield_percentage DECIMAL(8,4) NOT NULL DEFAULT 0,
    final_balance DECIMAL(12,2) NOT NULL DEFAULT 0,
    notes TEXT
);

-- Habilitar RLS (Row Level Security)
ALTER TABLE home_investments ENABLE ROW LEVEL SECURITY;

-- Política de Acesso Total
CREATE POLICY "Acesso público total para home_investments"
ON home_investments FOR ALL
USING (true)
WITH CHECK (true);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_home_investments_date ON home_investments(date);
CREATE INDEX IF NOT EXISTS idx_home_investments_month ON home_investments(month_ref);
