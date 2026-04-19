export interface InBodyScan {
  scan_date: string; // ISO date string "YYYY-MM-DD"
  weight_kg: number;
  muscle_mass_kg: number;
  body_fat_percent: number;
  body_fat_mass_kg: number;
  visceral_fat: number; // InBody score 1-20, not a percentage
  raw_pdf_url?: string; // populated after storage upload
  parsed_confidence: "high" | "low";
  flagged_fields?: string[]; // fields that triggered low confidence
}

export interface ParseResult {
  success: boolean;
  data?: InBodyScan;
  error?: string;
  raw_text?: string; // stored for debugging, not shown to user
}
