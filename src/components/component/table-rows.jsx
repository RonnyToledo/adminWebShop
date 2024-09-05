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

export default function TableRowsComponent({ product }) {
  return (
    <>
      {product.map((obj, ind) => (
        <TableRow key={ind}>
          <TableCell className="hidden sm:table-cell">
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
          <TableCell className="font-medium">{obj.title}</TableCell>
          <TableCell>
            <Badge variant="outline">
              {" "}
              {obj.caja ? obj.caja : "Sin categoria"}{" "}
              {obj.order < 100000 ? `-${obj.order}` : "-Sin prioridad"}
            </Badge>
          </TableCell>
          <TableCell className="hidden md:table-cell">
            ${Number(obj.price).toFixed(2)}
          </TableCell>
          <TableCell className="hidden md:table-cell">
            {obj.agotado ? "Si" : "No"}
          </TableCell>
          <TableCell className="hidden md:table-cell">
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
                <div className="flex flex-col">
                  <Link href={`/admin/products/${obj.productId}`}>Edit</Link>
                  <Button
                    className="text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100"
                    size="icon"
                    variant="ghost"
                    onClick={() => deleteProduct(obj.productId, obj.image)}
                  >
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
