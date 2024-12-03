import { createClient as createSupabaseClient } from "@supabase/supabase-js";

export const createClient = async (authorization: string) => {
  const supabase = createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      global: {
        headers: {
          Authorization: `${authorization}`
        }
      }
    },
  )
  return supabase;
};

export const createUserClient = async (authorization: string) => {
  const supabase = createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      global: {
        headers: {
          Authorization: `${authorization}`
        }
      }
    },
  )
  return supabase;
};

export const createSuperClient = async () => {
  const supabase = createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
  )
  return supabase;
};


