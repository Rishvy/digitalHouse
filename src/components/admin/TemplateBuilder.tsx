"use client";

import { useEffect, useState } from "react";
import { KonvaCanvas } from "@/components/canvas/KonvaCanvas";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { AdminBackLink } from "@/components/admin/AdminPageHeader";

interface TemplateRow {
  id: string;
  name: string;
  konva_json: string;
}

export function TemplateBuilder({ initialTemplateId }: { initialTemplateId: string }) {
  const [templates, setTemplates] = useState<TemplateRow[]>([]);
  const [templateId, setTemplateId] = useState(initialTemplateId);
  const [json, setJson] = useState("");
  const [lockedMode, setLockedMode] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ text: string; isError: boolean } | null>(null);

  useEffect(() => {
    const load = async () => {
      const supabase = createSupabaseBrowserClient();
      const sb = supabase as any;
      const { data } = await sb.from("templates").select("id,name,konva_json").order("created_at");
      const rows = (data ?? []) as TemplateRow[];
      setTemplates(rows);
      const current = rows.find((row) => row.id === initialTemplateId) ?? rows[0];
      if (current) {
        setTemplateId(current.id);
        setJson(current.konva_json);
      }
    };
    void load();
  }, [initialTemplateId]);

  const loadTemplate = (id: string) => {
    setTemplateId(id);
    setMessage(null);
    const row = templates.find((template) => template.id === id);
    if (row) setJson(row.konva_json);
  };

  const save = async () => {
    setSaving(true);
    setMessage(null);
    let payload = json;
    try {
      if (lockedMode) {
        const parsed = JSON.parse(json);
        payload = JSON.stringify({ ...parsed, attrs: { ...(parsed.attrs ?? {}), isLocked: true } });
        setJson(payload);
      }
      const res = await fetch("/api/templates/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ templateId, konvaJson: payload }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to save template");
      setMessage({ text: "Template saved successfully", isError: false });
    } catch (err) {
      setMessage({ text: err instanceof Error ? err.message : "Invalid JSON or save failed", isError: true });
    } finally {
      setSaving(false);
    }
  };

  var currentName = templates.find(function(t) { return t.id === templateId; })?.name ?? "Template";

  return (
    <div>
      <AdminBackLink href="/admin/templates" label="Back to Templates" />
      <div className="grid gap-4 lg:grid-cols-[220px_1fr]">
        <aside className="space-y-1 rounded-lg border border-foreground/10 p-3">
          <p className="px-2 pb-2 text-[10px] font-semibold uppercase tracking-wider text-foreground/40">Templates</p>
          {templates.map((template) => (
            <button
              key={template.id}
              type="button"
              onClick={() => loadTemplate(template.id)}
              className={"block w-full rounded-md px-2 py-1.5 text-left text-sm transition-colors " + (template.id === templateId ? "bg-accent text-accent-foreground font-semibold" : "text-foreground/60 hover:bg-foreground/5 hover:text-foreground")}
            >
              {template.name}
            </button>
          ))}
        </aside>
        <div className="space-y-4 rounded-lg border border-foreground/10 p-5">
          <div className="flex items-center justify-between">
            <h2 className="font-heading text-lg font-semibold">{currentName}</h2>
            <label className="inline-flex items-center gap-2 text-sm text-foreground/70">
              <input type="checkbox" checked={lockedMode} onChange={(event) => setLockedMode(event.target.checked)} className="rounded" />
              Lock mode
            </label>
          </div>
          <textarea
            value={json}
            onChange={(event) => setJson(event.target.value)}
            rows={14}
            className="w-full rounded-md border border-foreground/10 bg-background p-3 font-mono text-xs focus:border-foreground/20 focus:outline-none"
          />
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={save}
              disabled={saving}
              className="rounded-md bg-foreground px-4 py-2 text-sm font-semibold text-background transition-opacity hover:opacity-90 disabled:opacity-50"
            >
              {saving ? "Saving..." : "Save Template"}
            </button>
            {message && (
              <span className={"text-sm " + (message.isError ? "text-destructive" : "text-foreground/60")}>
                {message.text}
              </span>
            )}
          </div>
          <div className="rounded-md border border-foreground/10 bg-foreground/5 p-4">
            <p className="mb-2 text-xs font-semibold text-foreground/40">PREVIEW</p>
            <KonvaCanvas designState={json || null} width={640} height={360} className="w-full" />
          </div>
        </div>
      </div>
    </div>
  );
}
