"use client";

import {
  ChevronDown,
  Download,
  MousePointerClick,
  Redo2,
  Undo2,
} from "lucide-react";

import { ActiveTool, Editor } from "../types";

import { cn } from "@/lib/utils";

interface NavbarProps {
  editor: Editor | undefined;
  activeTool: ActiveTool;
  onChangeActiveTool: (tool: ActiveTool) => void;
  onExport?: (format: "png" | "jpg" | "svg" | "json" | "print-pdf", data?: string) => void;
  productName?: string;
}

export const Navbar = ({
  editor,
  activeTool,
  onChangeActiveTool,
  onExport,
  productName = "Untitled Design",
}: NavbarProps) => {
  const handleExport = (format: "png" | "jpg" | "svg" | "json" | "print-pdf", data?: string) => {
    switch (format) {
      case "png":
        editor?.savePng();
        break;
      case "jpg":
        editor?.saveJpg();
        break;
      case "svg":
        editor?.saveSvg();
        break;
      case "json":
        editor?.saveJson();
        break;
      case "print-pdf":
        const json = JSON.stringify(editor?.canvas.toJSON());
        onExport?.(format, json);
        break;
    }
  };

  return (
    <nav className="w-full flex items-center p-4 h-[68px] gap-x-8 border-b bg-white">
      <div className="flex items-center">
        <h1 className="text-lg font-semibold">Print Editor</h1>
        <span className="mx-2 text-muted-foreground">/</span>
        <span className="text-muted-foreground">{productName}</span>
      </div>
      <div className="w-full flex items-center gap-x-1 h-full">
        <button
          onClick={() => onChangeActiveTool("select")}
          className={cn(
            "p-2 rounded-md hover:bg-muted transition-colors",
            activeTool === "select" && "bg-muted"
          )}
          title="Select"
        >
          <MousePointerClick className="size-4" />
        </button>
        <button
          onClick={() => editor?.onUndo()}
          disabled={!editor?.canUndo()}
          className="p-2 rounded-md hover:bg-muted transition-colors disabled:opacity-50"
          title="Undo"
        >
          <Undo2 className="size-4" />
        </button>
        <button
          onClick={() => editor?.onRedo()}
          disabled={!editor?.canRedo()}
          className="p-2 rounded-md hover:bg-muted transition-colors disabled:opacity-50"
          title="Redo"
        >
          <Redo2 className="size-4" />
        </button>
        <div className="mx-2 h-6 w-px bg-border" />
        <div className="ml-auto flex items-center gap-x-4">
          <div className="relative group">
            <button className="flex items-center gap-2 px-3 py-1.5 rounded-md hover:bg-muted transition-colors text-sm">
              Export
              <ChevronDown className="size-4" />
            </button>
            <div className="absolute right-0 mt-1 w-48 bg-white border rounded-md shadow-lg hidden group-hover:block z-50">
              <button
                onClick={() => handleExport("png")}
                className="w-full px-4 py-2 text-left text-sm hover:bg-muted"
              >
                PNG (Web)
              </button>
              <button
                onClick={() => handleExport("jpg")}
                className="w-full px-4 py-2 text-left text-sm hover:bg-muted"
              >
                JPG (Print)
              </button>
              <button
                onClick={() => handleExport("svg")}
                className="w-full px-4 py-2 text-left text-sm hover:bg-muted"
              >
                SVG (Vector)
              </button>
              <button
                onClick={() => handleExport("print-pdf")}
                className="w-full px-4 py-2 text-left text-sm hover:bg-muted font-medium"
              >
                PDF (Press Ready)
              </button>
              <button
                onClick={() => handleExport("json")}
                className="w-full px-4 py-2 text-left text-sm hover:bg-muted"
              >
                JSON (Editable)
              </button>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
};