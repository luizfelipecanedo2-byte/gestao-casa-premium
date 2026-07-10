import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://wbbzeaydeyhpbugomxra.supabase.co';
const supabaseKey = 'sb_publishable__zle9WhSPyzY8s5v2lV3Xg_xacH2h8L';

const supabase = createClient(supabaseUrl, supabaseKey);

async function listTransactions() {
  try {
    const { data, error } = await supabase
      .from('home_transactions')
      .select('id, title, date, competency_date, payment_date, amount, type')
      .order('date', { ascending: false });

    if (error) {
      console.error('Error fetching transactions:', error);
    } else {
      console.log(`Found ${data.length} transactions:`);
      data.slice(0, 20).forEach(t => {
        console.log(`- [${t.type}] Date: ${t.date} | Competency: ${t.competency_date} | Payment: ${t.payment_date} | Title: "${t.title}" | Amount: ${t.amount}`);
      });
      if (data.length > 20) {
        console.log(`... and ${data.length - 20} more`);
      }
    }
    process.exit(0);
  } catch (err) {
    console.error('Unexpected error:', err);
    process.exit(1);
  }
}

listTransactions();
