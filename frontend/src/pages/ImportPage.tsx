import { useState } from "react";
import { importDeals } from "../api/deals";
import ImportResult from "../components/ImportResult";
import { ImportResult as IResult } from "../types";

export default function ImportPage() {
  const [raw, setRaw] = useState("");
  const [result, setResult] = useState<IResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleImport() {
    setError("");
    setResult(null);
    let parsed: unknown[];
    try {
      parsed = JSON.parse(raw);
      if (!Array.isArray(parsed)) throw new Error("Input must be a JSON array");
    } catch (e) {
      setError("Invalid JSON — paste a valid JSON array of deal objects.");
      return;
    }
    setLoading(true);
    try {
      const res = await importDeals(parsed);
      setResult(res);
    } catch (e) {
      setError(String(e));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <h1 style={{ marginBottom: 4 }}>Import deals</h1>
      <p className="muted" style={{ marginBottom: 20 }}>Paste raw JSON deal data below. Records are normalized, deduplicated, and validated on import.</p>

      <div className="card">
        <textarea
          rows={14}
          placeholder={'[\n  { "tenant": "Acme", "address": "...", "rent": "$34/SF", ... }\n]'}
          value={raw}
          onChange={e => setRaw(e.target.value)}
          style={{ fontFamily: "monospace", fontSize: 13, resize: "vertical" }}
        />
        {error && <p className="error-text" style={{ marginTop: 8 }}>{error}</p>}
        <div style={{ marginTop: 12, display: "flex", gap: 10, alignItems: "center" }}>
          <button className="btn btn-primary" onClick={handleImport} disabled={loading || !raw.trim()}>
            {loading ? "Importing…" : "Import"}
          </button>
          {raw && <button className="btn" style={{ background: "#f1f3f5", color: "#495057" }} onClick={() => { setRaw(""); setResult(null); setError(""); }}>Clear</button>}
        </div>
      </div>

      {result && <ImportResult result={result} />}
    </div>
  );
}
