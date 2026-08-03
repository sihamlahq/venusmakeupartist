"use client";

import { useEffect, useMemo, useState } from "react";
import type { DateRange } from "@/lib/date-range";
import { formatRangeLabel } from "@/lib/date-range";
import { formatMoney } from "@/lib/format";
import { summarizeSalesByButtons } from "@/lib/sale-summary";
import type { SaleButton } from "@/lib/sale-buttons";
import type { Sale } from "@/lib/types";

type Props = {
  sales: Sale[];
  saleButtons: SaleButton[];
  range: DateRange;
  onSaleButtonsUpdated: (saleButtons: SaleButton[]) => void;
};

const amountInputClass =
  "w-20 rounded-lg border border-rose-200 bg-white px-2 py-1 text-right text-sm outline-none focus:ring-2 focus:ring-rose-300";

function parseCommissionAmount(value: string) {
  const amount = Number(value);
  if (!Number.isFinite(amount) || amount < 0) return 0;
  return amount;
}

export function SalesSummaryTable({
  sales,
  saleButtons,
  range,
  onSaleButtonsUpdated,
}: Props) {
  const [amountDrafts, setAmountDrafts] = useState<Record<string, string>>({});
  const [savingCommission, setSavingCommission] = useState(false);
  const [commissionMessage, setCommissionMessage] = useState("");
  const [commissionError, setCommissionError] = useState("");

  useEffect(() => {
    setAmountDrafts(
      Object.fromEntries(
        saleButtons.map((button) => [
          button.id,
          String(button.commission_amount ?? 0),
        ]),
      ),
    );
  }, [saleButtons]);

  const buttonsWithDraftAmounts = useMemo(
    () =>
      saleButtons.map((button) => ({
        ...button,
        commission_amount: parseCommissionAmount(amountDrafts[button.id] ?? "0"),
      })),
    [saleButtons, amountDrafts],
  );

  const summary = useMemo(
    () => summarizeSalesByButtons(sales, buttonsWithDraftAmounts),
    [sales, buttonsWithDraftAmounts],
  );

  const commissionDirty = useMemo(
    () =>
      saleButtons.some(
        (button) =>
          parseCommissionAmount(amountDrafts[button.id] ?? "0") !==
          (button.commission_amount ?? 0),
      ),
    [saleButtons, amountDrafts],
  );

  function updateAmountDraft(id: string, value: string) {
    setAmountDrafts((current) => ({ ...current, [id]: value }));
    setCommissionMessage("");
    setCommissionError("");
  }

  async function saveCommissionAmounts() {
    setSavingCommission(true);
    setCommissionMessage("");
    setCommissionError("");

    try {
      const updatedButtons = saleButtons.map((button) => ({
        ...button,
        label: button.label.trim(),
        amount: Number(button.amount) || 0,
        commission_amount: parseCommissionAmount(amountDrafts[button.id] ?? "0"),
      }));

      const response = await fetch("/api/settings", {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ saleButtons: updatedButtons }),
      });

      if (!response.ok) {
        const data = (await response.json()) as { error?: string };
        setCommissionError(data.error ?? "Could not save commission amounts.");
        return;
      }

      const data = (await response.json()) as { saleButtons: SaleButton[] };
      onSaleButtonsUpdated(data.saleButtons);
      setCommissionMessage("Commission amounts saved.");
    } catch {
      setCommissionError(
        "Could not save commission amounts. Check your connection and try again.",
      );
    } finally {
      setSavingCommission(false);
    }
  }

  return (
    <section className="rounded-3xl border border-rose-100 bg-white/80 p-4 shadow-sm sm:p-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <h2 className="font-serif text-xl text-rose-950 sm:text-2xl">
            Package totals
          </h2>
          <p className="mt-1 text-sm text-rose-800/70">
            {formatRangeLabel(range)} · Commission = amount per unit × qty sold
          </p>
        </div>
        <button
          type="button"
          onClick={() => void saveCommissionAmounts()}
          disabled={!commissionDirty || savingCommission}
          className="shrink-0 rounded-full border border-rose-200 px-4 py-2 text-sm text-rose-900 transition hover:bg-rose-50 disabled:opacity-40"
        >
          {savingCommission ? "Saving…" : "Save commission amounts"}
        </button>
      </div>

      {commissionMessage ? (
        <p className="mt-3 text-sm text-emerald-700">{commissionMessage}</p>
      ) : null}
      {commissionError ? (
        <p className="mt-3 text-sm text-rose-700">{commissionError}</p>
      ) : null}

      <div className="mt-4 overflow-x-auto">
        <table className="min-w-full text-left text-sm">
          <thead className="text-rose-900">
            <tr className="border-b border-rose-100">
              <th className="px-3 py-2 font-medium">Button</th>
              <th className="px-3 py-2 font-medium text-right">Unit price</th>
              <th className="px-3 py-2 font-medium text-right">Qty</th>
              <th className="px-3 py-2 font-medium text-right">Total</th>
              <th className="px-3 py-2 font-medium text-right">Comm. / unit</th>
              <th className="px-3 py-2 font-medium text-right">Commission</th>
            </tr>
          </thead>
          <tbody>
            {summary.rows.map((row) => (
              <tr key={row.id} className="border-b border-rose-50">
                <td className="px-3 py-2.5 text-rose-950">{row.label}</td>
                <td className="px-3 py-2.5 text-right text-rose-800/80">
                  {formatMoney(row.unitPrice)}
                </td>
                <td className="px-3 py-2.5 text-right text-rose-950">{row.quantity}</td>
                <td className="px-3 py-2.5 text-right font-medium text-rose-950">
                  {formatMoney(row.total)}
                </td>
                <td className="px-3 py-2.5 text-right">
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={amountDrafts[row.id] ?? "0"}
                    onChange={(event) =>
                      updateAmountDraft(row.id, event.target.value)
                    }
                    className={`${amountInputClass} ml-auto`}
                    aria-label={`Commission per unit for ${row.label}`}
                  />
                </td>
                <td className="px-3 py-2.5 text-right font-medium text-rose-950">
                  {formatMoney(row.commissionTotal)}
                </td>
              </tr>
            ))}
            {summary.other ? (
              <tr className="border-b border-rose-50">
                <td className="px-3 py-2.5 text-rose-950">Other / manual</td>
                <td className="px-3 py-2.5 text-right text-rose-800/80">—</td>
                <td className="px-3 py-2.5 text-right text-rose-950">
                  {summary.other.quantity}
                </td>
                <td className="px-3 py-2.5 text-right font-medium text-rose-950">
                  {formatMoney(summary.other.total)}
                </td>
                <td className="px-3 py-2.5 text-right text-rose-800/60">—</td>
                <td className="px-3 py-2.5 text-right text-rose-800/60">—</td>
              </tr>
            ) : null}
          </tbody>
          <tfoot>
            <tr className="bg-rose-50/60">
              <td className="px-3 py-3 font-medium text-rose-950" colSpan={2}>
                Grand total
              </td>
              <td className="px-3 py-3 text-right font-medium text-rose-950">
                {summary.rows.reduce((sum, row) => sum + row.quantity, 0) +
                  (summary.other?.quantity ?? 0)}
              </td>
              <td className="px-3 py-3 text-right font-serif text-base text-rose-950 sm:text-lg">
                {formatMoney(summary.grandTotal)}
              </td>
              <td className="px-3 py-3" />
              <td className="px-3 py-3 text-right font-serif text-base text-rose-950 sm:text-lg">
                {formatMoney(summary.grandCommission)}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </section>
  );
}
