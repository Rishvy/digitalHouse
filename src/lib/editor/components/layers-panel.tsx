"use client";

import { useState } from "react";
import {
  ChevronDown,
  ChevronRight,
  Eye,
  EyeOff,
  Lock,
  Unlock,
  Trash2,
  Copy,
  Layers,
} from "lucide-react";

import { Editor } from "../types";

interface LayersPanelProps {
  editor: Editor | undefined;
}

export const LayersPanel = ({ editor }: LayersPanelProps) => {
  const [layers, setLayers] = useState<Array<{
    id: string;
    name: string;
    type: string;
    visible: boolean;
    locked: boolean;
  }>>([]);

  const refreshLayers = () => {
    if (editor) {
      setLayers(editor.getLayers());
    }
  };

  if (editor?.selectedObjects.length === 0 && layers.length === 0) {
    refreshLayers();
  }

  const toggleVisibility = (index: number) => {
    const objects = editor?.canvas.getObjects() || [];
    const obj = objects[index];
    if (obj) {
      obj.set({ visible: !obj.visible });
      editor?.canvas.renderAll();
      refreshLayers();
    }
  };

  const toggleLock = (index: number) => {
    const objects = editor?.canvas.getObjects() || [];
    const obj = objects[index];
    if (obj) {
      const isLocked = obj.selectable === false;
      obj.set({ selectable: isLocked, evented: isLocked });
      editor?.canvas.renderAll();
      refreshLayers();
    }
  };

  const deleteLayer = (index: number) => {
    const objects = editor?.canvas.getObjects() || [];
    if (objects[index]) {
      editor?.canvas.remove(objects[index]);
      editor?.canvas.renderAll();
      refreshLayers();
    }
  };

  const duplicateLayer = (index: number) => {
    const objects = editor?.canvas.getObjects() || [];
    if (objects[index]) {
      objects[index].clone((cloned: any) => {
        editor?.canvas.add(cloned);
        editor?.canvas.renderAll();
        refreshLayers();
      });
    }
  };

  const selectLayer = (index: number) => {
    const objects = editor?.canvas.getObjects() || [];
    if (objects[index]) {
      editor?.canvas.setActiveObject(objects[index]);
      editor?.canvas.renderAll();
    }
  };

  return (
    <aside
      className={`bg-white border-l w-[280px] h-full flex flex-col ${
        false ? "visible" : "hidden"
      }`}
    >
      <div className="p-3 border-b flex items-center justify-between">
        <h3 className="font-medium text-sm flex items-center gap-2">
          <Layers className="size-4" />
          Layers
        </h3>
        <button
          onClick={refreshLayers}
          className="text-xs text-muted-foreground hover:text-foreground"
        >
          Refresh
        </button>
      </div>
      <div className="flex-1 overflow-y-auto">
        {layers.length === 0 ? (
          <div className="p-4 text-center text-sm text-muted-foreground">
            No layers yet. Add shapes, text, or images to the canvas.
          </div>
        ) : (
          <div className="divide-y">
            {[...layers].reverse().map((layer, reverseIndex) => {
              const actualIndex = layers.length - 1 - reverseIndex;
              return (
                <div
                  key={layer.id}
                  className="flex items-center gap-2 p-2 hover:bg-muted/50 group"
                >
                  <button
                    onClick={() => toggleVisibility(actualIndex)}
                    className="p-1 hover:bg-muted rounded"
                    title={layer.visible ? "Hide" : "Show"}
                  >
                    {layer.visible ? (
                      <Eye className="size-4" />
                    ) : (
                      <EyeOff className="size-4 text-muted-foreground" />
                    )}
                  </button>
                  <button
                    onClick={() => toggleLock(actualIndex)}
                    className="p-1 hover:bg-muted rounded"
                    title={layer.locked ? "Unlock" : "Lock"}
                  >
                    {layer.locked ? (
                      <Lock className="size-4" />
                    ) : (
                      <Unlock className="size-4 text-muted-foreground" />
                    )}
                  </button>
                  <button
                    onClick={() => selectLayer(actualIndex)}
                    className="flex-1 text-left text-sm truncate hover:bg-muted rounded px-2 py-1"
                  >
                    {layer.name}
                  </button>
                  <div className="hidden group-hover:flex items-center gap-1">
                    <button
                      onClick={() => duplicateLayer(actualIndex)}
                      className="p-1 hover:bg-muted rounded"
                      title="Duplicate"
                    >
                      <Copy className="size-3" />
                    </button>
                    <button
                      onClick={() => deleteLayer(actualIndex)}
                      className="p-1 hover:bg-muted rounded text-red-500"
                      title="Delete"
                    >
                      <Trash2 className="size-3" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </aside>
  );
};