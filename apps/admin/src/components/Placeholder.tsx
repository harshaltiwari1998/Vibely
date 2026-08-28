export function Placeholder({ note }: { note: string }) {
  return <div className="rounded-lg border border-dashed border-slate-300 p-3 text-sm text-slate-500">{note}</div>;
}
