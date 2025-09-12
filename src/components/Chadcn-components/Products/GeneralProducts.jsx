import React from "react";
import { ProductManagementSystem } from "./product-management-system";
export default function GeneralProducts() {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">
            Gestión de Productos
          </h1>
          <p className="text-muted-foreground">
            Administra todos los productos de tu tienda organizados por
            categorías
          </p>
        </div>
        <ProductManagementSystem />
      </div>
    </div>
  );
}
