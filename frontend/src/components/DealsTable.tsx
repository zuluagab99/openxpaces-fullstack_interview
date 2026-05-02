import { Deal } from "../types";

interface Props {
  deals: Deal[];
  total: number;
  page: number;
  pageSize: number;
  sortBy: string;
  sortDir: string;
  onSort: (col: string) => void;
  onPage: (p: number) => void;
}

const BADGE: Record<string, string> = {
  NNN: "badge badge-nnn",
  GROSS: "badge badge-gross",
  MODIFIED: "badge badge-modified",
  UNKNOWN: "badge badge-unknown",
};

function SortIcon({ col, sortBy, sortDir }: { col: string; sortBy: string; sortDir: string }) {
  if (sortBy !== col) return <span style={{ color: "#ced4da" }}> ↕</span>;
  return <span style={{ color: "#1971c2" }}> {sortDir === "asc" ? "↑" : "↓"}</span>;
}

export default function DealsTable({ deals, total, page, pageSize, sortBy, sortDir, onSort, onPage }: Props) {
  const totalPages = Math.ceil(total / pageSize);

  const cols: { key: string; label: string; sortable?: boolean }[] = [
    { key: "tenant_name",      label: "Tenant" },
    { key: "address",          label: "Address" },
    { key: "size_sqft",        label: "Sqft",       sortable: true },
    { key: "rent_psf",         label: "Rent $/SF",  sortable: true },
    { key: "lease_type",       label: "Type" },
    { key: "lease_start_date", label: "Start" },
    { key: "data_source",      label: "Source" },
  ];

  if (deals.length === 0) {
    return <div className="card muted">No deals match your filters.</div>;
  }

  return (
    <div className="card" style={{ overflowX: "auto" }}>
      <div className="muted" style={{ marginBottom: 10 }}>
        {total} deal{total !== 1 ? "s" : ""} found
      </div>
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
        <thead>
          <tr style={{ borderBottom: "2px solid #e9ecef" }}>
            {cols.map(c => (
              <th
                key={c.key}
                style={{ textAlign: "left", padding: "6px 10px", fontWeight: 500, color: "#495057", whiteSpace: "nowrap", cursor: c.sortable ? "pointer" : "default" }}
                onClick={() => c.sortable && onSort(c.key)}
              >
                {c.label}
                {c.sortable && <SortIcon col={c.key} sortBy={sortBy} sortDir={sortDir} />}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {deals.map(d => (
            <tr key={d.id} style={{ borderBottom: "1px solid #f1f3f5" }}>
              <td style={{ padding: "8px 10px", fontWeight: 500 }}>{d.tenant_name}</td>
              <td style={{ padding: "8px 10px", color: "#495057" }}>{d.street}, {d.city}, {d.state}</td>
              <td style={{ padding: "8px 10px" }}>{d.size_sqft.toLocaleString()}</td>
              <td style={{ padding: "8px 10px" }}>${d.rent_psf.toFixed(2)}</td>
              <td style={{ padding: "8px 10px" }}><span className={BADGE[d.lease_type]}>{d.lease_type}</span></td>
              <td style={{ padding: "8px 10px", color: "#495057" }}>{d.lease_start_date}</td>
              <td style={{ padding: "8px 10px", color: "#6c757d" }}>{d.data_source || "—"}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {totalPages > 1 && (
        <div style={{ display: "flex", justifyContent: "center", gap: 8, marginTop: 16 }}>
          <button className="btn" style={{ background: "#f1f3f5", color: "#495057" }} disabled={page === 1} onClick={() => onPage(page - 1)}>← Prev</button>
          <span className="muted" style={{ lineHeight: "34px" }}>Page {page} of {totalPages}</span>
          <button className="btn" style={{ background: "#f1f3f5", color: "#495057" }} disabled={page === totalPages} onClick={() => onPage(page + 1)}>Next →</button>
        </div>
      )}
    </div>
  );
}
