
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://wbbzeaydeyhpbugomxra.supabase.co';
const supabaseKey = 'sb_publishable__zle9WhSPyzY8s5v2lV3Xg_xacH2h8L';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testConnection() {
    try {
        console.log('Testing connection to Supabase...');
        const { data, error } = await supabase
            .from('home_transactions')
            .select('*')
            .limit(1);

        if (error) {
            console.error('Error connecting to Supabase:', error.message);
            process.exit(1);
        } else {
            console.log('Successfully connected to Supabase!');
            console.log('Data:', JSON.stringify(data, null, 2));
            process.exit(0);
        }
    } catch (err) {
        console.error('Unexpected error:', err);
        process.exit(1);
    }
}

testConnection();
