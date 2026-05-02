import { useState, useEffect, useCallback } from "react";
import toast from "react-hot-toast";
import { fetchDeals } from "@/api/deals";
import { Deal, DealFilters } from "@/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Search, X, ArrowUpDown, ArrowUp, ArrowDown, ChevronLeft, ChevronRight, SlidersHorizontal, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";

const EMPTY: DealFilters = { city: "", state: "", lease_type: "", sqft_min: "", sqft_max: "", rent_min: "", rent_max: "", search: "" };

const LEASE_VARIANT: Record<string, "nnn"|"gross"|"modified"|"unknown"> = {
  NNN: "nnn", GROSS: "gross", MODIFIED: "modified", UNKNOWN: "unknown",
};

const ANOMALY_LABELS: Record<string, string> = {
  high_rent: "High rent", low_rent: "Low rent",
  large_space: "Large", long_term: "Long term", short_term: "Short term",
};

function SortIcon({ col, sortBy, sortDir }: { col: string; sortBy: string; sortDir: string }) {
  if (sortBy !== col) return <ArrowUpDown size={12} className="text-muted-foreground/40" />;
  return sortDir === "asc" ? <ArrowUp size={12} className="text-primary" /> : <ArrowDown size={12} className="text-primary" />;
}

function AnomalyBadges({ flags }: { flags: string[] }) {
  if (!flags.length) return null;
  return (
    <div className="flex flex-wrap gap-1 mt-1">
      {flags.map(f => (
        <span key={f} className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-medium bg-orange-500/10 text-orange-600 dark:text-orange-400 border border-orange-500/20">
          <AlertTriangle size={9} />{ANOMALY_LABELS[f] || f}
        </span>
      ))}
    </div>
  );
}

