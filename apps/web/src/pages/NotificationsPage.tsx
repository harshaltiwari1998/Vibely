import { useEffect, useRef, useState } from "react";
import { Page } from "../components/Page";
import api from "../lib/api";
import { io, Socket } from "socket.io-client";
import { useAuthStore } from "../store/auth";
import { RealtimeEvent } from "@vibely/types";
import { useLocalization } from "../locales";

type Notification = {
  id: string;
  type: string;
  title: string;
  body: string;
  read: boolean;
  createdAt: string;
};

export function NotificationsPage() {
  const [items, setItems] = useState<Notification[]>([]);
  const socketRef = useRef<Socket | null>(null);
  const accessToken = useAuthStore((s) => s.accessToken);
  const wsUrl = (import.meta.env.VITE_API_URL as string | undefined) ?? "http://localhost:4000";
  const { t } = useLocalization();

  const load = async () => {
    try {
      const { data } = await api.get("/notifications");
      setItems(data.items ?? []);
    } catch {
      setItems([]);
    }
  };

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    if (!accessToken) return;
    const sock = io(wsUrl, {
      auth: { token: `Bearer ${accessToken}` },
      transports: ["websocket"],
    });
    socketRef.current = sock;

    sock.on(RealtimeEvent.NotificationCreated, (payload: { notificationId: string; title: string; body: string; type?: string }) => {
      setItems((prev) => [{ id: payload.notificationId, type: payload.type ?? "SYSTEM", title: payload.title, body: payload.body, read: false, createdAt: new Date().toISOString() }, ...prev]);
    });

    sock.on(RealtimeEvent.NotificationRead, (payload: { notificationId: string }) => {
      setItems((prev) => prev.map((n) => (n.id === payload.notificationId ? { ...n, read: true } : n)));
    });

    sock.on(RealtimeEvent.NotificationDeleted, (payload: { notificationId: string }) => {
      setItems((prev) => prev.filter((n) => n.id !== payload.notificationId));
    });

    return () => {
      sock.disconnect();
    };
  }, [accessToken, wsUrl]);

  const markRead = async (id: string) => {
    try {
      await api.post(`/notifications/${id}/read`);
      setItems((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
    } catch {
      // ignore
    }
  };

  const markAllRead = async () => {
    try {
      await api.post("/notifications/read-all");
      setItems((prev) => prev.map((n) => ({ ...n, read: true })));
    } catch {
      // ignore
    }
  };

  const deleteNotification = async (id: string) => {
    try {
      await api.post(`/notifications/${id}/delete`);
      setItems((prev) => prev.filter((n) => n.id !== id));
    } catch {
      // ignore
    }
  };

  return (
    <Page title={t.notifications.title}>
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">{t.notifications.title}</h2>
        <button className="btn-secondary" onClick={markAllRead}>{t.notifications.markAllRead}</button>
      </div>
      <div className="space-y-2">
        {items.length === 0 && <div className="card">{t.notifications.noNotifications}</div>}
        {items.map((n) => (
          <div key={n.id} className={`card ${n.read ? "opacity-60" : ""}`}>
            <div className="flex items-start justify-between">
              <div>
                <div className="font-medium">{n.title}</div>
                <div className="text-sm text-gray-600">{n.body}</div>
                <div className="text-xs text-gray-400">{new Date(n.createdAt).toLocaleString()}</div>
              </div>
              <div className="flex gap-2">
                {!n.read && (
                  <button className="btn-secondary text-xs" onClick={() => markRead(n.id)}>{t.notifications.markRead}</button>
                )}
                <button className="btn-secondary text-xs" onClick={() => deleteNotification(n.id)}>{t.notifications.delete}</button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </Page>
  );
}
