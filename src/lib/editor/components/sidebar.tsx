"use client";

import {
  LayoutTemplate,
  ImageIcon,
  Pencil,
  Settings,
  Shapes,
  Type,
  Layers,
  Palette,
  Square,
} from "lucide-react";

import { ActiveTool } from "../types";
import { SidebarItem } from "./sidebar-item";

interface SidebarProps {
  activeTool: ActiveTool;
  onChangeActiveTool: (tool: ActiveTool) => void;
}

export const Sidebar = ({
  activeTool,
  onChangeActiveTool,
}: SidebarProps) => {
  return (
    <aside className="bg-white flex flex-col w-[72px] h-full border-r overflow-y-auto">
      <ul className="flex flex-col gap-1 p-1">
        <SidebarItem
          icon={LayoutTemplate}
          label="Templates"
          isActive={activeTool === "templates"}
          onClick={() => onChangeActiveTool("templates")}
        />
        <SidebarItem
          icon={Type}
          label="Text"
          isActive={activeTool === "text"}
          onClick={() => onChangeActiveTool("text")}
        />
        <SidebarItem
          icon={Shapes}
          label="Shapes"
          isActive={activeTool === "shapes"}
          onClick={() => onChangeActiveTool("shapes")}
        />
        <SidebarItem
          icon={ImageIcon}
          label="Images"
          isActive={activeTool === "images"}
          onClick={() => onChangeActiveTool("images")}
        />
        <SidebarItem
          icon={Pencil}
          label="Draw"
          isActive={activeTool === "draw"}
          onClick={() => onChangeActiveTool("draw")}
        />
        <SidebarItem
          icon={Palette}
          label="Background"
          isActive={activeTool === "background"}
          onClick={() => onChangeActiveTool("background")}
        />
        <SidebarItem
          icon={Layers}
          label="Layers"
          isActive={activeTool === "layers"}
          onClick={() => onChangeActiveTool("layers")}
        />
        <SidebarItem
          icon={Settings}
          label="Settings"
          isActive={activeTool === "settings"}
          onClick={() => onChangeActiveTool("settings")}
        />
      </ul>
    </aside>
  );
};