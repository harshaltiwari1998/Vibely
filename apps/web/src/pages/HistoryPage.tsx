import { useEffect, useState } from "react";
import { Page } from "../components/Page";
import api from "../lib/api";
import { useLocalization } from "../locales";

type Call = {
  id: string;
  initiator: { id: string; username: string; avatarUrl?: string };
  receiver: { id: string; username: string; avatarUrl?: string };
  startedAt: string;
  endedAt?: string;
  durationSeconds: number;
  status: string;
};

export function HistoryPage() {
  const [calls, setCalls] = useState<Call[]>([]);
  const { t } = useLocalization();

  const load = async () => {
    try {
      const { data } = await api.get("/calls/history");
      setCalls(data.items ?? []);
    } catch {
      setCalls([]);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const formatDuration = (seconds: number) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, "0");
    const s = (seconds % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  };

  return (
    <Page title={t.history.title}>
      <button className="btn-secondary" onClick={load}>{t.common.refresh}</button>
      <div className="space-y-2">
        {calls.length === 0 && <div className="card">{t.history.noCalls}</div>}
        {calls.map((call) => (
          <div key={call.id} className="card">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-gray-200" />
              <div className="flex-1">
                <div className="font-medium">{call.initiator.username} → {call.receiver.username}</div>
                <div className="text-xs text-gray-500">
                  {new Date(call.startedAt).toLocaleString()} · {t.history.duration}: {formatDuration(call.durationSeconds)} · {call.status}
                </div>
              </div>
            </div>
            <div className="mt-2 flex gap-2">
              <button className="btn-secondary text-xs">{t.history.callAgain}</button>
              <button className="btn-secondary text-xs">{t.history.favorite}</button>
              <button className="btn-secondary text-xs">{t.history.block}</button>
              <button className="btn-secondary text-xs">{t.history.report}</button>
            </div>
          </div>
        ))}
      </div>
    </Page>
  );
}
