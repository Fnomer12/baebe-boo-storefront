import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { supabaseServer } from "@/lib/supabaseServer";
import { randomUUID } from "crypto";

const BUCKET = "product-images";

async function isAdmin() {
  // ✅ Next.js dynamic API: cookies() must be awaited in route handlers
  const cookieStore = await cookies();
  const token = cookieStore.get("bb_admin")?.value;

  // (optional debug)
  // console.log("COOKIE TOKEN:", token);
  // console.log("ENV TOKEN:", process.env.ADMIN_SESSION_TOKEN);

  return token?.trim() === process.env.ADMIN_SESSION_TOKEN?.trim();
}

export async function POST(req: Request) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const sb = supabaseServer();
  const form = await req.formData();

  const id = randomUUID();
  const name = String(form.get("name") ?? "").trim();
  const slug = String(form.get("slug") ?? "").trim();
  const category = String(form.get("category") ?? "").trim();

  // ✅ since you removed description from admin UI, don’t break uploads
  const description = String(form.get("description") ?? "").trim();

  const price_ghs = Number(form.get("price_ghs") ?? 0);
  const stock = Number(form.get("stock") ?? 0);
  const file = form.get("file") as File | null;

  if (!file) {
    return NextResponse.json({ error: "Missing file" }, { status: 400 });
  }

  const ext = (file.name.split(".").pop() || "jpg").toLowerCase();
  const image_path = `products/${id}.${ext}`;

  const buffer = Buffer.from(await file.arrayBuffer());

  const { error: uploadError } = await sb.storage.from(BUCKET).upload(image_path, buffer, {
    contentType: file.type || "image/jpeg",
    upsert: false,
  });

  if (uploadError) {
    return NextResponse.json({ error: uploadError.message }, { status: 400 });
  }

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
