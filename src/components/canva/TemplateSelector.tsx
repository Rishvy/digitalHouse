"use client";

import { useState, useEffect } from "react";
import Image from "next/image";

interface CanvaTemplate {
  id: string;
  canva_template_id: string;
  name: string;
  description: string | null;
  thumbnail_url: string | null;
  product_category: string;
}

interface TemplateSelectorProps {
  category: string;
  productId?: string;
  variationId?: string;
  onSelect: (templateId: string | null) => void;
}

export default function TemplateSelector({
  category,
  productId,
  variationId,
  onSelect,
}: TemplateSelectorProps) {
  const [templates, setTemplates] = useState<CanvaTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);

  useEffect(() => {
    async function fetchTemplates() {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch(
          `/api/canva/templates?category=${encodeURIComponent(category)}`
        );

        if (!response.ok) {
          throw new Error("Failed to load templates");
        }

        const data = await response.json();
        setTemplates(data.templates || []);
      } catch (err) {
        console.error("Error fetching templates:", err);
        setError("Unable to load templates. Please try again.");
      } finally {
        setLoading(false);
      }
    }

    fetchTemplates();
  }, [category]);

  const handleTemplateSelect = (templateId: string | null) => {
    setSelectedTemplate(templateId);
    onSelect(templateId);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading templates...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center max-w-md">
          <div className="text-red-600 mb-4">
            <svg
              className="w-16 h-16 mx-auto"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <p className="text-gray-700 mb-4">{error}</p>
          <button
            onClick={() => handleTemplateSelect(null)}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Start with Blank Canvas
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-6xl mx-auto p-6">
      <div className="mb-8 text-center">
        <h2 className="text-3xl font-bold text-gray-900 mb-2">
          Choose a Template
        </h2>
        <p className="text-gray-600">
          Select a template to get started, or create your own from scratch
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Blank Canvas Option */}
        <button
          onClick={() => handleTemplateSelect(null)}
          className={`group relative overflow-hidden rounded-xl border-2 transition-all duration-200 ${
            selectedTemplate === null
              ? "border-blue-600 shadow-lg scale-105"
              : "border-gray-200 hover:border-gray-300 hover:shadow-md"
          }`}
        >
          <div className="aspect-[3/4] bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
            <div className="text-center">
              <svg
                className="w-16 h-16 mx-auto mb-3 text-gray-400 group-hover:text-gray-600 transition-colors"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 4v16m8-8H4"
                />
              </svg>
              <p className="text-lg font-semibold text-gray-700">
                Blank Canvas
              </p>
              <p className="text-sm text-gray-500 mt-1">Start from scratch</p>
            </div>
          </div>
          {selectedTemplate === null && (
            <div className="absolute top-3 right-3 bg-blue-600 text-white rounded-full p-1">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
          )}
        </button>

        {/* Template Options */}
        {templates.map((template) => (
          <button
            key={template.id}
            onClick={() => handleTemplateSelect(template.id)}
            className={`group relative overflow-hidden rounded-xl border-2 transition-all duration-200 ${
              selectedTemplate === template.id
                ? "border-blue-600 shadow-lg scale-105"
                : "border-gray-200 hover:border-gray-300 hover:shadow-md"
            }`}
          >
            <div className="aspect-[3/4] bg-gray-100 relative">
              {template.thumbnail_url ? (
                <Image
                  src={template.thumbnail_url}
                  alt={template.name}
                  fill
                  className="object-cover"
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200">
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
            <div className="p-4 bg-white">
              <h3 className="font-semibold text-gray-900 text-left">
                {template.name}
              </h3>
              {template.description && (
                <p className="text-sm text-gray-600 mt-1 text-left line-clamp-2">
                  {template.description}
                </p>
              )}
            </div>
            {selectedTemplate === template.id && (
              <div className="absolute top-3 right-3 bg-blue-600 text-white rounded-full p-1">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
            )}
          </button>
        ))}
      </div>

      {templates.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-600 mb-4">
            No templates available for this category yet.
          </p>
          <button
            onClick={() => handleTemplateSelect(null)}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Start with Blank Canvas
          </button>
        </div>
      )}
    </div>
  );
}
