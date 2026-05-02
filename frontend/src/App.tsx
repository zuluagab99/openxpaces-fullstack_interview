import { BrowserRouter, Routes, Route, NavLink } from "react-router-dom";
import ImportPage from "./pages/ImportPage";
import DealsExplorer from "./pages/DealsExplorer";
import MarketSummary from "./pages/MarketSummary";
import "./App.css";

export default function App() {
  return (
    <BrowserRouter>
      <nav className="nav">
        <span className="nav-brand">Deal Intake</span>
        <NavLink to="/import" className={({ isActive }) => isActive ? "nav-link active" : "nav-link"}>Import</NavLink>
        <NavLink to="/deals"  className={({ isActive }) => isActive ? "nav-link active" : "nav-link"}>Deals</NavLink>
        <NavLink to="/market" className={({ isActive }) => isActive ? "nav-link active" : "nav-link"}>Market</NavLink>
      </nav>
      <main className="main">
        <Routes>
          <Route path="/"       element={<ImportPage />} />
          <Route path="/import" element={<ImportPage />} />
          <Route path="/deals"  element={<DealsExplorer />} />
          <Route path="/market" element={<MarketSummary />} />
        </Routes>
      </main>
    </BrowserRouter>
  );
}
