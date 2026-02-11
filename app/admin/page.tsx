// app/admin/page.tsx
"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import { supabase } from "@/lib/supabaseClient";

type Tab = "payments" | "purchasers" | "upload" | "products";

type Payment = {
  id: string;
  amount_ghs: number;
  status: string;
  paid_at: string;
  reference: string | null;
  full_name: string | null;
  email: string | null;
};

type Order = {
  id: string;
  user_id: string | null;
  email: string | null;
  full_name: string | null;
  total_ghs: number | null;
  created_at: string | null;
};

type ProductRow = {
  id: string;
  name: string | null;
  slug: string | null;
  // ✅ removed description from admin UI
  price_ghs: number | null;
  stock: number | null;
  category: string | null;
  is_active: boolean | null;
  image_path: string | null;
  created_at: string | null;
};

const LS_KEY = "bb_admin_authed_v2";

const CATEGORIES = [
  { value: "clothes", label: "Clothes (Boys)" },
  { value: "shoes", label: "Shoes (Boys)" },
  { value: "accessories", label: "Accessories (Boys)" },
  { value: "girl_dresses", label: "Dresses (Girls)" },
  { value: "girl_shoes", label: "Shoes (Girls)" },
];

const BUCKET = "product-images";

function money(n: number) {
  return `GHS ${Number.isFinite(n) ? n.toFixed(2) : "0.00"}`;
}

function getPublicUrl(path: string | null) {
  if (!path) return "";
  const trimmed = path.trim();

  // if you accidentally stored a full URL, just use it
  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) return trimmed;

  // if you accidentally stored "product-images/xxx", strip bucket prefix
  const clean = trimmed.replace(/^\/+/, "").replace(/^product-images\//, "");

  const { data } = supabase.storage.from("product-images").getPublicUrl(clean);
  return data?.publicUrl || "";
}


