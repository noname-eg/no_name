import { randomUUID } from "node:crypto";
import type { Express } from "express";
import { z } from "zod";
import { requireAdmin, supabaseRequest, uploadSupabaseObject, writeAuditLog } from "../auth";

const productSelect = "id,name,name_en,description,description_en,category,numeric_price,original_price,sale_price,image,images,colors,sizes,badge,tag,stock,low_stock_threshold,active";

const orderSchema = z.object({
  customerName: z.string().trim().min(2).max(120),
  phone: z.string().trim().regex(/^\d{7,15}$/),
  address: z.string().trim().min(3).max(500),
  notes: z.string().trim().max(1000).optional().default(""),
  paymentMethod: z.enum(["cod", "wallet", "instapay"]),
  transferNumber: z.string().trim().max(120).optional(),
  receipt: z.string().max(1_500_000).optional(),
  couponCode: z.string().trim().max(64).optional(),
  items: z.array(z.object({ productId: z.string().trim().min(1).max(120), quantity: z.number().int().min(1).max(99) })).min(1).max(50),
});

const orderStatusSchema = z.object({ status: z.enum(["new", "processing", "completed", "rejected"]) });
const productSchema = z.object({
  id: z.string().trim().min(1).max(120),
  name: z.string().trim().min(1).max(200),
  nameEn: z.string().trim().max(200).optional(),
  description: z.string().max(5000).optional(),
  descriptionEn: z.string().max(5000).optional(),
  category: z.string().trim().min(1).max(120),
  numericPrice: z.number().nonnegative(),
  originalPrice: z.number().nonnegative().optional(),
  salePrice: z.number().nonnegative().optional(),
  image: z.string().url().max(2000),
  images: z.array(z.string().url().max(2000)).max(10).default([]),
  colors: z.array(z.string().max(30)).max(30).default([]),
  sizes: z.array(z.string().max(30)).max(30).default([]),
  badge: z.string().max(120).optional(),
  tag: z.string().max(120).optional(),
  stock: z.number().int().nonnegative().default(0),
  lowStockThreshold: z.number().int().nonnegative().default(3),
  active: z.boolean().default(true),
});
const couponSchema = z.object({ code: z.string().trim().min(1).max(64), discount: z.number().positive().max(100), maxUses: z.number().int().positive().optional(), expiresAt: z.string().datetime().optional(), active: z.boolean().default(true) });

function productRow(product: z.infer<typeof productSchema>) {
  return {
    id: product.id, name: product.name, name_en: product.nameEn || null, description: product.description || null, description_en: product.descriptionEn || null,
    category: product.category, numeric_price: product.numericPrice, original_price: product.originalPrice ?? null, sale_price: product.salePrice ?? null,
    image: product.image, images: product.images, colors: product.colors, sizes: product.sizes, badge: product.badge || null, tag: product.tag || null,
    stock: product.stock, low_stock_threshold: product.lowStockThreshold, active: product.active,
  };
}

function mapProduct(product: Record<string, unknown>) {
  const numericPrice = Number(product.numeric_price);
  return {
    ...product,
    nameEn: product.name_en,
    descriptionEn: product.description_en,
    numericPrice,
    originalPrice: product.original_price == null ? undefined : Number(product.original_price),
    salePrice: product.sale_price == null ? undefined : Number(product.sale_price),
    lowStockThreshold: product.low_stock_threshold,
    images: product.images || [],
    colors: product.colors || [],
    sizes: product.sizes || [],
  };
}

