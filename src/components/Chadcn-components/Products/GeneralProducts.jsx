import React from "react";
import { ProductManagementSystem } from "./product-management-system";

export default function GeneralProducts() {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-10 space-y-6">
        {/* Header editorial consistente con el resto del sistema */}
        <div>
          <p className="text-[11px] text-primary uppercase tracking-[0.18em] font-medium mb-1">
            Catálogo
          </p>
          <h1 className="text-2xl font-normal text-foreground italic leading-tight">
            Gestión de productos
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Arrastra para reordenar · Organizado por categorías
          </p>
        </div>

        <ProductManagementSystem />
      </div>
    </div>
  );
}
