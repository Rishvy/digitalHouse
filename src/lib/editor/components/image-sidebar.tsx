"use client";

import { useRef } from "react";

import { ActiveTool, Editor } from "../types";

interface ImageSidebarProps {
  editor: Editor | undefined;
  activeTool: ActiveTool;
  onChangeActiveTool: (tool: ActiveTool) => void;
}

export const ImageSidebar = ({
  editor,
  activeTool,
  onChangeActiveTool,
}: ImageSidebarProps) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const onClose = () => {
    onChangeActiveTool("select");
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && editor) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        editor.addImage(result);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <aside
      className={`bg-white relative border-r z-[40] w-[320px] h-full flex flex-col ${
        activeTool === "images" ? "visible" : "hidden"
      }`}
    >
      <div className="p-4 border-b">
        <h2 className="text-lg font-semibold">Images</h2>
        <p className="text-sm text-muted-foreground">Add images to your canvas</p>
      </div>
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">Upload Image</label>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="w-full p-2 border rounded-md file:mr-2 file:px-2 file:rounded-md file:border file:text-sm file:font-medium file:bg-primary file:text-primary-foreground file:cursor-pointer"
          />
        </div>
        <p className="text-xs text-muted-foreground">
          Supports JPG, PNG, SVG, and other image formats. For best results, use high-resolution images (300 DPI for print).
        </p>
      </div>
      <div className="p-4 border-t">
        <button
          onClick={onClose}
          className="w-full py-2 px-4 border rounded-md hover:bg-muted transition-colors"
        >
          Close
        </button>
      </div>
    </aside>
  );
};