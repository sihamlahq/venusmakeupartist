"use client";

import { useState, type FormEvent } from "react";
import { todayIsoDate } from "@/lib/date-range";
import { dateOnlyToSoldAtIso } from "@/lib/sale-utils";
import type { SaleButton } from "@/lib/sale-buttons";
import type { Sale } from "@/lib/types";

type Props = {
  saleButtons: SaleButton[];
  onCreated: (sale: Sale) => void;
};

const inputClass =
  "w-full rounded-xl border border-rose-200 px-3 py-2.5 text-base outline-none focus:ring-2 focus:ring-rose-300 sm:py-2 sm:text-sm";

export function ManualSaleForm({ saleButtons, onCreated }: Props) {
  const [open, setOpen] = useState(false);
  const [soldDate, setSoldDate] = useState(todayIsoDate());
  const [serviceKey, setServiceKey] = useState(
    saleButtons[0] ? `preset:${saleButtons[0].id}` : "custom",
  );
  const [customService, setCustomService] = useState("");
  const [amount, setAmount] = useState(
    saleButtons[0] ? String(saleButtons[0].amount) : "",
  );
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  function resetForm() {
    const first = saleButtons[0];
    setSoldDate(todayIsoDate());
    setServiceKey(first ? `preset:${first.id}` : "custom");
    setCustomService("");
    setAmount(first ? String(first.amount) : "");
    setNotes("");
    setError("");
  }

  function onServiceChange(value: string) {
    setServiceKey(value);
    if (value.startsWith("preset:")) {
      const preset = saleButtons.find((item) => item.id === value.slice(7));
      if (preset) setAmount(String(preset.amount));
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (saving) return;

    const resolvedService =
      serviceKey === "custom"
        ? customService.trim()
        : saleButtons.find((item) => item.id === serviceKey.slice(7))?.label ?? "";

    const parsedAmount = Number(amount);

    if (!resolvedService) {
      setError("Service is required.");
      return;
    }

    if (!Number.isFinite(parsedAmount) || parsedAmount < 0) {
      setError("Enter a valid amount.");
      return;
    }

    if (!soldDate) {
      setError("Date is required.");
      return;
    }

    setError("");
    setSaving(true);

    const response = await fetch("/api/sales", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        client_name: "",
        service: resolvedService,
        amount: parsedAmount,
        notes: notes.trim(),
        sold_at: dateOnlyToSoldAtIso(soldDate),
      }),
    });

    setSaving(false);

    if (!response.ok) {
      const data = (await response.json()) as { error?: string };
      setError(data.error ?? "Could not save sale.");
      return;
    }

    const data = (await response.json()) as { sale: Sale };
    resetForm();
    setOpen(false);
    onCreated(data.sale);
  }

  return (
    <div className="mt-6 border-t border-rose-100 pt-5">
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        className="flex w-full items-center justify-between gap-2 text-left"
      >
        <span className="font-medium text-rose-950">Manual entry</span>
        <span className="text-sm text-rose-800/70">
          {open ? "Hide" : "Key in a missed sale"}
        </span>
      </button>

      {open ? (
        <form onSubmit={(event) => void handleSubmit(event)} className="mt-4 space-y-3">
          <p className="text-sm text-rose-800/70">
            Add a sale by hand — pick any past date if you forgot to record it.
          </p>

          <label className="block text-sm">
            <span className="mb-1.5 block font-medium text-rose-950">Date</span>
            <input
              type="date"
              value={soldDate}
              max={todayIsoDate()}
              onChange={(event) => setSoldDate(event.target.value)}
              className={inputClass}
              required
            />
          </label>

          <label className="block text-sm">
            <span className="mb-1.5 block font-medium text-rose-950">Service</span>
            <select
              value={serviceKey}
              onChange={(event) => onServiceChange(event.target.value)}
              className={inputClass}
            >
              {saleButtons.map((button) => (
                <option key={button.id} value={`preset:${button.id}`}>
                  {button.label}
                </option>
              ))}
              <option value="custom">Other (type below)</option>
            </select>
          </label>

          {serviceKey === "custom" ? (
            <label className="block text-sm">
              <span className="mb-1.5 block font-medium text-rose-950">Service name</span>
              <input
                value={customService}
                onChange={(event) => setCustomService(event.target.value)}
                className={inputClass}
                placeholder="e.g. Touch-up"
                required
              />
            </label>
          ) : null}

          <label className="block text-sm">
            <span className="mb-1.5 block font-medium text-rose-950">Amount (MYR)</span>
            <input
              type="number"
              min="0"
              step="0.01"
              value={amount}
              onChange={(event) => setAmount(event.target.value)}
              className={inputClass}
              required
            />
          </label>

          <label className="block text-sm">
            <span className="mb-1.5 block font-medium text-rose-950">Notes</span>
            <input
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              className={inputClass}
              placeholder="Optional"
            />
          </label>

          {error ? <p className="text-sm text-rose-700">{error}</p> : null}

          <button
            type="submit"
            disabled={saving}
            className="w-full rounded-2xl bg-rose-900 px-4 py-2.5 text-sm font-medium text-white disabled:opacity-50"
          >
            {saving ? "Saving…" : "Save manual sale"}
          </button>
        </form>
      ) : null}
    </div>
  );
}
