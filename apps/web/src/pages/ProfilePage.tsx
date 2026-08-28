import { useEffect, useState } from "react";
import { Page } from "../components/Page";
import api from "../lib/api";
import { unwrap } from "../lib/api";
import { Gender } from "@vibely/types";

type UserProfile = {
  username: string;
  email: string;
  country: string;
  language: string;
  gender: string;
  avatarUrl?: string;
  profile?: { bio?: string; interests?: string[] };
};

export function ProfilePage() {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [bio, setBio] = useState("");
  const [interests, setInterests] = useState("");
  const [country, setCountry] = useState("");
  const [language, setLanguage] = useState("");
  const [gender, setGender] = useState(Gender.Male);
  const [avatar, setAvatar] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => {
    api.get("/users/me").then((res) => {
      const u = unwrap<UserProfile>(res.data);
      setUser(u);
      setBio(u.profile?.bio ?? "");
      setInterests((u.profile?.interests ?? []).join(", "));
      setCountry(u.country);
      setLanguage(u.language);
      setGender((u.gender as Gender) ?? Gender.Male);
      setAvatar(u.avatarUrl ?? null);
    });
  }, []);

  const save = async () => {
    setSaving(true);
    setMsg(null);
    try {
      await api.post("/users/me/profile", { bio, interests: interests.split(",").map((s) => s.trim()).filter(Boolean) });
      await api.post("/users/me", { country, language, gender });
      if (avatar) await api.post("/users/me/avatar", { avatarUrl: avatar });
      setMsg("Saved");
    } catch {
      setMsg("Save failed");
    } finally {
      setSaving(false);
    }
  };

  if (!user) return <Page title="My profile"><div className="card">Loading...</div></Page>;

  return (
    <Page title="My profile">
      <div className="card space-y-3">
        <div className="flex items-center gap-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gray-200 text-xl font-bold text-gray-600">
            {avatar ? <img src={avatar} alt="avatar" className="h-full w-full rounded-full object-cover" /> : user.username[0].toUpperCase()}
          </div>
          <div>
            <p className="font-semibold">{user.username}</p>
            <p className="text-sm text-gray-500">{user.email}</p>
          </div>
        </div>
        <input className="input" placeholder="Bio" value={bio} onChange={(e) => setBio(e.target.value)} />
        <input className="input" placeholder="Interests (comma separated)" value={interests} onChange={(e) => setInterests(e.target.value)} />
        <input className="input" placeholder="Country" value={country} onChange={(e) => setCountry(e.target.value)} />
        <input className="input" placeholder="Language" value={language} onChange={(e) => setLanguage(e.target.value)} />
        <select className="input" value={gender} onChange={(e) => setGender(e.target.value as Gender)}>
          <option value={Gender.Male}>Male</option>
          <option value={Gender.Female}>Female</option>
          <option value={Gender.NonBinary}>Non-binary</option>
          <option value={Gender.Other}>Other</option>
          <option value={Gender.PreferNotToSay}>Prefer not to say</option>
        </select>
        <input className="input" placeholder="Avatar URL" value={avatar ?? ""} onChange={(e) => setAvatar(e.target.value)} />
        <button className="btn-primary" onClick={save} disabled={saving}>{saving ? "Saving..." : "Save profile"}</button>
        {msg && <p className="text-sm text-brand-600">{msg}</p>}
      </div>
    </Page>
  );
}