export function registerStoreRoutes(app: Express) {
  app.post("/api/admin/migrate", requireAdmin, async (req, res) => {
    const body = z.object({ products: z.array(z.unknown()).optional(), settings: z.record(z.unknown()).optional(), sections: z.record(z.unknown()).optional(), pages: z.record(z.unknown()).optional(), coupons: z.array(z.unknown()).optional(), orders: z.array(z.unknown()).optional() }).safeParse(req.body);
    if (!body.success) { res.status(400).json({ error: "Invalid migration file." }); return; }
    try {
      let products = 0;
      for (const value of body.data.products || []) {
        const parsed = productSchema.safeParse(value);
        if (!parsed.success) continue;
        await supabaseRequest("products?on_conflict=id", { method: "POST", headers: { Prefer: "resolution=merge-duplicates,return=minimal" }, body: JSON.stringify(productRow(parsed.data)) });
        products += 1;
      }
      if (body.data.settings) await supabaseRequest("site_settings?on_conflict=id", { method: "POST", headers: { Prefer: "resolution=merge-duplicates,return=minimal" }, body: JSON.stringify({ id: true, data: body.data.settings }) });
      for (const [key, data] of Object.entries(body.data.sections || {})) await supabaseRequest("site_sections?on_conflict=key", { method: "POST", headers: { Prefer: "resolution=merge-duplicates,return=minimal" }, body: JSON.stringify({ key, data }) });
      if (body.data.pages) await supabaseRequest("page_settings?on_conflict=id", { method: "POST", headers: { Prefer: "resolution=merge-duplicates,return=minimal" }, body: JSON.stringify({ id: true, data: body.data.pages }) });
      let coupons = 0;
      for (const value of body.data.coupons || []) {
        const parsed = couponSchema.safeParse(value);
        if (!parsed.success) continue;
        await supabaseRequest("coupons?on_conflict=code", { method: "POST", headers: { Prefer: "resolution=merge-duplicates,return=minimal" }, body: JSON.stringify({ code: parsed.data.code.toUpperCase(), discount: parsed.data.discount, uses: 0, max_uses: parsed.data.maxUses ?? null, expires_at: parsed.data.expiresAt ?? null, active: parsed.data.active }) });
        coupons += 1;
      }
      await writeAuditLog("store.migrated", req.admin?.id, { products, coupons, ordersSkipped: (body.data.orders || []).length });
      res.json({ imported: { products, coupons }, ordersSkipped: (body.data.orders || []).length });
    } catch (error) { console.error("Store migration failed", error); res.status(400).json({ error: "Unable to import migration file." }); }
  });

  app.post("/api/admin/products", requireAdmin, async (req, res) => {
    const parsed = productSchema.safeParse(req.body);
    if (!parsed.success) { res.status(400).json({ error: "Invalid product data." }); return; }
    try {
      const rows = await supabaseRequest<Record<string, unknown>[]>("products", { method: "POST", headers: { Prefer: "return=representation" }, body: JSON.stringify(productRow(parsed.data)) });
      await writeAuditLog("product.created", req.admin?.id, { productId: parsed.data.id });
      res.status(201).json({ product: rows[0] ? mapProduct(rows[0]) : parsed.data });
    } catch (error) { console.error("Product creation failed", error); res.status(409).json({ error: "Unable to create product." }); }
  });

  app.patch("/api/admin/products/:id", requireAdmin, async (req, res) => {
    const parsed = productSchema.safeParse({ ...req.body, id: String(req.params.id) });
    if (!parsed.success) { res.status(400).json({ error: "Invalid product data." }); return; }
    try {
      const rows = await supabaseRequest<Record<string, unknown>[]>(`products?id=eq.${encodeURIComponent(parsed.data.id)}`, { method: "PATCH", headers: { Prefer: "return=representation" }, body: JSON.stringify(productRow(parsed.data)) });
      if (!rows[0]) { res.status(404).json({ error: "Product not found." }); return; }
      await writeAuditLog("product.updated", req.admin?.id, { productId: parsed.data.id });
      res.json({ product: mapProduct(rows[0]) });
    } catch (error) { console.error("Product update failed", error); res.status(400).json({ error: "Unable to update product." }); }
  });

  app.delete("/api/admin/products/:id", requireAdmin, async (req, res) => {
    const productId = String(req.params.id);
    try {
      await supabaseRequest(`products?id=eq.${encodeURIComponent(productId)}`, { method: "PATCH", headers: { Prefer: "return=minimal" }, body: JSON.stringify({ active: false, updated_at: new Date().toISOString() }) });
      await writeAuditLog("product.archived", req.admin?.id, { productId });
      res.status(204).send();
    } catch (error) { console.error("Product deletion failed", error); res.status(400).json({ error: "Unable to delete product." }); }
  });

  app.put("/api/admin/store-settings", requireAdmin, async (req, res) => {
    const data = z.record(z.unknown()).safeParse(req.body);
    if (!data.success) { res.status(400).json({ error: "Invalid settings." }); return; }
    try {
      const rows = await supabaseRequest<Record<string, unknown>[]>("site_settings?on_conflict=id", { method: "POST", headers: { Prefer: "resolution=merge-duplicates,return=representation" }, body: JSON.stringify({ id: true, data: data.data, updated_at: new Date().toISOString() }) });
      await writeAuditLog("settings.updated", req.admin?.id);
      res.json({ settings: rows[0]?.data || data.data });
    } catch (error) { console.error("Settings update failed", error); res.status(400).json({ error: "Unable to save settings." }); }
  });

  app.put("/api/admin/sections/:key", requireAdmin, async (req, res) => {
    const key = String(req.params.key);
    const data = z.record(z.unknown()).safeParse(req.body);
    if (!data.success || !key) { res.status(400).json({ error: "Invalid section." }); return; }
    try {
      await supabaseRequest("site_sections?on_conflict=key", { method: "POST", headers: { Prefer: "resolution=merge-duplicates,return=minimal" }, body: JSON.stringify({ key, data: data.data, updated_at: new Date().toISOString() }) });
      await writeAuditLog("section.updated", req.admin?.id, { key });
      res.json({ key, data: data.data });
    } catch (error) { console.error("Section update failed", error); res.status(400).json({ error: "Unable to save section." }); }
  });

  app.put("/api/admin/pages", requireAdmin, async (req, res) => {
    const data = z.record(z.unknown()).safeParse(req.body);
    if (!data.success) { res.status(400).json({ error: "Invalid pages." }); return; }
    try {
      await supabaseRequest("page_settings?on_conflict=id", { method: "POST", headers: { Prefer: "resolution=merge-duplicates,return=minimal" }, body: JSON.stringify({ id: true, data: data.data, updated_at: new Date().toISOString() }) });
      await writeAuditLog("pages.updated", req.admin?.id);
      res.json({ pages: data.data });
    } catch (error) { console.error("Pages update failed", error); res.status(400).json({ error: "Unable to save pages." }); }
  });

  app.post("/api/admin/coupons", requireAdmin, async (req, res) => {
    const parsed = couponSchema.safeParse(req.body);
    if (!parsed.success) { res.status(400).json({ error: "Invalid coupon." }); return; }
    try {
      const coupon = { code: parsed.data.code.toUpperCase(), discount: parsed.data.discount, max_uses: parsed.data.maxUses ?? null, expires_at: parsed.data.expiresAt ?? null, active: parsed.data.active, uses: 0 };
      const rows = await supabaseRequest<Record<string, unknown>[]>("coupons", { method: "POST", headers: { Prefer: "return=representation" }, body: JSON.stringify(coupon) });
      await writeAuditLog("coupon.created", req.admin?.id, { code: coupon.code });
      res.status(201).json({ coupon: rows[0] || coupon });
    } catch (error) { console.error("Coupon creation failed", error); res.status(409).json({ error: "Unable to create coupon." }); }
  });

  app.delete("/api/admin/coupons/:code", requireAdmin, async (req, res) => {
    const code = String(req.params.code).toUpperCase();
    try {
      await supabaseRequest(`coupons?code=eq.${encodeURIComponent(code)}`, { method: "PATCH", headers: { Prefer: "return=minimal" }, body: JSON.stringify({ active: false }) });
      await writeAuditLog("coupon.archived", req.admin?.id, { code });
      res.status(204).send();
    } catch (error) { console.error("Coupon deletion failed", error); res.status(400).json({ error: "Unable to delete coupon." }); }
  });

  app.get("/api/products", async (_req, res) => {
    try {
      const rows = await supabaseRequest<Record<string, unknown>[]>(`products?select=${productSelect}&active=eq.true&order=created_at.desc`);
      res.json({ products: rows.map(mapProduct) });
    } catch (error) {
      console.error("Products lookup failed", error);
      res.status(503).json({ error: "Store data is not configured." });
    }
  });

  app.get("/api/store-settings", async (_req, res) => {
    try {
      const rows = await supabaseRequest<{ data: Record<string, unknown> }[]>("site_settings?select=data&id=eq.true&limit=1");
      res.json({ settings: rows[0]?.data || {} });
    } catch (error) {
      console.error("Store settings lookup failed", error);
      res.status(503).json({ error: "Store data is not configured." });
    }
  });

  app.get("/api/sections", async (_req, res) => {
    try {
      const rows = await supabaseRequest<{ key: string; data: Record<string, unknown> }[]>("site_sections?select=key,data");
      res.json({ sections: Object.fromEntries(rows.map((row) => [row.key, row.data])) });
    } catch (error) {
      console.error("Sections lookup failed", error);
      res.status(503).json({ error: "Store data is not configured." });
    }
  });

  app.get("/api/pages", async (_req, res) => {
    try {
      const rows = await supabaseRequest<{ data: Record<string, unknown> }[]>("page_settings?select=data&id=eq.true&limit=1");
      res.json({ pages: rows[0]?.data || {} });
    } catch (error) {
      console.error("Pages lookup failed", error);
      res.status(503).json({ error: "Store data is not configured." });
    }
  });

  app.get("/api/coupons", async (_req, res) => {
    try {
      const rows = await supabaseRequest<Record<string, unknown>[]>("coupons?select=code,discount,uses,active&active=eq.true");
      res.json({ coupons: rows.map((coupon) => ({ ...coupon, discount: Number(coupon.discount), uses: Number(coupon.uses) })) });
    } catch (error) {
      console.error("Coupons lookup failed", error);
      res.status(503).json({ error: "Store data is not configured." });
    }
  });

  app.get("/api/orders/:orderNumber", async (req, res) => {
    const orderNumber = String(req.params.orderNumber);
    const phone = typeof req.query.phone === "string" ? req.query.phone.trim() : "";
    if (!phone || phone.length < 7) { res.status(400).json({ error: "Phone verification is required." }); return; }
    try {
      const orders = await supabaseRequest<Record<string, unknown>[]>(`orders?select=*,order_items(*)&order_number=eq.${encodeURIComponent(orderNumber)}&phone=eq.${encodeURIComponent(phone)}&limit=1`);
      const order = orders[0];
      if (!order) { res.status(404).json({ error: "Order not found." }); return; }
      res.json({ order });
    } catch (error) { console.error("Order lookup failed", error); res.status(503).json({ error: "Unable to load order." }); }
  });

  app.post("/api/order-receipts", async (req, res) => {
    const parsed = z.object({ receipt: z.string().max(1_500_000) }).safeParse(req.body);
    if (!parsed.success) { res.status(400).json({ error: "Invalid receipt." }); return; }
    const match = parsed.data.receipt.match(/^data:(image\/(?:png|jpeg|webp));base64,([A-Za-z0-9+/=]+)$/);
    if (!match) { res.status(400).json({ error: "Only PNG, JPEG, or WebP receipts are supported." }); return; }
    try {
      const path = `receipts/${new Date().toISOString().slice(0, 10)}/${randomUUID()}.${match[1].split("/")[1].replace("jpeg", "jpg")}`;
      await uploadSupabaseObject(path, match[1], Buffer.from(match[2], "base64"));
      res.status(201).json({ path });
    } catch (error) { console.error("Receipt upload failed", error); res.status(503).json({ error: "Unable to upload receipt." }); }
  });

  app.post("/api/orders", async (req, res) => {
    const parsed = orderSchema.safeParse(req.body);
    const idempotencyKey = req.get("Idempotency-Key")?.trim();
    if (!parsed.success || !idempotencyKey || idempotencyKey.length < 16 || idempotencyKey.length > 200) {
      res.status(400).json({ error: "Invalid order data." });
      return;
    }

    try {
      const result = await supabaseRequest<{ id: string; order_number: string; total: number }>("rpc/create_store_order", {
        method: "POST",
        body: JSON.stringify({
          p_customer_name: parsed.data.customerName,
          p_phone: parsed.data.phone,
          p_address: parsed.data.address,
          p_notes: parsed.data.notes,
          p_payment_method: parsed.data.paymentMethod,
          p_transfer_number: parsed.data.transferNumber || null,
          p_receipt: parsed.data.receipt || null,
          p_coupon_code: parsed.data.couponCode || null,
          p_idempotency_key: idempotencyKey,
          p_items: parsed.data.items,
        }),
      });
      res.status(201).json({ order: result });
    } catch (error) {
      console.error("Order creation failed", error);
      const message = error instanceof Error ? error.message : "";
      if (message.includes("product unavailable") || message.includes("invalid coupon")) {
        res.status(409).json({ error: "Product availability or coupon has changed." });
        return;
      }
      res.status(503).json({ error: "Unable to create order." });
    }
  });

  app.get("/api/admin/orders", requireAdmin, async (_req, res) => {
    try {
      const orders = await supabaseRequest<Record<string, unknown>[]>("orders?select=*&order=created_at.desc");
      res.json({ orders });
    } catch (error) {
      console.error("Admin orders lookup failed", error);
      res.status(503).json({ error: "Store data is not configured." });
    }
  });

  app.patch("/api/admin/orders/:id", requireAdmin, async (req, res) => {
    const parsed = orderStatusSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: "Invalid order status." });
      return;
    }
    try {
      const orderId = String(req.params.id);
      const orders = await supabaseRequest<Record<string, unknown>[]>(`orders?id=eq.${encodeURIComponent(orderId)}&select=id,status`, {
        method: "PATCH",
        headers: { Prefer: "return=representation" },
        body: JSON.stringify({ status: parsed.data.status, updated_at: new Date().toISOString() }),
      });
      if (!orders[0]) {
        res.status(404).json({ error: "Order not found." });
        return;
      }
      await writeAuditLog("order.status.updated", req.admin?.id, { orderId, status: parsed.data.status });
      res.json({ order: orders[0] });
    } catch (error) {
      console.error("Admin order update failed", error);
      res.status(503).json({ error: "Unable to update order." });
    }
  });
}
