import { NextResponse } from "next/server";
import crypto from "crypto";
import { createClient } from "@supabase/supabase-js";

const BUCKET = "product-images";

export async function POST(req: Request) {
  const rawBody = await req.text();

  const signature = req.headers.get("x-paystack-signature");
  const expected = crypto
    .createHmac("sha512", process.env.PAYSTACK_SECRET_KEY!)
    .update(rawBody)
    .digest("hex");

  if (signature !== expected) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  const event = JSON.parse(rawBody);

  // Only act on successful charges
  if (event.event !== "charge.success") {
    return NextResponse.json({ ok: true });
  }

  const metadata = event.data.metadata;
  const items = metadata?.items;

  if (!Array.isArray(items)) {
    return NextResponse.json({ error: "No items in metadata" }, { status: 400 });
  }

  const sb = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );

  // 1) reduce stock + get items to delete
  const { data, error } = await sb.rpc(
    "decrement_stock_and_get_deletions",
    { items }
  );

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  const deletions = data ?? [];

  // 2) delete product rows
  if (deletions.length > 0) {
    await sb
      .from("products")
      .delete()
      .in("id", deletions.map((d: any) => d.product_id));

    // 3) delete images
    const paths = deletions
      .map((d: any) => d.image_path)
      .filter(Boolean);

    if (paths.length > 0) {
      await sb.storage.from(BUCKET).remove(paths);
    }
  }

  return NextResponse.json({ ok: true });
}
