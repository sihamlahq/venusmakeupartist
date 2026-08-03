"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { formatMoney } from "@/lib/format";
import {
  getDateRange,
  toQueryRange,
  formatRangeLabel,
  todayIsoDate,
  type DateRangePreset,
} from "@/lib/date-range";
import { downloadSalesCsv } from "@/lib/export-sales";
import type { Sale, SaleUpdateInput } from "@/lib/types";
import {
  DEFAULT_SALE_BUTTONS,
  saleButtonLabels,
  type SaleButton,
} from "@/lib/sale-buttons";
import { DEFAULT_WEBSITE_PACKAGES, type WebsitePackage } from "@/lib/website-packages";
import { AdminLogoutButton } from "@/components/admin-login";
import { AdminSettingsPanel } from "@/components/admin-settings-panel";
import { SalesDateFilter } from "@/components/sales-date-filter";
import { SalesForm } from "@/components/sales-form";
import { SalesSummaryTable } from "@/components/sales-summary-table";
import { SalesTable } from "@/components/sales-table";

export function SalesDashboard() {
  const [preset, setPreset] = useState<DateRangePreset>("today");
  const [customFrom, setCustomFrom] = useState("");
  const [customTo, setCustomTo] = useState("");
  const [todayKey, setTodayKey] = useState(todayIsoDate());
  const [saleButtons, setSaleButtons] = useState<SaleButton[]>(DEFAULT_SALE_BUTTONS);
  const [whatsappNumber, setWhatsappNumber] = useState("");
  const [websitePackages, setWebsitePackages] = useState<WebsitePackage[]>(
    DEFAULT_WEBSITE_PACKAGES,
  );
  const [sales, setSales] = useState<Sale[]>([]);
  const [total, setTotal] = useState(0);
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [error, setError] = useState("");

  const ledgerServices = useMemo(() => saleButtonLabels(saleButtons), [saleButtons]);

  const range = useMemo(
    () => getDateRange(preset, customFrom, customTo),
    [preset, customFrom, customTo, todayKey],
  );

  useEffect(() => {
    const interval = window.setInterval(() => {
      const next = todayIsoDate();
      setTodayKey((current) => (current === next ? current : next));
    }, 60_000);

    return () => window.clearInterval(interval);
  }, []);

  const loadSettings = useCallback(async () => {
    const response = await fetch("/api/settings", { cache: "no-store" });
    if (!response.ok) return;

    const data = (await response.json()) as {
      whatsappNumber?: string;
      websitePackages?: WebsitePackage[];
      saleButtons?: SaleButton[];
    };
    if (data.saleButtons?.length) {
      setSaleButtons(data.saleButtons);
    }
    if (typeof data.whatsappNumber === "string") {
      setWhatsappNumber(data.whatsappNumber);
    }
    if (data.websitePackages?.length) {
      setWebsitePackages(data.websitePackages);
    }
  }, []);

  const loadSales = useCallback(async () => {
    const query = toQueryRange(range);
    const params = new URLSearchParams({
      from: query.from,
      to: query.to,
    });

    const response = await fetch(`/api/sales?${params.toString()}`, {
      cache: "no-store",
      credentials: "include",
    });

    if (!response.ok) {
      setError("Could not load sales.");
      setLoading(false);
      return;
    }

    const data = (await response.json()) as {
      sales: Sale[];
      total: number;
      count: number;
    };

    setSales(data.sales);
    setTotal(data.total);
    setCount(data.count);
    setLastUpdated(new Date());
    setError("");
    setLoading(false);
  }, [range]);

  useEffect(() => {
    void loadSettings();
  }, [loadSettings]);

  useEffect(() => {
    setLoading(true);
    void loadSales();
    const interval = window.setInterval(() => {
      void loadSales();
    }, 2000);

    return () => window.clearInterval(interval);
  }, [loadSales]);

  function onCreated(sale: Sale) {
    const soldAt = sale.sold_at.slice(0, 10);
    if (soldAt >= range.from && soldAt <= range.to) {
      setSales((current) => [sale, ...current]);
      setTotal((current) => current + Number(sale.amount));
      setCount((current) => current + 1);
      setLastUpdated(new Date());
    }
  }

  async function onDelete(id: string) {
    try {
      const response = await fetch(`/api/sales/${id}`, {
        method: "DELETE",
        credentials: "include",
      });

      if (!response.ok) return false;

      await loadSales();
      return true;
    } catch {
      return false;
    }
  }

  async function onUpdate(id: string, input: SaleUpdateInput) {
    const response = await fetch(`/api/sales/${id}`, {
      method: "PATCH",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });

    if (!response.ok) return false;

    await loadSales();
    return true;
  }

  function onExportCsv() {
    if (sales.length === 0) return;

    const filename = `venus-sales-${range.from}-to-${range.to}.csv`;
    downloadSalesCsv(sales, filename);
  }

  function onPresetChange(nextPreset: DateRangePreset) {
    setPreset(nextPreset);
    if (nextPreset === "custom" && !customFrom && !customTo) {
      const current = getDateRange("today");
      setCustomFrom(current.from);
      setCustomTo(current.to);
    }
  }

  const isTodayView = preset === "today";

  return (
    <div className="mx-auto w-full min-w-0 max-w-6xl px-3 py-6 sm:px-4 sm:py-10">
      <div className="mb-6 flex items-start justify-between gap-3 sm:mb-8">
        <div className="min-w-0 flex-1">
          <p className="text-xs uppercase tracking-[0.2em] text-rose-700 sm:text-sm">
            Live sales ledger
          </p>
          <h1 className="font-serif text-2xl text-rose-950 sm:text-3xl md:text-4xl">
            Venus Admin
          </h1>
          <p className="mt-2 break-words text-sm text-rose-800/70">
            {formatRangeLabel(range)}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <AdminSettingsPanel
            saleButtons={saleButtons}
            whatsappNumber={whatsappNumber}
            websitePackages={websitePackages}
            onSaleButtonsUpdated={setSaleButtons}
            onWhatsAppUpdated={setWhatsappNumber}
            onWebsitePackagesUpdated={setWebsitePackages}
          />
          <AdminLogoutButton />
        </div>
      </div>

      <SalesForm saleButtons={saleButtons} onCreated={onCreated} className="mb-6 lg:hidden" />

      <div className="mb-6 grid gap-3 sm:mb-8 sm:gap-4 md:grid-cols-3">
        <div className="rounded-3xl border border-rose-100 bg-white/80 p-4 shadow-sm sm:p-6">
          <p className="text-sm text-rose-800/70">
            {isTodayView ? "Today's total" : "Period total"}
          </p>
          <p className="mt-2 break-words font-serif text-2xl text-rose-950 sm:text-3xl">
            {formatMoney(total)}
          </p>
        </div>
        <div className="rounded-3xl border border-rose-100 bg-white/80 p-4 shadow-sm sm:p-6">
          <p className="text-sm text-rose-800/70">
            {isTodayView ? "Today's sales" : "Sales count"}
          </p>
          <p className="mt-2 font-serif text-2xl text-rose-950 sm:text-3xl">{count}</p>
        </div>
        <div className="rounded-3xl border border-rose-100 bg-white/80 p-4 shadow-sm sm:p-6">
          <p className="text-sm text-rose-800/70">Live status</p>
          <p className="mt-2 font-serif text-2xl text-rose-950 sm:text-3xl">
            {loading ? "Syncing" : "Live"}
          </p>
          <p className="mt-2 text-xs text-rose-800/60">
            {lastUpdated
              ? `Updated ${lastUpdated.toLocaleTimeString("en-MY")}`
              : "Waiting for first sync"}
          </p>
        </div>
      </div>

      <div className="mb-6 space-y-4">
        <SalesDateFilter
          range={range}
          customFrom={customFrom}
          customTo={customTo}
          onPresetChange={onPresetChange}
          onCustomFromChange={setCustomFrom}
          onCustomToChange={setCustomTo}
        />
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={onExportCsv}
            disabled={sales.length === 0}
            className="rounded-full border border-rose-200 px-4 py-2 text-sm text-rose-900 transition hover:bg-rose-50 disabled:opacity-40"
          >
            Export CSV ({count})
          </button>
          <a
            href="/"
            className="text-sm text-rose-800 underline-offset-4 hover:underline"
          >
            Back to website
          </a>
        </div>
      </div>

      <div className="mb-6">
        <SalesSummaryTable
          sales={sales}
          saleButtons={saleButtons}
          range={range}
          onSaleButtonsUpdated={setSaleButtons}
        />
      </div>

      <div className="grid min-w-0 gap-6 sm:gap-8 lg:grid-cols-[minmax(0,360px)_1fr]">
        <SalesForm saleButtons={saleButtons} onCreated={onCreated} className="hidden lg:block" />
        <div className="min-w-0">
          {error ? <p className="mb-4 text-sm text-rose-700">{error}</p> : null}
          <SalesTable
            sales={sales}
            services={ledgerServices}
            onDelete={onDelete}
            onUpdate={onUpdate}
          />
        </div>
      </div>
    </div>
  );
}
