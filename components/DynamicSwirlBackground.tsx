function DynamicSwirlBackground() {
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-0 -z-10 overflow-hidden"
    >
      <div className="swirl swirl-1" />
      <div className="swirl swirl-2" />
      <div className="swirl swirl-3" />

      {/* Soft readability wash */}
      <div className="absolute inset-0 bg-gradient-to-b from-white/70 via-white/40 to-white/85" />
    </div>
  );
}
