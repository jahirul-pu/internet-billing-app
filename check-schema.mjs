import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

async function getOpenAPI() {
  const res = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/?apikey=${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`);
  const data = await res.json();
  const rc = data.definitions.router_configs;
  console.log(JSON.stringify(rc, null, 2));
}

getOpenAPI();
