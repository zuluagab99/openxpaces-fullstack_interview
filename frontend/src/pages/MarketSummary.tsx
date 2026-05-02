import { useState } from "react";
import { fetchMarketSummary } from "../api/analytics";
import StatCard from "../components/StatCard";
import { MarketSummary as MS } from "../types";

const MARKETS = [
  { city: "Miami",         state: "FL" },
  { city: "Austin",        state: "TX" },
  { city: "San Jose",      state: "CA" },
  { city: "Chicago",       state: "IL" },
  { city: "Cambridge",     state: "MA" },
  { city: "Boulder",       state: "CO" },
  { city: "Santa Monica",  state: "CA" },
  { city: "San Francisco", state: "CA" },
  { city: "Mountain View", state: "CA" },
  { city: "New York",      state: "NY" },
  { city: "Oakland",       state: "CA" },
  { city: "Evanston",      state: "IL" },
];

const LEASE_COLORS: Record<string, string> = {
  NNN: "#2b8a3e", GROSS: "#1864ab", MODIFIED: "#e67700", UNKNOWN: "#495057",
};

export default function MarketSummary() {
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [sqftMin, setSqftMin] = useState("");
  const [sqftMax, setSqftMax] = useState("");
  const [summary, setSummary] = useState<MS | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  function selectMarket(m: { city: string; state: string }) {
    setCity(m.city);
    setState(m.state);
  }

  async function handleFetch() {
    if (!city || !state) return;
    setLoading(true);
    setError("");
    setSummary(null);
    try {
      const res = await fetchMarketSummary(city, state, sqftMin, sqftMax);
      setSummary(res);
    } catch (e) {
      setError(`No deals found for ${city}, ${state}.`);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <h1 style={{ marginBottom: 4 }}>Market summary</h1>
      <p className="muted" style={{ marginBottom: 20 }}>Select a market to see aggregated deal stats.</p>

      <div className="card">
        <h2>Quick select</h2>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 16 }}>
          {MARKETS.map(m => (
            <button
              key={`${m.city}-${m.state}`}
              className="btn"
              style={{ background: city === m.city && state === m.state ? "#e7f5ff" : "#f1f3f5", color: city === m.city && state === m.state ? "#1864ab" : "#495057", padding: "5px 12px" }}
              onClick={() => selectMarket(m)}
            >
              {m.city}, {m.state}
            </button>
          ))}
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr auto", gap: 10, alignItems: "end" }}>
          <div>
            <label className="muted">City</label>
            <input placeholder="e.g. Austin" value={city} onChange={e => setCity(e.target.value)} style={{ marginTop: 4 }} />
          </div>
          <div>
            <label className="muted">State</label>
            <input placeholder="e.g. TX" value={state} onChange={e => setState(e.target.value)} style={{ marginTop: 4 }} />
          </div>
          <div>
            <label className="muted">Sqft min</label>
            <input type="number" placeholder="optional" value={sqftMin} onChange={e => setSqftMin(e.target.value)} style={{ marginTop: 4 }} />
          </div>
          <div>
            <label className="muted">Sqft max</label>
            <input type="number" placeholder="optional" value={sqftMax} onChange={e => setSqftMax(e.target.value)} style={{ marginTop: 4 }} />
          </div>
          <button className="btn btn-primary" onClick={handleFetch} disabled={loading || !city || !state}>
            {loading ? "Loading…" : "Fetch"}
          </button>
        </div>
      </div>

      {error && <div className="error-text card">{error}</div>}

      {summary && (
        <>
          <h2 style={{ margin: "4px 0 12px" }}>{summary.city}, {summary.state}</h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: 12, marginBottom: 16 }}>
            <StatCard label="Total deals"    value={summary.deal_count} />
            <StatCard label="Avg rent $/SF"  value={`$${summary.avg_rent_psf?.toFixed(2)}`}    color="#1971c2" />
            <StatCard label="Median rent $/SF" value={`$${summary.median_rent_psf?.toFixed(2)}`} color="#1971c2" />
          </div>

          <div className="card">
            <h2>Lease type breakdown</h2>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 12 }}>
              {Object.entries(summary.lease_type_breakdown).map(([type, count]) => (
                <div key={type} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <div style={{ width: 10, height: 10, borderRadius: "50%", background: LEASE_COLORS[type] || "#adb5bd" }} />
                  <span style={{ fontWeight: 500 }}>{type}</span>
                  <span className="muted">{count} deal{count !== 1 ? "s" : ""}</span>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
