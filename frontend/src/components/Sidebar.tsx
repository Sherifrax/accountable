import { Building2, Handshake, KanbanSquare, LayoutDashboard, Users } from "lucide-react";
import { NavLink } from "react-router-dom";

const ITEMS = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard, end: true },
  { to: "/pipeline", label: "Pipeline", icon: KanbanSquare },
  { to: "/deals", label: "Deals", icon: Handshake },
  { to: "/organizations", label: "Organizations", icon: Building2 },
  { to: "/contacts", label: "Contacts", icon: Users },
];

export function Sidebar() {
  return (
    <aside className="sidebar">
      <div className="wordmark">Accountable</div>
      <div className="tagline">Sales, in order.</div>
      <nav className="nav" aria-label="Main">
        {ITEMS.map(({ to, label, icon: Icon, end }) => (
          <NavLink key={to} to={to} end={end} className={({ isActive }) => (isActive ? "active" : "")}>
            <Icon size={18} aria-hidden="true" />
            {label}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}
