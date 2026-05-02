import { DealsListResponse, ImportResult } from "../types";

const API_KEY = import.meta.env.VITE_API_KEY || "dev-secret-key-123";

const headers = () => ({
  "Content-Type": "application/json",
  "X-API-Key": API_KEY,
});

// POST /deals/import — returns job_id immediately (202)
export async function importDeals(records: unknown[]): Promise<{ job_id: string }> {
  const res = await fetch("/deals/import", {
    method: "POST",
    headers: headers(),
    body: JSON.stringify(records),
  });
  if (!res.ok) throw new Error(`Import failed: ${res.statusText}`);
  return res.json();
}

// GET /deals/import/status/:job_id — poll until done
export async function getImportStatus(jobId: string): Promise<{
  job_id: string;
  status: string;
  result: ImportResult | null;
  error: string | null;
}> {
  const res = await fetch(`/deals/import/status/${jobId}`, { headers: headers() });
  if (!res.ok) throw new Error(`Status check failed: ${res.statusText}`);
  return res.json();
}

// GET /deals
export async function fetchDeals(params: Record<string, string>): Promise<DealsListResponse> {
  const qs = new URLSearchParams(
    Object.fromEntries(Object.entries(params).filter(([, v]) => v !== ""))
  ).toString();
  const res = await fetch(`/deals${qs ? "?" + qs : ""}`, { headers: headers() });
  if (!res.ok) throw new Error(`Failed to fetch deals: ${res.statusText}`);
  return res.json();
}