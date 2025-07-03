export interface Artikel {
  id: string;
  unieke_id: string;
  naam: string;
  referentie_rubix?: string;
  referentie_fabrikant?: string;
  ean?: string;
  created_at: string;
  updated_at: string;
}

export interface User {
  id: string;
  email: string;
  role?: "admin" | "user";
  created_at: string;
}

export interface AuthState {
  user: User | null;
  loading: boolean;
}

export interface Veiligheidsblad {
  id: string;
  artikel_id: string;
  taal: "NL" | "EN" | "DE" | "FR";
  versie: string;
  bestandsnaam: string;
  storage_path: string;
  geupload_op: string;
}

export type Taal = "NL" | "EN" | "DE" | "FR";

export const TALEN: { code: Taal; naam: string }[] = [
  { code: "NL", naam: "Nederlands" },
  { code: "EN", naam: "English" },
  { code: "DE", naam: "Deutsch" },
  { code: "FR", naam: "Français" },
];
