"use client";

import { useEffect, useState } from "react";

interface HomepageSection {
  id: string;
  section_type: string;
  title: string | null;
  subtitle: string | null;
  content: string | null;
  background_type: string;
  background_value: string | null;
  layout: string;
  display_order: number;
  is_active: boolean;
  items?: SectionItem[];
}

interface SectionItem {
  id?: string;
  title: string;
  subtitle?: string;
  image_url?: string;
  link_url?: string;
  background_color?: string;
  display_order: number;
}

export function AdminHomepage() {
  const [sections, setSections] = useState<HomepageSection[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingSection, setEditingSection] = useState<HomepageSection | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    loadSections();
  }, []);

  async function loadSections() {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/homepage");
      const data = await res.json();
      setSections(data.sections ?? []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  function startEdit(section: HomepageSection) {
    setEditingSection(section);
    setShowForm(true);
  }

  function startNew() {
    setEditingSection({
      id: "",
      section_type: "hero",
      title: "",
      subtitle: "",
      content: "",
      background_type: "color",
      background_value: "#f6f6f6",
      layout: "default",
      display_order: sections.length,
      is_active: true,
      items: [],
    });
    setShowForm(true);
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this section?")) return;
    try {
      const res = await fetch(`/api/admin/homepage/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete");
      setMessage("Section deleted");
      loadSections();
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Error");
    }
  }

  async function toggleActive(id: string, isActive: boolean) {
    try {
      const res = await fetch(`/api/admin/homepage/${id}/toggle`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_active: !isActive }),
      });
      if (!res.ok) throw new Error("Failed to toggle");
      loadSections();
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Error");
    }
  }

  if (loading) {
    return <div className="rounded bg-surface-container p-4 text-sm">Loading...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-heading text-lg font-semibold">Homepage Sections</h2>
        <button
          type="button"
          onClick={startNew}
          className="rounded bg-primary-container px-4 py-2 text-sm font-semibold text-on-primary-fixed"
        >
          + Add Section
        </button>
      </div>

      {message && (
        <div className="rounded bg-tertiary-container px-4 py-2 text-sm text-on-tertiary-container">
          {message}
        </div>
      )}

      {showForm && editingSection && (
        <HomepageSectionForm
          section={editingSection}
          onSuccess={() => {
            setShowForm(false);
            setEditingSection(null);
            loadSections();
          }}
          onCancel={() => {
            setShowForm(false);
            setEditingSection(null);
          }}
        />
      )}

      <div className="space-y-3">
        {sections.length === 0 ? (
          <p className="rounded bg-surface-container p-4 text-sm text-on-surface/60">
            No sections yet. Add one to customize your homepage.
          </p>
        ) : (
          sections.map((section) => (
            <div
              key={section.id}
              className={`rounded-lg bg-surface-container p-4 ${!section.is_active ? "opacity-50" : ""}`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold">{section.title || "Untitled Section"}</h3>
                    <span className="rounded bg-secondary-container px-2 py-0.5 text-xs text-on-secondary-fixed">
                      {section.section_type}
                    </span>
                    {!section.is_active && (
                      <span className="rounded bg-error-container/20 px-2 py-0.5 text-xs text-error">
                        Hidden
                      </span>
                    )}
                  </div>
                  {section.subtitle && <p className="mt-1 text-sm text-on-surface/70">{section.subtitle}</p>}
                  <p className="mt-1 text-xs text-on-surface/60">
                    Background: {section.background_type} • Layout: {section.layout}
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => toggleActive(section.id, section.is_active)}
                    className="rounded bg-surface-container-low px-3 py-1 text-xs font-semibold"
                  >
                    {section.is_active ? "Hide" : "Show"}
                  </button>
                  <button
                    type="button"
                    onClick={() => startEdit(section)}
                    className="rounded bg-secondary-container px-3 py-1 text-xs font-semibold text-on-secondary-fixed"
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(section.id)}
                    className="rounded bg-error-container/20 px-3 py-1 text-xs font-semibold text-error"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

function HomepageSectionForm({
  section,
  onSuccess,
  onCancel,
}: {
  section: HomepageSection;
  onSuccess: () => void;
  onCancel: () => void;
}) {
  const [form, setForm] = useState(section);
  const [items, setItems] = useState<SectionItem[]>(section.items ?? []);
  const [status, setStatus] = useState<"idle" | "loading">("idle");
  const [message, setMessage] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("loading");
    setMessage("");

    try {
      const url = form.id ? `/api/admin/homepage/${form.id}` : "/api/admin/homepage";
      const method = form.id ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, items }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed");
      onSuccess();
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Error");
      setStatus("idle");
    }
  }

  function addItem() {
    setItems([
      ...items,
      {
        title: "",
        subtitle: "",
        image_url: "",
        link_url: "",
        background_color: "#ffd709",
        display_order: items.length,
      },
    ]);
  }

  function updateItem(index: number, field: keyof SectionItem, value: string) {
    setItems(items.map((item, i) => (i === index ? { ...item, [field]: value } : item)));
  }

  function removeItem(index: number) {
    setItems(items.filter((_, i) => i !== index));
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 rounded-lg bg-surface-container p-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold">{form.id ? "Edit Section" : "New Section"}</h3>
        <button type="button" onClick={onCancel} className="text-sm text-on-surface/60">
          ✕ Close
        </button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-xs font-semibold">Section Type</label>
          <select
            value={form.section_type}
            onChange={(e) => setForm({ ...form, section_type: e.target.value })}
            className="w-full rounded bg-surface-container-low px-3 py-2 text-sm"
          >
            <option value="hero">Hero Banner</option>
            <option value="category_grid">Category Grid</option>
            <option value="text_block">Text Block</option>
            <option value="image_banner">Image Banner</option>
          </select>
        </div>
        <div>
          <label className="mb-1 block text-xs font-semibold">Layout</label>
          <select
            value={form.layout}
            onChange={(e) => setForm({ ...form, layout: e.target.value })}
            className="w-full rounded bg-surface-container-low px-3 py-2 text-sm"
          >
            <option value="default">Default</option>
            <option value="split">Split (50/50)</option>
            <option value="full-width">Full Width</option>
            <option value="centered">Centered</option>
          </select>
        </div>
      </div>

      <div>
        <label className="mb-1 block text-xs font-semibold">Title</label>
        <input
          value={form.title ?? ""}
          onChange={(e) => setForm({ ...form, title: e.target.value })}
          className="w-full rounded bg-surface-container-low px-3 py-2 text-sm"
          placeholder="Section title"
        />
      </div>

      <div>
        <label className="mb-1 block text-xs font-semibold">Subtitle</label>
        <input
          value={form.subtitle ?? ""}
          onChange={(e) => setForm({ ...form, subtitle: e.target.value })}
          className="w-full rounded bg-surface-container-low px-3 py-2 text-sm"
          placeholder="Optional subtitle"
        />
      </div>

      <div>
        <label className="mb-1 block text-xs font-semibold">Content</label>
        <textarea
          value={form.content ?? ""}
          onChange={(e) => setForm({ ...form, content: e.target.value })}
          className="w-full rounded bg-surface-container-low px-3 py-2 text-sm resize-none"
          rows={3}
          placeholder="Optional content text"
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-xs font-semibold">Background Type</label>
          <select
            value={form.background_type}
            onChange={(e) => setForm({ ...form, background_type: e.target.value })}
            className="w-full rounded bg-surface-container-low px-3 py-2 text-sm"
          >
            <option value="color">Solid Color</option>
            <option value="image">Image</option>
            <option value="gradient">Gradient</option>
          </select>
        </div>
        <div>
          <label className="mb-1 block text-xs font-semibold">Background Value</label>
          {form.background_type === "color" ? (
            <input
              type="color"
              value={form.background_value ?? "#f6f6f6"}
              onChange={(e) => setForm({ ...form, background_value: e.target.value })}
              className="h-10 w-full cursor-pointer rounded"
            />
          ) : form.background_type === "image" ? (
            <div className="space-y-2">
              <input
                value={form.background_value ?? ""}
                onChange={(e) => setForm({ ...form, background_value: e.target.value })}
                className="w-full rounded bg-surface-container-low px-3 py-2 text-sm"
                placeholder="Image URL"
              />
            </div>
          ) : (
            <input
              value={form.background_value ?? ""}
              onChange={(e) => setForm({ ...form, background_value: e.target.value })}
              className="w-full rounded bg-surface-container-low px-3 py-2 text-sm"
              placeholder="CSS gradient (e.g., linear-gradient(...))"
            />
          )}
        </div>
      </div>

      {form.section_type === "category_grid" && (
        <div className="space-y-3 rounded-lg bg-surface-container-low p-4">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-semibold">Grid Items</h4>
            <button
              type="button"
              onClick={addItem}
              className="rounded bg-secondary-container px-3 py-1 text-xs font-semibold text-on-secondary-fixed"
            >
              + Add Item
            </button>
          </div>
          {items.map((item, idx) => (
            <div key={idx} className="space-y-2 rounded bg-surface-container p-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold">Item {idx + 1}</span>
                <button
                  type="button"
                  onClick={() => removeItem(idx)}
                  className="text-xs text-error hover:underline"
                >
                  Remove
                </button>
              </div>
              <input
                value={item.title}
                onChange={(e) => updateItem(idx, "title", e.target.value)}
                className="w-full rounded bg-surface-container-low px-3 py-2 text-sm"
                placeholder="Title"
              />
              <input
                value={item.link_url ?? ""}
                onChange={(e) => updateItem(idx, "link_url", e.target.value)}
                className="w-full rounded bg-surface-container-low px-3 py-2 text-sm"
                placeholder="Link URL"
              />
              <div className="flex gap-2">
                <input
                  type="color"
                  value={item.background_color ?? "#ffd709"}
                  onChange={(e) => updateItem(idx, "background_color", e.target.value)}
                  className="h-10 w-20 cursor-pointer rounded"
                />
                <input
                  value={item.image_url ?? ""}
                  onChange={(e) => updateItem(idx, "image_url", e.target.value)}
                  className="flex-1 rounded bg-surface-container-low px-3 py-2 text-sm"
                  placeholder="Image URL (optional)"
                />
              </div>
            </div>
          ))}
        </div>
      )}

      {message && <p className="text-sm text-error">{message}</p>}

      <div className="flex gap-2">
        <button
          type="submit"
          disabled={status === "loading"}
          className="rounded bg-primary-container px-4 py-2 text-sm font-semibold text-on-primary-fixed disabled:opacity-50"
        >
          {status === "loading" ? "Saving..." : form.id ? "Update" : "Create"}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="rounded bg-surface-container-low px-4 py-2 text-sm font-semibold"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
