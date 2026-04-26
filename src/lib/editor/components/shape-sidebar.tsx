import { FaCircle, FaSquare, FaSquareFull } from "react-icons/fa";

import { ActiveTool, Editor } from "../types";

interface ShapeSidebarProps {
  editor: Editor | undefined;
  activeTool: ActiveTool;
  onChangeActiveTool: (tool: ActiveTool) => void;
}

export const ShapeSidebar = ({
  editor,
  activeTool,
  onChangeActiveTool,
}: ShapeSidebarProps) => {
  const onClose = () => {
    onChangeActiveTool("select");
  };

  return (
    <aside
      className={`bg-white relative border-r z-[40] w-[320px] h-full flex flex-col ${
        activeTool === "shapes" ? "visible" : "hidden"
      }`}
    >
      <div className="p-4 border-b">
        <h2 className="text-lg font-semibold">Shapes</h2>
        <p className="text-sm text-muted-foreground">Add shapes to your canvas</p>
      </div>
      <div className="flex-1 overflow-y-auto p-4">
        <div className="grid grid-cols-3 gap-4">
          <button
            onClick={() => editor?.addCircle()}
            className="aspect-square border rounded-lg flex items-center justify-center hover:bg-muted transition-colors"
            title="Circle"
          >
            <FaCircle className="size-8" />
          </button>
          <button
            onClick={() => editor?.addSoftRectangle()}
            className="aspect-square border rounded-lg flex items-center justify-center hover:bg-muted transition-colors"
            title="Rounded Rectangle"
          >
            <FaSquare className="size-8" />
          </button>
          <button
            onClick={() => editor?.addRectangle()}
            className="aspect-square border rounded-lg flex items-center justify-center hover:bg-muted transition-colors"
            title="Rectangle"
          >
            <FaSquareFull className="size-8" />
          </button>
          <button
            onClick={() => editor?.addTriangle()}
            className="aspect-square border rounded-lg flex items-center justify-center hover:bg-muted transition-colors"
            title="Triangle"
          >
            <svg className="size-8" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2L2 22h20L12 2z" />
            </svg>
          </button>
          <button
            onClick={() => editor?.addInverseTriangle()}
            className="aspect-square border rounded-lg flex items-center justify-center hover:bg-muted transition-colors"
            title="Inverted Triangle"
          >
            <svg className="size-8 rotate-180" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2L2 22h20L12 2z" />
            </svg>
          </button>
          <button
            onClick={() => editor?.addDiamond()}
            className="aspect-square border rounded-lg flex items-center justify-center hover:bg-muted transition-colors"
            title="Diamond"
          >
            <svg className="size-8" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2l10 10-10 10L2 12z" />
            </svg>
          </button>
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