import { ReactNode } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { useAuthStore, logout } from "../store/auth";

const links = [
  { to: "/admin", label: "Dashboard", icon: "◈", end: true },
  { to: "/admin/users", label: "Users", icon: "◉" },
  { to: "/admin/reports", label: "Reports", icon: "⚑" },
  { to: "/admin/moderation", label: "Moderation", icon: "◐" },
  { to: "/admin/calls", label: "Calls", icon: "☎" },
  { to: "/admin/messages", label: "Messages", icon: "▰" },
  { to: "/admin/transactions", label: "Transactions", icon: "◆" },
  { to: "/admin/withdrawals", label: "Withdrawals", icon: "⛁" },
  { to: "/admin/gifts", label: "Gifts", icon: "❖" },
  { to: "/admin/analytics", label: "Analytics", icon: "▲" },
  { to: "/admin/settings", label: "Settings", icon: "⚙" },
];

export function AdminLayout({ children }: { children: ReactNode }) {
  const navigate = useNavigate();
  const username = useAuthStore((s) => s.username);
  const role = useAuthStore((s) => s.role);

  const onLogout = async () => {
    await logout();
    navigate("/login");
  };

  return (
    <div className="flex min-h-screen bg-[#f7f7f8] text-gray-900">
      <aside className="flex w-56 flex-shrink-0 flex-col bg-brand-900 text-brand-200">
        <div className="px-5 py-5 text-lg font-bold text-white">Vibely Admin</div>
        <nav className="flex-1 space-y-1 px-3">
          {links.map((l) => (
            <NavLink
              key={l.to}
              to={l.to}
              end={l.end}
              className={({ isActive }) =>
                `flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium ${
                  isActive ? "bg-brand-700 text-white" : "text-brand-300 hover:bg-brand-800 hover:text-white"
                }`
              }
            >
              <span className="w-4 text-center">{l.icon}</span>
              {l.label}
            </NavLink>
          ))}
        </nav>
        <div className="border-t border-brand-800 px-4 py-4">
          <div className="text-xs text-brand-300">@{username}</div>
          <div className="text-xs text-brand-400">{role}</div>
          <button className="mt-2 w-full rounded-lg border border-brand-700 py-1.5 text-xs font-medium text-brand-200 hover:bg-brand-800" onClick={onLogout}>
            Logout
          </button>
          <NavLink to="/home" className="mt-2 block text-center text-xs text-brand-400 hover:text-brand-200">
            ← Back to app
          </NavLink>
        </div>
      </aside>
      <main className="flex-1 overflow-y-auto px-6 py-6">{children}</main>
    </div>
  );
}
