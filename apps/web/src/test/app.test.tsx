import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { LoginPage } from "../pages/LoginPage";

describe("Web app foundation", () => {
  it("renders the sign-in page", () => {
    render(
      <MemoryRouter>
        <LoginPage />
      </MemoryRouter>,
    );
    expect(screen.getByRole("button", { name: "Sign in" })).toBeInTheDocument();
  });
});
