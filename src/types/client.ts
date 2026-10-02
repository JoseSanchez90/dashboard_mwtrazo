export type Client = {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  document_type: string | null;
  document_number: string | null;
  company: string | null;
  address: string | null;
  district: string | null;
  city: string | null;
  notes: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
};

export const CLIENT_DOCUMENT_TYPES = [
  { value: "DNI", label: "DNI" },
  { value: "RUC", label: "RUC" },
  { value: "CE", label: "Carné de Extranjería (CE)" },
  { value: "CPP", label: "Carné de Permiso Temporal (CPP)" },
  { value: "Pasaporte", label: "Pasaporte" },
] as const;

