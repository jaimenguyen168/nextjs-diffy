import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi } from "vitest";
import { RepoSelectItem } from "../components/repo-select-item";
import type { GitHubRepo } from "../types";

const baseRepo: GitHubRepo = {
  githubId: 1,
  name: "next-diffy",
  fullName: "jaimenguyen168/next-diffy",
  private: false,
  htmlUrl: "https://github.com/jaimenguyen168/next-diffy",
  description: "An AI-powered code review tool",
  language: "TypeScript",
  stars: 42,
  updatedAt: "2025-01-01T00:00:00Z",
};

describe("RepoSelectItem — rendering", () => {
  it("renders the repo full name", () => {
    render(
      <RepoSelectItem repo={baseRepo} selected={false} onToggle={vi.fn()} />,
    );
    expect(
      screen.getByText("jaimenguyen168/next-diffy"),
    ).toBeInTheDocument();
  });

  it("renders the description when provided", () => {
    render(
      <RepoSelectItem repo={baseRepo} selected={false} onToggle={vi.fn()} />,
    );
    expect(
      screen.getByText("An AI-powered code review tool"),
    ).toBeInTheDocument();
  });

  it("does not render description when null", () => {
    render(
      <RepoSelectItem
        repo={{ ...baseRepo, description: null }}
        selected={false}
        onToggle={vi.fn()}
      />,
    );
    expect(
      screen.queryByText("An AI-powered code review tool"),
    ).not.toBeInTheDocument();
  });

  it("renders the language", () => {
    render(
      <RepoSelectItem repo={baseRepo} selected={false} onToggle={vi.fn()} />,
    );
    expect(screen.getByText("TypeScript")).toBeInTheDocument();
  });

  it("renders the star count when > 0", () => {
    render(
      <RepoSelectItem repo={baseRepo} selected={false} onToggle={vi.fn()} />,
    );
    expect(screen.getByText("42")).toBeInTheDocument();
  });

  it("does not render star count when 0", () => {
    render(
      <RepoSelectItem
        repo={{ ...baseRepo, stars: 0 }}
        selected={false}
        onToggle={vi.fn()}
      />,
    );
    expect(screen.queryByText("0")).not.toBeInTheDocument();
  });

  it("shows the lock icon for private repos", () => {
    const { container } = render(
      <RepoSelectItem
        repo={{ ...baseRepo, private: true }}
        selected={false}
        onToggle={vi.fn()}
      />,
    );
    expect(container.querySelector("svg")).toBeInTheDocument();
  });
});

describe("RepoSelectItem — selection", () => {
  it("renders checkbox as unchecked when not selected", () => {
    render(
      <RepoSelectItem repo={baseRepo} selected={false} onToggle={vi.fn()} />,
    );
    expect(screen.getByRole("checkbox")).not.toBeChecked();
  });

  it("renders checkbox as checked when selected", () => {
    render(
      <RepoSelectItem repo={baseRepo} selected={true} onToggle={vi.fn()} />,
    );
    expect(screen.getByRole("checkbox")).toBeChecked();
  });

  it("calls onToggle when the label is clicked", async () => {
    const user = userEvent.setup();
    const onToggle = vi.fn();
    render(
      <RepoSelectItem repo={baseRepo} selected={false} onToggle={onToggle} />,
    );
    await user.click(screen.getByText("jaimenguyen168/next-diffy"));
    expect(onToggle).toHaveBeenCalledOnce();
  });

  it("calls onToggle when the checkbox is clicked directly", async () => {
    const user = userEvent.setup();
    const onToggle = vi.fn();
    render(
      <RepoSelectItem repo={baseRepo} selected={false} onToggle={onToggle} />,
    );
    await user.click(screen.getByRole("checkbox"));
    expect(onToggle).toHaveBeenCalledOnce();
  });
});
