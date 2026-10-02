import { createClient } from "@supabase/supabase-js";

const required = [
  "SUPABASE_URL",
  "SUPABASE_SECRET_KEY",
  "MWTRAZO_ADMIN_EMAIL",
  "MWTRAZO_ADMIN_PASSWORD",
  "MWTRAZO_ASSISTANT_EMAIL",
  "MWTRAZO_ASSISTANT_PASSWORD",
];

const missing = required.filter((name) => !process.env[name]);
if (missing.length > 0) {
  throw new Error(`Faltan variables requeridas: ${missing.join(", ")}`);
}

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SECRET_KEY,
  { auth: { autoRefreshToken: false, persistSession: false, detectSessionInUrl: false } },
);

const initialUsers = [
  {
    email: process.env.MWTRAZO_ADMIN_EMAIL,
    password: process.env.MWTRAZO_ADMIN_PASSWORD,
    fullName: "Alexis Wilfredo Trujillo Caro",
    role: "admin",
  },
  {
    email: process.env.MWTRAZO_ASSISTANT_EMAIL,
    password: process.env.MWTRAZO_ASSISTANT_PASSWORD,
    fullName: "Eusebia Florentina Meza",
    role: "assistant",
  },
];

const { data: existing, error: listError } = await supabase.auth.admin.listUsers({
  page: 1,
  perPage: 1000,
});
if (listError) throw listError;

for (const seed of initialUsers) {
  let user = existing.users.find(
    (candidate) => candidate.email?.toLowerCase() === seed.email.toLowerCase(),
  );

  if (!user) {
    const { data, error } = await supabase.auth.admin.createUser({
      email: seed.email,
      password: seed.password,
      email_confirm: true,
      user_metadata: { full_name: seed.fullName },
    });
    if (error || !data.user) throw error ?? new Error(`No se pudo crear ${seed.email}`);
    user = data.user;
  }

  const { error: profileError } = await supabase.from("profiles").upsert({
    id: user.id,
    full_name: seed.fullName,
    role: seed.role,
    is_active: true,
  });
  if (profileError) throw profileError;

  console.log(`Usuario preparado: ${seed.email} (${seed.role})`);
}

