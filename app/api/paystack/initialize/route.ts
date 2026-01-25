// app/api/paystack/initialize/route.ts
import { NextResponse } from "next/server";

type CartItem = {
  id?: string;
  name?: string | null;
  price_ghs?: number | null;
  qty?: number | null;
};

function normalizeGhanaPhone(raw: string) {
  // returns +233XXXXXXXXX (9 digits after +233)
  const s = String(raw || "").trim();

  // keep + if present, strip other non-digits
  const hasPlus = s.startsWith("+");
  const digits = s.replace(/[^\d]/g, "");

  // already +233XXXXXXXXX
  if (hasPlus && digits.startsWith("233") && digits.length >= 12) {
    return `+233${digits.slice(3, 12)}`;
  }

  // 233XXXXXXXXX
  if (digits.startsWith("233") && digits.length >= 12) {
    return `+233${digits.slice(3, 12)}`;
  }

  // 0XXXXXXXXX (10 digits)
  if (digits.startsWith("0") && digits.length >= 10) {
    return `+233${digits.slice(1, 10)}`;
  }

  // XXXXXXXXX (9 digits)
  if (digits.length >= 9) {
    return `+233${digits.slice(-9)}`;
  }

  return s.replace(/\s+/g, "");
}

function calcTotalGhs(items: CartItem[]) {
  return items.reduce((sum, i) => {
    const price = Number(i?.price_ghs ?? 0);
    const qty = Number(i?.qty ?? 0);
    return sum + Math.max(0, price) * Math.max(0, qty);
  }, 0);
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => null);

    const email = body?.email as string | null;
    const items = body?.items as CartItem[] | null;
    const phoneRaw = body?.phone as string | null;

    if (!email || !Array.isArray(items) || items.length === 0 || !phoneRaw) {
      return NextResponse.json(
        { error: "Missing required fields: email, items, phone" },
        { status: 400 }
      );
    }

    const phone = normalizeGhanaPhone(phoneRaw);

    const totalGhs = calcTotalGhs(items);

    // Guard against 0 / too-small amounts (can cause strange MoMo issues)
    const safeTotalGhs = totalGhs < 2 ? 2 : totalGhs;

    // Paystack amount is in pesewas
    const amount = Math.round(safeTotalGhs * 100);

    const siteUrl =
      process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/+$/, "") || "";
    const callback_url = siteUrl ? `${siteUrl}/payment/success` : undefined;

    const secret = process.env.PAYSTACK_SECRET_KEY;
    if (!secret) {
      return NextResponse.json(
        { error: "PAYSTACK_SECRET_KEY is not set in environment" },
        { status: 500 }
      );
    }

    // ✅ IMPORTANT: MoMo-first, stable path
    // - Force Mobile Money only (users want MoMo)
    // - Do NOT pass `mobile_money` object (Paystack infers and collects as needed)
    const initPayload: Record<string, any> = {
      email,
      amount,
      currency: "GHS",
      channels: ["mobile_money"],
      metadata: {
        phone,
        items,
        source: "baebe-boo-storefront",
      },
    };

    if (callback_url) initPayload.callback_url = callback_url;

    const res = await fetch("https://api.paystack.co/transaction/initialize", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${secret}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(initPayload),
    });

    const data = await res.json().catch(() => null);

    if (!res.ok || !data?.status || !data?.data?.authorization_url) {
      console.error("Paystack init error:", data);
      return NextResponse.json(
        {
          error:
            data?.message ||
            data?.error ||
            "Paystack initialize failed (no authorization_url)",
          details: data ?? null,
        },
        { status: 500 }
      );
    }

    // ✅ Return exactly what cart/page.tsx expects
    return NextResponse.json({
      authorization_url: data.data.authorization_url,
      reference: data.data.reference,
    });
  } catch (e: any) {
    console.error("Server error:", e);
    return NextResponse.json(
      { error: e?.message || "Server error" },
      { status: 500 }
    );
  }
}
