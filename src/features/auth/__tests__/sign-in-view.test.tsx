import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { SignInView } from "../views/sign-in-view";

const mockSignInWithEmail = vi.fn();
const mockSignInWithGithub = vi.fn();

vi.mock("../hooks/use-sign-in", () => ({
  useSignIn: vi.fn(),
}));

import { useSignIn } from "../hooks/use-sign-in";

beforeEach(() => {
  vi.mocked(useSignIn).mockReturnValue({
    signInWithEmail: mockSignInWithEmail,
    signInWithGithub: mockSignInWithGithub,
    error: "",
    loading: false,
  });
});

describe("SignInView — rendering", () => {
  it("renders the sign in heading", () => {
    render(<SignInView />);
    const heading = screen.getAllByText("Sign In")[0];
    expect(heading).toBeInTheDocument();
  });

  it("renders email and password fields", () => {
    render(<SignInView />);
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
  });

  it("renders the GitHub sign in button", () => {
    render(<SignInView />);
    expect(
      screen.getByRole("button", { name: /sign in with github/i }),
    ).toBeInTheDocument();
  });

  it("renders a link to sign up", () => {
    render(<SignInView />);
    expect(screen.getByRole("link", { name: /sign up/i })).toHaveAttribute(
      "href",
      "/sign-up",
    );
  });
});

describe("SignInView — interactions", () => {
  it("calls signInWithEmail with entered credentials on submit", async () => {
    const user = userEvent.setup();
    render(<SignInView />);

    await user.type(screen.getByLabelText(/email/i), "jaime@example.com");
    await user.type(screen.getByLabelText(/password/i), "secret123");
    await user.click(screen.getByRole("button", { name: /sign in$/i }));

    expect(mockSignInWithEmail).toHaveBeenCalledWith(
      "jaime@example.com",
      "secret123",
    );
  });

  it("calls signInWithGithub when GitHub button is clicked", async () => {
    const user = userEvent.setup();
    render(<SignInView />);

    await user.click(
      screen.getByRole("button", { name: /sign in with github/i }),
    );

    expect(mockSignInWithGithub).toHaveBeenCalled();
  });
});

describe("SignInView — loading state", () => {
  it("disables all inputs and buttons while loading", () => {
    vi.mocked(useSignIn).mockReturnValue({
      signInWithEmail: mockSignInWithEmail,
      signInWithGithub: mockSignInWithGithub,
      error: "",
      loading: true,
    });
    render(<SignInView />);

    expect(screen.getByLabelText(/email/i)).toBeDisabled();
    expect(screen.getByLabelText(/password/i)).toBeDisabled();
    expect(screen.getByRole("button", { name: /loading/i })).toBeDisabled();
    expect(
      screen.getByRole("button", { name: /sign in with github/i }),
    ).toBeDisabled();
  });
});

describe("SignInView — error state", () => {
  it("displays an error message when auth fails", () => {
    vi.mocked(useSignIn).mockReturnValue({
      signInWithEmail: mockSignInWithEmail,
      signInWithGithub: mockSignInWithGithub,
      error: "Invalid email or password",
      loading: false,
    });
    render(<SignInView />);

    expect(screen.getByText("Invalid email or password")).toBeInTheDocument();
  });
});
