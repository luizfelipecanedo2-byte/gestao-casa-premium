-- TABELA DE TRANSAÇÕES RESIDENCIAIS
CREATE TABLE IF NOT EXISTS home_transactions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    title TEXT NOT NULL,
    category TEXT NOT NULL,
    amount DECIMAL(12,2) NOT NULL,
    type TEXT CHECK (type IN ('payable', 'receivable')) NOT NULL,
    date DATE NOT NULL,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'completed')),
    notes TEXT
);

-- Habilitar RLS (Row Level Security)
ALTER TABLE home_transactions ENABLE ROW LEVEL SECURITY;

-- Criar política de acesso público (ajustar conforme necessidade de autenticação futura)
CREATE POLICY "Acesso público total para home_transactions" 
ON home_transactions FOR ALL 
USING (true) 
WITH CHECK (true);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_home_transactions_date ON home_transactions(date);
CREATE INDEX IF NOT EXISTS idx_home_transactions_type ON home_transactions(type);
CREATE INDEX IF NOT EXISTS idx_home_transactions_category ON home_transactions(category);