export default function AdminPage() {
  const [tab, setTab] = useState<Tab>("upload");

  // Login
  const [authed, setAuthed] = useState(false);
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [msg, setMsg] = useState("");

  // Data loading
  const [loadingData, setLoadingData] = useState(false);

  // Payments + Orders
  const [payments, setPayments] = useState<Payment[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);

  // Products
  const [products, setProducts] = useState<ProductRow[]>([]);

  useEffect(() => {
    const saved = typeof window !== "undefined" ? localStorage.getItem(LS_KEY) : null;
    if (saved === "1") setAuthed(true);
  }, []);

  const loadData = async () => {
    setLoadingData(true);
    setMsg("");

    const [pRes, oRes, prRes] = await Promise.all([
      supabase
        .from("payments")
        .select("id, amount_ghs, status, paid_at, reference, full_name, email")
        .order("paid_at", { ascending: false })
        .limit(500),

      supabase
        .from("orders")
        .select("id, user_id, email, full_name, total_ghs, created_at")
        .order("created_at", { ascending: false })
        .limit(1000),

      // ✅ removed description from select
      supabase
        .from("products")
        .select("id,name,slug,price_ghs,stock,category,is_active,image_path,created_at")
        .order("created_at", { ascending: false })
        .limit(1000),
    ]);

    if (pRes.error) setMsg(`Payments error: ${pRes.error.message}`);
    if (oRes.error)
      setMsg((prev) =>
        prev ? `${prev} | Orders error: ${oRes.error!.message}` : `Orders error: ${oRes.error!.message}`
      );
    if (prRes.error)
      setMsg((prev) =>
        prev ? `${prev} | Products error: ${prRes.error!.message}` : `Products error: ${prRes.error!.message}`
      );

    setPayments((pRes.data as Payment[]) ?? []);
    setOrders((oRes.data as Order[]) ?? []);
    setProducts((prRes.data as ProductRow[]) ?? []);

    setLoadingData(false);
  };

  useEffect(() => {
    if (authed) loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authed]);

  const monthly = useMemo(() => {
    const map = new Map<string, number>();
    for (const p of payments) {
      if (p.status !== "success") continue;
      const d = new Date(p.paid_at);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      map.set(key, (map.get(key) ?? 0) + Number(p.amount_ghs ?? 0));
    }
    return Array.from(map.entries())
      .map(([month, total]) => ({ month, total }))
      .sort((a, b) => (a.month > b.month ? 1 : -1));
  }, [payments]);

  const purchasers = useMemo(() => {
    const map = new Map<string, { name: string | null; email: string | null; orders: number; spent: number }>();

    for (const o of orders) {
      const key = o.user_id ?? o.email ?? "unknown";
      const cur = map.get(key) ?? { name: o.full_name ?? null, email: o.email ?? null, orders: 0, spent: 0 };
      cur.orders += 1;
      cur.spent += Number(o.total_ghs ?? 0);
      cur.name = cur.name ?? o.full_name ?? null;
      cur.email = cur.email ?? o.email ?? null;
      map.set(key, cur);
    }

    return Array.from(map.entries())
      .map(([key, v]) => ({ key, ...v }))
      .sort((a, b) => b.spent - a.spent);
  }, [orders]);

  const handleLogin = async (e: FormEvent) => {
    e.preventDefault();
    setMsg("");

    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include", // ✅ ADD THIS
        body: JSON.stringify({ email: loginEmail, password: loginPassword }),
      });
      

      const j = await res.json().catch(() => ({}));

      if (!res.ok) {
        setMsg(j?.error || "Login failed.");
        return;
      }

      localStorage.setItem(LS_KEY, "1");
      setAuthed(true);
      await loadData();
    } catch (err: any) {
      setMsg(err?.message || "Login error.");
    }
  };

  const logout = async () => {
    setMsg("");
    try {
      await fetch("/api/admin/logout", { method: "POST", credentials: "include" });
    } catch {}

    localStorage.removeItem(LS_KEY);
    setAuthed(false);
    setLoginEmail("");
    setLoginPassword("");
    setPayments([]);
    setOrders([]);
    setProducts([]);
    setTab("upload");
  };

  if (!authed) {
    return (
      <main className="min-h-screen bg-white text-black flex items-center justify-center px-4">
        <div className="w-full max-w-md rounded-2xl border border-black/10 p-8 shadow-sm bg-white">
          <div className="text-center mb-6">
            <h1 className="text-2xl font-bold tracking-tight">BaeBe Boo Storefront</h1>
            <p className="text-sm text-black/60 mt-1">Admin portal</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-3">
            <input
              className="w-full border border-black/15 rounded-xl px-3 py-2"
              placeholder="Admin email"
              value={loginEmail}
              onChange={(e) => setLoginEmail(e.target.value)}
              autoComplete="username"
            />
            <input
              className="w-full border border-black/15 rounded-xl px-3 py-2"
              placeholder="Admin password"
              type="password"
              value={loginPassword}
              onChange={(e) => setLoginPassword(e.target.value)}
              autoComplete="current-password"
            />
            <button className="w-full px-4 py-2 rounded-xl bg-black text-white hover:bg-black/90">Login</button>

            {msg && <p className="text-sm text-center text-black/70 mt-2">{msg}</p>}
          </form>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-white text-black">
      <div className="grid grid-cols-1 md:grid-cols-[260px_1fr] min-h-screen">
        <aside className="bg-black/5 border-r border-black/10 px-5 py-8 flex flex-col">
          <div className="mb-6">
            <h2 className="text-lg font-bold">BaeBe Boo Storefront</h2>
            <p className="text-sm text-black/60">Admin portal</p>
            {msg && <p className="text-xs text-black/60 mt-3">{msg}</p>}
          </div>

          <div className="flex-1 flex flex-col justify-center gap-2">
            <SideTab active={tab === "products"} onClick={() => setTab("products")}>
              Database
            </SideTab>
            <SideTab active={tab === "upload"} onClick={() => setTab("upload")}>
              Upload Product
            </SideTab>
            <SideTab active={tab === "payments"} onClick={() => setTab("payments")}>
              Payments
            </SideTab>
            <SideTab active={tab === "purchasers"} onClick={() => setTab("purchasers")}>
              Purchasers
            </SideTab>
          </div>

          <div className="mt-6 pt-6 border-t border-black/10 space-y-2">
            <button
              onClick={loadData}
              disabled={loadingData}
              className="w-full px-3 py-2 rounded-xl border border-black/15 hover:bg-black/5 text-sm disabled:opacity-60"
            >
              {loadingData ? "Refreshing..." : "Refresh"}
            </button>
            <button onClick={logout} className="w-full px-3 py-2 rounded-xl bg-black text-white hover:bg-black/90 text-sm">
              Logout
            </button>

            <p className="text-[11px] text-black/40 mt-3">
              Categories: clothes, shoes, accessories, girl_dresses, girl_shoes
            </p>
          </div>
        </aside>

        <section className="px-6 py-10">
          <div className="max-w-6xl">
            <h1 className="text-2xl font-semibold">Admin Dashboard</h1>
            <p className="text-sm text-black/60 mt-1">Manage products and review store activity.</p>

            <div className="mt-6">
              {tab === "products" && <ProductsTab products={products} onChanged={loadData} />}
              {tab === "upload" && <UploadProductTab onSuccess={loadData} />}
              {tab === "payments" && <PaymentsTab monthly={monthly} payments={payments} />}
              {tab === "purchasers" && <PurchasersTab purchasers={purchasers} />}
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

function SideTab({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={[
        "w-full text-left px-4 py-3 rounded-xl border transition text-sm",
        active ? "bg-black text-white border-black" : "border-black/15 hover:bg-black/5",
      ].join(" ")}
    >
      {children}
    </button>
  );
}

function PaymentsTab({ monthly, payments }: { monthly: { month: string; total: number }[]; payments: Payment[] }) {
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <div className="rounded-2xl border border-black/10 p-4">
        <h2 className="font-semibold">Monthly payments</h2>
        <p className="text-sm text-black/60 mt-1">Successful payments grouped by month</p>

        <div className="mt-3 space-y-2">
          {monthly.length === 0 && <p className="text-sm text-black/60">No payments yet.</p>}
          {monthly.map((m) => (
            <div key={m.month} className="flex items-center justify-between rounded-xl border border-black/10 px-3 py-2">
              <span className="font-mono text-sm">{m.month}</span>
              <span className="font-semibold">GHS {m.total.toFixed(2)}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-2xl border border-black/10 overflow-hidden">
        <div className="p-4">
          <h2 className="font-semibold">Recent payments</h2>
          <p className="text-sm text-black/60">Last 30</p>
        </div>

        <div className="overflow-auto">
          <table className="w-full text-sm">
            <thead className="bg-black/5 text-left">
              <tr>
                <th className="p-3">Date</th>
                <th className="p-3">Name</th>
                <th className="p-3">Amount</th>
                <th className="p-3">Ref</th>
              </tr>
            </thead>
            <tbody>
              {payments.slice(0, 30).map((p) => (
                <tr key={p.id} className="border-t border-black/10">
                  <td className="p-3 text-black/70">{new Date(p.paid_at).toLocaleString()}</td>
                  <td className="p-3">{p.full_name ?? "-"}</td>
                  <td className="p-3 font-semibold">GHS {Number(p.amount_ghs ?? 0).toFixed(2)}</td>
                  <td className="p-3 font-mono text-xs text-black/60">{p.reference ?? "-"}</td>
                </tr>
              ))}
              {payments.length === 0 && (
                <tr>
                  <td className="p-4 text-black/60" colSpan={4}>
                    No payments found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function PurchasersTab({
  purchasers,
}: {
  purchasers: { key: string; name: string | null; email: string | null; orders: number; spent: number }[];
}) {
  return (
    <div className="rounded-2xl border border-black/10 overflow-hidden">
      <div className="p-4">
        <h2 className="font-semibold">Purchasers</h2>
        <p className="text-sm text-black/60">Users who have made orders</p>
      </div>

      <div className="overflow-auto">
        <table className="w-full text-sm">
          <thead className="bg-black/5 text-left">
            <tr>
              <th className="p-3">Name</th>
              <th className="p-3">Email</th>
              <th className="p-3">Orders</th>
              <th className="p-3">Total spent</th>
            </tr>
          </thead>
          <tbody>
            {purchasers.map((u) => (
              <tr key={u.key} className="border-t border-black/10">
                <td className="p-3">{u.name ?? "-"}</td>
                <td className="p-3">{u.email ?? "-"}</td>
                <td className="p-3">{u.orders}</td>
                <td className="p-3 font-semibold">GHS {u.spent.toFixed(2)}</td>
              </tr>
            ))}
            {purchasers.length === 0 && (
              <tr>
                <td className="p-4 text-black/60" colSpan={4}>
                  No purchasers yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function ProductsTab({ products, onChanged }: { products: ProductRow[]; onChanged: () => Promise<void> }) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [msg, setMsg] = useState<string>("");

  const startEdit = (p: ProductRow) => setEditingId(p.id);

  const cancelEdit = () => {
    setEditingId(null);
    setMsg("");
  };

  const saveEdit = async (p: ProductRow, patch: Partial<ProductRow>) => {
    setMsg("");
    setBusyId(p.id);
    try {
      const res = await fetch("/api/admin/products", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include", // ✅ ADD THIS
        body: JSON.stringify({ id: p.id, patch }),
      });
      
      const j = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(j?.error || "Update failed");
      setMsg("✅ Updated");
      setEditingId(null);
      await onChanged();
    } catch (e: any) {
      setMsg(`❌ ${e?.message ?? "Update failed"}`);
    } finally {
      setBusyId(null);
    }
  };

  const deleteProduct = async (p: ProductRow) => {
    if (!confirm(`Delete "${p.name ?? "Untitled"}"? This will also remove its image.`)) return;
    setMsg("");
    setBusyId(p.id);
    try {
      const res = await fetch(`/api/admin/products?id=${encodeURIComponent(p.id)}`, {
        method: "DELETE",
        credentials: "include",
      });
      
      const j = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(j?.error || "Delete failed");
      setMsg("✅ Deleted");
      await onChanged();
    } catch (e: any) {
      setMsg(`❌ ${e?.message ?? "Delete failed"}`);
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="rounded-2xl border border-black/10 overflow-hidden bg-white">
      <div className="p-4 flex items-center justify-between gap-4">
        <div>
          <h2 className="font-semibold">Database</h2>
          <p className="text-sm text-black/60">Products in your store (edit or delete)</p>
        </div>
        {msg && <p className="text-sm text-black/70">{msg}</p>}
      </div>

      <div className="overflow-auto">
        <table className="w-full text-sm">
          <thead className="bg-black/5 text-left">
            <tr>
              <th className="p-3">Image</th>
              <th className="p-3">Name</th>
              <th className="p-3">Category</th>
              <th className="p-3">Price</th>
              <th className="p-3">Stock</th>
              <th className="p-3">Active</th>
              <th className="p-3">Actions</th>
            </tr>
          </thead>

          <tbody>
            {products.length === 0 && (
              <tr>
                <td colSpan={7} className="p-6 text-black/60">
                  No products yet.
                </td>
              </tr>
            )}

            {products.map((p) => (
              <ProductRowView
                key={p.id}
                p={p}
                isEditing={editingId === p.id}
                busy={busyId === p.id}
                onEdit={() => startEdit(p)}
                onCancel={cancelEdit}
                onSave={(patch) => saveEdit(p, patch)}
                onDelete={() => deleteProduct(p)}
              />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function ProductRowView({
  p,
  isEditing,
  busy,
  onEdit,
  onCancel,
  onSave,
  onDelete,
}: {
  p: ProductRow;
  isEditing: boolean;
  busy: boolean;
  onEdit: () => void;
  onCancel: () => void;
  onSave: (patch: Partial<ProductRow>) => void;
  onDelete: () => void;
}) {
  const [name, setName] = useState(p.name ?? "");
  const [slug, setSlug] = useState(p.slug ?? "");
  const [price, setPrice] = useState<number>(Number(p.price_ghs ?? 0));
  const [stock, setStock] = useState<number>(Number(p.stock ?? 0));
  const [category, setCategory] = useState<string>(p.category ?? "clothes");
  const [active, setActive] = useState<boolean>(p.is_active ?? true);

  useEffect(() => {
    if (!isEditing) return;
    setName(p.name ?? "");
    setSlug(p.slug ?? "");
    setPrice(Number(p.price_ghs ?? 0));
    setStock(Number(p.stock ?? 0));
    setCategory(p.category ?? "clothes");
    setActive(p.is_active ?? true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isEditing]);

  const img = getPublicUrl(p.image_path);

  return (
    <tr className="border-t border-black/10 align-top">
      <td className="p-3">
        <div className="h-12 w-12 rounded-xl overflow-hidden bg-black/5 border border-black/10">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          {img ? <img src={img} alt={p.name ?? "Product"} className="h-full w-full object-cover" /> : null}
        </div>
      </td>

      <td className="p-3">
        {!isEditing ? (
          <div>
            <div className="font-semibold">{p.name ?? "-"}</div>
            <div className="text-xs text-black/50 break-all">{p.slug ?? ""}</div>
          </div>
        ) : (
          <div className="space-y-2 min-w-[260px]">
            <input className="w-full border border-black/15 rounded-lg px-2 py-1" value={name} onChange={(e) => setName(e.target.value)} />
            <input className="w-full border border-black/15 rounded-lg px-2 py-1" value={slug} onChange={(e) => setSlug(e.target.value)} />
          </div>
        )}
      </td>

      <td className="p-3">
        {!isEditing ? (
          <span className="text-black/70">{p.category ?? "-"}</span>
        ) : (
          <select className="border border-black/15 rounded-lg px-2 py-1 bg-white" value={category} onChange={(e) => setCategory(e.target.value)}>
            {CATEGORIES.map((c) => (
              <option key={c.value} value={c.value}>
                {c.label}
              </option>
            ))}
          </select>
        )}
      </td>

      <td className="p-3">
        {!isEditing ? (
          <span className="font-semibold">{money(Number(p.price_ghs ?? 0))}</span>
        ) : (
          <input
            className="w-28 border border-black/15 rounded-lg px-2 py-1"
            type="number"
            value={price}
            min={0}
            step="0.01"
            onChange={(e) => setPrice(Number(e.target.value))}
          />
        )}
      </td>

      <td className="p-3">
        {!isEditing ? (
          <span className="text-black/70">{p.stock ?? 0}</span>
        ) : (
          <input
            className="w-24 border border-black/15 rounded-lg px-2 py-1"
            type="number"
            value={stock}
            min={0}
            step="1"
            onChange={(e) => setStock(Number(e.target.value))}
          />
        )}
      </td>

      <td className="p-3">
        {!isEditing ? (
          <span className={p.is_active ? "text-green-700" : "text-red-700"}>{p.is_active ? "Yes" : "No"}</span>
        ) : (
          <label className="inline-flex items-center gap-2 text-sm">
            <input type="checkbox" checked={active} onChange={(e) => setActive(e.target.checked)} />
            Active
          </label>
        )}
      </td>

      <td className="p-3">
        {!isEditing ? (
          <div className="flex gap-2">
            <button disabled={busy} onClick={onEdit} className="px-3 py-1.5 rounded-lg border border-black/15 hover:bg-black/5 text-sm disabled:opacity-60">
              Edit
            </button>
            <button disabled={busy} onClick={onDelete} className="px-3 py-1.5 rounded-lg bg-black text-white hover:bg-black/90 text-sm disabled:opacity-60">
              Delete
            </button>
          </div>
        ) : (
          <div className="flex gap-2">
            <button
              disabled={busy}
              onClick={() =>
                onSave({
                  name: name.trim(),
                  slug: slug.trim(),
                  price_ghs: price,
                  stock,
                  category,
                  is_active: active,
                })
              }
              className="px-3 py-1.5 rounded-lg bg-black text-white hover:bg-black/90 text-sm disabled:opacity-60"
            >
              {busy ? "Saving..." : "Save"}
            </button>
            <button disabled={busy} onClick={onCancel} className="px-3 py-1.5 rounded-lg border border-black/15 hover:bg-black/5 text-sm disabled:opacity-60">
              Cancel
            </button>
          </div>
        )}
      </td>
    </tr>
  );
}

function UploadProductTab({ onSuccess }: { onSuccess: () => Promise<void> }) {
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  // ✅ removed description from admin UI
  const [price, setPrice] = useState<number>(0);
  const [stock, setStock] = useState<number>(0);
  const [category, setCategory] = useState<string>("clothes");
  const [file, setFile] = useState<File | null>(null);

  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");

  // ✅ suggest category from name only now
  const suggestCategory = (text: string) => {
    const t = text.toLowerCase();
    if (t.includes("dress")) return "girl_dresses";
    if (t.includes("girl") && (t.includes("shoe") || t.includes("sneaker") || t.includes("sandals"))) return "girl_shoes";
    if (t.includes("shoe") || t.includes("sneaker") || t.includes("sandals")) return "shoes";
    if (t.includes("accessor") || t.includes("bib") || t.includes("hat") || t.includes("cap") || t.includes("sock")) return "accessories";
    return "clothes";
  };

  useEffect(() => {
    setCategory(suggestCategory(name));
  }, [name]);

  const upload = async () => {
    setMsg("");
    if (!name.trim()) return setMsg("Please enter a product name.");
    if (!slug.trim()) return setMsg("Please enter a slug (e.g. baby-onesie).");
    if (!file) return setMsg("Please choose an image.");
    if (!category) return setMsg("Please choose a category.");

    setBusy(true);

    try {
      const fd = new FormData();
      fd.append("name", name.trim());
      fd.append("slug", slug.trim());
      // ✅ no description field
      fd.append("category", category);
      fd.append("price_ghs", String(price));
      fd.append("stock", String(stock));
      fd.append("file", file);

      const res = await fetch("/api/admin/products", {
        method: "POST",
        body: fd,
        credentials: "include", // ✅ ADD THIS
      });
      
      const j = await res.json().catch(() => ({}));

      if (!res.ok) throw new Error(j?.error || "Upload failed");

      setMsg("✅ Product uploaded and added to store!");
      setName("");
      setSlug("");
      setPrice(0);
      setStock(0);
      setFile(null);
      setCategory("clothes");

      await onSuccess();
    } catch (e: any) {
      setMsg(`❌ ${e?.message ?? "Upload failed"}`);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="rounded-2xl border border-black/10 p-5 bg-white">
      <h2 className="font-semibold">Upload product</h2>
      <p className="text-sm text-black/60 mt-1">Image uploads to Supabase Storage + product saved to the right category.</p>

      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <Field label="Product name">
          <input
            className="w-full border border-black/15 rounded-xl px-3 py-2"
            placeholder="e.g. Baby Onesie"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </Field>

        <Field label="Slug">
          <input
            className="w-full border border-black/15 rounded-xl px-3 py-2"
            placeholder="e.g. baby-onesie"
            value={slug}
            onChange={(e) => setSlug(e.target.value)}
          />
        </Field>

        <Field label="Category">
          <select
            className="w-full border border-black/15 rounded-xl px-3 py-2 bg-white"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          >
            {CATEGORIES.map((c) => (
              <option key={c.value} value={c.value}>
                {c.label}
              </option>
            ))}
          </select>
        </Field>

        <Field label="Price (GHS)">
          <input
            className="w-full border border-black/15 rounded-xl px-3 py-2"
            type="number"
            value={price}
            onChange={(e) => setPrice(Number(e.target.value))}
            min={0}
            step="0.01"
          />
        </Field>

        <Field label="Stock">
          <input
            className="w-full border border-black/15 rounded-xl px-3 py-2"
            type="number"
            value={stock}
            onChange={(e) => setStock(Number(e.target.value))}
            min={0}
            step="1"
          />
        </Field>

              <Field label="Product image">
        <input
          className="w-full border border-black/15 rounded-xl px-3 py-2"
          type="file"
          accept="image/*"
          onChange={(e) => setFile(e.target.files?.[0] ?? null)}
        />
      </Field>
      </div>

      {/* ✅ description section removed */}

      <div className="mt-5 flex items-center gap-3">
        <button disabled={busy} onClick={upload} className="px-4 py-2 rounded-xl bg-black text-white disabled:opacity-60">
          {busy ? "Uploading..." : "Upload"}
        </button>
        {msg && <p className="text-sm text-black/70">{msg}</p>}
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-xs font-medium text-black/60 mb-1">{label}</p>
      {children}
    </div>
  );
}
