import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const BUCKET = "product-images";

export async function POST(req: Request) {
  try {
    const { items } = await req.json();
    // items = [{ product_id: "...", qty: 2 }, ...]

    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: "Missing items" }, { status: 400 });
    }

    const sb = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { persistSession: false } }
    );

    // 1) decrement stock + get which products should be deleted
    const { data: toDelete, error: decErr } = await sb.rpc(
      "decrement_stock_and_get_deletions",
      { items }
    );

    if (decErr) {
      return NextResponse.json({ error: decErr.message }, { status: 400 });
    }

    const deletions = (toDelete ?? []) as { product_id: string; image_path: string | null }[];

    // 2) delete product rows that are now out of stock
    if (deletions.length > 0) {
      const ids = deletions.map((d) => d.product_id);

      const { error: delErr } = await sb.from("products").delete().in("id", ids);
      if (delErr) {
        return NextResponse.json({ error: delErr.message }, { status: 400 });
      }

      // 3) delete images from storage too
      const paths = deletions.map((d) => d.image_path).filter(Boolean) as string[];

      if (paths.length > 0) {
        const { error: rmErr } = await sb.storage.from(BUCKET).remove(paths);

        // If storage delete fails, we don't want to block checkout,
        // but we DO return it so you can see it in logs.
        if (rmErr) {
          return NextResponse.json({
            ok: true,
            warning: "Product deleted but image removal failed",
            storage_error: rmErr.message,
          });
        }
      }
    }

    return NextResponse.json({ ok: true, deleted: deletions.length });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Server error" }, { status: 500 });
  }
}
