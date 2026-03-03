
import { createClient } from '@supabase/supabase-js';

// Usando as mesmas credenciais do sistema da empresa para facilitar
const supabaseUrl = 'https://wbbzeaydeyhpbugomxra.supabase.co';
const supabaseKey = 'sb_publishable__zle9WhSPyzY8s5v2lV3Xg_xacH2h8L';

export const supabase = createClient(supabaseUrl, supabaseKey);
