-- TABELA PARA GESTÃO DE GASTOS POR SERVIÇO / PROJETO
CREATE TABLE IF NOT EXISTS service_expenses (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    client_name TEXT NOT NULL,
    environment TEXT NOT NULL,
    service_value DECIMAL(12,2) DEFAULT 0,
    spent_value DECIMAL(12,2) DEFAULT 0,
    items JSONB DEFAULT '[]'::jsonb, -- Armazena a lista de materiais [{description, unit, quantity, unitValue, totalValue}]
    status TEXT DEFAULT 'active'
);

-- Habilitar RLS (Segurança)
ALTER TABLE service_expenses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Acesso público total para service_expenses" ON service_expenses FOR ALL USING (true) WITH CHECK (true);
