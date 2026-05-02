import { useState, useEffect, useCallback } from "react";
import { fetchDeals } from "../api/deals";
import FilterPanel from "../components/FilterPanel";
import DealsTable from "../components/DealsTable";
import { Deal, DealFilters } from "../types";

const EMPTY_FILTERS: DealFilters = {
  city: "", state: "", lease_type: "", sqft_min: "", sqft_max: "", rent_min: "", rent_max: "", search: "",
};

export default function DealsExplorer() {
  const [filters, setFilters] = useState<DealFilters>(EMPTY_FILTERS);
  const [page, setPage] = useState(1);
  const [sortBy, setSortBy] = useState("created_at");
  const [sortDir, setSortDir] = useState("desc");
  const [deals, setDeals] = useState<Deal[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const params: Record<string, string> = {
        page: String(page),
        page_size: "25",
        sort_by: sortBy,
        sort_dir: sortDir,
        ...Object.fromEntries(Object.entries(filters).filter(([, v]) => v !== "")),
      };
      const res = await fetchDeals(params);
      setDeals(res.results);
      setTotal(res.total);
    } catch (e) {
      setError(String(e));
    } finally {
      setLoading(false);
    }
  }, [filters, page, sortBy, sortDir]);

  useEffect(() => { load(); }, [load]);

  function handleSort(col: string) {
    if (col === sortBy) setSortDir(d => d === "asc" ? "desc" : "asc");
    else { setSortBy(col); setSortDir("desc"); }
    setPage(1);
  }

  function handleFilterChange(f: DealFilters) {
    setFilters(f);
    setPage(1);
  }

  return (
    <div>
      <h1 style={{ marginBottom: 4 }}>Deals explorer</h1>
      <p className="muted" style={{ marginBottom: 20 }}>Browse, filter, and sort all imported deals.</p>

      <FilterPanel filters={filters} onChange={handleFilterChange} onReset={() => { setFilters(EMPTY_FILTERS); setPage(1); }} />

      {loading && <div className="muted" style={{ padding: 16 }}>Loading…</div>}
      {error   && <div className="error-text" style={{ padding: 16 }}>{error}</div>}
      {!loading && !error && (
        <DealsTable
          deals={deals}
          total={total}
          page={page}
          pageSize={25}
          sortBy={sortBy}
          sortDir={sortDir}
          onSort={handleSort}
          onPage={setPage}
        />
      )}
    </div>
  );
}
