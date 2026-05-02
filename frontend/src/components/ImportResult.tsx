import { ImportResult as IResult } from "../types";

interface Props { result: IResult; }

export default function ImportResult({ result }: Props) {
  return (
    <div>
      <div style={{ display: "flex", gap: 12, marginBottom: 16 }}>
        <div className="card" style={{ flex: 1, textAlign: "center", margin: 0 }}>
          <div style={{ fontSize: 28, fontWeight: 600, color: "#2b8a3e" }}>{result.imported}</div>
          <div className="muted">Imported</div>
        </div>
        <div className="card" style={{ flex: 1, textAlign: "center", margin: 0 }}>
          <div style={{ fontSize: 28, fontWeight: 600, color: "#e67700" }}>{result.skipped}</div>
          <div className="muted">Skipped (duplicates)</div>
        </div>
        <div className="card" style={{ flex: 1, textAlign: "center", margin: 0 }}>
          <div style={{ fontSize: 28, fontWeight: 600, color: "#c92a2a" }}>{result.errors.length}</div>
          <div className="muted">Errors</div>
        </div>
      </div>

      {result.errors.length > 0 && (
        <div className="card" style={{ margin: 0 }}>
          <h2>Row errors</h2>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid #e9ecef" }}>
                {["Row", "Field", "Raw value", "Reason"].map(h => (
                  <th key={h} style={{ textAlign: "left", padding: "6px 8px", color: "#6c757d", fontWeight: 500 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {result.errors.map((e, i) => (
                <tr key={i} style={{ borderBottom: "1px solid #f1f3f5" }}>
                  <td style={{ padding: "6px 8px" }}>{e.index}</td>
                  <td style={{ padding: "6px 8px", fontFamily: "monospace" }}>{e.field}</td>
                  <td style={{ padding: "6px 8px", fontFamily: "monospace", color: "#c92a2a" }}>{e.raw || <em>empty</em>}</td>
                  <td style={{ padding: "6px 8px", color: "#6c757d" }}>{e.reason}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
