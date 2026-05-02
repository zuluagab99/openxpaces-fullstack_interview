import { BrowserRouter, Routes, Route, NavLink } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { useTheme } from "./context/ThemeContext";
import ImportPage from "./pages/ImportPage";
import DealsExplorer from "./pages/DealsExplorer";
import MarketSummary from "./pages/MarketSummary";
import { Sun, Moon, Building2, Upload, BarChart3, Table2 } from "lucide-react";

function ThemeToggle() {
  const { theme, toggle } = useTheme();
  return (
    <button
      onClick={toggle}
      className="flex items-center justify-center w-8 h-8 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
      title="Toggle theme"
    >
      {theme === "dark" ? <Sun size={16} /> : <Moon size={16} />}
    </button>
  );
}

const links = [
  { to: "/import", label: "Import",  icon: Upload },
  { to: "/deals",  label: "Deals",   icon: Table2 },
  { to: "/market", label: "Market",  icon: BarChart3 },
];

export default function App() {
  return (
    <BrowserRouter>
      <div className="flex h-screen bg-background overflow-hidden">

        {/* Sidebar */}
        <aside className="w-56 flex flex-col border-r border-border bg-card shrink-0">
          {/* Logo */}
          <div className="flex items-center gap-2.5 px-4 h-14 border-b border-border">
            <div className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center shrink-0">
              <Building2 size={14} className="text-primary-foreground" />
            </div>
            <div>
              <div className="text-sm font-semibold leading-none">Deal Intake</div>
              <div className="text-[10px] text-muted-foreground mt-0.5">CRE Platform</div>
            </div>
          </div>

          {/* Nav */}
          <nav className="flex flex-col gap-1 p-3 flex-1">
            <div className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest px-2 mb-1">Workspace</div>
            {links.map(({ to, label, icon: Icon }) => (
              <NavLink
                key={to}
                to={to}
                className={({ isActive }) =>
                  `flex items-center gap-2.5 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    isActive
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:text-foreground hover:bg-accent"
                  }`
                }
              >
                <Icon size={15} />
                {label}
              </NavLink>
            ))}
          </nav>

          {/* Footer */}
          <div className="p-3 border-t border-border flex items-center justify-between">
            <span className="text-[11px] text-muted-foreground">v0.1.0</span>
            <ThemeToggle />
          </div>
        </aside>

        {/* Main content */}
        <main className="flex-1 overflow-y-auto">
          <Routes>
            <Route path="/"       element={<ImportPage />} />
            <Route path="/import" element={<ImportPage />} />
            <Route path="/deals"  element={<DealsExplorer />} />
            <Route path="/market" element={<MarketSummary />} />
          </Routes>
        </main>
      </div>

      <Toaster
        position="bottom-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: "hsl(var(--card))",
            color: "hsl(var(--foreground))",
            border: "1px solid hsl(var(--border))",
            borderRadius: "8px",
            fontSize: "13px",
            padding: "10px 14px",
          },
        }}
      />
    </BrowserRouter>
  );
}
