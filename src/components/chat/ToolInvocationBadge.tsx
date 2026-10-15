import type { ToolInvocation } from "ai";
import { Loader2 } from "lucide-react";

export function getToolLabel(toolName: string, args: any): string {
  const command = args?.command;
  const path = args?.path;

  if (toolName === "str_replace_editor" && path) {
    switch (command) {
      case "create":
        return `Creating ${path}`;
      case "str_replace":
      case "insert":
        return `Editing ${path}`;
      case "view":
        return `Viewing ${path}`;
      case "undo_edit":
        return `Undoing last edit to ${path}`;
    }
  }

  if (toolName === "file_manager" && path) {
    if (command === "rename" && args?.new_path) {
      return `Renaming ${path} to ${args.new_path}`;
    }
    if (command === "delete") {
      return `Deleting ${path}`;
    }
  }

  return toolName;
}

interface ToolInvocationBadgeProps {
  toolInvocation: ToolInvocation;
}

export function ToolInvocationBadge({
  toolInvocation,
}: ToolInvocationBadgeProps) {
  const isDone = toolInvocation.state === "result" && toolInvocation.result;
  const label = getToolLabel(toolInvocation.toolName, toolInvocation.args);

  return (
    <div className="inline-flex items-center gap-2 mt-2 px-3 py-1.5 bg-neutral-50 rounded-lg text-xs font-mono border border-neutral-200">
      {isDone ? (
        <div
          data-testid="tool-done"
          className="w-2 h-2 rounded-full bg-emerald-500"
        ></div>
      ) : (
        <Loader2
          data-testid="tool-pending"
          className="w-3 h-3 animate-spin text-blue-600"
        />
      )}
      <span className="text-neutral-700">{label}</span>
    </div>
  );
}
