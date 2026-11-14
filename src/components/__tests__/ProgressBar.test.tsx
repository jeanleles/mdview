import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import ProgressBar from "../ProgressBar";

describe("ProgressBar", () => {
  it("clamps and exposes an integer reading progress", () => {
    const { rerender } = render(<ProgressBar progress={42.7} />);

    const bar = screen.getByRole("progressbar", { name: "Progresso de leitura" });
    expect(bar).toHaveAttribute("aria-valuenow", "42");
    expect(screen.getByText("42%")).toBeInTheDocument();
    expect(bar).toHaveClass("fixed", "bottom-4", "right-4");
    expect(bar.querySelector("circle:last-child")).toHaveAttribute(
      "stroke-dashoffset",
      String((2 * Math.PI * 17) * (1 - 0.42))
    );

    rerender(<ProgressBar progress={150} />);
    expect(bar).toHaveAttribute("aria-valuenow", "100");
    expect(screen.getByText("100%")).toBeInTheDocument();
    expect(bar.querySelector("circle:last-child")).toHaveAttribute(
      "stroke-dashoffset",
      "0"
    );

    rerender(<ProgressBar progress={-10} />);
    expect(bar).toHaveAttribute("aria-valuenow", "0");
    expect(screen.getByText("0%")).toBeInTheDocument();
  });
});
