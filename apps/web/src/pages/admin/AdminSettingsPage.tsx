import { useEffect, useState } from "react";
import { Page } from "../../components/Page";
import api from "../../lib/api";

type Settings = {
  appName: string;
  minAge: number;
  maxAge: number;
  allowRegistration: boolean;
  maintenanceMode: boolean;
  features: Record<string, boolean>;
};

export function AdminSettingsPage() {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    try {
      const { data } = await api.get("/admin/settings");
      setSettings(data);
    } catch {
      setSettings(null);
    }
  };

  useEffect(() => { load(); }, []);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!settings) return;
    setSaving(true);
    try {
      await api.post("/admin/settings", settings);
      alert("Settings saved");
    } catch {
      alert("Save failed");
    } finally {
      setSaving(false);
    }
  };

  if (!settings) return <Page title="Admin - Settings"><div className="card">Failed to load settings.</div></Page>;

  return (
    <Page title="Admin - Settings">
      <form onSubmit={save} className="card space-y-3">
        <h2 className="text-lg font-semibold">Platform Settings</h2>
        <label className="block text-sm text-gray-600">App Name</label>
        <input className="input" value={settings.appName} onChange={(e) => setSettings({ ...settings, appName: e.target.value })} />
        <label className="block text-sm text-gray-600">Min Age</label>
        <input className="input" type="number" value={settings.minAge} onChange={(e) => setSettings({ ...settings, minAge: parseInt(e.target.value || "18", 10) })} />
        <label className="block text-sm text-gray-600">Max Age</label>
        <input className="input" type="number" value={settings.maxAge} onChange={(e) => setSettings({ ...settings, maxAge: parseInt(e.target.value || "120", 10) })} />
        <div className="flex items-center gap-2">
          <input type="checkbox" checked={settings.allowRegistration} onChange={(e) => setSettings({ ...settings, allowRegistration: e.target.checked })} />
          <span className="text-sm">Allow Registration</span>
        </div>
        <div className="flex items-center gap-2">
          <input type="checkbox" checked={settings.maintenanceMode} onChange={(e) => setSettings({ ...settings, maintenanceMode: e.target.checked })} />
          <span className="text-sm">Maintenance Mode</span>
        </div>
        <button className="btn-primary" type="submit" disabled={saving}>{saving ? "Saving..." : "Save Settings"}</button>
      </form>
    </Page>
  );
}
