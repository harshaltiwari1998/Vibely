import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Page } from "../components/Page";
import api from "../lib/api";
import { unwrap } from "../lib/api";

type UserProfile = {
  username: string;
  email: string;
  country: string;
  language: string;
  gender: string;
  avatarUrl?: string;
};

const menuItems = [
  { label: "Task", to: "/tasks" },
  { label: "My level", to: "#" },
  { label: "My Badge", to: "#" },
  { label: "Family", to: "/discover" },
  { label: "My invitation", to: "/invitation" },
  { label: "Mall", to: "#" },
  { label: "My profile", to: "/profile/edit" },
  { label: "My chat price", to: "#" },
];

export function ProfilePage() {
  const [user, setUser] = useState<UserProfile | null>(null);

  useEffect(() => {
    api.get("/users/me").then((res) => {
      setUser(unwrap<UserProfile>(res.data));
    }).catch(() => setUser(null));
  }, []);

  return (
    <Page title="">
      <div className="mx-auto -mt-2 max-w-3xl">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-black text-gray-900">{user?.username ?? "Guest"}</h1>
            <p className="text-sm text-gray-500">{user?.email ?? ""}</p>
            <div className="mt-3 flex gap-2">
              <span className="rounded-full bg-[#3fb6e8] px-3 py-1 text-xs font-semibold text-white">{user?.gender ?? "—"}</span>
              <span className="rounded-full bg-[#f29b3c] px-3 py-1 text-xs font-semibold text-white">{user?.language ?? "—"}</span>
            </div>
          </div>
          <div className="h-20 w-20 rounded-full bg-[#d9f2d2]">
            {user?.avatarUrl && <img src={user.avatarUrl} alt="" className="h-full w-full rounded-full object-cover" />}
          </div>
        </div>

        <div className="mt-5 grid grid-cols-3 rounded-2xl bg-[#f5f4f6] py-4 text-center">
          <div><p className="text-2xl font-black">23</p><p className="text-sm text-gray-500">Friend</p></div>
          <div><p className="text-2xl font-black">100</p><p className="text-sm text-gray-500">Follow</p></div>
          <div><p className="text-2xl font-black">61</p><p className="text-sm text-gray-500">Fans</p></div>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-3">
          <Link to="/wallet" className="rounded-2xl bg-[#ff2e7e] p-4 text-white"><p className="font-bold">My Wallet</p><p className="text-2xl font-black">5385</p></Link>
          <div className="rounded-2xl bg-[#3e6bf2] p-4 text-white"><p className="font-bold">My Income</p><p className="text-2xl font-black">6</p></div>
        </div>

        <div className="mt-4 rounded-2xl bg-[#141215] p-5 text-white">
          <p className="text-lg font-black">Become VIP</p>
          <p className="text-sm text-gray-300">VIP center</p>
        </div>

        <div className="mt-6 grid grid-cols-4 gap-4 text-center">
          {menuItems.map((item) => (
            <Link key={item.label} to={item.to} className="flex flex-col items-center gap-2">
              <span className="h-11 w-11 rounded-xl bg-[#ffe3e9]" />
              <span className="text-xs text-gray-700">{item.label}</span>
            </Link>
          ))}
        </div>
        <Link to="/settings" className="mt-6 block text-center text-sm text-gray-400 underline">Settings</Link>
      </div>
    </Page>
  );
}
