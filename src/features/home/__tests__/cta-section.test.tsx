import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { CtaSection } from "../components/cta-section";

vi.mock("@/lib/auth-client", () => ({
  useSession: vi.fn(),
}));

import { useSession } from "@/lib/auth-client";

describe("CtaSection — logged out", () => {
  it("renders the heading", () => {
    vi.mocked(useSession).mockReturnValue({ data: null } as never);
    render(<CtaSection />);
    expect(
      screen.getByText("Ready to improve your code reviews?"),
    ).toBeInTheDocument();
  });

  it("shows get started link when not authenticated", () => {
    vi.mocked(useSession).mockReturnValue({ data: null } as never);
    render(<CtaSection />);
    expect(
      screen.getByRole("link", { name: /get started for free/i }),
    ).toHaveAttribute("href", "/sign-up");
  });
});

describe("CtaSection — logged in", () => {
  it("shows repositories link when authenticated", () => {
    vi.mocked(useSession).mockReturnValue({
      data: { user: { id: "1", name: "Jaime" } },
    } as never);
    render(<CtaSection />);
    expect(
      screen.getByRole("link", { name: /repositories/i }),
    ).toHaveAttribute("href", "/repos");
  });
});
