"use client";

import { useState } from "react";
import { formatDateTime, formatMoney } from "@/lib/format";
import {
  fromDatetimeLocalValue,
  toDatetimeLocalValue,
} from "@/lib/sale-utils";
import {
  type Sale,
  type SaleUpdateInput,
} from "@/lib/types";

type Props = {
  sales: Sale[];
  services: string[];
  onDelete: (id: string) => Promise<boolean>;
  onUpdate: (id: string, input: SaleUpdateInput) => Promise<boolean>;
};

const inputClass =
  "w-full rounded-lg border border-rose-200 px-2 py-2 text-base outline-none focus:ring-1 focus:ring-rose-300 sm:py-1.5 sm:text-sm";

function SaleEditor({
  sale,
  services,
  saving,
  onSave,
  onCancel,
}: {
  sale: Sale;
  services: string[];
  saving: boolean;
  onSave: (input: SaleUpdateInput) => void;
  onCancel: () => void;
}) {
  const isCustomService = !services.includes(sale.service);
  const [clientName, setClientName] = useState(sale.client_name);
  const [service, setService] = useState(
    isCustomService ? "custom" : sale.service || services[0],
  );
  const [customService, setCustomService] = useState(
    isCustomService ? sale.service : "",
  );
  const [amount, setAmount] = useState(String(sale.amount));
  const [notes, setNotes] = useState(sale.notes);
  const [soldAt, setSoldAt] = useState(toDatetimeLocalValue(sale.sold_at));

  function handleSave() {
    const resolvedService =
      service === "custom" ? customService.trim() : service;

    onSave({
      client_name: clientName,
      service: resolvedService,
      amount: Number(amount),
      payment_method: sale.payment_method,
      notes,
      sold_at: fromDatetimeLocalValue(soldAt),
    });
  }

  return (
    <div className="rounded-xl border border-rose-100 bg-rose-50/50 p-2">
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <label className="col-span-2 block text-xs sm:col-span-1">
          <span className="mb-0.5 block text-rose-800/60">Date</span>
          <input
            type="datetime-local"
            value={soldAt}
            onChange={(event) => setSoldAt(event.target.value)}
            className={inputClass}
          />
        </label>

        <label className="block text-xs">
          <span className="mb-0.5 block text-rose-800/60">Amount</span>
          <input
            type="number"
            min="0"
            step="0.01"
            value={amount}
            onChange={(event) => setAmount(event.target.value)}
            className={inputClass}
          />
        </label>

        <label className="col-span-2 block text-xs sm:col-span-1">
          <span className="mb-0.5 block text-rose-800/60">Client</span>
          <input
            value={clientName}
            onChange={(event) => setClientName(event.target.value)}
            className={inputClass}
            placeholder="Optional"
          />
        </label>

        <label className="col-span-2 block text-xs sm:col-span-2">
          <span className="mb-0.5 block text-rose-800/60">Service</span>
          <select
            value={service}
            onChange={(event) => setService(event.target.value)}
            className={inputClass}
          >
            {services.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
            <option value="custom">Custom</option>
          </select>
        </label>

        {service === "custom" ? (
          <label className="col-span-2 block text-xs">
            <span className="mb-0.5 block text-rose-800/60">Custom name</span>
            <input
              value={customService}
              onChange={(event) => setCustomService(event.target.value)}
              className={inputClass}
            />
          </label>
        ) : null}

        <label className="col-span-2 block text-xs sm:col-span-4">
          <span className="mb-0.5 block text-rose-800/60">Notes</span>
          <input
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
            className={inputClass}
            placeholder="Optional"
          />
        </label>
      </div>

      <div className="mt-2 flex justify-end gap-2">
        <button
          type="button"
          onClick={onCancel}
          className="rounded-lg px-2.5 py-1 text-xs text-rose-800 hover:bg-rose-100"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="rounded-lg bg-rose-900 px-2.5 py-1 text-xs font-medium text-white disabled:opacity-60"
        >
          {saving ? "Saving..." : "Save"}
        </button>
      </div>
    </div>
  );
}

export function SalesTable({ sales, services, onDelete, onUpdate }: Props) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [pendingDelete, setPendingDelete] = useState<Sale | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState("");

  async function saveSale(id: string, input: SaleUpdateInput) {
    setSavingId(id);
    const ok = await onUpdate(id, input);
    setSavingId(null);
    if (ok) setEditingId(null);
  }

  function closeDeleteDialog() {
    if (deletingId) return;
    setPendingDelete(null);
    setDeleteError("");
  }

  async function confirmDelete() {
    if (!pendingDelete || deletingId) return;

    setDeleteError("");
    setDeletingId(pendingDelete.id);

    try {
      const ok = await onDelete(pendingDelete.id);
      if (!ok) {
        setDeleteError("Could not delete this sale. Try again.");
        return;
      }
      setPendingDelete(null);
      setDeleteError("");
    } catch {
      setDeleteError("Could not delete this sale. Check your connection.");
    } finally {
      setDeletingId(null);
    }
  }

  const deleteDialog = pendingDelete ? (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-espresso/40 p-0 sm:items-center sm:p-4"
      onClick={closeDeleteDialog}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="delete-sale-title"
        className="w-full max-w-sm rounded-t-[2rem] border border-rose-100 bg-white p-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] shadow-2xl sm:rounded-[2rem] sm:p-6"
        onClick={(event) => event.stopPropagation()}
      >
        <h3
          id="delete-sale-title"
          className="font-serif text-xl text-rose-950 sm:text-2xl"
        >
          Delete this sale?
        </h3>
        <p className="mt-2 text-sm text-rose-800/70">
          {pendingDelete.service} · {formatMoney(Number(pendingDelete.amount))}
        </p>
        <p className="mt-1 text-xs text-rose-800/60">
          {formatDateTime(pendingDelete.sold_at)}
        </p>
        <p className="mt-3 text-sm text-rose-800/70">This cannot be undone.</p>
        {deleteError ? (
          <p className="mt-3 text-sm text-rose-700">{deleteError}</p>
        ) : null}

        <div className="mt-5 flex gap-2">
          <button
            type="button"
            disabled={deletingId !== null}
            onClick={closeDeleteDialog}
            className="flex-1 rounded-2xl border border-rose-200 px-4 py-2.5 text-sm font-medium text-rose-800 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={deletingId !== null}
            onClick={() => void confirmDelete()}
            className="flex-1 rounded-2xl bg-rose-900 px-4 py-2.5 text-sm font-medium text-white disabled:opacity-50"
          >
            {deletingId === pendingDelete.id ? "Deleting…" : "Delete"}
          </button>
        </div>
      </div>
    </div>
  ) : null;

  if (sales.length === 0) {
    return (
      <>
        <div className="rounded-3xl border border-dashed border-rose-200 bg-white/60 p-10 text-center text-rose-800/70">
          No sales recorded for this period yet.
        </div>
        {deleteDialog}
      </>
    );
  }

  return (
    <>
      <div className="space-y-4 md:hidden">
        {sales.map((sale) => (
          <article
            key={sale.id}
            className="rounded-3xl border border-rose-100 bg-white/80 p-4 shadow-sm"
          >
            {editingId === sale.id ? (
              <SaleEditor
                sale={sale}
                services={services}
                saving={savingId === sale.id}
                onSave={(input) => void saveSale(sale.id, input)}
                onCancel={() => setEditingId(null)}
              />
            ) : (
              <>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs text-rose-800/70">
                      {formatDateTime(sale.sold_at)}
                    </p>
                    <p className="mt-1 font-medium text-rose-950">
                      {formatMoney(Number(sale.amount))}
                    </p>
                  </div>
                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={() => setEditingId(sale.id)}
                      className="text-xs text-rose-900 underline-offset-2 hover:underline"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => setPendingDelete(sale)}
                      className="text-xs text-rose-700 underline-offset-2 hover:underline"
                    >
                      Delete
                    </button>
                  </div>
                </div>

                <dl className="mt-4 space-y-3 text-sm">
                  <div>
                    <dt className="text-rose-800/70">Client</dt>
                    <dd className="mt-1 text-rose-950">{sale.client_name || "—"}</dd>
                  </div>
                  <div>
                    <dt className="text-rose-800/70">Service</dt>
                    <dd className="mt-1 text-rose-950">{sale.service}</dd>
                  </div>
                  {sale.notes ? (
                    <div>
                      <dt className="text-rose-800/70">Notes</dt>
                      <dd className="mt-1 text-rose-950">{sale.notes}</dd>
                    </div>
                  ) : null}
                </dl>
              </>
            )}
          </article>
        ))}
      </div>

      <div className="hidden overflow-hidden rounded-3xl border border-rose-100 bg-white/80 shadow-sm md:block">
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-rose-50/80 text-rose-900">
              <tr>
                <th className="px-4 py-3 font-medium">Time</th>
                <th className="px-4 py-3 font-medium">Client</th>
                <th className="px-4 py-3 font-medium">Service</th>
                <th className="px-4 py-3 font-medium">Amount</th>
                <th className="px-4 py-3 font-medium">Notes</th>
                <th className="px-4 py-3 font-medium" />
              </tr>
            </thead>
            <tbody>
              {sales.map((sale) => (
                <tr key={sale.id} className="border-t border-rose-100 align-top">
                  {editingId === sale.id ? (
                    <td colSpan={6} className="px-3 py-2">
                      <SaleEditor
                        sale={sale}
                        services={services}
                        saving={savingId === sale.id}
                        onSave={(input) => void saveSale(sale.id, input)}
                        onCancel={() => setEditingId(null)}
                      />
                    </td>
                  ) : (
                    <>
                      <td className="px-4 py-3 whitespace-nowrap">
                        {formatDateTime(sale.sold_at)}
                      </td>
                      <td className="px-4 py-3">{sale.client_name || "—"}</td>
                      <td className="px-4 py-3">{sale.service}</td>
                      <td className="px-4 py-3 font-medium text-rose-950">
                        {formatMoney(Number(sale.amount))}
                      </td>
                      <td className="px-4 py-3 max-w-xs text-rose-800/80">
                        {sale.notes || "—"}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="flex gap-3">
                          <button
                            type="button"
                            onClick={() => setEditingId(sale.id)}
                            className="text-xs text-rose-900 underline-offset-2 hover:underline"
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => setPendingDelete(sale)}
                            className="text-xs text-rose-700 underline-offset-2 hover:underline"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {deleteDialog}
    </>
  );
}
