import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { HowItWorksSection } from "../components/how-it-works-section";

describe("HowItWorksSection", () => {
  it("renders the section heading", () => {
    render(<HowItWorksSection />);
    expect(screen.getByText("Up and running in minutes")).toBeInTheDocument();
  });

  it("renders all three steps", () => {
    render(<HowItWorksSection />);
    expect(screen.getByText("Connect GitHub")).toBeInTheDocument();
    expect(screen.getByText("Open a PR")).toBeInTheDocument();
    expect(screen.getByText("Merge with confidence")).toBeInTheDocument();
  });

  it("renders each step description", () => {
    render(<HowItWorksSection />);
    expect(
      screen.getByText("Sign in and select repositories to enable."),
    ).toBeInTheDocument();
    expect(
      screen.getByText("Diffy triggers automatically on every pull request."),
    ).toBeInTheDocument();
    expect(
      screen.getByText("Address suggestions and ship faster."),
    ).toBeInTheDocument();
  });
});
