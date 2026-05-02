import { useState, useRef, useCallback } from "react";
import toast from "react-hot-toast";
import { Upload, FileJson, X, AlertCircle, CheckCircle2, SkipForward } from "lucide-react";
import { importDeals } from "@/api/deals";
import { ImportResult } from "@/types";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export default function ImportPage() {
  const [raw, setRaw]           = useState("");
  const [result, setResult]     = useState<ImportResult | null>(null);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState("");
  const [dragging, setDragging] = useState(false);
  const fileRef                 = useRef<HTMLInputElement>(null);

  function loadFile(file: File) {
    if (!file.name.endsWith(".json")) {
      toast.error("Please upload a .json file");
      return;
    }
    const reader = new FileReader();
    reader.onload = e => {
      const text = e.target?.result as string;
      setRaw(text);
      setError("");
      setResult(null);
      toast.success(`Loaded ${file.name}`);
    };
    reader.readAsText(file);
  }

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) loadFile(file);
  }, []);

  async function handleImport() {
    setError("");
    setResult(null);
    let parsed: unknown[];
    try {
      parsed = JSON.parse(raw);
      if (!Array.isArray(parsed)) throw new Error("Must be a JSON array");
    } catch {
      setError("Invalid JSON — paste or upload a valid JSON array of deal objects.");
      return;
    }
    setLoading(true);
    const toastId = toast.loading(`Processing ${parsed.length} records…`);
    try {
      const res = await importDeals(parsed);
      setResult(res);
      toast.success(
        `Done — ${res.imported} imported, ${res.skipped} skipped, ${res.errors.length} errors`,
        { id: toastId, duration: 5000 }
      );
    } catch (e) {
      const msg = String(e);
      setError(msg);
      toast.error("Import failed", { id: toastId });
    } finally {
      setLoading(false);
    }
  }

  const lineCount = raw ? raw.split("\n").length : 0;

  return (
    <div className="p-6 max-w-4xl mx-auto animate-fade-in">
      <div className="mb-6">
        <h1 className="text-xl font-semibold">Import deals</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Upload a JSON file or paste raw deal data. Records are normalized, deduplicated, and validated automatically.
        </p>
      </div>

      <div className="grid gap-4">
        {/* Drop zone */}
        <div
          onDragOver={e => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={onDrop}
          onClick={() => fileRef.current?.click()}
          className={cn(
            "border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-all",
            dragging
              ? "border-primary bg-primary/5 scale-[1.01]"
              : "border-border hover:border-primary/50 hover:bg-accent/50"
          )}
        >
          <input ref={fileRef} type="file" accept=".json" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) loadFile(f); }} />
          <div className="flex flex-col items-center gap-2 pointer-events-none">
            <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center transition-colors", dragging ? "bg-primary/10" : "bg-muted")}>
              <FileJson size={22} className={dragging ? "text-primary" : "text-muted-foreground"} />
            </div>
            <div>
              <p className="text-sm font-medium">{dragging ? "Drop to load" : "Drop your JSON file here"}</p>
              <p className="text-xs text-muted-foreground mt-0.5">or click to browse</p>
            </div>
          </div>
        </div>

        {/* Textarea */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Paste JSON</CardTitle>
                <CardDescription className="mt-0.5">Paste the array of raw deal objects directly</CardDescription>
              </div>
              <div className="flex items-center gap-2">
                {raw && (
                  <Badge variant="default" className="font-mono-num">
                    {lineCount} lines
                  </Badge>
                )}
                {raw && (
                  <Button variant="ghost" size="icon" onClick={() => { setRaw(""); setResult(null); setError(""); }}>
                    <X size={14} />
                  </Button>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Textarea
              rows={12}
              placeholder={'[\n  {\n    "tenant": "Acme Corp",\n    "address": "123 Main St, Austin, TX 78701",\n    "size": "10,000",\n    "rent": "$34/SF",\n    "lease_type": "NNN",\n    "start_date": "2024-01-01",\n    "term_months": 60,\n    "source": "broker-email"\n  }\n]'}
              value={raw}
              onChange={e => { setRaw(e.target.value); setError(""); }}
              className="min-h-[200px]"
            />
            {error && (
              <div className="flex items-center gap-2 mt-2 text-destructive text-sm">
                <AlertCircle size={14} />
                {error}
              </div>
            )}
            <div className="flex items-center gap-2 mt-3">
              <Button onClick={handleImport} disabled={loading || !raw.trim()} className="gap-2">
                <Upload size={14} />
                {loading ? "Importing…" : "Import deals"}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Results */}
        {result && (
          <div className="animate-slide-in space-y-4">
            <div className="grid grid-cols-3 gap-3">
              <Card className="border-emerald-500/20 bg-emerald-500/5">
                <CardContent className="pt-5 flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-emerald-500/10 flex items-center justify-center shrink-0">
                    <CheckCircle2 size={18} className="text-emerald-500" />
                  </div>
                  <div>
                    <div className="text-2xl font-semibold font-mono-num">{result.imported}</div>
                    <div className="text-xs text-muted-foreground">Imported</div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-amber-500/20 bg-amber-500/5">
                <CardContent className="pt-5 flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-amber-500/10 flex items-center justify-center shrink-0">
                    <SkipForward size={18} className="text-amber-500" />
                  </div>
                  <div>
                    <div className="text-2xl font-semibold font-mono-num">{result.skipped}</div>
                    <div className="text-xs text-muted-foreground">Skipped (dupes)</div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-red-500/20 bg-red-500/5">
                <CardContent className="pt-5 flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-red-500/10 flex items-center justify-center shrink-0">
                    <AlertCircle size={18} className="text-red-500" />
                  </div>
                  <div>
                    <div className="text-2xl font-semibold font-mono-num">{result.errors.length}</div>
                    <div className="text-xs text-muted-foreground">Errors</div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {result.errors.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Row errors</CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border">
                        {["Row", "Field", "Raw value", "Reason"].map(h => (
                          <th key={h} className="text-left py-2 px-3 text-xs font-medium text-muted-foreground">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {result.errors.map((e, i) => (
                        <tr key={i} className="border-b border-border/50 last:border-0 hover:bg-accent/30 transition-colors">
                          <td className="py-2 px-3 font-mono-num text-xs">{e.index}</td>
                          <td className="py-2 px-3 font-mono text-xs text-primary">{e.field}</td>
                          <td className="py-2 px-3 font-mono text-xs text-destructive">{e.raw || <span className="italic text-muted-foreground">empty</span>}</td>
                          <td className="py-2 px-3 text-xs text-muted-foreground">{e.reason}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
