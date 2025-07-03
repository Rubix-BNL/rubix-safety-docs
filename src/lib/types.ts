export interface Artikel {
  id: string;
  naam: string;
  omschrijving?: string;
  leverancier?: string;
  artikelnummer?: string;
  ean_code?: string;
  referentie_nummer?: string;
  created_at: string;
  updated_at: string;
}

export interface Veiligheidsblad {
  id: string;
  artikel_id: string;
  taal: "NL" | "EN" | "DE" | "FR";
  versie: string;
  bestand_url: string;
  bestand_naam: string;
  upload_datum: string;
  is_latest: boolean;
  created_at: string;
  updated_at: string;
}

export type Taal = "NL" | "EN" | "DE" | "FR";

export const TALEN: { code: Taal; naam: string }[] = [
  { code: "NL", naam: "Nederlands" },
  { code: "EN", naam: "English" },
  { code: "DE", naam: "Deutsch" },
  { code: "FR", naam: "Français" },
];
