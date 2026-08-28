import { ReactNode } from "react";

export function Page({ title, description, children }: { title: string; description?: string; children?: ReactNode }) {
  return (
    <section className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
        {description && <p className="text-sm text-gray-500">{description}</p>}
      </div>
      {children}
    </section>
  );
}

export function Placeholder({ note }: { note: string }) {
  return (
    <div className="card border-dashed text-sm text-gray-500">
      <span className="font-medium text-gray-700">Foundation scaffold.</span> {note}
    </div>
  );
}
