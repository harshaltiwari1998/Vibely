import { NavLink, useNavigate } from "react-router-dom";
import { Logo } from "./Logo";
import { useAuthStore, logout } from "../store/auth";

const links = [
  { to: "/home", label: "Home", icon: "⌂" },
  { to: "/match", label: "Match", icon: "♥" },
  { to: "/live", label: "Live", icon: "▶" },
  { to: "/discover", label: "Discover", icon: "◉" },
  { to: "/chat", label: "Chats", icon: "▰" },
  { to: "/profile", label: "Profile", icon: "●" },
];

export function Navbar() {
  const navigate = useNavigate();
  const username = useAuthStore((s) => s.username);

  const onLogout = async () => {
    await logout();
    navigate("/login");
  };

  return (
    <>
      <header className="sticky top-0 z-10 border-b border-black/5 bg-white/90 backdrop-blur md:block">
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
          <button className="hidden btn-secondary sm:inline-flex" onClick={onLogout}>
            Logout
          </button>
        </div>
      </div>
      </header>
      <nav className="fixed inset-x-0 bottom-0 z-20 flex h-[72px] items-center justify-around border-t border-[#eadbf2] bg-white/95 px-2 pb-1 shadow-[0_-8px_24px_rgba(94,25,119,0.08)] backdrop-blur md:hidden">
        {links.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            className={({ isActive }) => `flex min-w-12 flex-col items-center gap-1 text-[10px] font-semibold ${isActive ? "text-[#ad2bd9]" : "text-gray-400"}`}
          >
            <span className="flex h-7 w-7 items-center justify-center text-xl leading-none">{link.icon}</span>
            {link.label}
          </NavLink>
        ))}
      </nav>
    </>
  );
}
