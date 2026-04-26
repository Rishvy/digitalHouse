"use client";

import { useState } from "react";

import { Editor } from "../types";

const PATTERNS = [
  { id: "dots", name: "Dots", url: "" },
  { id: "lines", name: "Lines", url: "" },
  { id: "cross", name: "Cross", url: "" },
  { id: "grid", name: "Grid", url: "" },
  { id: "diagonal", name: "Diagonal", url: "" },
  { id: "waves", name: "Waves", url: "" },
];

const SOLID_COLORS = [
  "#FFFFFF", "#000000", "#F3F4F6", "#E5E7EB", "#9CA3AF",
  "#EF4444", "#F97316", "#EAB308", "#22C55E", "#14B8A6",
  "#3B82F6", "#8B5CF6", "#EC4899", "#F43F5E",
];

interface BackgroundsPanelProps {
  editor: Editor | undefined;
}

export const BackgroundsPanel = ({ editor }: BackgroundsPanelProps) => {
  const [activeTab, setActiveTab] = useState<"colors" | "patterns">("colors");

  const handleColorSelect = (color: string) => {
    editor?.changeBackground(color);
  };

  const handleClearBackground = () => {
    editor?.clearBackground();
  };

  return (
    <aside
      className={`bg-white border-r w-[320px] h-full flex flex-col ${
        false ? "visible" : "hidden"
      }`}
    >
      <div className="p-4 border-b">
        <h2 className="text-lg font-semibold">Background</h2>
        <p className="text-sm text-muted-foreground">
          Set canvas background color or pattern
        </p>
      </div>
      
      <div className="flex border-b">
        <button
          onClick={() => setActiveTab("colors")}
          className={`flex-1 py-2 text-sm font-medium ${
            activeTab === "colors"
              ? "border-b-2 border-primary text-primary"
              : "text-muted-foreground"
          }`}
        >
          Colors
        </button>
        <button
          onClick={() => setActiveTab("patterns")}
          className={`flex-1 py-2 text-sm font-medium ${
            activeTab === "patterns"
              ? "border-b-2 border-primary text-primary"
              : "text-muted-foreground"
          }`}
        >
          Patterns
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        {activeTab === "colors" && (
          <div className="space-y-4">
            <div className="grid grid-cols-5 gap-2">
              {SOLID_COLORS.map((color) => (
                <button
                  key={color}
                  onClick={() => handleColorSelect(color)}
                  className="w-10 h-10 rounded-lg border shadow-sm hover:ring-2 hover:ring-primary transition-all"
                  style={{ backgroundColor: color }}
                  title={color}
                />
              ))}
            </div>
            <div className="pt-2">
              <button
                onClick={handleClearBackground}
                className="w-full py-2 text-sm border rounded-md hover:bg-muted"
              >
                Clear Background
              </button>
            </div>
          </div>
        )}

        {activeTab === "patterns" && (
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">
              Click a pattern to apply it to the background
            </p>
            <div className="grid grid-cols-3 gap-2">
              {PATTERNS.map((pattern) => (
                <button
                  key={pattern.id}
                  onClick={() => {}}
                  className="aspect-square rounded-lg border bg-pattern-preview hover:ring-2 hover:ring-primary transition-all"
                  title={pattern.name}
                >
                  {pattern.name}
                </button>
              ))}
            </div>
            <p className="text-xs text-muted-foreground pt-2">
              Upload custom patterns to add more options
            </p>
          </div>
        )}
      </div>
    </aside>
  );
};