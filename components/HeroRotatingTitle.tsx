"use client";

import { useEffect, useState } from "react";

const slides = [
  "Baebe Boo Storefront",
  "A modern baby store experience",
];

export default function HeroRotatingTitle() {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const id = setInterval(() => {
      setIndex((i) => (i + 1) % slides.length);
    }, 3000);
    return () => clearInterval(id);
  }, []);

  const headlineClass =
    "font-semibold tracking-tight leading-[0.95] text-[clamp(44px,6vw,84px)]";

  return (
    <div className="relative" suppressHydrationWarning>
      {/* 1) SIZER: reserves the correct height */}
      <h1
        className={`${headlineClass} opacity-0 pointer-events-none select-none`}
      >
        {slides.reduce((a, b) => (a.length > b.length ? a : b))}
      </h1>

      {/* 2) ROTATING TEXT */}
      <div className="absolute inset-0">
        {slides.map((text, i) => (
          <span
            key={text}
            aria-hidden={index !== i}
            className={[
              "absolute inset-0",
              headlineClass,
              "transition-opacity duration-500",
              index === i ? "opacity-100" : "opacity-0",
            ].join(" ")}
          >
            {text}
          </span>
        ))}
      </div>

      {/* 3) Constant line below */}
      <div className="mt-2 text-xs sm:text-sm text-black/60">
        Ghana • MoMo + Card via Paystack
      </div>
    </div>
  );
}
