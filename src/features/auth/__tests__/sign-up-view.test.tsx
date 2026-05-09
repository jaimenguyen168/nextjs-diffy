import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { SignUpView } from "../views/sign-up-view";

const mockSignUpWithEmail = vi.fn();
const mockSignUpWithGithub = vi.fn();

vi.mock("../hooks/use-sign-up", () => ({
  useSignUp: vi.fn(),
}));

import { useSignUp } from "../hooks/use-sign-up";

beforeEach(() => {
  vi.mocked(useSignUp).mockReturnValue({
    signUpWithEmail: mockSignUpWithEmail,
    signUpWithGithub: mockSignUpWithGithub,
    error: "",
    loading: false,
  });
});

describe("SignUpView — rendering", () => {
  it("renders the sign up heading", () => {
    render(<SignUpView />);
    const heading = screen.getAllByText("Sign Up")[0];
    expect(heading).toBeInTheDocument();
  });

  it("renders name, email, and password fields", () => {
    render(<SignUpView />);
    expect(screen.getByLabelText(/name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
  });

  it("renders the GitHub sign up button", () => {
    render(<SignUpView />);
    expect(
      screen.getByRole("button", { name: /sign up with github/i }),
    ).toBeInTheDocument();
  });

  it("renders a link to sign in", () => {
    render(<SignUpView />);
    expect(screen.getByRole("link", { name: /sign in/i })).toHaveAttribute(
      "href",
      "/sign-in",
    );
  });
});

describe("SignUpView — interactions", () => {
  it("calls signUpWithEmail with all fields on submit", async () => {
    const user = userEvent.setup();
    render(<SignUpView />);

    await user.type(screen.getByLabelText(/name/i), "Jaime");
    await user.type(screen.getByLabelText(/email/i), "jaime@example.com");
    await user.type(screen.getByLabelText(/password/i), "secret123");
    await user.click(screen.getByRole("button", { name: /sign up$/i }));

    expect(mockSignUpWithEmail).toHaveBeenCalledWith(
      "Jaime",
      "jaime@example.com",
      "secret123",
    );
  });

  it("calls signUpWithGithub when GitHub button is clicked", async () => {
    const user = userEvent.setup();
    render(<SignUpView />);

    await user.click(
      screen.getByRole("button", { name: /sign up with github/i }),
    );

    expect(mockSignUpWithGithub).toHaveBeenCalled();
  });
});

describe("SignUpView — loading state", () => {
  it("disables all inputs and buttons while loading", () => {
    vi.mocked(useSignUp).mockReturnValue({
      signUpWithEmail: mockSignUpWithEmail,
      signUpWithGithub: mockSignUpWithGithub,
      error: "",
      loading: true,
    });
    render(<SignUpView />);

    expect(screen.getByLabelText(/name/i)).toBeDisabled();
    expect(screen.getByLabelText(/email/i)).toBeDisabled();
    expect(screen.getByLabelText(/password/i)).toBeDisabled();
    expect(screen.getByRole("button", { name: /loading/i })).toBeDisabled();
    expect(
      screen.getByRole("button", { name: /sign up with github/i }),
    ).toBeDisabled();
  });
});

describe("SignUpView — error state", () => {
  it("displays an error message when registration fails", () => {
    vi.mocked(useSignUp).mockReturnValue({
      signUpWithEmail: mockSignUpWithEmail,
      signUpWithGithub: mockSignUpWithGithub,
      error: "Email already in use",
      loading: false,
    });
    render(<SignUpView />);

    expect(screen.getByText("Email already in use")).toBeInTheDocument();
  });
});
