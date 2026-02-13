// app/page.tsx
"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import HeroRotatingTitle from "@/components/HeroRotatingTitle";

export default function Home() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <main className="min-h-screen bg-white text-black">
      {/* ✅ pass scroll state to navbar */}
      <Navbar scrolled={scrolled} titleOnScroll="Baebe Boo Storefront" />

      {/* Hero */}
      <section className="pt-24 sm:pt-28 md:pt-32">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          {/* ✅ Explore shop comes first */}
          <div className="pb-10" id="categories">
            <Link
              href="/shop"
              className="group relative block overflow-hidden rounded-3xl border border-black/10 shadow-sm hover:shadow-md transition"
              aria-label="Go to shop"
            >
              <div className="relative h-[320px] sm:h-[380px] md:h-[520px]">
                <video
                  className="pointer-events-none absolute inset-0 h-full w-full object-cover"
                  src="/videos/baebeboo.mp4"
                  autoPlay
                  muted
                  loop
                  playsInline
                  preload="metadata"
                />

                <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                <div className="pointer-events-none absolute inset-0 bg-black/10 group-hover:bg-black/0 transition" />

                <div className="relative z-10 h-full flex items-end">
                  <div className="p-5 sm:p-6 md:p-10">
                    <h2 className="text-xl sm:text-2xl md:text-4xl font-semibold tracking-tight text-white">
                      Shop the collection
                    </h2>
                    <p className="mt-2 max-w-xl text-xs sm:text-sm md:text-base text-white/80">
                      Tap to browse our full range of baby essentials — designed
                      with comfort, care, and simplicity in mind.
                    </p>

                    <span className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-white/90 group-hover:text-white transition">
                      Explore <span className="text-lg">→</span>
                    </span>
                  </div>
                </div>
              </div>
            </Link>
          </div>

          {/* ✅ Founder section below Explore shop */}
          <div className="grid gap-10 md:gap-12 md:grid-cols-2 items-center">
            {/* Left */}
            <div className="max-w-2xl">
              <HeroRotatingTitle />

              <p className="mt-6 sm:mt-7 max-w-xl text-black/70 leading-relaxed text-sm sm:text-base">
                Clean, premium essentials — thoughtfully curated for everyday
                care.
              </p>
            </div>

            {/* Right CEO card */}
            <div className="flex justify-center md:justify-end">
              <div className="w-full max-w-md rounded-3xl border border-black/10 bg-white p-3 sm:p-4 shadow-sm">
                <div className="relative w-full aspect-[4/3] rounded-2xl overflow-hidden bg-black/[0.03]">
                  <Image
                    src="/mercy.jpg"
                    alt="Mercy Doku"
                    fill
                    className="object-cover"
                    priority
                    sizes="(max-width: 768px) 90vw, 420px"
                  />
                </div>

                <div className="mt-4 flex items-center justify-between gap-4">
                  <div className="min-w-0">
                    <div className="text-sm font-semibold text-black">
                      Mercy Doku
                    </div>
                    <p className="mt-1 text-sm text-black/70 leading-snug">
                      Quality baby essentials, thoughtfully curated.
                    </p>
                  </div>

                  <div className="shrink-0 rounded-full border border-black/10 bg-black/[0.02] px-3 py-1 text-xs font-medium text-black/70">
                    Founder
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Divider */}
          <div className="mt-10 sm:mt-12 border-t border-black/10" />

          {/* About */}
          <section
            id="about"
            className="scroll-mt-24 sm:scroll-mt-28 md:scroll-mt-32 py-10 sm:py-12"
          >
            <div className="grid gap-6 md:grid-cols-2 items-start">
              <div>
                <h2 className="text-2xl md:text-3xl font-semibold tracking-tight">
                  About Baebe Boo
                </h2>

                <p className="mt-3 text-black/70 leading-relaxed">
                  Baebe Boo is a modern baby essentials brand designed for
                  parents who value quality, simplicity, and trust. We curate
                  everyday essentials with care, ensuring each product meets
                  high standards of comfort, safety, and practicality.
                </p>

                <p className="mt-4 text-black/70 leading-relaxed">
                  Browse freely and shop with confidence. We support payments in
                  Ghana via Mobile Money and card.
                </p>
              </div>

              <div className="rounded-3xl border border-black/10 bg-white p-5 sm:p-6 shadow-sm">
                <div className="text-sm font-semibold">What we prioritize</div>

                <div className="mt-4 space-y-3 text-sm text-black/70">
                  <div className="flex gap-3">
                    <span className="mt-1 h-1.5 w-1.5 rounded-full bg-black/30" />
                    <div>
                      <span className="font-medium text-black/80">
                        Quality-first
                      </span>{" "}
                      selections designed for daily use.
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <span className="mt-1 h-1.5 w-1.5 rounded-full bg-black/30" />
                    <div>
                      <span className="font-medium text-black/80">
                        Clear browsing
                      </span>{" "}
                      so you can find what you need fast.
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <span className="mt-1 h-1.5 w-1.5 rounded-full bg-black/30" />
                    <div>
                      <span className="font-medium text-black/80">
                        Smooth checkout
                      </span>{" "}
                      with MoMo + card support.
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>
        </div>
      </section>

      <Footer />
    </main>
  );
}
