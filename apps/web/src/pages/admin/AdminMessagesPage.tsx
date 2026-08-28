import { useEffect, useState } from "react";
import { Page } from "../../components/Page";
import api from "../../lib/api";

type Message = { id: string; content: string; createdAt: string; sender: { username: string } };

export function AdminMessagesPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await api.get("/admin/messages");
      setMessages(data.items ?? []);
    } catch {
      setMessages([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  return (
    <Page title="Admin - Messages">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold">Messages</h2>
        <button className="btn-secondary" onClick={load} disabled={loading}>{loading ? "Loading..." : "Refresh"}</button>
      </div>
      <div className="space-y-2">
        {messages.length === 0 && <div className="card">No messages found.</div>}
        {messages.map((m) => (
          <div key={m.id} className="card">
            <div className="font-medium">{m.sender.username}</div>
            <div className="text-sm">{m.content}</div>
            <div className="text-xs text-gray-500">{new Date(m.createdAt).toLocaleString()}</div>
          </div>
        ))}
      </div>
    </Page>
  );
}
