"use client";

import { useEffect, useState } from "react";
import { KonvaCanvas } from "@/components/canvas/KonvaCanvas";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

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
    const row = templates.find((template) => template.id === id);
    if (row) setJson(row.konva_json);
  };

  const save = async () => {
    let payload = json;
    if (lockedMode) {
      const parsed = JSON.parse(json);
      payload = JSON.stringify({ ...parsed, attrs: { ...(parsed.attrs ?? {}), isLocked: true } });
      setJson(payload);
    }
    await fetch("/api/templates/save", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        templateId,
        konvaJson: payload,
      }),
    });
  };

  return (
    <div className="grid gap-4 pb-20 lg:grid-cols-[240px_1fr] lg:pb-4">
      <aside className="space-y-2 rounded-xl bg-surface-container p-3">
        <h3 className="text-sm font-semibold">Templates</h3>
        {templates.map((template) => (
          <button
            key={template.id}
            type="button"
            onClick={() => loadTemplate(template.id)}
            className={`block w-full rounded px-2 py-1 text-left text-xs ${template.id === templateId ? "bg-primary-container text-on-primary-fixed" : "bg-surface-container-low"}`}
          >
            {template.name}
          </button>
        ))}
      </aside>
      <div className="space-y-3 rounded-xl bg-surface-container p-4">
        <h2 className="text-lg font-semibold">Template Builder</h2>
        <label className="inline-flex items-center gap-2 text-sm">
          <input type="checkbox" checked={lockedMode} onChange={(event) => setLockedMode(event.target.checked)} />
          Lock mode (applies lock metadata on save)
        </label>
        <textarea
          value={json}
          onChange={(event) => setJson(event.target.value)}
          rows={12}
          className="w-full rounded bg-surface-container-low p-3 text-xs"
        />
        <button type="button" onClick={save} className="rounded bg-primary-container px-4 py-2 text-sm font-semibold text-on-primary-fixed">
          Save Template
        </button>
        <KonvaCanvas designState={json || null} width={640} height={360} className="w-full" />
      </div>
    </div>
  );
}
