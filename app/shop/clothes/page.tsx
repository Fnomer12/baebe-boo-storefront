// app/shop/clothes/page.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Footer from "@/components/Footer";
import { supabase } from "@/lib/supabaseClient";
import { useCart } from "@/components/CartProvider"; // ✅ global cart

type Product = {
  id: string;
  name: string | null;
  price_ghs: number | null;
  category: string | null;
  image_url: string | null;
  created_at?: string | null;
  is_active?: boolean | null;
  stock?: number | null;
};

function CartIcon({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className={className}
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M6.5 6h15l-1.5 8.5H8.2L6.5 6Z" />
      <path d="M6.5 6 5.7 3.5H3" />
      <path d="M9 20a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z" />
      <path d="M18 20a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z" />
    </svg>
  );
}

export default function ClothesPage() {
  const [items, setItems] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  // ✅ global cart
  const { addItem, totalItems, hydrated } = useCart();

  // ✅ rotating title
  const titles = ["Clothes Store", "Baebe Boo Storefront"] as const;
  const [titleIndex, setTitleIndex] = useState(0);

  const formatter = useMemo(
    () =>
      new Intl.NumberFormat("en-GH", {
        style: "currency",
        currency: "GHS",
        maximumFractionDigits: 0,
      }),
    []
  );

  async function load() {
    setLoading(true);
    setErr(null);

    const { data, error } = await supabase
      .from("products")
      .select("id,name,price_ghs,category,image_url,created_at,is_active,stock")
      .eq("category", "clothes")
      .eq("is_active", true)
      .order("created_at", { ascending: false });

    if (error) {
      setErr(error.message);
      setItems([]);
    } else {
      setItems((data ?? []) as Product[]);
    }

    setLoading(false);
  }

  useEffect(() => {
    load();

    // ✅ rotate title every 3s
    const t = setInterval(() => {
      setTitleIndex((i) => (i + 1) % titles.length);
    }, 3000);

    const channel = supabase
      .channel("products-clothes-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "products" },
        (payload) => {
          const newRow = (payload as any).new as Product | undefined;
          const oldRow = (payload as any).old as Product | undefined;

          if (payload.eventType === "INSERT" && newRow?.category === "clothes") {
            if (newRow.is_active === false) return;
            setItems((prev) => [newRow, ...prev]);
          }

          if (payload.eventType === "UPDATE") {
            setItems((prev) => {
              const wasClothes = oldRow?.category === "clothes";
              const isClothes =
                newRow?.category === "clothes" && newRow?.is_active !== false;

              if (wasClothes && !isClothes) {
                return prev.filter((p) => p.id !== oldRow?.id);
              }

              if (isClothes && newRow?.id) {
                const exists = prev.some((p) => p.id === newRow.id);
                if (!exists) return [newRow, ...prev];
                return prev.map((p) => (p.id === newRow.id ? newRow : p));
              }

              return prev;
            });
          }

          if (payload.eventType === "DELETE" && oldRow?.id) {
            setItems((prev) => prev.filter((p) => p.id !== oldRow.id));
          }
        }
      )
      .subscribe();

    return () => {
      clearInterval(t);
      supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <main className="min-h-screen bg-white text-black">
      {/* tiny keyframes just for the title */}
      <style jsx global>{`
        @keyframes bbFadeSlide {
          from {
            opacity: 0;
            transform: translateY(6px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .bb-title-anim {
          animation: bbFadeSlide 240ms ease-out;
        }
      `}</style>

            {/* TOP BAR */}
<div className="sticky top-0 z-40 border-b border-black/10 bg-white/80 backdrop-blur">
  <div className="max-w-6xl mx-auto px-6 h-16">
    <div className="relative h-full flex items-center justify-between">
      {/* Left: Back icon (centered in a fixed hit area) */}
      <Link
        href="/shop"
        aria-label="Back"
        title="Back"
        className="flex h-10 w-10 items-center justify-center rounded-full text-black/70 hover:text-black hover:bg-black/5 transition"
      >
        ←
      </Link>

       {/* Center: Rotating title (optically centered, slightly lower) */}
<div className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-[42%] text-center">
  {/* width stabilizer */}
  <span className="invisible block text-sm font-semibold tracking-tight">
    Baebe Boo Storefront
  </span>

  <div
    key={titleIndex}
    className="absolute inset-0 bb-title-anim text-sm font-semibold tracking-tight"
  >
    {titles[titleIndex]}
  </div>
</div>




      {/* Right: Cart icon (centered in same fixed hit area) */}
      <Link
        href="/cart"
        aria-label="Cart"
        title="Cart"
        className="relative flex h-10 w-10 items-center justify-center rounded-full text-black/70 hover:text-black hover:bg-black/5 transition"
      >
        <CartIcon className="h-5 w-5" />

        {hydrated && totalItems > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-black text-white text-[11px] leading-[18px] text-center">
            {totalItems}
          </span>
        )}
      </Link>
    </div>
  </div>
</div>

      {/* CONTENT */}
      <section className="mt-8 pb-12">
        <div className="max-w-6xl mx-auto px-6">
          {loading ? (
            <div className="grid gap-6 sm:grid-cols-2 md:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <div
                  key={i}
                  className="overflow-hidden rounded-3xl border border-black/10 bg-white shadow-sm"
                >
                  <div className="h-52 bg-black/[0.06]" />
                  <div className="p-5">
                    <div className="h-4 w-2/3 rounded bg-black/[0.06]" />
                    <div className="mt-3 h-3 w-1/3 rounded bg-black/[0.06]" />
                    <div className="mt-5 h-9 w-28 rounded-full bg-black/[0.06]" />
                  </div>
                </div>
              ))}
            </div>
          ) : err ? (
            <div className="rounded-3xl border border-black/10 bg-white p-6 shadow-sm">
              <div className="text-sm font-semibold">Couldn’t load clothes</div>
              <p className="mt-2 text-sm text-black/70">{err}</p>
              <button
                onClick={load}
                className="mt-4 rounded-full bg-black text-white px-5 py-2.5 text-sm font-medium hover:bg-black/90 transition"
              >
                Retry
              </button>
            </div>
          ) : items.length === 0 ? (
            <div className="rounded-3xl border border-black/10 bg-white p-8 text-center shadow-sm">
              <div className="text-sm font-semibold">No items added yet</div>
              
            </div>
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 md:grid-cols-3">
              {items.map((item) => (
                <div
                  key={item.id}
                  className="group overflow-hidden rounded-3xl border border-black/10 bg-white shadow-sm hover:shadow-md transition"
                >
                  <div className="relative w-full aspect-[4/3] bg-black/[0.03] overflow-hidden">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={item.image_url ?? "/images/products/placeholder.jpg"}
                      alt={item.name ?? "Product"}
                      className="absolute inset-0 h-full w-full object-cover object-center"
                      loading="lazy"
                    />
                  </div>

                  <div className="p-5">
                    <div className="text-base font-semibold tracking-tight">
                      {item.name ?? "Untitled product"}
                    </div>

                    {/* optional: show price */}
                    <div className="mt-1 text-sm text-black/70">
                      {formatter.format(item.price_ghs ?? 0)}
                    </div>

                    <button
                      onClick={() =>
                        addItem({
                          id: item.id,
                          name: item.name ?? "Untitled product",
                          price_ghs: item.price_ghs ?? 0,
                          image_url: item.image_url,
                        })
                      }
                      className="mt-5 inline-flex items-center rounded-full bg-black text-white px-4 py-2 text-sm font-medium hover:bg-black/90 transition"
                    >
                      Add to cart
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ✅ page-level footer height reduction */}
      <div className="-mt-2 overflow-hidden">
        <Footer />
      </div>
    </main>
  );
}
