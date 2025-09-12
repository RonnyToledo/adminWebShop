"use client";
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { X, FileText, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "../../ui/input";

export default function Caracteristicas({
  setNewItem,
  newItem,
  addItem,
  removeItem,
  items,
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="w-5 h-5" />
          Detalles
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="bg-card rounded-lg border p-6 mb-6">
          <div className="flex gap-2">
            <Input
              placeholder="Agregar nuevo elemento..."
              value={newItem}
              onChange={(e) => setNewItem(e.target.value)}
              className="flex-1"
            />
            <Button onClick={addItem} size="sm" type="button">
              <Plus className="w-4 h-4 mr-1" />
              Agregar
            </Button>
          </div>
        </div>

        <div className="bg-card rounded-lg border p-6">
          <ul className="space-y-3">
            {items.map((item, index) => (
              <li
                key={index}
                className="flex items-center justify-between text-foreground group"
              >
                <div className="flex items-center">
                  <span className="w-2 h-2 bg-primary rounded-full mr-3"></span>
                  {item}
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  type="button"
                  onClick={() => removeItem(item)}
                  className=" h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
                >
                  <X className="w-4 h-4" />
                </Button>
              </li>
            ))}
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}
