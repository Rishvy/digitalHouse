"use client";

import { useEffect, useRef, useState } from "react";
import Konva from "konva";
import { cn } from "@/lib/utils";

interface KonvaCanvasProps {
  designState: string | null;
  width: number;
  height: number;
  className?: string;
}

function freezeNode(node: Konva.Node) {
  node.setAttrs({ draggable: false, listening: false });
  const maybeChildren = (node as unknown as { getChildren?: () => Konva.Node[] }).getChildren?.() ?? [];
  maybeChildren.forEach((child) => freezeNode(child));
}

export function KonvaCanvas({ designState, width, height, className }: KonvaCanvasProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const stageRef = useRef<Konva.Stage | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!containerRef.current || !designState) return;

    try {
      const node = Konva.Node.create(designState) as Konva.Stage;
      const stage = node;
      stage.container(containerRef.current);
      stage.width(width);
      stage.height(height);

      const stageWidth = Number(stage.attrs.width ?? width);
      const stageHeight = Number(stage.attrs.height ?? height);
      const scale = Math.min(width / stageWidth, height / stageHeight);
      stage.scale({ x: scale, y: scale });

      stage.getChildren().forEach((layer) => freezeNode(layer));
      stage.draw();
      stageRef.current = stage;
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Invalid design state");
    }

    return () => {
      stageRef.current?.destroy();
      stageRef.current = null;
    };
  }, [designState, width, height]);

  if (!designState) {
    return (
      <div
        className={cn("flex items-center justify-center rounded bg-surface-container px-3 py-6 text-sm text-on-surface/70", className)}
      >
        No design
      </div>
    );
  }

  if (error) {
    return (
      <div className={cn("rounded bg-surface-container px-3 py-6 text-sm text-error", className)}>
        Failed to render design: {error}
      </div>
    );
  }

  return <div ref={containerRef} className={cn("overflow-hidden rounded bg-surface-container-lowest", className)} />;
}
