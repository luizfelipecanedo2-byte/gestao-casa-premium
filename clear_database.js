import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://wbbzeaydeyhpbugomxra.supabase.co';
const supabaseKey = 'sb_publishable__zle9WhSPyzY8s5v2lV3Xg_xacH2h8L';

const supabase = createClient(supabaseUrl, supabaseKey);

async function clearData() {
  try {
    console.log('Iniciando limpeza do banco de dados...');

    // Deleta todos os registros de home_transactions filtrando id diferente de um uuid nulo/inexistente
    const { error: err1 } = await supabase
      .from('home_transactions')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000');

    if (err1) {
      console.error('Erro ao deletar home_transactions:', err1.message);
    } else {
      console.log('Tabela home_transactions limpa com sucesso!');
    }

    // Deleta todos os registros de service_expenses
    const { error: err2 } = await supabase
      .from('service_expenses')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000');

    if (err2) {
      console.error('Erro ao deletar service_expenses:', err2.message);
    } else {
      console.log('Tabela service_expenses limpa com sucesso!');
    }

    process.exit(0);
  } catch (err) {
    console.error('Erro inesperado:', err);
    process.exit(1);
  }
}

clearData();
