// app/shop/page.tsx
"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import Footer from "@/components/Footer";
import { useCart } from "@/components/CartProvider";

type Category = {
  title: string;
  desc: string;
  href: string;
  image: string;
};

const categories: Category[] = [
  {
    title: "Clothes",
    desc: "Soft everyday wear, onesies, sets, and basics.",
    href: "/shop/clothes",
    image: "/images/categories/clothes.jpg",
  },
  {
    title: "Shoes",
    desc: "Comfort-first booties and baby-friendly footwear.",
    href: "/shop/shoes",
    image: "/images/categories/shoes.jpg",
  },
  {
    title: "Accessories",
    desc: "Bibs, swaddles, clips, and smart add-ons.",
    href: "/shop/accessories",
    image: "/images/categories/accessories.jpg",
  },
];

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
      <path d="M6.5 6.5H21L19.2 14.1C19.1 14.6 18.6 15 18.1 15H8.1L6.5 6.5Z" />
      <path d="M6.5 6.5 5.7 3.5H3" />
      <path d="M9 20a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z" />
      <path d="M18 20a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z" />
    </svg>
  );
}

/**
 * Nicer rotate: flip + fade + slight blur
 * - no layout jump (sizer)
 * - respects reduced motion
 */
function RotatingTopTitle() {
  const titles = useMemo(() => ["Baebe Boo", "Storefront"] as const, []);
  const [index, setIndex] = useState(0);
  const prefersReducedMotion = useRef(false);

  useEffect(() => {
    prefersReducedMotion.current =
      typeof window !== "undefined" &&
      window.matchMedia &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const t = setInterval(() => {
      setIndex((i) => (i + 1) % titles.length);
    }, 3000);

    return () => clearInterval(t);
  }, [titles.length]);

  return (
    <div className="relative h-6 text-center">
      {/* width stabilizer */}
      <span className="invisible block text-sm font-semibold tracking-tight">
        Baebe Boo Storefront
      </span>

      <div className="absolute inset-0 flex items-center justify-center">
        {titles.map((t, i) => (
          <span
            key={t}
            className={[
              "absolute",
              "text-sm font-semibold tracking-tight",
              "transition-[opacity,transform,filter] duration-500",
              "ease-[cubic-bezier(.2,.8,.2,1)]",
              prefersReducedMotion.current ? "transition-none" : "",
              index === i
                ? "opacity-100 translate-y-0 rotateX-0 blur-0"
                : "opacity-0 -translate-y-1 rotateX-12 blur-[1px]",
            ].join(" ")}
            style={{
              transformStyle: "preserve-3d",
              backfaceVisibility: "hidden",
            }}
          >
            {t}
          </span>
        ))}
      </div>
    </div>
  );
}

export default function ShopPage() {
  const { totalItems, hydrated } = useCart();

  return (
    <main className="min-h-screen bg-white text-black">
      {/* TOP BAR */}
      <div className="sticky top-0 z-40 border-b border-black/10 bg-white/80 backdrop-blur">
        <div className="max-w-6xl mx-auto px-6 h-16">
          <div className="relative h-full flex items-center justify-between">
            {/* Back arrow */}
            <Link
              href="/"
              aria-label="Back"
              className="flex h-10 w-10 items-center justify-center rounded-full text-black/70 hover:text-black hover:bg-black/5 transition"
            >
              ←
            </Link>

            {/* Center title (slightly lower on mobile/tablet) */}
            <div
              className="
                pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 text-center
                -translate-y-[34%] sm:-translate-y-[36%] md:-translate-y-[42%] lg:-translate-y-1/2
              "
            >
              <RotatingTopTitle />
            </div>

            {/* Cart */}
            <Link
              href="/cart"
              aria-label="Cart"
              className="relative flex h-10 w-10 items-center justify-center rounded-full text-black/70 hover:text-black hover:bg-black/5 transition"
            >
              <CartIcon />
              {hydrated && totalItems > 0 && (
                <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-black text-white text-[11px] leading-[18px] text-center">
                  {totalItems}
                </span>
              )}
            </Link>
          </div>
        </div>
      </div>

      {/* HEADER */}
      <section className="pt-8 sm:pt-10">
        <div className="max-w-6xl mx-auto px-6">
          <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight">
            Shop by category
          </h1>
          <p className="mt-2 max-w-2xl text-sm sm:text-base text-black/70">
            Start with what you need — browse collections made for modern parents.
          </p>
        </div>
      </section>

      {/* CATEGORY CARDS */}
      <section className="mt-6 sm:mt-8 pb-14">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {categories.map((c) => (
              <Link
                key={c.title}
                href={c.href}
                className="group relative overflow-hidden rounded-3xl border border-black/10 shadow-sm hover:shadow-md transition"
              >
                <div className="relative h-[320px]">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={c.image}
                    alt={c.title}
                    className="absolute inset-0 h-full w-full object-cover transition duration-500 group-hover:scale-105"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-black/30 group-hover:bg-black/40 transition" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />

                  <div className="relative z-10 flex h-full items-end p-6">
                    <div>
                      <div className="text-white text-xl font-semibold">
                        {c.title}
                      </div>
                      <p className="mt-2 text-sm text-white/85 opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 transition">
                        {c.desc}
                      </p>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}
