"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Footer from "@/components/Footer";
import { supabase } from "@/lib/supabaseClient";
import { useCart } from "@/components/CartProvider";
import type { User } from "@supabase/supabase-js";

type Step = 1 | 2 | 3;

function fmtGHS(amount: number) {
  return new Intl.NumberFormat("en-GH", {
    style: "currency",
    currency: "GHS",
    maximumFractionDigits: 0,
  }).format(amount);
}

function initials(nameOrEmail: string) {
  const s = (nameOrEmail || "").trim();
  if (!s) return "U";
  const parts = s.split(" ").filter(Boolean);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return s.slice(0, 2).toUpperCase();
}

function GoogleLogo({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 48" className={className} aria-hidden="true">
      <path
        fill="#FFC107"
        d="M43.611 20.083H42V20H24v8h11.303C33.651 32.657 29.223 36 24 36c-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.962 3.038l5.657-5.657C34.047 6.053 29.268 4 24 4 12.955 4 4 12.955 4 24s8.955 20 20 20 20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z"
      />
      <path
        fill="#FF3D00"
        d="M6.306 14.691l6.571 4.819C14.655 16.108 19.001 12 24 12c3.059 0 5.842 1.154 7.962 3.038l5.657-5.657C34.047 6.053 29.268 4 24 4 16.318 4 9.656 8.337 6.306 14.691z"
      />
      <path
        fill="#4CAF50"
        d="M24 44c5.166 0 9.86-1.977 13.409-5.197l-6.19-5.238C29.162 35.091 26.715 36 24 36c-5.202 0-9.62-3.317-11.283-7.946l-6.52 5.024C9.504 39.556 16.227 44 24 44z"
      />
      <path
        fill="#1976D2"
        d="M43.611 20.083H42V20H24v8h11.303a12.05 12.05 0 0 1-4.084 5.565l.003-.002 6.19 5.238C36.97 39.202 44 34 44 24c0-1.341-.138-2.65-.389-3.917z"
      />
    </svg>
  );
}

/**
 * Horizontal stepper like your design:
 * - smaller circles (responsive)
 * - connected line
 * - pink+blue flowing gradient fill
 * - active/done circles gradient fill
 */
function FlowStepper({ step }: { step: Step }) {
  const pct = step === 1 ? 0 : step === 2 ? 50 : 100;

  const nodeBaseFixed =
    "relative overflow-hidden h-[44px] w-[44px] sm:h-[52px] sm:w-[52px] md:h-[60px] md:w-[60px] rounded-full flex items-center justify-center text-lg sm:text-xl md:text-2xl font-semibold border transition";

  const nodeOn =
    "text-black border-black/10 bg-[linear-gradient(135deg,#93c5fd_0%,#f9a8d4_100%)] shadow-sm";

  const nodeOff = "bg-black/[0.03] text-black/35 border-black/10";

  const isOn = (n: Step) => step >= n;

  const leftRight = "left-6 right-6 sm:left-7 sm:right-7 md:left-8 md:right-8";
  const left = "left-6 sm:left-7 md:left-8";

  return (
    <div className="w-full">
      <div className="relative mx-auto max-w-5xl">
        {/* base line */}
        <div
          className={`absolute ${leftRight} top-1/2 -translate-y-1/2 h-[2px] bg-black/15`}
        />

        {/* filled line */}
        <div
          className={`absolute ${left} top-1/2 -translate-y-1/2 h-[2px] overflow-hidden transition-[width] duration-500 ease-out`}
          style={{ width: `calc(${pct}% - 32px)` }}
        >
          <div className="absolute inset-0 bg-[linear-gradient(90deg,#f9a8d4_0%,#93c5fd_100%)]" />
          <div className="absolute inset-0 opacity-45 animate-[flow_1.1s_linear_infinite] bg-[linear-gradient(90deg,rgba(255,255,255,0)_0%,rgba(255,255,255,0.75)_50%,rgba(255,255,255,0)_100%)] bg-[length:180px_100%]" />
        </div>

        {/* nodes */}
        <div className="relative grid grid-cols-3 items-center">
          <div className="flex justify-center">
            <div className={`${nodeBaseFixed} ${isOn(1) ? nodeOn : nodeOff}`}>
              <span className="relative z-10">1</span>
              {isOn(1) && (
                <span className="absolute inset-0 opacity-30 bg-[radial-gradient(circle_at_30%_30%,rgba(255,255,255,0.95),rgba(255,255,255,0)_60%)]" />
              )}
            </div>
          </div>

          <div className="flex justify-center">
            <div className={`${nodeBaseFixed} ${isOn(2) ? nodeOn : nodeOff}`}>
              <span className="relative z-10">2</span>
              {isOn(2) && (
                <span className="absolute inset-0 opacity-30 bg-[radial-gradient(circle_at_30%_30%,rgba(255,255,255,0.95),rgba(255,255,255,0)_60%)]" />
              )}
            </div>
          </div>

          <div className="flex justify-center">
            <div className={`${nodeBaseFixed} ${isOn(3) ? nodeOn : nodeOff}`}>
              <span className="relative z-10">3</span>
              {isOn(3) && (
                <span className="absolute inset-0 opacity-30 bg-[radial-gradient(circle_at_30%_30%,rgba(255,255,255,0.95),rgba(255,255,255,0)_60%)]" />
              )}
            </div>
          </div>
        </div>
      </div>

      {/* labels */}
      <div className="mx-auto mt-3 max-w-5xl grid grid-cols-3 text-center text-[11px] sm:text-xs md:text-sm text-black/60">
        <div className={step >= 1 ? "text-black" : ""}>Sign in</div>
        <div className={step >= 2 ? "text-black" : ""}>Review</div>
        <div className={step >= 3 ? "text-black" : ""}>Payment</div>
      </div>

      <style jsx global>{`
        @keyframes flow {
          from {
            transform: translateX(-180px);
          }
          to {
            transform: translateX(180px);
          }
        }
      `}</style>
    </div>
  );
}

