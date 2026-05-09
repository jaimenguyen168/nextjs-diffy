import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { HomeFooter } from "../components/home-footer";

describe("HomeFooter", () => {
  it("renders the copyright with current year", () => {
    render(<HomeFooter />);
    const year = new Date().getFullYear().toString();
    expect(screen.getByText(`© ${year} Diffy`)).toBeInTheDocument();
  });

  it("renders a link to the source code on GitHub", () => {
    render(<HomeFooter />);
    const link = screen.getByRole("link", { name: /source code/i });
    expect(link).toHaveAttribute(
      "href",
      "https://github.com/jaimenguyen168/next-diffy",
    );
    expect(link).toHaveAttribute("target", "_blank");
  });
});
