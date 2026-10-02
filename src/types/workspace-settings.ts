export type WorkspaceSettings = {
  id: number;
  studio_name: string;
  logo_path: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
  city: string;
  country: string;
  updated_by: string | null;
  created_at: string;
  updated_at: string;
};

export type StudioBranding = {
  studioName: string;
  logoUrl: string | null;
};
