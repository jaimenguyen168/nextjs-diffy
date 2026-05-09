import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { HomeHeader } from "../components/home-header";

vi.mock("@/lib/auth-client", () => ({
  useSession: vi.fn(),
}));

vi.mock("@/components/logo", () => ({
  Logo: () => <div>Diffy</div>,
}));

import { useSession } from "@/lib/auth-client";

describe("HomeHeader — logged out", () => {
  it("renders sign in and get started links", () => {
    vi.mocked(useSession).mockReturnValue({ data: null } as never);
    render(<HomeHeader />);
    expect(screen.getByRole("link", { name: /sign in/i })).toHaveAttribute(
      "href",
      "/sign-in",
    );
    expect(screen.getByRole("link", { name: /get started/i })).toHaveAttribute(
      "href",
      "/sign-up",
    );
  });

  it("does not show repositories link when not authenticated", () => {
    vi.mocked(useSession).mockReturnValue({ data: null } as never);
    render(<HomeHeader />);
    expect(
      screen.queryByRole("link", { name: /repositories/i }),
    ).not.toBeInTheDocument();
  });
});

describe("HomeHeader — logged in", () => {
  it("shows repositories link when authenticated", () => {
    vi.mocked(useSession).mockReturnValue({
      data: { user: { id: "1", name: "Jaime" } },
    } as never);
    render(<HomeHeader />);
    expect(
      screen.getByRole("link", { name: /repositories/i }),
    ).toHaveAttribute("href", "/repos");
  });

  it("does not show sign in link when authenticated", () => {
    vi.mocked(useSession).mockReturnValue({
      data: { user: { id: "1", name: "Jaime" } },
    } as never);
    render(<HomeHeader />);
    expect(
      screen.queryByRole("link", { name: /sign in/i }),
    ).not.toBeInTheDocument();
  });
});
