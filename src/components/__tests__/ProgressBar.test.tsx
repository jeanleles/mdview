import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import ProgressBar from "../ProgressBar";

describe("ProgressBar", () => {
  it("clamps and exposes an integer reading progress", () => {
    const { rerender } = render(<ProgressBar progress={42.7} />);

    const bar = screen.getByRole("progressbar", { name: "Progresso de leitura" });
    expect(bar).toHaveAttribute("aria-valuenow", "42");
    expect(bar.querySelector("span")).toHaveTextContent("42%");

    rerender(<ProgressBar progress={150} />);
    expect(bar).toHaveAttribute("aria-valuenow", "100");

    rerender(<ProgressBar progress={-10} />);
    expect(bar).toHaveAttribute("aria-valuenow", "0");
  });
});
