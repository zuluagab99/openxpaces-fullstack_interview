interface Props {
  label: string;
  value: string | number;
  sub?: string;
  color?: string;
}

export default function StatCard({ label, value, sub, color = "#1971c2" }: Props) {
  return (
    <div className="card" style={{ margin: 0 }}>
      <div style={{ fontSize: 26, fontWeight: 600, color }}>{value}</div>
      <div style={{ fontWeight: 500, marginTop: 2 }}>{label}</div>
      {sub && <div className="muted" style={{ marginTop: 2 }}>{sub}</div>}
    </div>
  );
}
