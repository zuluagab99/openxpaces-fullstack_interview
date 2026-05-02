import { DealsListResponse, ImportResult } from "../types";

const BASE = "";

export async function importDeals(records: unknown[]): Promise<ImportResult> {
  const res = await fetch(`${BASE}/deals/import`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(records),
  });
  if (!res.ok) throw new Error(`Import failed: ${res.statusText}`);
  return res.json();
}

export async function fetchDeals(params: Record<string, string>): Promise<DealsListResponse> {
  const qs = new URLSearchParams(
    Object.fromEntries(Object.entries(params).filter(([, v]) => v !== ""))
  ).toString();
  const res = await fetch(`${BASE}/deals${qs ? "?" + qs : ""}`);
  if (!res.ok) throw new Error(`Failed to fetch deals: ${res.statusText}`);
  return res.json();
}
