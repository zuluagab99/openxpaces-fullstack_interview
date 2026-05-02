import { MarketSummary } from "../types";

const API_KEY = import.meta.env.VITE_API_KEY || "dev-secret-key-123";

const headers = () => ({ "X-API-Key": API_KEY });

export async function fetchMarketSummary(
  city: string, state: string,
  sqft_min?: string, sqft_max?: string
): Promise<MarketSummary & { cached?: boolean }> {
  const params = new URLSearchParams({ city, state });
  if (sqft_min) params.set("sqft_min", sqft_min);
  if (sqft_max) params.set("sqft_max", sqft_max);
  const res = await fetch(`/analytics/market-summary?${params}`, { headers: headers() });
  if (!res.ok) throw new Error(`No data found for ${city}, ${state}`);
  return res.json();
}