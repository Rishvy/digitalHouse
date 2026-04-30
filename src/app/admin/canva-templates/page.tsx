"use client";

import { useState, useEffect } from "react";
import Image from "next/image";

interface CanvaTemplate {
  id: string;
  canva_template_id: string;
  canva_template_url: string;
  name: string;
  description: string | null;
  thumbnail_url: string | null;
  product_category: string;
  created_at: string;
  updated_at: string;
}

const PRODUCT_CATEGORIES = [
  { value: "business_cards", label: "Business Cards" },
  { value: "flyers", label: "Flyers" },
  { value: "posters", label: "Posters" },
  { value: "brochures", label: "Brochures" },
  { value: "banners", label: "Banners" },
  { value: "invitations", label: "Invitations" },
  { value: "postcards", label: "Postcards" },
  { value: "other", label: "Other" },
];

export default function CanvaTemplatesAdmin() {
  const [templates, setTemplates] = useState<CanvaTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<CanvaTemplate | null>(null);
  
  // Form state
  const [formData, setFormData] = useState({
    canva_template_url: "",
    name: "",
    description: "",
    product_category: "business_cards",
  });
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/admin/canva-templates");
      const data = await response.json();
      setTemplates(data.templates || []);
    } catch (err) {
      console.error("Error fetching templates:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleThumbnailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setThumbnailFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setThumbnailPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      // Create or update template
      const url = editingTemplate
        ? `/api/admin/canva-templates/${editingTemplate.id}`
        : "/api/admin/canva-templates";
      
      const method = editingTemplate ? "PATCH" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to save template");
      }

      const templateId = data.template.id;

      // Upload thumbnail if provided
      if (thumbnailFile) {
        const formDataUpload = new FormData();
        formDataUpload.append("file", thumbnailFile);
        formDataUpload.append("templateId", templateId);

        const uploadResponse = await fetch("/api/admin/canva-templates/upload-thumbnail", {
          method: "POST",
          body: formDataUpload,
        });

        if (!uploadResponse.ok) {
          const uploadData = await uploadResponse.json();
          throw new Error(uploadData.error || "Failed to upload thumbnail");
        }
      }

      // Reset form and refresh list
      setFormData({
        canva_template_url: "",
        name: "",
        description: "",
        product_category: "business_cards",
      });
      setThumbnailFile(null);
      setThumbnailPreview(null);
      setShowForm(false);
      setEditingTemplate(null);
      fetchTemplates();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (template: CanvaTemplate) => {
    setEditingTemplate(template);
    setFormData({
      canva_template_url: template.canva_template_url,
      name: template.name,
      description: template.description || "",
      product_category: template.product_category,
    });
    setThumbnailPreview(template.thumbnail_url);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this template?")) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/canva-templates/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete template");
      }

      fetchTemplates();
    } catch (err) {
      console.error("Error deleting template:", err);
      alert("Failed to delete template");
    }
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingTemplate(null);
    setFormData({
      canva_template_url: "",
      name: "",
      description: "",
      product_category: "business_cards",
    });
    setThumbnailFile(null);
    setThumbnailPreview(null);
    setError(null);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Canva Template Management
          </h1>
          {!showForm && (
            <button
              onClick={() => setShowForm(true)}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Add New Template
            </button>
          )}
        </div>

        {showForm && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-8">
            <h2 className="text-xl font-semibold mb-4">
              {editingTemplate ? "Edit Template" : "Add New Template"}
            </h2>
            
            {error && (
              <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Canva Template URL *
                </label>
                <input
                  type="url"
                  required
                  value={formData.canva_template_url}
                  onChange={(e) =>
                    setFormData({ ...formData, canva_template_url: e.target.value })
                  }
                  placeholder="https://www.canva.com/templates/..."
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Paste the full Canva template URL
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Template Name *
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  placeholder="Modern Business Card"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  placeholder="A professional business card template with modern design"
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Product Category *
                </label>
                <select
                  required
                  value={formData.product_category}
                  onChange={(e) =>
                    setFormData({ ...formData, product_category: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  {PRODUCT_CATEGORIES.map((cat) => (
                    <option key={cat.value} value={cat.value}>
                      {cat.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Thumbnail Image (Optional)
                </label>
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={handleThumbnailChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Thumbnail will be automatically fetched from Canva. Upload only if you want to use a custom image. Max 500KB. JPEG, PNG, or WebP format.
                </p>
                {thumbnailPreview && (
                  <div className="mt-2">
                    <p className="text-sm text-gray-600 mb-1">Preview:</p>
                    <div className="relative w-48 h-64 border border-gray-200 rounded-lg overflow-hidden">
                      <Image
                        src={thumbnailPreview}
                        alt="Thumbnail preview"
                        fill
                        className="object-cover"
                      />
                    </div>
                  </div>
                )}
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-400"
                >
                  {submitting ? "Saving..." : editingTemplate ? "Update Template" : "Create Template"}
                </button>
                <button
                  type="button"
                  onClick={handleCancel}
                  className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {templates.map((template) => (
              <div
                key={template.id}
                className="bg-white rounded-lg shadow-md overflow-hidden"
              >
                <div className="aspect-[3/4] bg-gray-100 relative">
                  {template.thumbnail_url ? (
                    <Image
                      src={template.thumbnail_url}
                      alt={template.name}
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <svg
                        className="w-16 h-16 text-gray-400"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                        />
                      </svg>
                    </div>
                  )}
                </div>
                <div className="p-4">
                  <h3 className="font-semibold text-gray-900 mb-1">
                    {template.name}
                  </h3>
                  <p className="text-sm text-gray-600 mb-2">
                    {PRODUCT_CATEGORIES.find(
                      (cat) => cat.value === template.product_category
                    )?.label || template.product_category}
                  </p>
                  {template.description && (
                    <p className="text-sm text-gray-500 mb-3 line-clamp-2">
                      {template.description}
                    </p>
                  )}
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEdit(template)}
                      className="flex-1 px-3 py-1 bg-blue-50 text-blue-600 rounded hover:bg-blue-100 transition-colors text-sm"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(template.id)}
                      className="flex-1 px-3 py-1 bg-red-50 text-red-600 rounded hover:bg-red-100 transition-colors text-sm"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {!loading && templates.length === 0 && !showForm && (
          <div className="text-center py-12">
            <p className="text-gray-600 mb-4">No templates yet.</p>
            <button
              onClick={() => setShowForm(true)}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Add Your First Template
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
