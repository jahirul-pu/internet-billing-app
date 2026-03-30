import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function check() {
  const { data, error } = await supabase.rpc('get_columns', { table_name: 'router_configs' })
    .select('*');

  if (error) {
     // If no easy RPC, I'll just insert a {} and see the error? No, let's just insert something and see:
     const res2 = await supabase.from('router_configs').insert({}).select('*');
     console.log('Insert attempt:', res2);
  } else {
    console.log("Cols:", data);
  }
}
check();
