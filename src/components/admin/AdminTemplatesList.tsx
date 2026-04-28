"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

interface Template {
  id: string;
  name: string;
  width_inches: number;
  height_inches: number;
  color_options: string | null;
  preview_url: string | null;
  created_at: string;
}

export function AdminTemplatesList() {
  var [templates, setTemplates] = useState<Template[]>([]);
  var [loading, setLoading] = useState(true);

  useEffect(function() {
    loadTemplates();
  }, []);

  async function loadTemplates() {
    setLoading(true);
    var supabase = createSupabaseBrowserClient();
    var sb = supabase as any;
    var { data } = await sb.from("templates").select("*").order("created_at");
    setTemplates((data ?? []) as Template[]);
    setLoading(false);
  }

  if (loading) {
    return <div className="text-sm text-foreground/50">Loading templates...</div>;
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {templates.length === 0 ? (
        <div className="col-span-full rounded-lg border border-foreground/10 p-8 text-center text-sm text-foreground/50">
          No templates yet. Seed demo data to create sample templates.
        </div>
      ) : (
        templates.map(function(template) {
          var colors: string[] = [];
          try { colors = JSON.parse(template.color_options || "[]"); } catch {}
          return (
            <div key={template.id} className="flex flex-col rounded-lg border border-foreground/10 overflow-hidden transition-all hover:border-foreground/20 hover:shadow-sm">
              <div className="aspect-[16/10] bg-foreground/5 flex items-center justify-center">
                {template.preview_url ? (
                  <img src={template.preview_url} alt={template.name} className="h-full w-full object-cover" />
                ) : (
                  <span className="material-symbols-outlined text-4xl text-foreground/15">grid_view</span>
                )}
              </div>
              <div className="p-4 flex-1 flex flex-col">
                <h3 className="font-heading text-base font-semibold">{template.name}</h3>
                <p className="mt-1 text-xs text-foreground/50">{template.width_inches}" × {template.height_inches}"</p>
                {colors.length > 0 && (
                  <div className="mt-2 flex gap-1">
                    {colors.map(function(color: string) {
                      return (
                        <span key={color} className="h-4 w-4 rounded-full border border-foreground/10" style={{ backgroundColor: color }} title={color} />
                      );
                    })}
                  </div>
                )}
                <div className="mt-auto pt-3">
                  <p className="inline-flex items-center gap-1 text-xs font-semibold text-foreground/60">
                    {template.width_inches}" × {template.height_inches}"
                  </p>
                </div>
              </div>
            </div>
          );
        })
      )}
    </div>
  );
}
