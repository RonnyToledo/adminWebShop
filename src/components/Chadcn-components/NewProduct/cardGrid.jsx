"use client";
import React from "react";
import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { MdNewReleases } from "react-icons/md";

export default function ProductCard({
  product,
  store,
  index = 0,
  banner = "",
}) {
  // Función auxiliar para verificar si es producto nuevo
  const isNewProduct = (createdDate) => {
    if (!createdDate) return false;
    const created = new Date(createdDate);
    const now = new Date();
    const diffTime = Math.abs(now - created);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays <= 7; // Considera nuevo si tiene menos de 7 días
  };

  // Función auxiliar para redondeo inteligente
  const smartRound = (price) => {
    return Math.round(price * 100) / 100;
  };

  return (
    <motion.div
      key={index}
      className={`grid  rounded-lg shadow-md overflow-hidden  ${
        product?.span && "col-span-2"
      }`}
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: 0.2 + index * 0.05, duration: 0.4 }}
    >
      <Link href={`#`} className="relative">
        <Image
          width={250}
          height={250}
          placeholder="blur"
          blurDataURL={product?.image || banner}
          alt={product?.title || `Producto ${index}`}
          className="w-full h-48 object-cover"
          src={product?.image || banner}
          style={{
            filter: product?.stock ? "initial" : "grayscale(1)",
          }}
        />
        {isNewProduct(product?.creado) && (
          <div className="absolute top-2 left-2 backdrop-blur-3xl rounded-full">
            <MdNewReleases className="fill-red-600 shadow-md h-4 w-4" />
          </div>
        )}
      </Link>

      <div className="p-2 flex flex-col justify-evenly">
        <h4
          className={`font-cinzel font-bold text-[var(--text-gold)] text-base line-clamp-2 flex items-center w-full ${
            product?.span ? "min-h-6" : "min-h-12"
          }`}
        >
          {product?.title}
        </h4>

        <p
          className={`text-[10px] text-[var(--text-muted)] mt-1 line-clamp-2 whitespace-pre-line ${
            product?.span ? "min-h-4" : "min-h-8"
          }`}
        >
          {product?.descripcion || "..."}
        </p>

        <div className="flex items-center justify-between mt-3">
          <p className="font-bold w-full text-[10px] text-[var(--text-light)]">
            ${smartRound(product?.price || 0)} {store?.moneda_default?.moneda}
          </p>
        </div>
      </div>
    </motion.div>
  );
}

// Ejemplo de uso:
/*
import ProductCard from './ProductCard';

export default function ProductList({ products, store, banner }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {products.map((product, index) => (
        <ProductCard
          key={product?.productId}
          product={product}
          store={store}
          index={index}
          banner={banner}
        />
      ))}
    </div>
  );
}
*/