export default function CartPage() {
  const { items, totalItems, setQty, removeItem, clearCart, hydrated } =
    useCart();

  const [user, setUser] = useState<User | null>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [profileOpen, setProfileOpen] = useState(false);

  const [paying, setPaying] = useState(false);
  const [step, setStep] = useState<Step>(1);

  // Step 3 phone
  const [phone, setPhone] = useState("+233 ");
  const [savingPhone, setSavingPhone] = useState(false);
  const [phoneError, setPhoneError] = useState<string | null>(null);

  const signedIn = !!user;
  const hasItems = hydrated && items.length > 0;

  const totalPrice = useMemo(() => {
    return items.reduce((sum, i) => sum + (i.price_ghs || 0) * (i.qty || 0), 0);
  }, [items]);

  const displayName =
    (user?.user_metadata as any)?.full_name ||
    (user?.user_metadata as any)?.name ||
    user?.email ||
    "";

  function goShop() {
    window.location.assign("/shop");
  }

  useEffect(() => {
    let alive = true;

    async function boot() {
      const { data } = await supabase.auth.getUser();
      if (!alive) return;

      const u = data.user ?? null;
      setUser(u);

      const meta = (u?.user_metadata ?? {}) as any;
      const pic =
        meta.avatar_url || meta.picture || meta.photo || meta.image || null;
      setAvatarUrl(typeof pic === "string" ? pic : null);
    }

    boot();

    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      const u = session?.user ?? null;
      setUser(u);

      const meta = (u?.user_metadata ?? {}) as any;
      const pic =
        meta.avatar_url || meta.picture || meta.photo || meta.image || null;
      setAvatarUrl(typeof pic === "string" ? pic : null);

      setProfileOpen(false);
    });

    return () => {
      alive = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!signedIn) {
      setStep(1);
      return;
    }
    setStep((prev) => (prev === 3 ? 3 : 2));
  }, [signedIn]);

  useEffect(() => {
    if (!user) return;
    const meta = (user.user_metadata ?? {}) as any;
    const p = meta.phone || meta.phone_number || "";
    if (typeof p === "string" && p.trim()) {
      if (p.startsWith("+233")) {
        setPhone(p.replace(/\s+/g, " ").replace(/^\+233(?=\d)/, "+233 "));
      } else {
        setPhone(`+233 ${p.replace(/^\+/, "")}`);
      }
    } else {
      setPhone((cur) => (cur.trim().length ? cur : "+233 "));
    }
  }, [user]);

  // ✅ Apple removed: only Google remains
  async function signIn(provider: "google") {
    const origin = window.location.origin;
  
    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: `${origin}/auth/callback?next=/cart`,
      },
    });
  
    if (error) alert(error.message);
  }
  

  async function signOut() {
    await supabase.auth.signOut();
    setProfileOpen(false);
  }

  function back() {
    if (step === 1) return goShop();
    if (step === 2) return setStep(1);
    if (step === 3) return setStep(2);
  }

  function goNext() {
    if (step === 1) {
      if (signedIn) setStep(2);
      return;
    }
    if (step === 2) {
      if (!hydrated || !hasItems) return;
      setStep(3);
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }
  }

  function normalizePhone(v: string) {
    return v.replace(/[^\d+]/g, "").trim();
  }

  function validatePhone(v: string) {
    const p = normalizePhone(v);
    if (!p.startsWith("+233")) return "Phone must start with +233.";
    const digits = p.replace(/\D/g, "");
    if (digits.length < 12)
      return "Please enter a valid Ghana number (9 digits after +233).";
    return null;
  }

  async function savePhoneToSupabase() {
    if (!user) return false;

    const err = validatePhone(phone);
    if (err) {
      setPhoneError(err);
      return false;
    }

    setPhoneError(null);
    setSavingPhone(true);

    try {
      const { error } = await supabase.auth.updateUser({
        data: { phone: normalizePhone(phone) },
      });
      if (error) throw error;
      return true;
    } catch (e: any) {
      setPhoneError(e?.message || "Failed to save phone number.");
      return false;
    } finally {
      setSavingPhone(false);
    }
  }

  async function handlePaystackCheckout() {
    if (!signedIn || !hasItems || paying) return;

    const ok = await savePhoneToSupabase();
    if (!ok) return;

    try {
      setPaying(true);

      const res = await fetch("/api/paystack/initialize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: user?.email ?? null,
          items,
          phone: normalizePhone(phone),
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Failed to start payment");

      window.location.href = data.authorization_url;
    } catch (e: any) {
      alert(e?.message || "Payment failed to start");
      setPaying(false);
    }
  }

  return (
    <main className="min-h-screen bg-white text-black">
      {/* TOP BAR */}
      <div className="sticky top-0 z-40 border-b border-black/10 bg-white/80 backdrop-blur">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={back}
            className="inline-flex h-10 w-10 items-center justify-center rounded-full hover:bg-black/[0.04] transition"
            aria-label="Back"
            title="Back"
          >
            <span className="text-lg leading-none">←</span>
          </button>

          <div className="min-w-0 text-center">
            <div className="text-sm font-semibold tracking-tight truncate">
              {step === 1 ? "Sign in" : step === 2 ? "Review" : "Payment"}
            </div>
            <div className="mt-0.5 text-[11px] text-black/55 truncate">
              Baebe Boo Storefront
            </div>
          </div>

          <div className="flex items-center gap-2">
            {signedIn ? (
              <div className="relative">
                <button
                  onClick={() => setProfileOpen((s) => !s)}
                  className="h-10 w-10 rounded-full overflow-hidden border border-black/10 bg-white hover:bg-black/[0.03] transition flex items-center justify-center"
                  aria-label="Open profile menu"
                  title={displayName || "Account"}
                >
                  {avatarUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={avatarUrl}
                      alt="Profile"
                      className="h-full w-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <span className="text-xs font-semibold text-black/70">
                      {initials(displayName)}
                    </span>
                  )}
                </button>

                {profileOpen && (
                  <div
                    className="absolute right-0 mt-2 w-64 rounded-2xl border border-black/10 bg-white shadow-lg overflow-hidden"
                    onMouseLeave={() => setProfileOpen(false)}
                  >
                    <div className="px-4 py-3">
                      <div className="text-sm font-semibold truncate">
                        {displayName || "Signed in"}
                      </div>
                      {user?.email && (
                        <div className="mt-0.5 text-xs text-black/60 truncate">
                          {user.email}
                        </div>
                      )}
                    </div>
                    <div className="h-px bg-black/10" />
                    <button
                      onClick={signOut}
                      className="w-full text-left px-4 py-3 text-sm text-black/70 hover:text-black hover:bg-black/[0.03] transition"
                    >
                      Sign out
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <span className="text-xs text-black/60 rounded-full border border-black/10 px-3 py-2">
                Guest
              </span>
            )}
          </div>
        </div>
      </div>

      {/* STEPPER */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-10">
        <FlowStepper step={step} />
      </div>

      {/* STEP CONTENT */}
      <section className="pt-10 pb-16">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          {/* STEP 1 */}
          {step === 1 && (
            <div className="mx-auto max-w-xl rounded-3xl border border-black/10 bg-white p-6 shadow-sm">
              <h1 className="text-2xl font-semibold tracking-tight">
                Step 1: Sign in
              </h1>
              <p className="mt-2 text-sm text-black/70">
                Sign in with Google to continue.
              </p>

              <div className="mt-6 grid gap-2">
                <button
                  onClick={() => signIn("google")}
                  className="w-full inline-flex items-center justify-center gap-2 rounded-full border border-black/10 px-4 py-3 text-sm font-medium hover:bg-black/[0.03] transition"
                  type="button"
                >
                  <GoogleLogo className="h-4 w-4" />
                  Continue with Google
                </button>
              </div>

              <button
                type="button"
                onClick={goShop}
                className="mt-6 w-full rounded-full border border-black/10 px-5 py-3 text-sm font-medium text-black/70 hover:text-black hover:bg-black/[0.03] transition"
              >
                Back to shop
              </button>
            </div>
          )}

          {/* STEP 2 */}
          {step === 2 && (
            <div className="grid gap-8 lg:grid-cols-[1.35fr_0.85fr] items-start">
              <div>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h1 className="text-2xl font-semibold tracking-tight">
                      Step 2: Review your cart
                    </h1>
                    <p className="mt-2 text-sm text-black/70">
                      Adjust quantities or remove items before payment.
                    </p>
                  </div>

                  <button
                    onClick={clearCart}
                    className="text-sm font-medium text-black/70 hover:text-black transition disabled:opacity-40"
                    disabled={!hydrated || items.length === 0}
                  >
                    Clear
                  </button>
                </div>

                {!hydrated ? (
                  <div className="mt-6 rounded-3xl border border-black/10 bg-white p-6 shadow-sm">
                    <div className="text-sm text-black/70">Loading cart…</div>
                  </div>
                ) : items.length === 0 ? (
                  <div className="mt-6 rounded-3xl border border-black/10 bg-white p-8 text-center shadow-sm">
                    <div className="text-sm font-semibold">
                      Your cart is empty
                    </div>
                    <p className="mt-2 text-sm text-black/70">
                      Browse the shop and add items to continue.
                    </p>

                    <button
                      type="button"
                      onClick={goShop}
                      className="mt-4 inline-flex rounded-full bg-black text-white px-5 py-2.5 text-sm font-medium hover:bg-black/90 transition"
                    >
                      Go to shop
                    </button>
                  </div>
                ) : (
                  <div className="mt-6 space-y-4">
                    {items.map((item) => (
                      <div
                        key={item.id}
                        className="rounded-3xl border border-black/10 bg-white p-4 md:p-5 shadow-sm"
                      >
                        <div className="flex gap-4">
                          <div className="relative h-20 w-20 md:h-24 md:w-24 overflow-hidden rounded-2xl bg-black/[0.04] flex-shrink-0">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={
                                item.image_url ??
                                "/images/products/placeholder.jpg"
                              }
                              alt={item.name ?? "Item"}
                              className="absolute inset-0 h-full w-full object-cover"
                              loading="lazy"
                            />
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-3">
                              <div className="min-w-0">
                                <div className="font-semibold tracking-tight truncate">
                                  {item.name}
                                </div>
                                <div className="mt-1 text-sm text-black/70">
                                  {fmtGHS(item.price_ghs || 0)}
                                </div>
                              </div>

                              <button
                                onClick={() => removeItem(item.id)}
                                className="text-sm text-black/60 hover:text-black transition"
                              >
                                Remove
                              </button>
                            </div>

                            <div className="mt-4 flex items-center justify-between gap-4">
                              <div className="inline-flex items-center rounded-full border border-black/10 overflow-hidden">
                                <button
                                  onClick={() =>
                                    setQty(item.id, (item.qty || 1) - 1)
                                  }
                                  className="h-9 w-10 text-black/70 hover:text-black hover:bg-black/[0.03] transition disabled:opacity-40"
                                  aria-label="Decrease quantity"
                                  disabled={(item.qty || 1) <= 1}
                                >
                                  −
                                </button>
                                <div className="h-9 min-w-[44px] px-3 flex items-center justify-center text-sm font-medium tabular-nums">
                                  {item.qty}
                                </div>
                                <button
                                  onClick={() =>
                                    setQty(item.id, (item.qty || 1) + 1)
                                  }
                                  className="h-9 w-10 text-black/70 hover:text-black hover:bg-black/[0.03] transition"
                                  aria-label="Increase quantity"
                                >
                                  +
                                </button>
                              </div>

                              <div className="text-sm font-semibold tabular-nums">
                                {fmtGHS(
                                  (item.price_ghs || 0) * (item.qty || 0)
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <aside className="lg:sticky lg:top-24 h-fit">
                <div className="rounded-3xl border border-black/10 bg-white p-6 shadow-sm">
                  <div className="text-lg font-semibold tracking-tight">
                    Summary
                  </div>

                  <div className="mt-4 rounded-2xl bg-black/[0.03] p-4">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-black/70">Items</span>
                      <span className="font-medium tabular-nums">
                        {hydrated ? totalItems : 0}
                      </span>
                    </div>
                    <div className="mt-2 flex items-center justify-between text-sm">
                      <span className="text-black/70">Total</span>
                      <span className="font-semibold tabular-nums">
                        {fmtGHS(totalPrice)}
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={goNext}
                    disabled={!hydrated || !hasItems}
                    className="mt-5 w-full rounded-full bg-black text-white px-5 py-3 text-sm font-medium hover:bg-black/90 transition disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    Continue to payment
                  </button>

                  <button
                    type="button"
                    onClick={goShop}
                    className="mt-3 w-full rounded-full border border-black/10 px-5 py-3 text-sm font-medium text-black/70 hover:text-black hover:bg-black/[0.03] transition"
                  >
                    Continue shopping
                  </button>
                </div>
              </aside>
            </div>
          )}

          {/* STEP 3 */}
          {step === 3 && (
            <div className="mx-auto max-w-xl rounded-3xl border border-black/10 bg-white p-6 shadow-sm">
              <h1 className="text-2xl font-semibold tracking-tight">
                Step 3: Payment
              </h1>
              <p className="mt-2 text-sm text-black/70">
                Add your phone number, then pay securely with Paystack.
              </p>

              <div className="mt-6">
                <label className="text-sm font-medium">Phone number</label>
                <input
                  value={phone}
                  onChange={(e) => {
                    const v = e.target.value;
                    if (!v.startsWith("+233")) setPhone("+233 ");
                    else setPhone(v);
                  }}
                  onFocus={() =>
                    setPhone((cur) => (cur.trim().length ? cur : "+233 "))
                  }
                  placeholder="+233 55 123 4567"
                  className="mt-2 w-full rounded-2xl border border-black/10 px-4 py-3 text-sm outline-none focus:border-black/30"
                  inputMode="tel"
                />
                {phoneError && (
                  <div className="mt-2 text-xs text-red-600">{phoneError}</div>
                )}
              </div>

              <div className="mt-6 rounded-2xl bg-black/[0.03] p-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-black/70">Items</span>
                  <span className="font-medium tabular-nums">{totalItems}</span>
                </div>
                <div className="mt-2 flex items-center justify-between text-sm">
                  <span className="text-black/70">Total</span>
                  <span className="font-semibold tabular-nums">
                    {fmtGHS(totalPrice)}
                  </span>
                </div>
              </div>

              <button
                onClick={handlePaystackCheckout}
                disabled={!signedIn || !hasItems || paying || savingPhone}
                className={[
                  "mt-5 w-full rounded-full px-5 py-3 text-sm font-medium transition",
                  paying || savingPhone
                    ? "border border-white/20 bg-white/10 text-black backdrop-blur-md shadow-[0_10px_30px_rgba(0,0,0,0.12)]"
                    : "bg-black text-white hover:bg-black/90",
                  "disabled:opacity-60 disabled:cursor-not-allowed",
                ].join(" ")}
              >
                {savingPhone
                  ? "Saving phone…"
                  : paying
                  ? "Redirecting to Paystack…"
                  : "Pay now"}
              </button>

              <button
                type="button"
                onClick={back}
                className="mt-3 w-full rounded-full border border-black/10 px-5 py-3 text-sm font-medium text-black/70 hover:text-black hover:bg-black/[0.03] transition"
              >
                Back to review
              </button>
            </div>
          )}
        </div>
      </section>

      <Footer />
    </main>
  );
}
