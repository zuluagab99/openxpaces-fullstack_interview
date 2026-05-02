import { DealFilters } from "../types";

interface Props {
  filters: DealFilters;
  onChange: (f: DealFilters) => void;
  onReset: () => void;
}

const LEASE_TYPES = ["", "NNN", "GROSS", "MODIFIED", "UNKNOWN"];

export default function FilterPanel({ filters, onChange, onReset }: Props) {
  const set = (key: keyof DealFilters) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    onChange({ ...filters, [key]: e.target.value });

  return (
    <div className="card">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
        <h2 style={{ margin: 0 }}>Filters</h2>
        <button className="btn" style={{ padding: "4px 10px", fontSize: 12, background: "#f1f3f5", color: "#495057" }} onClick={onReset}>Reset</button>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: 10 }}>
        <div>
          <label className="muted">Search</label>
          <input placeholder="Tenant or address" value={filters.search} onChange={set("search")} style={{ marginTop: 4 }} />
        </div>
        <div>
          <label className="muted">City</label>
          <input placeholder="e.g. Austin" value={filters.city} onChange={set("city")} style={{ marginTop: 4 }} />
        </div>
        <div>
          <label className="muted">State</label>
          <input placeholder="e.g. TX" value={filters.state} onChange={set("state")} style={{ marginTop: 4 }} />
        </div>
        <div>
          <label className="muted">Lease type</label>
          <select value={filters.lease_type} onChange={set("lease_type")} style={{ marginTop: 4 }}>
            {LEASE_TYPES.map(t => <option key={t} value={t}>{t || "All"}</option>)}
          </select>
        </div>
        <div>
          <label className="muted">Sqft min</label>
          <input type="number" placeholder="0" value={filters.sqft_min} onChange={set("sqft_min")} style={{ marginTop: 4 }} />
        </div>
        <div>
          <label className="muted">Sqft max</label>
          <input type="number" placeholder="∞" value={filters.sqft_max} onChange={set("sqft_max")} style={{ marginTop: 4 }} />
        </div>
        <div>
          <label className="muted">Rent min ($/SF)</label>
          <input type="number" placeholder="0" value={filters.rent_min} onChange={set("rent_min")} style={{ marginTop: 4 }} />
        </div>
        <div>
          <label className="muted">Rent max ($/SF)</label>
          <input type="number" placeholder="∞" value={filters.rent_max} onChange={set("rent_max")} style={{ marginTop: 4 }} />
        </div>
      </div>
    </div>
  );
}
