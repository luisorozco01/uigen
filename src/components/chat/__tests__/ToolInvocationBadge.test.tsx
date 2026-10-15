import { test, expect, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import type { ToolInvocation } from "ai";
import { ToolInvocationBadge, getToolLabel } from "../ToolInvocationBadge";

afterEach(() => {
  cleanup();
});

function invocation(
  toolName: string,
  args: any,
  state: "call" | "result" = "result"
): ToolInvocation {
  return state === "result"
    ? { toolCallId: "id", toolName, args, state, result: "Success" }
    : { toolCallId: "id", toolName, args, state };
}

test("getToolLabel describes str_replace_editor commands", () => {
  expect(
    getToolLabel("str_replace_editor", { command: "create", path: "/App.jsx" })
  ).toBe("Creating /App.jsx");
  expect(
    getToolLabel("str_replace_editor", {
      command: "str_replace",
      path: "/App.jsx",
    })
  ).toBe("Editing /App.jsx");
  expect(
    getToolLabel("str_replace_editor", { command: "insert", path: "/App.jsx" })
  ).toBe("Editing /App.jsx");
  expect(
    getToolLabel("str_replace_editor", { command: "view", path: "/App.jsx" })
  ).toBe("Viewing /App.jsx");
  expect(
    getToolLabel("str_replace_editor", {
      command: "undo_edit",
      path: "/App.jsx",
    })
  ).toBe("Undoing last edit to /App.jsx");
});

test("getToolLabel describes file_manager commands", () => {
  expect(
    getToolLabel("file_manager", {
      command: "rename",
      path: "/a.jsx",
      new_path: "/b.jsx",
    })
  ).toBe("Renaming /a.jsx to /b.jsx");
  expect(
    getToolLabel("file_manager", { command: "delete", path: "/a.jsx" })
  ).toBe("Deleting /a.jsx");
});

test("getToolLabel falls back to the tool name", () => {
  expect(getToolLabel("something_else", { command: "create", path: "/a" })).toBe(
    "something_else"
  );
  expect(getToolLabel("str_replace_editor", {})).toBe("str_replace_editor");
  expect(getToolLabel("str_replace_editor", undefined)).toBe(
    "str_replace_editor"
  );
  expect(
    getToolLabel("file_manager", { command: "rename", path: "/a.jsx" })
  ).toBe("file_manager");
});

test("ToolInvocationBadge shows friendly text and done indicator", () => {
  render(
    <ToolInvocationBadge
      toolInvocation={invocation("str_replace_editor", {
        command: "create",
        path: "/components/Card.jsx",
      })}
    />
  );

  expect(screen.getByText("Creating /components/Card.jsx")).toBeDefined();
  expect(screen.queryByText("str_replace_editor")).toBeNull();
  expect(screen.getByTestId("tool-done")).toBeDefined();
  expect(screen.queryByTestId("tool-pending")).toBeNull();
});

test("ToolInvocationBadge shows spinner while pending", () => {
  render(
    <ToolInvocationBadge
      toolInvocation={invocation(
        "str_replace_editor",
        { command: "str_replace", path: "/App.jsx" },
        "call"
      )}
    />
  );

  expect(screen.getByText("Editing /App.jsx")).toBeDefined();
  expect(screen.getByTestId("tool-pending")).toBeDefined();
  expect(screen.queryByTestId("tool-done")).toBeNull();
});
