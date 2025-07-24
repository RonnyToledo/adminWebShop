"use client";
import React from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { File, ListFilter, MoreHorizontal, PlusCircle } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { Trash2, Pencil, Loader2 } from "lucide-react";
import { useState, useContext } from "react";
import axios from "axios";
import { ToastAction } from "@/components/ui/toast";
import { useToast } from "@/components/ui/use-toast";
import { ThemeContext } from "@/context/useContext";

export default function TableRowsComponent({ product }) {
  const { webshop, setWebshop } = useContext(ThemeContext);
  const [downloading, setDownloading] = useState(false);
  const { toast } = useToast();

  const deleteProduct = async (value, image) => {
    setDownloading(true);
    const formData = new FormData();
    if (image) formData.append("image", image);
    formData.append("Id", value);
    try {
      const res = await axios.delete(
        `/api/tienda/${webshop.store.sitioweb}/products/${value}/`,
        {
          data: formData,
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );
    } catch (error) {
      console.error("Error :", error);
      toast({
        title: "Error",
        variant: "destructive",
        description: "No se pudo eliminar el producto.",
      });
    } finally {
      toast({
        title: "Tarea Ejecutada",
        description: "Informacion Actualizada",
        action: (
          <ToastAction altText="Goto schedule to undo">Cerrar</ToastAction>
        ),
      });
      setWebshop({
        ...webshop,
        products: webshop.products.filter((obj) => obj.productId !== value),
      });
      setDownloading(false);
    }
  };
  return (
    <>
      {product.map((obj, ind) => (
        <TableRow key={ind}>
          <TableCell className="p-1 sm:p-2 md:p-4">
            <Image
              alt={obj.title ? obj.title : `Producto${ind}`}
              className="aspect-square rounded-md object-cover"
              height={64}
              src={
                obj.image
                  ? obj.image
                  : "https://res.cloudinary.com/dbgnyc842/image/upload/v1725399957/xmlctujxukncr5eurliu.png"
              }
              style={{
                aspectRatio: "64/64",
                objectFit: "cover",
              }}
              width={64}
            />
          </TableCell>
          <TableCell className="font-medium p-1 sm:p-2 md:p-4">
            {obj.title}
          </TableCell>
          <TableCell className="p-1 sm:p-2 md:p-4">
            <Badge variant="outline">
              {" "}
              {obj.caja ? obj.caja : "Sin categoria"}{" "}
              {obj.order < 100000 && `-${obj.order}`}
            </Badge>
          </TableCell>
          <TableCell className="hidden md:table-cell p-1 sm:p-2 md:p-4">
            ${Number(obj.price).toFixed(2)}
          </TableCell>
          <TableCell className="hidden md:table-cell p-1 sm:p-2 md:p-4">
            {obj.agotado ? "Si" : "No"}
          </TableCell>
          <TableCell className="hidden md:table-cell p-1 sm:p-2 md:p-4">
            {obj.favorito ? "Si" : "No"}
          </TableCell>
          <TableCell>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button aria-haspopup="true" size="icon" variant="ghost">
                  <MoreHorizontal className="h-4 w-4" />
                  <span className="sr-only">Toggle menu</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <div className="flex flex-col gap-3 p-2">
                  <Link
                    className="flex gap-3 w-full justify-start items-center"
                    href={`/products/${obj.productId}`}
                  >
                    <Pencil className="h-3 w-3" />
                    Edit
                  </Link>
                  <Button
                    className="flex gap-3 w-full justify-start items-center"
                    size="icon"
                    variant="ghost"
                    onClick={() => deleteProduct(obj.productId, obj.image)}
                  >
                    {!downloading ? (
                      <Trash2 className="h-3 w-3" />
                    ) : (
                      <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                    )}
                    Delete
                  </Button>
                </div>
              </DropdownMenuContent>
            </DropdownMenu>
          </TableCell>
        </TableRow>
      ))}
    </>
  );
}
