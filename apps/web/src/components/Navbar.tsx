import { NavLink, useNavigate } from "react-router-dom";
import { Logo } from "./Logo";
import { useAuthStore, logout } from "../store/auth";

const links = [
  { to: "/home", label: "Home" },
  { to: "/discover", label: "Discover" },
  { to: "/match", label: "Match" },
  { to: "/chat", label: "Chat" },
  { to: "/wallet", label: "Wallet" },
  { to: "/favorites", label: "Favorites" },
  { to: "/history", label: "History" },
  { to: "/notifications", label: "Alerts" },
  { to: "/profile", label: "Profile" },
  { to: "/settings", label: "Settings" },
];

export function Navbar() {
  const navigate = useNavigate();
  const username = useAuthStore((s) => s.username);

  const onLogout = async () => {
    await logout();
    navigate("/login");
  };

  return (
    <header className="sticky top-0 z-10 border-b border-black/5 bg-white/80 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center gap-4 px-4 py-3">
        <NavLink to="/home">
          <Logo />
        </NavLink>
        <nav className="hidden flex-1 items-center gap-1 overflow-x-auto md:flex">
          {links.map((l) => (
            <NavLink
              key={l.to}
              to={l.to}
              className={({ isActive }) =>
                `rounded-lg px-3 py-1.5 text-sm font-medium ${
                  isActive ? "bg-brand-100 text-brand-700" : "text-gray-600 hover:bg-gray-100"
                }`
              }
            >
              {l.label}
            </NavLink>
          ))}
        </nav>
        <div className="ml-auto flex items-center gap-3">
          {username && <span className="text-sm text-gray-500">@{username}</span>}
          <button className="btn-secondary" onClick={onLogout}>
            Logout
          </button>
        </div>
      </div>
    </header>
  );
}
