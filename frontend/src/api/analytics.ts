import { MarketSummary } from "../types";

const BASE = "";

export async function fetchMarketSummary(
  city: string,
  state: string,
  sqft_min?: string,
  sqft_max?: string
): Promise<MarketSummary> {
  const params = new URLSearchParams({ city, state });
  if (sqft_min) params.set("sqft_min", sqft_min);
  if (sqft_max) params.set("sqft_max", sqft_max);
  const res = await fetch(`${BASE}/analytics/market-summary?${params}`);
  if (!res.ok) throw new Error(`No data found for ${city}, ${state}`);
  return res.json();
}
