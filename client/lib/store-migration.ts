const keys = ["no-name-products", "no-name-settings", "no-name-sections", "no-name-pages", "no-name-coupons", "no-name-orders"] as const;

const LEGACY_STORAGE_KEYS = {
  products: "no-name-products",
  settings: "no-name-settings",
  sections: "no-name-sections",
  pages: "no-name-pages",
  coupons: "no-name-coupons",
  orders: "no-name-orders",
} as const;

export type LegacyStoreData = {
  products?: unknown[];
  settings?: Record<string, unknown>;
  sections?: Record<string, unknown>;
  pages?: Record<string, unknown>;
  coupons?: unknown[];
  orders?: unknown[];
};

function readJson(key: string) {
  try {
    return JSON.parse(localStorage.getItem(key) || "null");
  } catch {
    return null;
  }
}

export function exportLegacyStoreData() {
  const data: LegacyStoreData = {
    products: readJson(LEGACY_STORAGE_KEYS.products) || [],
    settings: readJson(LEGACY_STORAGE_KEYS.settings) || {},
    sections: readJson(LEGACY_STORAGE_KEYS.sections) || {},
    pages: readJson(LEGACY_STORAGE_KEYS.pages) || {},
    coupons: readJson(LEGACY_STORAGE_KEYS.coupons) || [],
    orders: readJson(LEGACY_STORAGE_KEYS.orders) || [],
  };
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `no-name-store-export-${new Date().toISOString().slice(0, 10)}.json`;
  link.click();
  URL.revokeObjectURL(url);
  return data;
}

export async function importLegacyStoreData(file: File) {
  const data = JSON.parse(await file.text()) as LegacyStoreData;
  const response = await fetch("/api/admin/migrate", {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!response.ok) throw new Error("Unable to import store data");
  return response.json() as Promise<{
    imported: { products: number; coupons: number };
    rejected: { products: number; coupons: number; details: string[] };
    ordersSkipped: number;
  }>;
}
