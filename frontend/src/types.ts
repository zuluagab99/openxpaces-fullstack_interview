export interface Deal {
  id: string;
  tenant_name: string;
  street: string;
  city: string;
  state: string;
  zip: string | null;
  size_sqft: number;
  rent_psf: number;
  lease_type: "NNN" | "GROSS" | "MODIFIED" | "UNKNOWN";
  lease_start_date: string;
  lease_term_months: number | null;
  data_source: string | null;
  created_at: string;
}

export interface DealsListResponse {
  total: number;
  page: number;
  page_size: number;
  results: Deal[];
}

export interface ImportError {
  index: number;
  field: string;
  raw: string;
  reason: string;
}

export interface ImportResult {
  imported: number;
  skipped: number;
  errors: ImportError[];
}

export interface MarketSummary {
  city: string;
  state: string;
  deal_count: number;
  avg_rent_psf: number;
  median_rent_psf: number;
  lease_type_breakdown: Record<string, number>;
}

export interface DealFilters {
  city: string;
  state: string;
  lease_type: string;
  sqft_min: string;
  sqft_max: string;
  rent_min: string;
  rent_max: string;
  search: string;
}
