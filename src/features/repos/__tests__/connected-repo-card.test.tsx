import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi } from "vitest";
import { ConnectedRepoCard } from "../components/connected-repo-card";
import type { ConnectedRepo } from "../types";

const baseRepo: ConnectedRepo = {
  id: "repo-1",
  fullName: "jaimenguyen168/next-diffy",
  private: false,
  createdAt: new Date("2025-01-01"),
  openPRCount: 0,
};

describe("ConnectedRepoCard — rendering", () => {
  it("renders the repo full name", () => {
    render(
      <ConnectedRepoCard
        repo={baseRepo}
        onDisconnect={vi.fn()}
        isDisconnecting={false}
      />,
    );
    expect(
      screen.getByText("jaimenguyen168/next-diffy"),
    ).toBeInTheDocument();
  });

  it("shows Public badge for a public repo", () => {
    render(
      <ConnectedRepoCard
        repo={baseRepo}
        onDisconnect={vi.fn()}
        isDisconnecting={false}
      />,
    );
    expect(screen.getByText("Public")).toBeInTheDocument();
  });

  it("shows Private badge for a private repo", () => {
    render(
      <ConnectedRepoCard
        repo={{ ...baseRepo, private: true }}
        onDisconnect={vi.fn()}
        isDisconnecting={false}
      />,
    );
    expect(screen.getByText("Private")).toBeInTheDocument();
  });

  it("renders View PRs link pointing to the repo page", () => {
    render(
      <ConnectedRepoCard
        repo={baseRepo}
        onDisconnect={vi.fn()}
        isDisconnecting={false}
      />,
    );
    const links = screen.getAllByRole("link", { name: /view prs/i });
    expect(links[0]).toHaveAttribute("href", "/repos/repo-1");
  });

  it("shows open PR count badge when openPRCount > 0", () => {
    render(
      <ConnectedRepoCard
        repo={{ ...baseRepo, openPRCount: 3 }}
        onDisconnect={vi.fn()}
        isDisconnecting={false}
      />,
    );
    expect(screen.getByText("3 open")).toBeInTheDocument();
  });

  it("does not show open PR badge when openPRCount is 0", () => {
    render(
      <ConnectedRepoCard
        repo={baseRepo}
        onDisconnect={vi.fn()}
        isDisconnecting={false}
      />,
    );
    expect(screen.queryByText(/open/)).not.toBeInTheDocument();
  });
});

describe("ConnectedRepoCard — disconnect dialog", () => {
  // The trash button is icon-only (no accessible name), so we grab it by its
  // SVG child — it's the only button that isn't a link-wrapped "View PRs".
  const getTrashButton = () =>
    screen
      .getAllByRole("button")
      .find((btn) => btn.querySelector("svg"))!;

  it("opens the disconnect dialog when trash button is clicked", async () => {
    const user = userEvent.setup();
    render(
      <ConnectedRepoCard
        repo={baseRepo}
        onDisconnect={vi.fn()}
        isDisconnecting={false}
      />,
    );

    await user.click(getTrashButton());
    expect(screen.getByText("Disconnect Repository")).toBeInTheDocument();
    expect(
      screen.getByText(/are you sure you want to disconnect/i),
    ).toBeInTheDocument();
  });

  it("calls onDisconnect when Disconnect is confirmed", async () => {
    const user = userEvent.setup();
    const onDisconnect = vi.fn();
    render(
      <ConnectedRepoCard
        repo={baseRepo}
        onDisconnect={onDisconnect}
        isDisconnecting={false}
      />,
    );

    await user.click(getTrashButton());
    await user.click(screen.getByRole("button", { name: /^disconnect$/i }));
    expect(onDisconnect).toHaveBeenCalledOnce();
  });

  it("does not call onDisconnect when Cancel is clicked", async () => {
    const user = userEvent.setup();
    const onDisconnect = vi.fn();
    render(
      <ConnectedRepoCard
        repo={baseRepo}
        onDisconnect={onDisconnect}
        isDisconnecting={false}
      />,
    );

    await user.click(getTrashButton());
    await user.click(screen.getByRole("button", { name: /cancel/i }));
    expect(onDisconnect).not.toHaveBeenCalled();
  });

  it("disables the trash button while disconnecting", () => {
    render(
      <ConnectedRepoCard
        repo={baseRepo}
        onDisconnect={vi.fn()}
        isDisconnecting={true}
      />,
    );
    expect(getTrashButton()).toBeDisabled();
  });
});
