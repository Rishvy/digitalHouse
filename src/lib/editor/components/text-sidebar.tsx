"use client";

import { useState } from "react";

import { ActiveTool, Editor } from "../types";

interface TextSidebarProps {
  editor: Editor | undefined;
  activeTool: ActiveTool;
  onChangeActiveTool: (tool: ActiveTool) => void;
}

export const TextSidebar = ({
  editor,
  activeTool,
  onChangeActiveTool,
}: TextSidebarProps) => {
  const [textValue, setTextValue] = useState("Text");

  const onClose = () => {
    onChangeActiveTool("select");
  };

  const handleAddText = () => {
    editor?.addText(textValue);
  };

  return (
    <aside
      className={`bg-white relative border-r z-[40] w-[320px] h-full flex flex-col ${
        activeTool === "text" ? "visible" : "hidden"
      }`}
    >
      <div className="p-4 border-b">
        <h2 className="text-lg font-semibold">Text</h2>
        <p className="text-sm text-muted-foreground">Add text to your canvas</p>
      </div>
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">Text Content</label>
          <input
            type="text"
            value={textValue}
            onChange={(e) => setTextValue(e.target.value)}
            className="w-full p-2 border rounded-md"
            placeholder="Enter text..."
          />
        </div>
        <button
          onClick={handleAddText}
          className="w-full py-2 px-4 bg-primary text-primary-foreground rounded-md hover:opacity-90 transition-opacity"
        >
          Add Text
        </button>
        <div className="pt-4 space-y-2">
          <p className="text-sm font-medium">Quick Add</p>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => editor?.addText("Heading", { fontSize: 80, fontWeight: 700 })}
              className="py-4 px-2 border rounded-md hover:bg-muted transition-colors text-left"
            >
              <span className="text-2xl font-bold block">Heading</span>
            </button>
            <button
              onClick={() => editor?.addText("Subheading", { fontSize: 44, fontWeight: 600 })}
              className="py-4 px-2 border rounded-md hover:bg-muted transition-colors text-left"
            >
              <span className="text-xl font-semibold block">Subheading</span>
            </button>
            <button
              onClick={() => editor?.addText("Paragraph", { fontSize: 32 })}
              className="py-4 px-2 border rounded-md hover:bg-muted transition-colors text-left"
            >
              <span className="text-lg block">Paragraph</span>
            </button>
            <button
              onClick={() => editor?.addText("Caption", { fontSize: 16 })}
              className="py-4 px-2 border rounded-md hover:bg-muted transition-colors text-left"
            >
              <span className="text-sm block">Caption</span>
            </button>
          </div>
        </div>
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