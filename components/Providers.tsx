"use client";

import { CartProvider } from "@/components/CartProvider";

export default function Providers({ children }: { children: React.ReactNode }) {
  return <CartProvider>{children}</CartProvider>;
}
