import { Link } from "react-router-dom";
import { useAuthStore } from "../store/auth";

const shortcuts = [
  { label: "Daily check-in", icon: "✓", to: "/tasks", tone: "bg-rose-100 text-rose-600" },
  { label: "Lucky draw", icon: "✦", to: "/gifts", tone: "bg-amber-100 text-amber-600" },
  { label: "My level", icon: "♛", to: "/profile", tone: "bg-violet-100 text-violet-600" },
  { label: "Invite friends", icon: "↗", to: "/invitation", tone: "bg-sky-100 text-sky-600" },
  { label: "Favorites", icon: "♥", to: "/favorites", tone: "bg-pink-100 text-pink-600" },
  { label: "Call history", icon: "◷", to: "/history", tone: "bg-indigo-100 text-indigo-600" },
];

export function HomePage() {
  const username = useAuthStore((state) => state.username) || "Harshal";

  return (
    <div className="mx-auto min-h-[calc(100vh-68px)] max-w-2xl overflow-hidden rounded-[28px] bg-[#f8f7fb] shadow-sm ring-1 ring-black/5">
      <section className="relative overflow-hidden bg-gradient-to-br from-[#7a22d2] via-[#b82de1] to-[#f3298b] px-5 pb-6 pt-5 text-white">
        <div className="absolute -right-12 -top-16 h-40 w-40 rounded-full bg-white/10 blur-2xl" />
        <div className="relative flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-full border-2 border-white/70 bg-white/25 text-lg font-bold">{username.slice(0, 1).toUpperCase()}</div>
            <div><p className="text-[11px] text-white/70">Welcome back</p><p className="font-bold">{username}</p></div>
          </div>
          <div className="flex items-center gap-2"><Link to="/notifications" aria-label="Notifications" className="flex h-10 w-10 items-center justify-center rounded-full bg-white/15 text-lg">♧</Link><Link to="/settings" aria-label="Settings" className="flex h-10 w-10 items-center justify-center rounded-full bg-white/15 text-lg">⚙</Link></div>
        </div>
        <div className="relative mt-7 flex items-end justify-between"><div><p className="text-xs text-white/75">Diamond balance</p><p className="mt-1 text-3xl font-black tracking-tight">4,625 <span className="text-lg">◆</span></p></div><Link to="/wallet" className="rounded-full bg-white px-4 py-2 text-xs font-extrabold text-[#a625d5] shadow-lg shadow-[#74158d]/20">Recharge</Link></div>
      </section>

      <section className="space-y-4 px-4 pb-8 pt-4">
        <Link to="/match" className="group relative block overflow-hidden rounded-2xl bg-gradient-to-r from-[#ff4c97] to-[#9f31e8] p-5 text-white shadow-lg shadow-fuchsia-200"><div className="absolute -right-5 -top-8 text-[115px] leading-none opacity-20">♡</div><p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/75">Find your connection</p><h1 className="mt-1 text-2xl font-black">Start a random video chat</h1><p className="mt-1 max-w-[240px] text-xs text-white/80">Meet someone new, one conversation at a time.</p><span className="mt-4 inline-flex rounded-full bg-white px-5 py-2 text-xs font-black text-[#b323d3] transition group-hover:translate-x-1">Start matching <span className="ml-2">→</span></span></Link>

        <div className="flex items-center justify-between rounded-2xl bg-white px-4 py-3 shadow-sm ring-1 ring-black/5"><div className="flex items-center gap-3"><span className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#fff0bb] text-2xl">♛</span><div><p className="text-sm font-extrabold text-gray-800">Become VIP</p><p className="text-[11px] text-gray-400">Unlock more ways to connect</p></div></div><Link to="/wallet" className="rounded-full bg-[#6d28d9] px-3 py-2 text-[11px] font-bold text-white">Join now</Link></div>

        <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-black/5"><div className="mb-3 flex items-center justify-between"><h2 className="text-sm font-extrabold text-gray-800">Quick access</h2><Link to="/discover" className="text-xs font-bold text-[#a52ad4]">See all</Link></div><div className="grid grid-cols-3 gap-y-5">{shortcuts.map((shortcut) => <Link key={shortcut.label} to={shortcut.to} className="flex flex-col items-center gap-2 text-center"><span className={`flex h-11 w-11 items-center justify-center rounded-2xl text-xl font-black ${shortcut.tone}`}>{shortcut.icon}</span><span className="text-[11px] font-semibold text-gray-500">{shortcut.label}</span></Link>)}</div></div>

        <div className="rounded-2xl bg-gradient-to-r from-[#fff0fa] to-[#f1eaff] p-4"><div className="flex items-center justify-between"><div><p className="text-sm font-black text-[#7624b8]">Daily rewards</p><p className="mt-1 text-xs text-gray-500">Check in today and earn diamonds</p></div><Link to="/tasks" className="rounded-full bg-[#c72fdd] px-4 py-2 text-[11px] font-bold text-white">Claim</Link></div><div className="mt-4 h-2 overflow-hidden rounded-full bg-white"><div className="h-full w-2/5 rounded-full bg-gradient-to-r from-[#f02c8a] to-[#a52ce1]" /></div></div>
      </section>
    </div>
  );
}
