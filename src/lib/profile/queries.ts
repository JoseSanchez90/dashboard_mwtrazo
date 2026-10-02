import "server-only";

import { cache } from "react";

import { createClient } from "@/lib/supabase/server";

export const getAvatarSignedUrl = cache(async (path: string | null) => {
  if (!path) return null;

  const supabase = await createClient();
  const { data, error } = await supabase.storage
    .from("avatars")
    .createSignedUrl(path, 300);

  return error ? null : data.signedUrl;
});
