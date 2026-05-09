import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { FeaturesSection } from "../components/features-section";

describe("FeaturesSection", () => {
  it("renders the section heading", () => {
    render(<FeaturesSection />);
    expect(
      screen.getByText("Everything you need for better reviews"),
    ).toBeInTheDocument();
  });

  it("renders all six feature cards", () => {
    render(<FeaturesSection />);
    expect(screen.getByText("Instant feedback")).toBeInTheDocument();
    expect(screen.getByText("Security scanning")).toBeInTheDocument();
    expect(screen.getByText("Clear suggestions")).toBeInTheDocument();
    expect(screen.getByText("PR integration")).toBeInTheDocument();
    expect(screen.getByText("Context aware")).toBeInTheDocument();
    expect(screen.getByText("Always improving")).toBeInTheDocument();
  });

  it("renders each feature description", () => {
    render(<FeaturesSection />);
    expect(
      screen.getByText("Get comprehensive reviews in seconds, not hours."),
    ).toBeInTheDocument();
    expect(
      screen.getByText("Detect vulnerabilities and secrets automatically."),
    ).toBeInTheDocument();
  });
});
