import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { HeroSection } from "../components/hero-section";

vi.mock("@/lib/auth-client", () => ({
  useSession: vi.fn(),
}));

import { useSession } from "@/lib/auth-client";

describe("HeroSection — logged out", () => {
  it("renders the main heading", () => {
    vi.mocked(useSession).mockReturnValue({ data: null } as never);
    render(<HeroSection />);
    expect(screen.getByText(/ship better code/i)).toBeInTheDocument();
  });

  it("shows sign-up and sign-in buttons when not authenticated", () => {
    vi.mocked(useSession).mockReturnValue({ data: null } as never);
    render(<HeroSection />);
    expect(
      screen.getByRole("link", { name: /start for free/i }),
    ).toHaveAttribute("href", "/sign-up");
    expect(screen.getByRole("link", { name: /sign in/i })).toHaveAttribute(
      "href",
      "/sign-in",
    );
  });

  it("renders the trust badges", () => {
    vi.mocked(useSession).mockReturnValue({ data: null } as never);
    render(<HeroSection />);
    expect(screen.getByText("No credit card required")).toBeInTheDocument();
    expect(screen.getByText("GitHub integration")).toBeInTheDocument();
    expect(screen.getByText("Private repos supported")).toBeInTheDocument();
  });
});

describe("HeroSection — logged in", () => {
  it("shows repositories link when authenticated", () => {
    vi.mocked(useSession).mockReturnValue({
      data: { user: { id: "1", name: "Jaime" } },
    } as never);
    render(<HeroSection />);
    expect(
      screen.getByRole("link", { name: /repositories/i }),
    ).toHaveAttribute("href", "/repos");
  });

  it("does not show sign-up button when authenticated", () => {
    vi.mocked(useSession).mockReturnValue({
      data: { user: { id: "1", name: "Jaime" } },
    } as never);
    render(<HeroSection />);
    expect(
      screen.queryByRole("link", { name: /start for free/i }),
    ).not.toBeInTheDocument();
  });
});
