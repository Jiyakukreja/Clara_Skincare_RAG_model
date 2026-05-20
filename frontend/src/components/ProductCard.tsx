"use client";

import Link from "next/link";
import { ArrowUpRight } from "lucide-react";

import type { ProductRecommendation } from "@/types";

type Props = {
  product: ProductRecommendation;
};

export function ProductCard({ product }: Props) {
  const productHref = product.product_url || `https://www.clinikally.com/search?q=${encodeURIComponent(product.name)}`;

  return (
    <Link
      href={productHref}
      target="_blank"
      rel="noopener noreferrer"
      className="group block rounded-[8px] border border-[var(--border)] bg-white p-4 transition-all duration-150 ease-out hover:-translate-y-0.5 hover:border-[var(--purple)] hover:shadow-[0_12px_26px_rgba(140,48,245,0.12)]"
    >
      <div className="mb-3 flex items-start justify-between gap-3">
        <div>
          <div className="text-[13px] font-bold text-[var(--text-dark)]">{product.name}</div>
          <div className="mt-1 inline-flex rounded-full bg-[var(--purple-light)] px-3 py-1 text-[11px] font-bold uppercase tracking-[0.08em] text-[#6b21c8]">
            {product.concerns?.[0] || "Suggested product"}
          </div>
        </div>
        <span className="text-[11px] font-bold text-[var(--purple)] transition-transform duration-150 ease-out group-hover:translate-x-0.5 group-hover:-translate-y-0.5">
          ↗
        </span>
      </div>

      <div className="inline-flex rounded-full bg-[#ede0fd] px-3 py-[3px] text-[11px] font-bold text-[#6b21c8]">
        MRP &nbsp;
        {formatPrice(product.price, product.currency)}
      </div>

      <p className="mt-3 text-[12px] leading-[1.6] text-[var(--text-dark)]">{product.description}</p>
    </Link>
  );
}

function formatPrice(price: number, currency: string) {
  if (currency === "INR") return `₹${price.toFixed(0)}`;
  return `${currency} ${price.toFixed(2)}`;
}
