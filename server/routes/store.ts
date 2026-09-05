import type { Express } from "express";
import { z } from "zod";
import { requireAdmin, supabaseRequest, writeAuditLog } from "../auth";

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
