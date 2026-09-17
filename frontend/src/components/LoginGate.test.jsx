// src/components/LoginGate.test.jsx
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import LoginGate from "./LoginGate";
import { api } from "../services/api";
import { getSession, clearSession } from "../services/auth";

vi.mock("../services/api", () => ({
  api: {
    requestOtp: vi.fn(),
    verifyOtp: vi.fn(),
  },
}));

describe("LoginGate Component", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    clearSession();
  });

  it("renders the email step by default", () => {
    render(<LoginGate onAuthenticated={vi.fn()} />);
    expect(screen.getByPlaceholderText("you@shipstation.com")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Send code" })).toBeInTheDocument();
  });

  it("advances to the code step after a code is sent", async () => {
    api.requestOtp.mockResolvedValue({ session: "session-token" });
    render(<LoginGate onAuthenticated={vi.fn()} />);

    fireEvent.change(screen.getByPlaceholderText("you@shipstation.com"), {
      target: { value: "demo@shipstation.com" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Send code" }));

    await waitFor(() => {
      expect(screen.getByPlaceholderText("6-digit code")).toBeInTheDocument();
    });
    expect(api.requestOtp).toHaveBeenCalledWith("demo@shipstation.com");
  });

  it("shows the server error when the email is rejected", async () => {
    api.requestOtp.mockRejectedValue(new Error("Access is restricted to ShipStation team emails."));
    render(<LoginGate onAuthenticated={vi.fn()} />);

    fireEvent.change(screen.getByPlaceholderText("you@shipstation.com"), {
      target: { value: "outsider@example.com" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Send code" }));

    await waitFor(() => {
      expect(
        screen.getByText("Access is restricted to ShipStation team emails."),
      ).toBeInTheDocument();
    });
    expect(screen.getByPlaceholderText("you@shipstation.com")).toBeInTheDocument();
  });

  it("saves the session and calls onAuthenticated on a correct code", async () => {
    api.requestOtp.mockResolvedValue({ session: "session-token" });
    api.verifyOtp.mockResolvedValue({
      idToken: "id-token",
      accessToken: "access-token",
      refreshToken: "refresh-token",
      expiresIn: 3600,
    });
    const onAuthenticated = vi.fn();
    render(<LoginGate onAuthenticated={onAuthenticated} />);

    fireEvent.change(screen.getByPlaceholderText("you@shipstation.com"), {
      target: { value: "demo@shipstation.com" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Send code" }));
    await waitFor(() => screen.getByPlaceholderText("6-digit code"));

    fireEvent.change(screen.getByPlaceholderText("6-digit code"), {
      target: { value: "123456" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Verify code" }));

    await waitFor(() => expect(onAuthenticated).toHaveBeenCalledTimes(1));
    expect(api.verifyOtp).toHaveBeenCalledWith("demo@shipstation.com", "123456", "session-token");
    expect(getSession()?.idToken).toBe("id-token");
  });

  it("shows an error and keeps the code step on an incorrect code", async () => {
    api.requestOtp.mockResolvedValue({ session: "session-token" });
    api.verifyOtp.mockRejectedValue(new Error("Incorrect code. Please try again."));
    render(<LoginGate onAuthenticated={vi.fn()} />);

    fireEvent.change(screen.getByPlaceholderText("you@shipstation.com"), {
      target: { value: "demo@shipstation.com" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Send code" }));
    await waitFor(() => screen.getByPlaceholderText("6-digit code"));

    fireEvent.change(screen.getByPlaceholderText("6-digit code"), {
      target: { value: "000000" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Verify code" }));

    await waitFor(() => {
      expect(screen.getByText("Incorrect code. Please try again.")).toBeInTheDocument();
    });
    expect(screen.getByPlaceholderText("6-digit code")).toBeInTheDocument();
  });

  it("returns to the email step when 'Use a different email' is clicked", async () => {
    api.requestOtp.mockResolvedValue({ session: "session-token" });
    render(<LoginGate onAuthenticated={vi.fn()} />);

    fireEvent.change(screen.getByPlaceholderText("you@shipstation.com"), {
      target: { value: "demo@shipstation.com" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Send code" }));
    await waitFor(() => screen.getByPlaceholderText("6-digit code"));

    fireEvent.click(screen.getByRole("button", { name: /Use a different email/ }));

    expect(screen.getByPlaceholderText("you@shipstation.com")).toBeInTheDocument();
  });
});
