"use client";

import { useEffect, useState } from "react";

interface Category {
  id: string;
  name: string;
  slug: string;
  description: string | null;
}

export function AdminCategories() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ name: "", slug: "", description: "" });
  const [message, setMessage] = useState("");

  useEffect(() => {
    loadCategories();
  }, []);

  async function loadCategories() {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/categories");
      const data = await res.json();
      setCategories(data.categories ?? []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  function startEdit(cat: Category) {
    setEditingId(cat.id);
    setForm({ name: cat.name, slug: cat.slug, description: cat.description ?? "" });
    setShowForm(true);
  }

  function resetForm() {
    setForm({ name: "", slug: "", description: "" });
    setEditingId(null);
    setShowForm(false);
    setMessage("");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMessage("");
    try {
      const url = editingId ? `/api/admin/categories/${editingId}` : "/api/admin/categories";
      const method = editingId ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed");
      setMessage(editingId ? "Category updated" : "Category created");
      resetForm();
      loadCategories();
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Error");
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this category? Products in this category will be unlinked.")) return;
    try {
      const res = await fetch(`/api/admin/categories/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete");
      setMessage("Category deleted");
      loadCategories();
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Error");
    }
  }

  if (loading) {
    return <div className="rounded bg-surface-container p-4 text-sm">Loading categories...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-heading text-xl font-bold">Categories</h2>
        <button
          type="button"
          onClick={() => setShowForm(!showForm)}
          className="rounded bg-primary-container px-4 py-2 text-sm font-semibold text-on-primary-fixed"
        >
          {showForm ? "Cancel" : "+ Add Category"}
        </button>
      </div>

      {message && (
        <div className="rounded bg-tertiary-container px-4 py-2 text-sm text-on-tertiary-container">
          {message}
        </div>
      )}

      {showForm && (
        <form onSubmit={handleSubmit} className="space-y-3 rounded-lg bg-surface-container p-4">
          <h3 className="font-semibold text-sm">{editingId ? "Edit Category" : "New Category"}</h3>
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-semibold">Name</label>
              <input
                required
                value={form.name}
                onChange={(e) => {
                  const name = e.target.value;
                  setForm({ ...form, name, slug: name.toLowerCase().replace(/\s+/g, "-") });
                }}
                className="w-full rounded bg-surface-container-low px-3 py-2 text-sm"
                placeholder="Business Cards"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold">Slug</label>
              <input
                required
                value={form.slug}
                onChange={(e) => setForm({ ...form, slug: e.target.value })}
                className="w-full rounded bg-surface-container-low px-3 py-2 text-sm"
                placeholder="business-cards"
              />
            </div>
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold">Description (optional)</label>
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className="w-full rounded bg-surface-container-low px-3 py-2 text-sm resize-none"
              rows={2}
              placeholder="Professional business cards"
            />
          </div>
          <div className="flex gap-2">
            <button
              type="submit"
              className="rounded bg-primary-container px-4 py-2 text-sm font-semibold text-on-primary-fixed"
            >
              {editingId ? "Update" : "Create"}
            </button>
            <button
              type="button"
              onClick={resetForm}
              className="rounded bg-surface-container-low px-4 py-2 text-sm font-semibold"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      <div className="space-y-2">
        {categories.length === 0 ? (
          <p className="rounded bg-surface-container p-4 text-sm text-on-surface/60">
            No categories yet. Add one to get started.
          </p>
        ) : (
          categories.map((cat) => (
            <div
              key={cat.id}
              className="flex items-center justify-between rounded bg-surface-container p-4"
            >
              <div>
                <h3 className="font-semibold">{cat.name}</h3>
                <p className="text-xs text-on-surface/60">/{cat.slug}</p>
                {cat.description && <p className="mt-1 text-sm text-on-surface/70">{cat.description}</p>}
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => startEdit(cat)}
                  className="rounded bg-secondary-container px-3 py-1 text-xs font-semibold text-on-secondary-fixed"
                >
                  Edit
                </button>
                <button
                  type="button"
                  onClick={() => handleDelete(cat.id)}
                  className="rounded bg-error-container/20 px-3 py-1 text-xs font-semibold text-error"
                >
                  Delete
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
