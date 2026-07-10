import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://wbbzeaydeyhpbugomxra.supabase.co';
const supabaseKey = 'sb_publishable__zle9WhSPyzY8s5v2lV3Xg_xacH2h8L';

const supabase = createClient(supabaseUrl, supabaseKey);

async function deleteOldTransactions() {
  try {
    console.log('Buscando transações do mês de julho/2026 para trás...');
    
    // Buscar transações que possuem data <= '2026-07-31'
    const { data: toDelete, error: fetchError } = await supabase
      .from('home_transactions')
      .select('id, title, date, amount, type')
      .lte('date', '2026-07-31');

    if (fetchError) {
      console.error('Erro ao buscar transações para deletar:', fetchError);
      process.exit(1);
    }

    console.log(`Encontradas ${toDelete.length} transações para deletar (data <= 2026-07-31):`);
    toDelete.forEach(t => {
      console.log(`- [${t.type}] Date: ${t.date} | Title: "${t.title}" | Amount: ${t.amount}`);
    });

    if (toDelete.length === 0) {
      console.log('Nenhuma transação encontrada para deletar.');
    } else {
      console.log('\nDeletando transações...');
      const { error: deleteError } = await supabase
        .from('home_transactions')
        .delete()
        .lte('date', '2026-07-31');

      if (deleteError) {
        console.error('Erro ao deletar transações:', deleteError);
        process.exit(1);
      }
      console.log('Transações deletadas com sucesso!');
    }

    // Listar as transações que sobraram (agosto/2026 para frente)
    const { data: remaining, error: remainingError } = await supabase
      .from('home_transactions')
      .select('id, title, date, amount, type')
      .order('date', { ascending: true });

    if (remainingError) {
      console.error('Erro ao buscar transações restantes:', remainingError);
      process.exit(1);
    }

    console.log(`\nTransações restantes no banco (${remaining.length}):`);
    remaining.forEach(t => {
      console.log(`- [${t.type}] Date: ${t.date} | Title: "${t.title}" | Amount: ${t.amount}`);
    });

    process.exit(0);
  } catch (err) {
    console.error('Erro inesperado:', err);
    process.exit(1);
  }
}

deleteOldTransactions();
