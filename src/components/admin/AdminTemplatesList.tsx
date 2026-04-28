"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

interface Template {
  id: string;
  name: string;
  width_inches: number;
  height_inches: number;
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
    var { data } = await sb.from("templates").select("id, name, width_inches, height_inches, preview_url, created_at").order("created_at");
    setTemplates((data ?? []) as Template[]);
    setLoading(false);
  }

  if (loading) {
    return <div className="text-sm text-foreground/50">Loading templates...</div>;
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      <style>{`
        .bg-checkered {
          background-image: linear-gradient(45deg,#e0e0e0 25%,transparent 25%),linear-gradient(-45deg,#e0e0e0 25%,transparent 25%),linear-gradient(45deg,transparent 75%,#e0e0e0 75%),linear-gradient(-45deg,transparent 75%,#e0e0e0 75%);
          background-size:10px 10px;background-position:0 0,0 5px,5px -5px,-5px 0px;
        }
      `}</style>
      {templates.length === 0 ? (
        <div className="col-span-full rounded-lg border border-foreground/10 p-8 text-center text-sm text-foreground/50">
          No templates yet. Seed demo data to create sample templates.
        </div>
      ) : (
        templates.map(function(template) {
          return (
            <div key={template.id} className="flex flex-col rounded-lg border border-foreground/10 overflow-hidden transition-all hover:border-foreground/20 hover:shadow-sm">
              <div className="aspect-[16/10] bg-checkered flex items-center justify-center overflow-hidden">
                {template.preview_url ? (
                  <img src={template.preview_url} alt={template.name} className="h-full w-full object-contain" />
                ) : (
                  <span className="material-symbols-outlined text-4xl text-foreground/15">grid_view</span>
                )}
              </div>
              <div className="p-4 flex-1 flex flex-col">
                <h3 className="font-heading text-base font-semibold">{template.name}</h3>
                <p className="mt-1 text-xs text-foreground/50">{template.width_inches}" × {template.height_inches}"</p>
                <p className="mt-1 text-xs text-foreground/40">
                  {template.preview_url ? "Overlay PNG uploaded" : "No overlay PNG — upload one to use in sandwich preview"}
                </p>
              </div>
            </div>
          );
        })
      )}
    </div>
  );
}
