/** Admin-only one-tap sale buttons — separate from public website packages. */
export type SaleButton = {
  id: string;
  label: string;
  amount: number;
  /** Fixed commission amount per unit sold (MYR). */
  commission_amount: number;
};

export const MAX_SALE_BUTTONS = 20;

const DEFAULT_SALE_BUTTON_SEEDS: Array<{
  id: string;
  label: string;
  amount: number;
}> = [
  { id: "btn-01", label: "Bridal full", amount: 450 },
  { id: "btn-02", label: "Bridal trial", amount: 180 },
  { id: "btn-03", label: "Bridal touch-up", amount: 120 },
  { id: "btn-04", label: "ROM", amount: 180 },
  { id: "btn-05", label: "Event / dinner", amount: 180 },
  { id: "btn-06", label: "Bridesmaid", amount: 150 },
  { id: "btn-07", label: "Touch-up", amount: 100 },
  { id: "btn-08", label: "Makeup only", amount: 120 },
  { id: "btn-09", label: "Hair only", amount: 100 },
  { id: "btn-10", label: "Product", amount: 50 },
];

/** Starter labels for the ledger — add, remove, or rename in Settings. */
export const DEFAULT_SALE_BUTTONS: SaleButton[] = DEFAULT_SALE_BUTTON_SEEDS.map(
  (button) => ({
    ...button,
    commission_amount: 0,
  }),
);

function parseSaleButton(raw: unknown): SaleButton | null {
  if (!raw || typeof raw !== "object") return null;

  const item = raw as Record<string, unknown>;
  const id = typeof item.id === "string" ? item.id.trim() : "";
  const label = typeof item.label === "string" ? item.label.trim() : "";
  const amount = Number(item.amount);
  const commissionAmount = Number(item.commission_amount);

  if (!id || !label) return null;
  if (!Number.isFinite(amount) || amount < 0) return null;

  return {
    id,
    label,
    amount,
    commission_amount:
      Number.isFinite(commissionAmount) && commissionAmount >= 0
        ? commissionAmount
        : 0,
  };
}

export function createSaleButtonId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return `btn-${crypto.randomUUID().slice(0, 8)}`;
  }
  return `btn-${Date.now().toString(36)}`;
}

export function createEmptySaleButton(): SaleButton {
  return {
    id: createSaleButtonId(),
    label: "",
    amount: 0,
    commission_amount: 0,
  };
}

/** Ensure every button has a valid commission_amount before save/display. */
export function withCommissionAmount(button: SaleButton): SaleButton {
  const commission_amount = Number(button.commission_amount);
  return {
    ...button,
    commission_amount:
      Number.isFinite(commission_amount) && commission_amount >= 0
        ? commission_amount
        : 0,
  };
}

export function mergeSaleButtons(stored: unknown): SaleButton[] {
  if (!Array.isArray(stored)) return [...DEFAULT_SALE_BUTTONS];

  const seen = new Set<string>();
  const buttons: SaleButton[] = [];

  for (const raw of stored) {
    const button = parseSaleButton(raw);
    if (!button || seen.has(button.id)) continue;
    seen.add(button.id);
    buttons.push(button);
  }

  return buttons.length > 0 ? buttons : [...DEFAULT_SALE_BUTTONS];
}

export function normalizeSaleButtons(input: unknown): SaleButton[] {
  if (!Array.isArray(input)) {
    throw new Error("Sale buttons must be an array.");
  }

  const seen = new Set<string>();
  const buttons: SaleButton[] = [];

  for (const raw of input) {
    const button = parseSaleButton(raw);
    if (!button) {
      throw new Error("Each button needs a name and a valid price (MYR 0 or more).");
    }
    if (seen.has(button.id)) {
      throw new Error("Duplicate sale button ids.");
    }
    seen.add(button.id);
    buttons.push(button);
  }

  if (buttons.length === 0) {
    throw new Error("At least one sale button is required.");
  }

  if (buttons.length > MAX_SALE_BUTTONS) {
    throw new Error(`Maximum ${MAX_SALE_BUTTONS} sale buttons.`);
  }

  return buttons;
}

export function saleButtonLabels(buttons: SaleButton[]): string[] {
  return buttons.map((button) => button.label.trim()).filter(Boolean);
}

export function calculateCommissionTotal(quantity: number, commissionPerUnit: number) {
  if (!Number.isFinite(quantity) || quantity <= 0) return 0;
  if (!Number.isFinite(commissionPerUnit) || commissionPerUnit <= 0) return 0;
  return Math.round(quantity * commissionPerUnit * 100) / 100;
}
