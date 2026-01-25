"use client";

import { useEffect, useRef, useState } from "react";

export default function Footer() {
  const footerRef = useRef<HTMLElement | null>(null);
  const [p, setP] = useState(0); // 0..1 progress through footer in viewport

  useEffect(() => {
    const el = footerRef.current;
    if (!el) return;

    let raf = 0;

    const update = () => {
      raf = 0;
      const r = el.getBoundingClientRect();
      const vh = window.innerHeight || 1;

      // Progress: when footer enters bottom -> 0, when footer leaves top -> 1
      const raw = (vh - r.top) / (vh + r.height);
      const clamped = Math.max(0, Math.min(1, raw));
      setP(clamped);
    };

    const onScroll = () => {
      if (raf) return;
      raf = window.requestAnimationFrame(update);
    };

    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);

    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (raf) window.cancelAnimationFrame(raf);
    };
  }, []);

  // Tune these for stronger/weaker parallax
  const driftA = (p - 0.5) * 18; // px
  const driftB = (p - 0.5) * 28; // px (slightly faster layer)
  const sway = Math.sin(p * Math.PI * 2) * 6; // subtle side drift

  return (
    <footer
      ref={footerRef as any}
      id="contact"
      className="relative mt-6 border-t border-black/10 overflow-hidden bg-white"
    >
      {/* Background ribbons (parallax layers) */}
      <div aria-hidden className="pointer-events-none absolute inset-0 z-0">
        {/* Layer 1 */}
        <div
          className="absolute inset-0 will-change-transform"
          style={{
            transform: `translate3d(${sway}px, ${driftA}px, 0)`,
          }}
        >
          <svg
            className="absolute inset-0 h-full w-full"
            viewBox="0 0 1440 120"
            preserveAspectRatio="none"
          >
            <defs>
              <linearGradient id="pinkGrad" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#ff5fbf" stopOpacity="0.4" />
                <stop offset="50%" stopColor="#ff9fdd" stopOpacity="0.25" />
                <stop offset="100%" stopColor="#ff5fbf" stopOpacity="0.4" />
              </linearGradient>
            </defs>

            {/* MOBILE / TABLET */}
            <path
              d="M-200,72 C200,48 420,90 760,72 C1080,54 1240,88 1640,66"
              fill="none"
              stroke="url(#pinkGrad)"
              strokeWidth="12"
              strokeLinecap="round"
              className="md:hidden"
            />

            {/* DESKTOP */}
            <path
              d="M-300,70 C120,30 420,105 760,70 C1100,35 1320,95 1740,55"
              fill="none"
              stroke="url(#pinkGrad)"
              strokeWidth="18"
              strokeLinecap="round"
              className="hidden md:block"
            />
          </svg>
        </div>

        {/* Layer 2 (moves a bit faster for parallax depth) */}
        <div
          className="absolute inset-0 will-change-transform"
          style={{
            transform: `translate3d(${-sway}px, ${driftB}px, 0)`,
          }}
        >
          <svg
            className="absolute inset-0 h-full w-full"
            viewBox="0 0 1440 120"
            preserveAspectRatio="none"
          >
            <defs>
              <linearGradient id="blueGrad" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#4b8bff" stopOpacity="0.4" />
                <stop offset="50%" stopColor="#9ad0ff" stopOpacity="0.25" />
                <stop offset="100%" stopColor="#4b8bff" stopOpacity="0.4" />
              </linearGradient>
            </defs>

            {/* MOBILE / TABLET */}
            <path
              d="M-220,92 C240,70 480,108 820,90 C1160,72 1320,102 1700,86"
              fill="none"
              stroke="url(#blueGrad)"
              strokeWidth="12"
              strokeLinecap="round"
              className="md:hidden"
            />

            {/* DESKTOP */}
            <path
              d="M-320,90 C140,55 460,120 800,88 C1140,55 1360,110 1800,75"
              fill="none"
              stroke="url(#blueGrad)"
              strokeWidth="18"
              strokeLinecap="round"
              className="hidden md:block"
            />
          </svg>
        </div>

        <div className="absolute inset-0 bg-gradient-to-b from-white/30 via-transparent to-white/40" />
      </div>

      {/* Background text (centered, also subtle parallax) */}
      <div className="pointer-events-none absolute inset-0 z-10 grid place-items-center">
        <span
          className="select-none font-semibold tracking-tight leading-none text-black/[0.035] text-[clamp(3.25rem,10vw,8rem)] will-change-transform"
          style={{ transform: `translate3d(0, ${(p - 0.5) * 10}px, 0)` }}
        >
          Shop Now
        </span>
      </div>

      {/* Content */}
      <div className="relative z-20 mx-auto w-full max-w-6xl px-4 sm:px-6 py-6 sm:py-7">
        <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
          <div className="min-w-0">
            <div className="text-sm font-semibold tracking-tight">Baebe Boo Storefront</div>

            <p className="mt-1 max-w-md text-xs text-black/70 leading-snug">
              Carefully selected baby essentials for today’s parents.
            </p>

            <div className="mt-3 text-xs text-black/70 space-y-1">
              <div className="flex flex-wrap gap-x-2">
                <span className="text-black/50">Email</span>
                <span className="font-medium break-all">support@baebeboo.com</span>
              </div>

              <div className="flex flex-wrap gap-x-2">
                <span className="text-black/50">Location</span>
                <span>Accra, Ghana</span>
              </div>

              <div className="flex flex-wrap gap-x-2">
                <span className="text-black/50">Contact</span>
                <span className="font-medium">+233 243 365 351</span>
              </div>
            </div>
          </div>

          <div className="text-xs text-black/60 md:text-right">
            <div>© {new Date().getFullYear()} Baebe Boo Storefront</div>

            <div className="mt-2 flex items-center gap-3 md:justify-end text-black/55">
              <a
                href="https://www.instagram.com/baebe.boo?igsh=ZGYwcWU2NnEya29m"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Instagram"
                className="hover:text-black transition"
              >
                <svg
                  viewBox="0 0 24 24"
                  className="h-4 w-4"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                >
                  <rect x="3" y="3" width="18" height="18" rx="5" />
                  <circle cx="12" cy="12" r="4" />
                  <circle cx="17.5" cy="6.5" r="1" fill="currentColor" />
                </svg>
              </a>

              <a
                href="https://wa.me/233243365351"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="WhatsApp"
                className="hover:text-black transition"
              >
                <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor">
                  <path d="M20.52 3.48A11.9 11.9 0 0 0 12.03 0C5.41 0 .02 5.39.02 12c0 2.12.55 4.19 1.6 6.02L0 24l6.18-1.62A11.94 11.94 0 0 0 12.03 24C18.65 24 24 18.61 24 12c0-3.2-1.25-6.2-3.51-8.52zm-8.49 18.6a9.9 9.9 0 0 1-5.05-1.38l-.36-.21-3.67.96.98-3.58-.24-.37a9.85 9.85 0 1 1 8.34 4.58z" />
                </svg>
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
