// app/shop/clothes/page.tsx
"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import Footer from "@/components/Footer";
import { supabase } from "@/lib/supabaseClient";
import { useCart } from "@/components/CartProvider";

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

const BUCKET = "product-images";
const PLACEHOLDER = "/images/products/placeholder.jpg";

function isHttpUrl(v: string) {
  return v.startsWith("http://") || v.startsWith("https://");
}

function toPublicUrl(storagePath: string) {
  const cleanPath = storagePath
    .trim()
    .replace(/^\/+/, "")
    .replace(new RegExp(`^${BUCKET}\/+`), "");

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(cleanPath);
  return data?.publicUrl || "";
}

function resolveProductImage(image_url: string | null) {
  if (!image_url) return PLACEHOLDER;
  const raw = image_url.trim();
  if (!raw) return PLACEHOLDER;
  if (isHttpUrl(raw)) return raw;
  const pub = toPublicUrl(raw);
  return pub || PLACEHOLDER;
}

export default function ClothesPage() {
  const [items, setItems] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  const { addItem, totalItems, hydrated } = useCart();

  const titles = ["Boys Clothes Store", "Baebe Boo Storefront"] as const;
  const [titleIndex, setTitleIndex] = useState(0);

  // ✅ UI micro-interactions
  const [cartPulse, setCartPulse] = useState(false);
  const [addedMap, setAddedMap] = useState<Record<string, boolean>>({});
  const addedTimersRef = useRef<Record<string, number>>({});
  const prevTotalRef = useRef<number>(0);

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
      setLoading(false);
      return;
    }

    setItems((data ?? []) as Product[]);
    setLoading(false);
  }

  // Cart pulse when count changes (and after hydration)
  useEffect(() => {
    if (!hydrated) return;

    const prev = prevTotalRef.current;
    if (totalItems !== prev) {
      setCartPulse(true);
      const t = window.setTimeout(() => setCartPulse(false), 260);
      prevTotalRef.current = totalItems;
      return () => window.clearTimeout(t);
    }

    prevTotalRef.current = totalItems;
  }, [totalItems, hydrated]);

  useEffect(() => {
    load();

    const t = setInterval(() => {
      setTitleIndex((i) => (i + 1) % titles.length);
    }, 3000);

    const channel = supabase
      .channel("products-clothes-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "products" }, (payload) => {
        const newRow = (payload as any).new as Product | undefined;
        const oldRow = (payload as any).old as Product | undefined;

        if (payload.eventType === "INSERT") {
          if (newRow?.category !== "clothes") return;
          if (newRow?.is_active === false) return;
          setItems((prev) => [newRow, ...prev]);
          return;
        }

        if (payload.eventType === "UPDATE") {
          setItems((prev) => {
            const wasClothes = oldRow?.category === "clothes" && oldRow?.is_active !== false;
            const isClothes = newRow?.category === "clothes" && newRow?.is_active !== false;

            if (wasClothes && !isClothes) return prev.filter((p) => p.id !== oldRow?.id);

            if (isClothes && newRow?.id) {
              const exists = prev.some((p) => p.id === newRow.id);
              if (!exists) return [newRow, ...prev];
              return prev.map((p) => (p.id === newRow.id ? newRow : p));
            }

            return prev;
          });
          return;
        }

        if (payload.eventType === "DELETE") {
          if (!oldRow?.id) return;
          setItems((prev) => prev.filter((p) => p.id !== oldRow.id));
        }
      })
      .subscribe();

    return () => {
      clearInterval(t);
      supabase.removeChannel(channel);

      // clear any running timers for "Added"
      Object.values(addedTimersRef.current).forEach((timerId) => window.clearTimeout(timerId));
      addedTimersRef.current = {};
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function markAdded(productId: string) {
    // clear previous timer if spam-clicked
    const existing = addedTimersRef.current[productId];
    if (existing) window.clearTimeout(existing);

    setAddedMap((m) => ({ ...m, [productId]: true }));
    addedTimersRef.current[productId] = window.setTimeout(() => {
      setAddedMap((m) => ({ ...m, [productId]: false }));
      delete addedTimersRef.current[productId];
    }, 900);
  }

  return (
    <main className="min-h-screen bg-white text-black">
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

        /* ✅ cart + badge micro-animations */
        @keyframes bbPop {
          0% {
            transform: scale(1);
          }
          40% {
            transform: scale(1.22);
          }
          100% {
            transform: scale(1);
          }
        }
        @keyframes bbBounce {
          0% {
            transform: translateY(0);
          }
          35% {
            transform: translateY(-2px);
          }
          70% {
            transform: translateY(0);
          }
          100% {
            transform: translateY(0);
          }
        }
        .bb-badge-pop {
          animation: bbPop 260ms ease-out;
        }
        .bb-cart-bounce {
          animation: bbBounce 260ms ease-out;
        }

        /* ✅ item added highlight */
        @keyframes bbGlow {
          0% {
            box-shadow: 0 0 0 rgba(0, 0, 0, 0);
          }
          35% {
            box-shadow: 0 10px 30px rgba(0, 0, 0, 0.08);
          }
          100% {
            box-shadow: 0 0 0 rgba(0, 0, 0, 0);
          }
        }
        .bb-added-glow {
          animation: bbGlow 900ms ease-out;
        }
      `}</style>

      {/* TOP BAR */}
      <div className="sticky top-0 z-40 border-b border-black/10 bg-white/80 backdrop-blur">
        <div className="mx-auto h-16 max-w-6xl px-4 sm:px-6">
          <div className="relative flex h-full items-center justify-between">
            <Link
              href="/shop"
              aria-label="Back"
              title="Back"
              className="flex h-10 w-10 items-center justify-center rounded-full text-black/70 transition hover:bg-black/5 hover:text-black"
            >
              ←
            </Link>

            <div className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-[42%] text-center">
              <span className="invisible block text-sm font-semibold tracking-tight">Baebe Boo Storefront</span>
              <div key={titleIndex} className="absolute inset-0 bb-title-anim text-sm font-semibold tracking-tight">
                {titles[titleIndex]}
              </div>
            </div>

            <Link
              href="/cart"
              aria-label="Cart"
              title="Cart"
              className="relative flex h-10 w-10 items-center justify-center rounded-full text-black/70 transition hover:bg-black/5 hover:text-black"
            >
              <span className={cartPulse ? "bb-cart-bounce" : ""}>
                <CartIcon className="h-5 w-5" />
              </span>

              {hydrated && totalItems > 0 && (
                <span
                  className={[
                    "absolute -right-1 -top-1 h-[18px] min-w-[18px] rounded-full bg-black px-1 text-center text-[11px] leading-[18px] text-white",
                    cartPulse ? "bb-badge-pop" : "",
                  ].join(" ")}
                  aria-label={`${totalItems} items in cart`}
                >
                  {totalItems}
                </span>
              )}
            </Link>
          </div>
        </div>
      </div>

      {/* CONTENT */}
      <section className="mt-8 pb-12">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          {loading ? (
            <div className="grid gap-6 sm:grid-cols-2 md:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="overflow-hidden rounded-3xl border border-black/10 bg-white shadow-sm">
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
                className="mt-4 rounded-full bg-black px-5 py-2.5 text-sm font-medium text-white transition hover:bg-black/90"
              >
                Retry
              </button>
            </div>
          ) : items.length === 0 ? (
            <div className="rounded-3xl border border-black/10 bg-white p-8 text-center shadow-sm">
              <div className="text-sm font-semibold">No items added yet</div>
              <p className="mt-2 text-sm text-black/60">Add products in Supabase and they’ll show here.</p>
            </div>
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 md:grid-cols-3">
              {items.map((item) => {
                const imgSrc = resolveProductImage(item.image_url);
                const isAdded = !!addedMap[item.id];

                return (
                  <div
                    key={item.id}
                    className={[
                      "group overflow-hidden rounded-3xl border border-black/10 bg-white shadow-sm transition hover:shadow-md",
                      isAdded ? "bb-added-glow" : "",
                    ].join(" ")}
                  >
                    <div className="relative w-full overflow-hidden bg-black/[0.03] aspect-[4/3]">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={imgSrc}
                        alt={item.name ?? "Product"}
                        className="absolute inset-0 h-full w-full object-cover object-center transition duration-300 group-hover:scale-[1.02]"
                        loading="lazy"
                        referrerPolicy="no-referrer"
                        onError={(e) => {
                          (e.currentTarget as HTMLImageElement).src = PLACEHOLDER;
                        }}
                      />
                    </div>

                    <div className="p-5">
                      <div className="text-base font-semibold tracking-tight">{item.name ?? "Untitled product"}</div>
                      <div className="mt-1 text-sm text-black/70">{formatter.format(item.price_ghs ?? 0)}</div>

                      <button
                        onClick={() => {
                          addItem({
                            id: item.id,
                            name: item.name ?? "Untitled product",
                            price_ghs: item.price_ghs ?? 0,
                            image_url: imgSrc,
                          });
                          markAdded(item.id);
                        }}
                        className={[
                          "mt-5 inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium text-white transition",
                          isAdded ? "bg-black/80" : "bg-black hover:bg-black/90",
                        ].join(" ")}
                      >
                        {isAdded ? (
                          <>
                            <span className="inline-block">Added</span>
                            <span aria-hidden="true">✓</span>
                          </>
                        ) : (
                          "Add to cart"
                        )}
                      </button>

                      {/* tiny debug line (remove later) */}
                      <div className="mt-3 text-[10px] text-black/40 break-all">{imgSrc}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </section>

      <div className="-mt-2 overflow-hidden">
        <Footer />
      </div>
    </main>
  );
}
