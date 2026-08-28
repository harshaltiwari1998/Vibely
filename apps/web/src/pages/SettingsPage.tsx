import { AxiosResponse } from "axios";
import { useEffect, useState } from "react";
import { Page } from "../components/Page";
import api from "../lib/api";
import { unwrap } from "../lib/api";
import { useAuthStore } from "../store/auth";
import { Gender } from "@vibely/types";
import { useLocalization } from "../locales";

export function SettingsPage() {
  const [prefs, setPrefs] = useState({ preferredGender: "", preferredAgeMin: 18, preferredAgeMax: 99, preferredCountries: "", preferredLanguages: "" });
  const [pw, setPw] = useState({ oldPassword: "", newPassword: "" });
  const [msg, setMsg] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const { language, setLanguage, t } = useLocalization();

  useEffect(() => {
    api.get("/users/me").then((res: AxiosResponse) => {
      const u = unwrap<{ preferences?: { preferredGender?: string; preferredAgeMin?: number; preferredAgeMax?: number; preferredCountries?: string[]; preferredLanguages?: string[] } }>(res.data);
      if (u.preferences) {
        setPrefs({
          preferredGender: u.preferences.preferredGender ?? "",
          preferredAgeMin: u.preferences.preferredAgeMin ?? 18,
          preferredAgeMax: u.preferences.preferredAgeMax ?? 99,
          preferredCountries: (u.preferences.preferredCountries ?? []).join(", "),
          preferredLanguages: (u.preferences.preferredLanguages ?? []).join(", "),
        });
      }
    });
  }, []);

  const savePrefs = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMsg(null);
    try {
      await api.post("/users/me/preferences", {
        preferredGender: prefs.preferredGender || undefined,
        preferredAgeMin: prefs.preferredAgeMin,
        preferredAgeMax: prefs.preferredAgeMax,
        preferredCountries: prefs.preferredCountries.split(",").map((s) => s.trim()).filter(Boolean),
        preferredLanguages: prefs.preferredLanguages.split(",").map((s) => s.trim()).filter(Boolean),
      });
      setMsg("Preferences saved");
    } catch {
      setMsg("Save failed");
    } finally {
      setSaving(false);
    }
  };

  const changePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMsg(null);
    try {
      await useAuthStore.getState().changePassword(pw.oldPassword, pw.newPassword);
      setMsg("Password changed. Please log in again.");
      setPw({ oldPassword: "", newPassword: "" });
    } catch {
      setMsg("Password change failed");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Page title={t.navigation.settings}>
      <form onSubmit={(e) => { e.preventDefault(); setLanguage(language === "en" ? "hi" : "en"); }} className="card space-y-3">
        <h2 className="text-lg font-semibold">Language</h2>
        <select className="input" value={language} onChange={(e) => setLanguage(e.target.value as "en" | "hi")}>
          <option value="en">English</option>
          <option value="hi">Hindi</option>
        </select>
      </form>

      <form onSubmit={savePrefs} className="card mt-6 space-y-3">
        <h2 className="text-lg font-semibold">Discovery preferences</h2>
        <label className="block text-sm text-gray-600">Preferred gender</label>
        <select className="input" value={prefs.preferredGender} onChange={(e) => setPrefs({ ...prefs, preferredGender: e.target.value })}>
          <option value="">Any</option>
          <option value={Gender.Male}>Male</option>
          <option value={Gender.Female}>Female</option>
          <option value={Gender.NonBinary}>Non-binary</option>
          <option value={Gender.Other}>Other</option>
        </select>
        <div className="grid grid-cols-2 gap-3">
          <input className="input" type="number" placeholder="Min age" value={prefs.preferredAgeMin} onChange={(e) => setPrefs({ ...prefs, preferredAgeMin: parseInt(e.target.value || "18", 10) })} />
          <input className="input" type="number" placeholder="Max age" value={prefs.preferredAgeMax} onChange={(e) => setPrefs({ ...prefs, preferredAgeMax: parseInt(e.target.value || "99", 10) })} />
        </div>
        <input className="input" placeholder="Preferred countries (comma separated)" value={prefs.preferredCountries} onChange={(e) => setPrefs({ ...prefs, preferredCountries: e.target.value })} />
        <input className="input" placeholder="Preferred languages (comma separated)" value={prefs.preferredLanguages} onChange={(e) => setPrefs({ ...prefs, preferredLanguages: e.target.value })} />
        <button className="btn-primary" type="submit" disabled={saving}>{saving ? "Saving..." : "Save preferences"}</button>
        {msg && <p className="text-sm text-brand-600">{msg}</p>}
      </form>

      <form onSubmit={changePassword} className="card mt-6 space-y-3">
        <h2 className="text-lg font-semibold">Change password</h2>
        <input className="input" type="password" placeholder="Current password" value={pw.oldPassword} onChange={(e) => setPw({ ...pw, oldPassword: e.target.value })} />
        <input className="input" type="password" placeholder="New password" value={pw.newPassword} onChange={(e) => setPw({ ...pw, newPassword: e.target.value })} />
        <button className="btn-primary" type="submit" disabled={saving}>{saving ? "Updating..." : "Change password"}</button>
      </form>
    </Page>
  );
}
