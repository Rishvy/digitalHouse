"use client";

import { useState, useEffect } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

interface MediaFile {
  name: string;
  id: string;
  publicUrl: string;
  created_at: string;
  metadata?: { size?: number; mimetype?: string };
}

export function AdminUploads() {
  const [files, setFiles] = useState<MediaFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedUrl, setSelectedUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    loadFiles();
  }, []);

  async function loadFiles() {
    setLoading(true);
    try {
      var supabase = createSupabaseBrowserClient();
      var sb = supabase as any;
      var { data } = await sb.storage.from("templates").list("", { limit: 100, sortBy: { column: "created_at", order: "desc" } });
      if (data) {
        var mapped = data
          .filter(function(f: any) { return !f.id.endsWith(".emptyFolderPlaceholder"); })
          .map(function(f: any) {
            var { data: urlData } = sb.storage.from("templates").getPublicUrl(f.name);
            return {
              name: f.name,
              id: f.id,
              publicUrl: urlData?.publicUrl ?? "",
              created_at: f.created_at ?? "",
              metadata: f.metadata,
            };
          });
        setFiles(mapped);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  function copyUrl(url: string) {
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(function() { setCopied(false); }, 2000);
  }

  var filtered = search.trim()
    ? files.filter(function(f) { return f.name.toLowerCase().includes(search.toLowerCase()); })
    : files;

  return (
    <div className="space-y-6">
      <div className="rounded-lg border border-foreground/10 p-5">
        <h2 className="font-heading text-base font-semibold">Upload New File</h2>
        <p className="mt-1 text-sm text-foreground/50">PNG, JPG, TIFF, SVG, PDF, WEBP up to 100MB</p>
        <div className="mt-3">
          <input
            type="file"
            accept="image/png,image/jpeg,image/tiff,image/svg+xml,application/pdf,image/webp"
            className="w-full rounded-md border border-foreground/10 bg-background px-3 py-2 text-sm file:mr-3 file:rounded file:border-0 file:bg-foreground file:px-3 file:py-1 file:text-xs file:font-semibold file:text-background"
          />
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex items-center gap-3">
          <div className="relative flex-1 max-w-xs">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-sm text-foreground/40">search</span>
            <input
              value={search}
              onChange={function(e) { setSearch(e.target.value); }}
              placeholder="Search files..."
              className="w-full rounded-md border border-foreground/10 bg-background py-2 pl-9 pr-3 text-sm placeholder:text-foreground/30 focus:border-foreground/20 focus:outline-none"
            />
          </div>
          <p className="text-xs text-foreground/40">{filtered.length} file{filtered.length !== 1 ? "s" : ""}</p>
        </div>

        {loading ? (
          <p className="text-sm text-foreground/50">Loading files...</p>
        ) : filtered.length === 0 ? (
          <p className="rounded-lg border border-foreground/10 p-6 text-center text-sm text-foreground/50">No files uploaded yet.</p>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map(function(file) {
              var isImage = /\.(png|jpg|jpeg|gif|svg|webp|tiff?)$/i.test(file.name);
              return (
                <div key={file.id} className={"group rounded-lg border p-3 transition-all hover:shadow-sm " + (selectedUrl === file.publicUrl ? "border-accent ring-1 ring-accent/30" : "border-foreground/10")}>
                  <div className="mb-2 aspect-video overflow-hidden rounded-md bg-foreground/5 flex items-center justify-center">
                    {isImage ? (
                      <img src={file.publicUrl} alt={file.name} className="h-full w-full object-cover" />
                    ) : (
                      <span className="material-symbols-outlined text-3xl text-foreground/20">description</span>
                    )}
                  </div>
                  <p className="text-xs font-medium truncate" title={file.name}>{file.name}</p>
                  {file.created_at && (
                    <p className="mt-0.5 text-[10px] text-foreground/40">{new Date(file.created_at).toLocaleDateString()}</p>
                  )}
                  <div className="mt-2 flex gap-1.5">
                    <button
                      type="button"
                      onClick={function() { copyUrl(file.publicUrl); setSelectedUrl(file.publicUrl); }}
                      className="flex-1 rounded-md bg-foreground/5 px-2 py-1 text-[11px] font-semibold text-foreground/60 transition-colors hover:bg-foreground/10 hover:text-foreground"
                    >
                      {copied && selectedUrl === file.publicUrl ? "Copied!" : "Copy URL"}
                    </button>
                    <a
                      href={file.publicUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="rounded-md bg-foreground/5 px-2 py-1 text-[11px] font-semibold text-foreground/60 transition-colors hover:bg-foreground/10 hover:text-foreground"
                    >
                      Open
                    </a>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
