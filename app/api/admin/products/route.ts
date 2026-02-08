import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabaseServer";
import { randomUUID } from "crypto";

const BUCKET = "product-images";

function isAdmin(req: Request) {
  const cookie = req.headers.get("cookie") || "";
  return cookie.includes(`bb_admin=${process.env.ADMIN_SESSION_TOKEN}`);
}

export async function POST(req: Request) {
  if (!isAdmin(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const sb = supabaseServer();
  const form = await req.formData();

  const id = randomUUID();
  const name = String(form.get("name"));
  const slug = String(form.get("slug"));
  const description = String(form.get("description"));
  const category = String(form.get("category"));
  const price_ghs = Number(form.get("price_ghs"));
  const stock = Number(form.get("stock"));
  const file = form.get("file") as File;

  const ext = file.name.split(".").pop();
  const image_path = `products/${id}.${ext}`;

  // Upload image
  const buffer = Buffer.from(await file.arrayBuffer());
  const { error: uploadError } = await sb.storage
    .from(BUCKET)
    .upload(image_path, buffer);

  if (uploadError) {
    return NextResponse.json({ error: uploadError.message }, { status: 400 });
  }

  // Insert product (THIS MAKES IT SHOW ON SHOP PAGES)
  const { error } = await sb.from("products").insert({
    id,
    name,
    slug,
    description,
    category,
    price_ghs,
    stock,
    is_active: true,
    image_path,
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ ok: true });
}
