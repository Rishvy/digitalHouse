import { describe, expect, it } from "vitest";
import { runBleedCheck } from "../src/preflight/checks/bleedCheck";
import { runOverprintCheck } from "../src/preflight/checks/overprintCheck";

describe("preflight checks", () => {
  it("fails bleed verification when no full-bleed background exists", () => {
    const result = runBleedCheck(
      {
        className: "Stage",
        children: [
          {
            className: "Layer",
            children: [{ className: "Rect", attrs: { x: 0, y: 0, width: 1000, height: 1000 } }],
          },
        ],
      },
      1000,
      1000,
    );
    expect(result.status).toBe("failed");
  });

  it("fails overprint check when black text has no overprint flag", () => {
    const result = runOverprintCheck({
      className: "Stage",
      children: [
        {
          className: "Layer",
          children: [{ className: "Text", attrs: { fill: "#000000", text: "Sample" } }],
        },
      ],
    });
    expect(result.status).toBe("failed");
  });
});
