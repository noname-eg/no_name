const keys = ["no-name-products", "no-name-settings", "no-name-sections", "no-name-pages", "no-name-coupons", "no-name-orders"] as const;

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
    products: readJson(keys[0]) || [],
    settings: readJson(keys[1]) || {},
    sections: readJson(keys[2]) || {},
    pages: readJson(keys[3]) || {},
    coupons: readJson(keys[4]) || [],
    orders: readJson(keys[5]) || [],
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
  return response.json() as Promise<{ imported: { products: number; coupons: number }; ordersSkipped: number }>;
}
