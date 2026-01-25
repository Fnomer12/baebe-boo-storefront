import Link from "next/link";
import Image from "next/image";

type CategoryCard = {
  title: string;
  category: string;
  description: string;
  image: string;
};

const cards: CategoryCard[] = [
  {
    title: "Clothing",
    category: "Baby Clothing",
    description:
      "Comfort-first essentials including onesies, sets, and everyday wear.",
    image: "/categories/clothing.jpg",
  },
  {
    title: "Shoes",
    category: "Baby Shoes",
    description:
      "Soft, lightweight footwear designed for early steps and daily use.",
    image: "/categories/shoes.jpg",
  },
  {
    title: "Accessories",
    category: "Baby Accessories",
    description:
      "Thoughtfully designed accessories that support play, learning, and development.",
    image: "/categories/newaccessories.jpg",
  },
];

export default function CategoryCards() {
  return (
    <section id="categories" className="mt-10">
      <div className="text-center">
        <h2 className="text-2xl md:text-3xl font-semibold tracking-tight">
          Shop by category
        </h2>
        <p className="mt-2 text-black/70">
          Choose a category to continue. Login is required to purchase.
        </p>
      </div>

      <div className="mt-8 grid gap-4 md:grid-cols-3">
        {cards.map((c) => (
          <Link
            key={c.title}
           href="/login?next=/storefront"

            className="group relative overflow-hidden rounded-3xl border border-black/10 bg-white transition hover:shadow-sm"
          >
            {/* Image area */}
            <div className="relative h-56 w-full overflow-hidden">
              <Image
                src={c.image}
                alt={c.title}
                fill
                className="object-cover transition-transform duration-500 group-hover:scale-105"
              />

              {/* Base overlay */}
              <div className="absolute inset-0 bg-black/[0.15]" />

              {/* Title (always visible) */}
              <div className="absolute bottom-4 left-4 right-4">
                <h3 className="text-lg font-semibold text-white">
                  {c.title}
                </h3>
                <p className="text-sm text-white/80">{c.category}</p>
              </div>

              {/* Hover overlay */}
              <div className="absolute inset-0 flex items-center justify-center bg-black/60 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                <p className="px-6 text-center text-sm text-white leading-relaxed">
                  {c.description}
                </p>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
