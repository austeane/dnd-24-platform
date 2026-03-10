import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { EmptyState } from "./EmptyState.tsx";

afterEach(cleanup);

describe("EmptyState", () => {
  it("renders title and description", () => {
    render(
      <EmptyState
        title="No characters found"
        description="Create a character to get started."
      />,
    );

    expect(screen.getByText("No characters found")).toBeInTheDocument();
    expect(
      screen.getByText("Create a character to get started."),
    ).toBeInTheDocument();
  });

  it("renders with default icon when none provided", () => {
    render(<EmptyState title="Empty" />);

    expect(screen.getByText("Empty")).toBeInTheDocument();
    // Default icon is the sparkle character
    const iconDiv = screen.getByText("Empty")
      .closest("div")
      ?.querySelector("div:first-child");
    expect(iconDiv).toBeInTheDocument();
  });

  it("renders custom icon", () => {
    render(<EmptyState icon="!" title="No items" />);

    expect(screen.getByText("!")).toBeInTheDocument();
    expect(screen.getByText("No items")).toBeInTheDocument();
  });

  it("does not render description when not provided", () => {
    const { container } = render(<EmptyState title="Empty" />);

    const paragraphs = container.querySelectorAll("p");
    expect(paragraphs).toHaveLength(0);
  });
});
