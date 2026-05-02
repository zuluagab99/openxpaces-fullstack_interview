import { useState } from "react";
import toast from "react-hot-toast";
import { fetchMarketSummary } from "@/api/analytics";
import { MarketSummary as MS } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BarChart3, TrendingUp, Building, MapPin } from "lucide-react";
import { cn } from "@/lib/utils";

const MARKETS = [
  { city: "Miami",         state: "FL" },
  { city: "Austin",        state: "TX" },
  { city: "San Jose",      state: "CA" },
  { city: "Chicago",       state: "IL" },
  { city: "Boulder",       state: "CO" },
  { city: "Santa Monica",  state: "CA" },
  { city: "San Francisco", state: "CA" },
  { city: "Mountain View", state: "CA" },
  { city: "New York",      state: "NY" },
  { city: "Oakland",       state: "CA" },
  { city: "Evanston",      state: "IL" },
];

const LEASE_COLORS: Record<string, string> = {
  NNN:      "bg-emerald-500",
  GROSS:    "bg-blue-500",
  MODIFIED: "bg-amber-500",
  UNKNOWN:  "bg-zinc-500",
};

const LEASE_VARIANT: Record<string, "nnn"|"gross"|"modified"|"unknown"> = {
  NNN: "nnn", GROSS: "gross", MODIFIED: "modified", UNKNOWN: "unknown",
};

function StatTile({ icon: Icon, label, value, sub }: { icon: React.ElementType; label: string; value: string; sub?: string }) {
  return (
    <Card>
      <CardContent className="pt-5">
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
            <Icon size={16} className="text-primary" />
          </div>
          <div>
            <div className="text-2xl font-semibold font-mono-num">{value}</div>
            <div className="text-xs font-medium mt-0.5">{label}</div>
            {sub && <div className="text-xs text-muted-foreground mt-0.5">{sub}</div>}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function MarketSummary() {
  const [city, setCity]     = useState("");
  const [state, setState]   = useState("");
  const [sqftMin, setSqftMin] = useState("");
  const [sqftMax, setSqftMax] = useState("");
  const [summary, setSummary] = useState<MS | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleFetch() {
    if (!city || !state) return;
    setLoading(true);
    const toastId = toast.loading(`Fetching market data for ${city}, ${state}…`);
    try {
      const res = await fetchMarketSummary(city, state, sqftMin, sqftMax);
      setSummary(res);
      toast.success(`Loaded ${res.deal_count} deals for ${city}, ${state}`, { id: toastId });
    } catch {
      toast.error(`No deals found for ${city}, ${state}`, { id: toastId });
      setSummary(null);
    } finally {
      setLoading(false);
    }
  }

  function selectMarket(m: { city: string; state: string }) {
    setCity(m.city);
    setState(m.state);
    setSummary(null);
  }

  const breakdown = summary ? Object.entries(summary.lease_type_breakdown) : [];
  const total     = breakdown.reduce((s, [, v]) => s + v, 0);

  return (
    <div className="p-6 max-w-4xl animate-fade-in">
      <div className="mb-6">
        <h1 className="text-xl font-semibold">Market summary</h1>
        <p className="text-sm text-muted-foreground mt-1">Aggregated deal stats by city and state.</p>
      </div>

      <Card className="mb-4">
        <CardHeader>
          <CardTitle className="text-sm flex items-center gap-2">
            <MapPin size={14} className="text-primary" />
            Select market
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0 space-y-4">
          {/* Quick picks */}
          <div className="flex flex-wrap gap-2">
            {MARKETS.map(m => (
              <button
                key={`${m.city}-${m.state}`}
                onClick={() => selectMarket(m)}
                className={cn(
                  "px-3 py-1.5 rounded-full text-xs font-medium border transition-colors",
                  city === m.city && state === m.state
                    ? "bg-primary/10 border-primary/30 text-primary"
                    : "border-border text-muted-foreground hover:text-foreground hover:border-border/80 hover:bg-accent"
                )}
              >
                {m.city}, {m.state}
              </button>
            ))}
          </div>

          {/* Manual input */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-2 items-end">
            <Input placeholder="City" value={city} onChange={e => setCity(e.target.value)} />
            <Input placeholder="State" value={state} onChange={e => setState(e.target.value)} />
            <Input type="number" placeholder="Sqft min" value={sqftMin} onChange={e => setSqftMin(e.target.value)} />
            <Input type="number" placeholder="Sqft max" value={sqftMax} onChange={e => setSqftMax(e.target.value)} />
            <Button onClick={handleFetch} disabled={loading || !city || !state} className="gap-2">
              <BarChart3 size={14} />
              {loading ? "Loading…" : "Fetch"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {summary && (
        <div className="space-y-4 animate-slide-in">
          <div className="flex items-center gap-2">
            <h2 className="text-base font-semibold">{summary.city}, {summary.state}</h2>
            <Badge variant="default">{summary.deal_count} deals</Badge>
          </div>

          {/* Stat tiles */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <StatTile icon={Building}   label="Total deals"      value={String(summary.deal_count)} />
            <StatTile icon={TrendingUp} label="Avg rent"         value={`$${summary.avg_rent_psf?.toFixed(2)}/SF`} sub="per square foot" />
            <StatTile icon={BarChart3}  label="Median rent"      value={`$${summary.median_rent_psf?.toFixed(2)}/SF`} sub="per square foot" />
          </div>

          {/* Lease breakdown */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Lease type breakdown</CardTitle>
            </CardHeader>
            <CardContent className="pt-0 space-y-3">
              {/* Bar chart */}
              <div className="flex h-2 rounded-full overflow-hidden gap-0.5">
                {breakdown.map(([type, count]) => (
                  <div
                    key={type}
                    className={cn("h-full transition-all", LEASE_COLORS[type] || "bg-zinc-400")}
                    style={{ width: `${(count / total) * 100}%` }}
                    title={`${type}: ${count}`}
                  />
                ))}
              </div>
              {/* Legend */}
              <div className="flex flex-wrap gap-3">
                {breakdown.map(([type, count]) => (
                  <div key={type} className="flex items-center gap-2">
                    <Badge variant={LEASE_VARIANT[type] || "unknown"}>{type}</Badge>
                    <span className="text-sm font-mono-num font-medium">{count}</span>
                    <span className="text-xs text-muted-foreground">({Math.round((count / total) * 100)}%)</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
