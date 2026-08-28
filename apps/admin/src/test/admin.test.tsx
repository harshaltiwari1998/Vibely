import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { AdminLoginPage } from "../pages/AdminLoginPage";

describe("Admin app foundation", () => {
  it("renders the admin sign-in page", () => {
    render(
      <MemoryRouter>
        <AdminLoginPage />
      </MemoryRouter>,
    );
    expect(screen.getByRole("button", { name: "Sign in" })).toBeInTheDocument();
  });
});
