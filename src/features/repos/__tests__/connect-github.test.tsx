import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { ConnectGithub } from "../components/connect-github";

vi.mock("@/lib/auth-client", () => ({
  linkSocial: vi.fn().mockResolvedValue(undefined),
}));

import { linkSocial } from "@/lib/auth-client";

beforeEach(() => {
  vi.mocked(linkSocial).mockResolvedValue(undefined as never);
});

describe("ConnectGithub — rendering", () => {
  it("renders the default title", () => {
    render(<ConnectGithub />);
    expect(
      screen.getByText("Connect your GitHub account"),
    ).toBeInTheDocument();
  });

  it("renders a custom title when provided", () => {
    render(<ConnectGithub title="Github account not connected" />);
    expect(
      screen.getByText("Github account not connected"),
    ).toBeInTheDocument();
  });

  it("renders the default description", () => {
    render(<ConnectGithub />);
    expect(
      screen.getByText(
        "Link your GitHub account to access your repositories and enable AI code reviews.",
      ),
    ).toBeInTheDocument();
  });

  it("renders a custom description when provided", () => {
    render(<ConnectGithub description="Connect to view your repos." />);
    expect(
      screen.getByText("Connect to view your repos."),
    ).toBeInTheDocument();
  });

  it("renders the Connect GitHub button", () => {
    render(<ConnectGithub />);
    expect(
      screen.getByRole("button", { name: /connect github/i }),
    ).toBeInTheDocument();
  });
});

describe("ConnectGithub — interactions", () => {
  it("calls linkSocial with github provider when button is clicked", async () => {
    const user = userEvent.setup();
    render(<ConnectGithub />);

    await user.click(screen.getByRole("button", { name: /connect github/i }));

    expect(linkSocial).toHaveBeenCalledWith({
      provider: "github",
      callbackURL: expect.any(String),
    });
  });

  it("disables the button while connecting", async () => {
    vi.mocked(linkSocial).mockImplementation(
      () => new Promise(() => {}), // never resolves
    );
    const user = userEvent.setup();
    render(<ConnectGithub />);

    await user.click(screen.getByRole("button", { name: /connect github/i }));

    expect(screen.getByRole("button")).toBeDisabled();
  });
});
