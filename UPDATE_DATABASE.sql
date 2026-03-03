-- ATUALIZAÇÃO DA TABELA DE TRANSAÇÕES RESIDENCIAIS
-- Execute este script no SQL Editor do Supabase para adicionar os novos campos

ALTER TABLE home_transactions 
ADD COLUMN IF NOT EXISTS sub_category TEXT,
ADD COLUMN IF NOT EXISTS competency_date DATE,
ADD COLUMN IF NOT EXISTS bank TEXT,
ADD COLUMN IF NOT EXISTS payment_date DATE;

-- Recriar a tabela completa (Opcional, caso queira limpar tudo e começar com a estrutura nova)
/*
DROP TABLE IF EXISTS home_transactions;
CREATE TABLE home_transactions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    title TEXT NOT NULL,
    category TEXT NOT NULL,
    sub_category TEXT,
    amount DECIMAL(12,2) NOT NULL,
    type TEXT CHECK (type IN ('payable', 'receivable')) NOT NULL,
    date DATE NOT NULL,
    competency_date DATE,
    bank TEXT,
    payment_date DATE,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'completed')),
    notes TEXT
);

ALTER TABLE home_transactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Acesso público total para home_transactions" ON home_transactions FOR ALL USING (true) WITH CHECK (true);
*/
