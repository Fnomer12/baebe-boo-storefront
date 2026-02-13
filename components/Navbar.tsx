"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";

const navLinks = [
  { label: "Shop", href: "#categories" },
  { label: "About", href: "#about" },
  { label: "Contact", href: "#contact" },
];

type NavbarProps = {
  scrolled?: boolean;
  titleOnScroll?: string;
};

export default function Navbar({
  scrolled: scrolledProp,
  titleOnScroll = "Baebe Boo Storefront",
}: NavbarProps) {
  const [internalScrolled, setInternalScrolled] = useState(false);
  const scrolled = scrolledProp ?? internalScrolled;

  const [open, setOpen] = useState(false);
  const [active, setActive] = useState<string>("#categories");

  const desktopNavRef = useRef<HTMLDivElement>(null);
  const indicatorRef = useRef<HTMLDivElement>(null);

  // ✅ Only attach scroll listener if parent did NOT provide scrolled
  useEffect(() => {
    if (scrolledProp !== undefined) return;

    const onScroll = () => setInternalScrolled(window.scrollY > 10);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [scrolledProp]);

  const moveIndicator = () => {
    const nav = desktopNavRef.current;
    const indicator = indicatorRef.current;
    if (!nav || !indicator) return;

    const activeEl = nav.querySelector<HTMLAnchorElement>(`a[href="${active}"]`);
    if (!activeEl) return;

    const navRect = nav.getBoundingClientRect();
    const aRect = activeEl.getBoundingClientRect();
    const left = aRect.left - navRect.left;

    indicator.style.transform = `translateX(${left}px)`;
    indicator.style.width = `${aRect.width}px`;
    indicator.style.opacity = "1";
  };

  useLayoutEffect(() => {
    moveIndicator();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active]);

  useEffect(() => {
    const onResize = () => moveIndicator();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active]);

  const onNavClick = (href: string) => {
    setActive(href);
    setOpen(false);
  };

  return (
    <header
      className={[
        "fixed top-0 left-0 right-0 z-50 transition-all duration-300",
        scrolled
          ? "bg-white/90 backdrop-blur border-b border-black/10"
          : "bg-transparent",
      ].join(" ")}
    >
      <nav className="max-w-6xl mx-auto px-4 sm:px-6 py-5 sm:py-6 flex items-center justify-between">
        {/* LEFT: Brand title appears on scroll */}
        <div className="w-10 sm:w-12 md:w-52">
          <span
            className={[
              "hidden md:inline-block text-sm font-semibold tracking-tight transition-all duration-300",
              scrolled
                ? "opacity-100 translate-y-0"
                : "opacity-0 -translate-y-1 pointer-events-none",
            ].join(" ")}
          >
            {titleOnScroll}
          </span>
        </div>

        {/* Desktop nav (centered) */}
        <div
          ref={desktopNavRef}
          className="hidden md:flex items-center gap-12 absolute left-1/2 -translate-x-1/2"
        >
          {/* Gradient indicator */}
          <div
            ref={indicatorRef}
            className="absolute -z-10 rounded-full h-11 transition-all duration-300 ease-out opacity-0"
            style={{
              left: 0,
              width: 0,
              background:
                "linear-gradient(90deg, rgba(255,95,191,0.22), rgba(75,139,255,0.22))",
              boxShadow:
                "0 10px 24px rgba(255,95,191,0.12), 0 10px 24px rgba(75,139,255,0.12)",
            }}
          />

          {navLinks.map((l) => (
            <a
              key={l.href}
              href={l.href}
              onClick={() => onNavClick(l.href)}
              className={[
                "relative px-5 py-2.5 rounded-full transition",
                "text-base font-medium",
                active === l.href
                  ? "text-black"
                  : "text-black/80 hover:text-black",
              ].join(" ")}
            >
              {l.label}
            </a>
          ))}
        </div>

        {/* Mobile menu button */}
        <button
          className="md:hidden rounded-xl border border-black/15 px-4 py-2.5 text-base"
          aria-label="Toggle menu"
          onClick={() => setOpen((v) => !v)}
        >
          ☰
        </button>
      </nav>

      {/* Mobile menu */}
      <div
        className={[
          "md:hidden transition-all duration-300 overflow-hidden",
          open ? "max-h-72" : "max-h-0",
        ].join(" ")}
      >
        <div className="px-6 pb-4">
          <div className="rounded-2xl border border-black/10 bg-white/90 backdrop-blur p-4 space-y-3">
            {navLinks.map((l) => {
              const isActive = active === l.href;
              return (
                <a
                  key={l.href}
                  href={l.href}
                  onClick={() => onNavClick(l.href)}
                  className={[
                    "block rounded-xl px-4 py-3 transition",
                    "text-base font-medium",
                    isActive
                      ? "text-black border border-black/10"
                      : "text-black/80 hover:text-black",
                  ].join(" ")}
                  style={
                    isActive
                      ? {
                          background:
                            "linear-gradient(90deg, rgba(255,95,191,0.18), rgba(75,139,255,0.18))",
                          boxShadow:
                            "0 10px 22px rgba(255,95,191,0.08), 0 10px 22px rgba(75,139,255,0.08)",
                        }
                      : undefined
                  }
                >
                  {l.label}
                </a>
              );
            })}
          </div>
        </div>
      </div>
    </header>
  );
}
