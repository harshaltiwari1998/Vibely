import { ReactNode } from "react";
import { Navigate, NavLink, useNavigate } from "react-router-dom";
import { useAdminAuthStore } from "../store/auth";
import { Logo } from "./Logo";

const links = [
  { to: "/admin", label: "Dashboard", end: true },
  { to: "/admin/users", label: "Users" },
  { to: "/admin/reports", label: "Reports" },
  { to: "/admin/calls", label: "Calls" },
  { to: "/admin/gifts", label: "Gifts" },
  { to: "/admin/transactions", label: "Transactions" },
  { to: "/admin/settings", label: "Settings" },
];

export function ProtectedRoute({ children }: { children: ReactNode }) {
  const authed = useAdminAuthStore((s) => Boolean(s.accessToken));
  if (!authed) return <Navigate to="/admin/login" replace />;
  return <>{children}</>;
}

export function AdminLayout({ children }: { children: ReactNode }) {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen bg-slate-100 text-ink-900">
      <header className="border-b border-black/5 bg-white">
        <div className="mx-auto flex max-w-6xl items-center gap-4 px-4 py-3">
          <NavLink to="/admin"><Logo /></NavLink>
          <nav className="flex flex-1 gap-1 overflow-x-auto">
            {links.map((l) => (
              <NavLink key={l.to} to={l.to} end={l.end} className={({ isActive }) => `rounded-lg px-3 py-1.5 text-sm font-medium ${isActive ? "bg-brand-600 text-white" : "text-slate-600 hover:bg-slate-100"}`}>
                {l.label}
              </NavLink>
            ))}
          </nav>
          <button className="btn" onClick={() => { useAdminAuthStore.getState().clear(); navigate("/admin/login"); }}>Logout</button>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-6">{children}</main>
    </div>
  );
}

export function Page({ title, children }: { title: string; children?: ReactNode }) {
  return (
    <section className="space-y-4">
      <h1 className="text-2xl font-bold">{title}</h1>
      {children}
    </section>
  );
}
