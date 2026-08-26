import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { OrderDialog } from "../components/OrderDialog";

const currentOrder = {
  id: "1",
  message: "每日量測血壓",
  createdAt: "2026-08-26T09:00:00.000Z",
};

const renderDialog = (hasOrder = true) =>
  render(
    <OrderDialog
      patient={{
        id: "1",
        name: "小民",
        order: hasOrder ? currentOrder : null,
        orderHistory: hasOrder ? [currentOrder] : [],
      }}
      onClose={vi.fn()}
      onSaved={vi.fn().mockResolvedValue(undefined)}
    />,
  );

afterEach(() => cleanup());

describe("OrderDialog", () => {
  it("進入編輯模式後停用標題的編輯按鈕", () => {
    renderDialog();

    const editButton = screen.getByRole("button", { name: "編輯" });
    expect(editButton).toHaveProperty("disabled", false);

    fireEvent.click(editButton);

    expect(editButton).toHaveProperty("disabled", true);
    expect(screen.getByRole("button", { name: "回存醫囑" })).toHaveProperty(
      "disabled",
      false,
    );
  });

  it("新增模式中停用標題的新增醫囑按鈕", () => {
    renderDialog(false);

    expect(screen.getByRole("button", { name: "新增醫囑" })).toHaveProperty(
      "disabled",
      true,
    );
    expect(screen.getByRole("button", { name: "回存醫囑" })).toHaveProperty(
      "disabled",
      false,
    );
  });
});