export default function DealsExplorer() {
  const [filters, setFilters]     = useState<DealFilters>(EMPTY);
  const [page, setPage]           = useState(1);
  const [sortBy, setSortBy]       = useState("created_at");
  const [sortDir, setSortDir]     = useState("desc");
  const [deals, setDeals]         = useState<Deal[]>([]);
  const [total, setTotal]         = useState(0);
  const [loading, setLoading]     = useState(false);
  const [showFilters, setShowFilters] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = {
        page: String(page), page_size: "25", sort_by: sortBy, sort_dir: sortDir,
        ...Object.fromEntries(Object.entries(filters).filter(([, v]) => v !== "")),
      };
      const res = await fetchDeals(params);
      setDeals(res.results);
      setTotal(res.total);
    } catch { toast.error("Failed to load deals"); }
    finally { setLoading(false); }
  }, [filters, page, sortBy, sortDir]);

  useEffect(() => { load(); }, [load]);

  function handleSort(col: string) {
    if (col === sortBy) setSortDir(d => d === "asc" ? "desc" : "asc");
    else { setSortBy(col); setSortDir("desc"); }
    setPage(1);
  }

  function setFilter(key: keyof DealFilters) {
    return (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
      setFilters(f => ({ ...f, [key]: e.target.value }));
      setPage(1);
    };
  }

  const totalPages    = Math.ceil(total / 25);
  const activeFilters = Object.values(filters).filter(Boolean).length;

  const cols = [
    { key: "tenant_name",      label: "Tenant",     sortable: false },
    { key: "address",          label: "Address",    sortable: false },
    { key: "size_sqft",        label: "Sqft",       sortable: true  },
    { key: "rent_psf",         label: "Rent $/SF",  sortable: true  },
    { key: "lease_type",       label: "Type",       sortable: false },
    { key: "lease_start_date", label: "Start",      sortable: false },
    { key: "flags",            label: "Flags",      sortable: false },
    { key: "data_source",      label: "Source",     sortable: false },
  ];

  return (
    <div className="p-6 animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold">Deals explorer</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {loading ? "Loading…" : `${total.toLocaleString()} deal${total !== 1 ? "s" : ""} found`}
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={() => setShowFilters(f => !f)} className="gap-2">
          <SlidersHorizontal size={13} />
          Filters
          {activeFilters > 0 && (
            <span className="ml-0.5 bg-primary text-primary-foreground rounded-full w-4 h-4 text-[10px] flex items-center justify-center">{activeFilters}</span>
          )}
        </Button>
      </div>

      {showFilters && (
        <Card className="mb-4 animate-slide-in">
          <CardContent className="pt-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="relative md:col-span-2">
                <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Input placeholder="Search tenant or address…" className="pl-8" value={filters.search} onChange={setFilter("search")} />
              </div>
              <Input placeholder="City" value={filters.city} onChange={setFilter("city")} />
              <Input placeholder="State (e.g. TX)" value={filters.state} onChange={setFilter("state")} />
              <Select value={filters.lease_type} onChange={setFilter("lease_type")}>
                <option value="">All lease types</option>
                {["NNN","GROSS","MODIFIED","UNKNOWN"].map(t => <option key={t} value={t}>{t}</option>)}
              </Select>
              <Input type="number" placeholder="Sqft min" value={filters.sqft_min} onChange={setFilter("sqft_min")} />
              <Input type="number" placeholder="Sqft max" value={filters.sqft_max} onChange={setFilter("sqft_max")} />
              <div className="flex gap-2 items-center">
                <Input type="number" placeholder="Rent min $/SF" value={filters.rent_min} onChange={setFilter("rent_min")} />
                {activeFilters > 0 && (
                  <Button variant="ghost" size="icon" onClick={() => { setFilters(EMPTY); setPage(1); }}>
                    <X size={14} />
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/40">
                {cols.map(c => (
                  <th key={c.key} onClick={() => c.sortable && handleSort(c.key)}
                    className={cn("text-left px-4 py-3 text-xs font-medium text-muted-foreground whitespace-nowrap", c.sortable && "cursor-pointer hover:text-foreground select-none")}>
                    <div className="flex items-center gap-1.5">
                      {c.label}
                      {c.sortable && <SortIcon col={c.key} sortBy={sortBy} sortDir={sortDir} />}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <tr key={i} className="border-b border-border/50">
                    {cols.map(c => <td key={c.key} className="px-4 py-3"><Skeleton className="h-4 w-full" /></td>)}
                  </tr>
                ))
              ) : deals.length === 0 ? (
                <tr><td colSpan={cols.length} className="px-4 py-16 text-center text-muted-foreground text-sm">No deals match your filters.</td></tr>
              ) : (
                deals.map(d => (
                  <tr key={d.id} className="border-b border-border/50 last:border-0 hover:bg-accent/30 transition-colors">
                    <td className="px-4 py-3 font-medium whitespace-nowrap">{d.tenant_name}</td>
                    <td className="px-4 py-3 text-muted-foreground text-xs">{d.street}, {d.city}, {d.state}</td>
                    <td className="px-4 py-3 font-mono-num">{d.size_sqft.toLocaleString()}</td>
                    <td className="px-4 py-3 font-mono-num font-medium">${d.rent_psf.toFixed(2)}</td>
                    <td className="px-4 py-3"><Badge variant={LEASE_VARIANT[d.lease_type] || "unknown"}>{d.lease_type}</Badge></td>
                    <td className="px-4 py-3 text-muted-foreground font-mono-num text-xs">{d.lease_start_date}</td>
                    <td className="px-4 py-3"><AnomalyBadges flags={d.anomaly_flags} /></td>
                    <td className="px-4 py-3 text-muted-foreground text-xs">{d.data_source || "—"}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-border">
            <span className="text-xs text-muted-foreground">Page {page} of {totalPages}</span>
            <div className="flex gap-1">
              <Button variant="outline" size="icon" disabled={page === 1} onClick={() => setPage(p => p - 1)}><ChevronLeft size={14} /></Button>
              <Button variant="outline" size="icon" disabled={page === totalPages} onClick={() => setPage(p => p + 1)}><ChevronRight size={14} /></Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}