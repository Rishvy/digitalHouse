"use client";

import { Minimize, ZoomIn, ZoomOut } from "lucide-react";

import { Editor } from "../types";

interface FooterProps {
  editor: Editor | undefined;
}

export const Footer = ({ editor }: FooterProps) => {
  return (
    <footer className="h-[52px] border-t bg-white w-full flex items-center overflow-x-auto z-[49] p-2 gap-x-1 shrink-0 px-4 flex-row-reverse">
      <button
        onClick={() => editor?.autoZoom()}
        className="h-full p-2 hover:bg-muted rounded-md transition-colors"
        title="Reset zoom"
      >
        <Minimize className="size-4" />
      </button>
      <button
        onClick={() => editor?.zoomIn()}
        className="h-full p-2 hover:bg-muted rounded-md transition-colors"
        title="Zoom in"
      >
        <ZoomIn className="size-4" />
      </button>
      <button
        onClick={() => editor?.zoomOut()}
        className="h-full p-2 hover:bg-muted rounded-md transition-colors"
        title="Zoom out"
      >
        <ZoomOut className="size-4" />
      </button>
    </footer>
  );
};