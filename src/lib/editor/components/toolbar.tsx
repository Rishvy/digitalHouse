"use client";

import { useState } from "react";

import {
  FaBold,
  FaItalic,
  FaStrikethrough,
  FaUnderline,
} from "react-icons/fa";
import { BsBorderWidth } from "react-icons/bs";
import {
  ArrowUp,
  ArrowDown,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Trash,
  Copy,
  FlipHorizontal,
  FlipVertical,
  RotateCw,
} from "lucide-react";

import { isTextType } from "../utils";
import { ActiveTool, Editor, FONT_SIZE } from "../types";

import { cn } from "@/lib/utils";

interface ToolbarProps {
  editor: Editor | undefined;
  activeTool: ActiveTool;
  onChangeActiveTool: (tool: ActiveTool) => void;
}

export const Toolbar = ({
  editor,
  activeTool,
  onChangeActiveTool,
}: ToolbarProps) => {
  const selectedObject = editor?.selectedObjects[0];
  const selectedObjectType = editor?.selectedObjects[0]?.type;

  const isText = isTextType(selectedObjectType);
  const isImage = selectedObjectType === "image";
  const hasSelection = editor?.selectedObjects.length ?? 0 > 0;

  const initialFillColor = editor?.getActiveFillColor();
  const initialStrokeColor = editor?.getActiveStrokeColor();
  const initialFontFamily = editor?.getActiveFontFamily();
  const initialFontWeight = editor?.getActiveFontWeight() || 400;
  const initialFontStyle = editor?.getActiveFontStyle();
  const initialFontLinethrough = editor?.getActiveFontLinethrough();
  const initialFontUnderline = editor?.getActiveFontUnderline();
  const initialTextAlign = editor?.getActiveTextAlign();
  const initialFontSize = editor?.getActiveFontSize() || FONT_SIZE;
  const initialOpacity = editor?.getActiveOpacity() ?? 1;

  const [properties, setProperties] = useState({
    fillColor: initialFillColor,
    strokeColor: initialStrokeColor,
    fontFamily: initialFontFamily,
    fontWeight: initialFontWeight,
    fontStyle: initialFontStyle,
    fontLinethrough: initialFontLinethrough,
    fontUnderline: initialFontUnderline,
    textAlign: initialTextAlign,
    fontSize: initialFontSize,
    opacity: initialOpacity,
  });

  const onChangeFontSize = (value: number) => {
    if (!selectedObject) return;
    editor?.changeFontSize(value);
    setProperties((current) => ({ ...current, fontSize: value }));
  };

  const onChangeTextAlign = (value: string) => {
    if (!selectedObject) return;
    editor?.changeTextAlign(value);
    setProperties((current) => ({ ...current, textAlign: value }));
  };

  const onChangeOpacity = (value: number) => {
    if (!selectedObject) return;
    editor?.changeOpacity(value);
    setProperties((current) => ({ ...current, opacity: value }));
  };

  const toggleBold = () => {
    if (!selectedObject) return;
    const newValue = properties.fontWeight > 500 ? 500 : 700;
    editor?.changeFontWeight(newValue);
    setProperties((current) => ({ ...current, fontWeight: newValue }));
  };

  const toggleItalic = () => {
    if (!selectedObject) return;
    const isItalic = properties.fontStyle === "italic";
    const newValue = isItalic ? "normal" : "italic";
    editor?.changeFontStyle(newValue);
    setProperties((current) => ({ ...current, fontStyle: newValue }));
  };

  const toggleLinethrough = () => {
    if (!selectedObject) return;
    const newValue = properties.fontLinethrough ? false : true;
    editor?.changeFontLinethrough(newValue);
    setProperties((current) => ({ ...current, fontLinethrough: newValue }));
  };

  const toggleUnderline = () => {
    if (!selectedObject) return;
    const newValue = properties.fontUnderline ? false : true;
    editor?.changeFontUnderline(newValue);
    setProperties((current) => ({ ...current, fontUnderline: newValue }));
  };

  if (!hasSelection) {
    return (
      <div className="shrink-0 h-14 border-b bg-white w-full flex items-center overflow-x-auto z-50 p-2 gap-x-1" />
    );
  }

  return (
    <div className="shrink-0 h-14 border-b bg-white w-full flex items-center overflow-x-auto z-50 p-2 gap-x-1">
      {/* Fill Color */}
      {!isImage && (
        <div className="flex items-center h-full justify-center">
          <button
            onClick={() => onChangeActiveTool("fill")}
            className={cn(
              "p-2 rounded-md hover:bg-muted transition-colors",
              activeTool === "fill" && "bg-muted"
            )}
            title="Fill Color"
          >
            <div
              className="rounded-sm w-5 h-5 border"
              style={{ backgroundColor: properties.fillColor }}
            />
          </button>
        </div>
      )}

      {/* Stroke Color */}
      {!isText && (
        <div className="flex items-center h-full justify-center">
          <button
            onClick={() => onChangeActiveTool("stroke-color")}
            className={cn(
              "p-2 rounded-md hover:bg-muted transition-colors",
              activeTool === "stroke-color" && "bg-muted"
            )}
            title="Stroke Color"
          >
            <div
              className="rounded-sm w-5 h-5 border-2 bg-white"
              style={{ borderColor: properties.strokeColor }}
            />
          </button>
        </div>
      )}

      {/* Stroke Width */}
      {!isText && (
        <div className="flex items-center h-full justify-center">
          <button
            onClick={() => onChangeActiveTool("stroke-width")}
            className={cn(
              "p-2 rounded-md hover:bg-muted transition-colors",
              activeTool === "stroke-width" && "bg-muted"
            )}
            title="Stroke Width"
          >
            <BsBorderWidth className="w-4 h-4" />
          </button>
        </div>
      )}

      <div className="w-px h-8 bg-border mx-1" />

      {/* Text Formatting */}
      {isText && (
        <div className="flex items-center h-full gap-1">
          <button
            onClick={toggleBold}
            className={cn(
              "p-2 rounded-md hover:bg-muted transition-colors",
              properties.fontWeight > 500 && "bg-muted"
            )}
            title="Bold"
          >
            <FaBold className="w-4 h-4" />
          </button>
          <button
            onClick={toggleItalic}
            className={cn(
              "p-2 rounded-md hover:bg-muted transition-colors",
              properties.fontStyle === "italic" && "bg-muted"
            )}
            title="Italic"
          >
            <FaItalic className="w-4 h-4" />
          </button>
          <button
            onClick={toggleUnderline}
            className={cn(
              "p-2 rounded-md hover:bg-muted transition-colors",
              properties.fontUnderline && "bg-muted"
            )}
            title="Underline"
          >
            <FaUnderline className="w-4 h-4" />
          </button>
          <button
            onClick={toggleLinethrough}
            className={cn(
              "p-2 rounded-md hover:bg-muted transition-colors",
              properties.fontLinethrough && "bg-muted"
            )}
            title="Strikethrough"
          >
            <FaStrikethrough className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Alignment */}
      {isText && <div className="w-px h-8 bg-border mx-1" />}

      {isText && (
        <div className="flex items-center h-full gap-1">
          <button
            onClick={() => editor?.alignLeft()}
            className="p-2 rounded-md hover:bg-muted transition-colors"
            title="Align Left"
          >
            <AlignLeft className="w-4 h-4" />
          </button>
          <button
            onClick={() => editor?.alignCenter()}
            className="p-2 rounded-md hover:bg-muted transition-colors"
            title="Align Center"
          >
            <AlignCenter className="w-4 h-4" />
          </button>
          <button
            onClick={() => editor?.alignRight()}
            className="p-2 rounded-md hover:bg-muted transition-colors"
            title="Align Right"
          >
            <AlignRight className="w-4 h-4" />
          </button>
        </div>
      )}

      <div className="w-px h-8 bg-border mx-1" />

      {/* Flip & Rotate */}
      <div className="flex items-center h-full gap-1">
        <button
          onClick={() => editor?.flipX()}
          className="p-2 rounded-md hover:bg-muted transition-colors"
          title="Flip Horizontal"
        >
          <FlipHorizontal className="w-4 h-4" />
        </button>
        <button
          onClick={() => editor?.flipY()}
          className="p-2 rounded-md hover:bg-muted transition-colors"
          title="Flip Vertical"
        >
          <FlipVertical className="w-4 h-4" />
        </button>
        <button
          onClick={() => editor?.rotate90()}
          className="p-2 rounded-md hover:bg-muted transition-colors"
          title="Rotate 90°"
        >
          <RotateCw className="w-4 h-4" />
        </button>
      </div>

      <div className="w-px h-8 bg-border mx-1" />

      {/* Layer Order */}
      <div className="flex items-center h-full gap-1">
        <button
          onClick={() => editor?.bringForward()}
          className="p-2 rounded-md hover:bg-muted transition-colors"
          title="Bring Forward"
        >
          <ArrowUp className="w-4 h-4" />
        </button>
        <button
          onClick={() => editor?.sendBackwards()}
          className="p-2 rounded-md hover:bg-muted transition-colors"
          title="Send Backward"
        >
          <ArrowDown className="w-4 h-4" />
        </button>
      </div>

      <div className="w-px h-8 bg-border mx-1" />

      {/* Duplicate & Delete */}
      <div className="flex items-center h-full gap-1">
        <button
          onClick={() => editor?.duplicate()}
          className="p-2 rounded-md hover:bg-muted transition-colors"
          title="Duplicate"
        >
          <Copy className="w-4 h-4" />
        </button>
        <button
          onClick={() => editor?.delete()}
          className="p-2 rounded-md hover:bg-muted transition-colors text-red-500"
          title="Delete"
        >
          <Trash className="w-4 h-4" />
        </button>
      </div>

      {/* Opacity */}
      <div className="flex items-center h-full gap-2 ml-2">
        <input
          type="range"
          min="0"
          max="1"
          step="0.1"
          value={properties.opacity}
          onChange={(e) => onChangeOpacity(parseFloat(e.target.value))}
          className="w-20"
          title="Opacity"
        />
        <span className="text-xs w-8">{Math.round(properties.opacity * 100)}%</span>
      </div>
    </div>
  );
};