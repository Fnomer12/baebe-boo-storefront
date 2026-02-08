"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Footer from "@/components/Footer";
import { useCart } from "@/components/CartProvider";

type Category = {
  title: string;
  desc: string;
  href: string;
  image: string;
};

type Gender = "boy" | "girl";

/* -------------------------------------------
   LocalStorage-backed state
-------------------------------------------- */
function useLocalStorageState<T extends string>(key: string, initial: T) {
  const [value, setValue] = useState<T>(initial);

  useEffect(() => {
    const saved =
      typeof window !== "undefined" ? localStorage.getItem(key) : null;
    if (saved) setValue(saved as T);
  }, [key]);

  useEffect(() => {
    if (typeof window !== "undefined") localStorage.setItem(key, value);
  }, [key, value]);

  return [value, setValue] as const;
}

/* -------------------------------------------
   Icons
-------------------------------------------- */
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
      <path d="M9 20a1 1 0 1 0 0-2" />
      <path d="M18 20a1 1 0 1 0 0-2" />
    </svg>
  );
}

function ChevronDownIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className={className}
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M6 9l6 6 6-6" />
    </svg>
  );
}

/* -------------------------------------------
   Better rotating header title:
   - smooth slide-up + fade (no flip)
   - no layout jump (width stabilizer)
   - respects reduced motion
-------------------------------------------- */
function RotatingHeaderTitle() {
  const titles = ["Baebe Boo", "Storefront"] as const;
  const [index, setIndex] = useState(0);

  const prefersReducedMotion =
    typeof window !== "undefined" &&
    window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches;

  useEffect(() => {
    if (prefersReducedMotion) return;
    const t = setInterval(() => setIndex((i) => (i + 1) % titles.length), 2600);
    return () => clearInterval(t);
  }, [prefersReducedMotion]);

  return (
    <div className="relative h-9 sm:h-10 text-center">
      {/* width stabilizer */}
      <span className="invisible block text-2xl sm:text-3xl font-semibold tracking-tight">
        Baebe Boo Storefront
      </span>

      <div className="absolute inset-0 flex items-center justify-center">
        {titles.map((t, i) => {
          const active = index === i;
          return (
            <span
              key={t}
              className={[
                "absolute",
                "text-2xl sm:text-3xl font-semibold tracking-tight text-black",
                prefersReducedMotion ? "" : "transition-all duration-500",
                active
                  ? "opacity-100 translate-y-0"
                  : "opacity-0 translate-y-2",
              ].join(" ")}
            >
              {t}
            </span>
          );
        })}
      </div>
    </div>
  );
}

/* -------------------------------------------
   Nicer Gender Select
-------------------------------------------- */
function GenderSelect({
  value,
  onChange,
}: {
  value: Gender;
  onChange: (g: Gender) => void;
}) {
  return (
    <div className="max-w-sm">
      <label className="block text-sm font-medium text-black/60 mb-2">
        Shop for
      </label>

      <div className="relative">
        <select
          value={value}
          onChange={(e) => onChange(e.target.value as Gender)}
          className="
            w-full appearance-none
            rounded-2xl border border-black/10
            bg-white/90
            px-4 pr-11 h-12
            text-base font-medium text-black/80
            shadow-sm
            focus:outline-none focus:ring-2 focus:ring-black/10
            hover:border-black/20 transition
          "
        >
          <option value="boy">Boys</option>
          <option value="girl">Girls</option>
        </select>

        <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-black/50">
          <ChevronDownIcon />
        </span>
      </div>

      <p className="mt-2 text-xs text-black/45">
        Pick a collection to see tailored categories.
      </p>
    </div>
  );
}

/* -------------------------------------------
   Categories
-------------------------------------------- */
const BOYS_CATEGORIES: Category[] = [
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

const GIRLS_CATEGORIES: Category[] = [
  {
    title: "Dresses",
    desc: "Cute everyday dresses, sets, and special occasion picks.",
    href: "/shop/girl_dresses",
    image: "/images/categories/dresses.jpg",
  },
  {
    title: "Shoes",
    desc: "Comfort-first footwear designed for little girls.",
    href: "/shop/girl_shoes",
    image: "/images/categories/girls-shoes.jpg",
  },
  {
    title: "Accessories",
    desc: "Bows, clips, bibs, and stylish add-ons.",
    href: "/shop/accessories",
    image: "/images/categories/accessories.jpg",
  },
];

/* -------------------------------------------
   Page
-------------------------------------------- */
export default function ShopPage() {
  const { totalItems, hydrated } = useCart();
  const [gender, setGender] = useLocalStorageState<Gender>("shop_gender", "boy");
  const categories = gender === "girl" ? GIRLS_CATEGORIES : BOYS_CATEGORIES;

  return (
    <main className="min-h-screen bg-white text-black">
      {/* HEADER */}
      <div className="sticky top-0 z-40 border-b border-black/10 bg-white/85 backdrop-blur">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16">
          <div className="relative h-full flex items-center justify-between">
            {/* Left: Back */}
            <Link
              href="/"
              aria-label="Back"
              className="flex h-10 w-10 items-center justify-center rounded-full text-black/70 hover:text-black hover:bg-black/5 transition"
            >
              ←
            </Link>

            {/* Center: Rotating title (smaller + smoother) */}
            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
              <RotatingHeaderTitle />
            </div>

            {/* Right: Cart */}
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

      {/* CONTEXT */}
      <section className="pt-10">
        <div className="max-w-6xl mx-auto px-6">
          <h1 className="text-xl font-medium text-black/80">
            Shop by Category for {gender === "boy" ? "Boys" : "Girls"}
          </h1>

          <div className="mt-6">
            <GenderSelect value={gender} onChange={setGender} />
          </div>
        </div>
      </section>

      {/* CATEGORY GRID (lower / centered feel) */}
      <section className="mt-20 pb-16">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {categories.map((c) => (
              <Link
                key={c.href}
                href={c.href}
                className="group relative overflow-hidden rounded-3xl border border-black/10 hover:shadow-md transition"
              >
                <div className="relative h-[340px]">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={c.image}
                    alt={c.title}
                    className="absolute inset-0 h-full w-full object-cover transition duration-500 group-hover:scale-105"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-black/35 group-hover:bg-black/40 transition" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />

                  <div className="relative z-10 h-full flex items-end p-6">
                    <div>
                      <div className="text-white text-2xl font-semibold">
                        {c.title}
                      </div>
                      <p className="mt-2 text-white/80 text-sm">{c.desc}</p>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* FOOTER unchanged */}
      <Footer />
    </main>
  );
}
