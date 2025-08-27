"use client";
import React, { useState, useContext, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Settings,
  Grid3X3,
  Square,
  RectangleVerticalIcon as Rectangle,
  Minimize2,
} from "lucide-react";
import { FromData } from "../globalFunction/fromData";

export default function Theme({ ThemeContext }) {
  const context = useContext(ThemeContext);
  if (!context) throw new Error("Theme must be used within ThemeProvider");

  const { webshop, setWebshop } = context;
  const [store, setStore] = useState({
    edit: {
      grid: true,
      size: false,
      orientation: false,
      style: false,
    },
  });
  useEffect(() => {
    setStore(webshop.store);
  }, [webshop.store]);
  useEffect(() => {
    if (store.edit.grid) {
      setStore({
        ...store,
        edit: { ...store.edit, horizontal: false },
      });
    }
  }, [store.edit.grid]);
  useEffect(() => {
    if (store.edit.horizontal) {
      setStore({
        ...store,
        edit: { ...store.edit, grid: false },
      });
    }
  }, [store.edit.horizontal]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4 md:p-8">
      <FromData store={store} ThemeContext={ThemeContext}>
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-blue-600 rounded-lg">
              <Settings className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-slate-900">
              Theme Settings
            </h1>
          </div>
          <p className="text-slate-600 text-lg">
            Customize the appearance of your store products
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="md:col-span-2 space-y-6">
            {/* Grid Settings */}
            <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
              <CardHeader className="pb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-emerald-100 rounded-lg">
                    <Grid3X3 className="w-5 h-5 text-emerald-600" />
                  </div>
                  <div>
                    <CardTitle className="text-xl text-slate-900">
                      Grid Layout
                    </CardTitle>
                    <CardDescription className="text-slate-600">
                      Choose how many products to display per row
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <RadioGroup
                  value={store.edit.grid}
                  onValueChange={(value) =>
                    setStore({
                      ...store,
                      edit: { ...store.edit, grid: value },
                    })
                  }
                  className="grid grid-cols-2 gap-4"
                >
                  <div className="flex items-center space-x-3 p-4 rounded-lg border-2 border-slate-200 hover:border-emerald-300 hover:bg-emerald-50/50 transition-all cursor-pointer">
                    <RadioGroupItem value={false} id="grid-1" />
                    <Label
                      htmlFor="grid-1"
                      className="font-medium cursor-pointer"
                    >
                      1 Column
                    </Label>
                  </div>
                  <div className="flex items-center space-x-3 p-4 rounded-lg border-2 border-slate-200 hover:border-emerald-300 hover:bg-emerald-50/50 transition-all cursor-pointer">
                    <RadioGroupItem value={true} id="grid-2" />
                    <Label
                      htmlFor="grid-2"
                      className="font-medium cursor-pointer"
                    >
                      2 Columns
                    </Label>
                  </div>
                </RadioGroup>
              </CardContent>
            </Card>

            {/* Size Settings */}
            <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
              <CardHeader className="pb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-purple-100 rounded-lg">
                    <Square className="w-5 h-5 text-purple-600" />
                  </div>
                  <div>
                    <CardTitle className="text-xl text-slate-900">
                      Product Shape
                    </CardTitle>
                    <CardDescription className="text-slate-600">
                      Select the aspect ratio for product images
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <RadioGroup
                  value={store.edit.square}
                  onValueChange={(value) =>
                    setStore({
                      ...store,
                      edit: { ...store.edit, square: value },
                    })
                  }
                  className="grid grid-cols-2 gap-4"
                >
                  <div className="flex items-center space-x-3 p-4 rounded-lg border-2 border-slate-200 hover:border-purple-300 hover:bg-purple-50/50 transition-all cursor-pointer">
                    <RadioGroupItem value={true} id="size-square" />
                    <Label
                      htmlFor="size-square"
                      className="font-medium cursor-pointer"
                    >
                      Square
                    </Label>
                  </div>
                  <div className="flex items-center space-x-3 p-4 rounded-lg border-2 border-slate-200 hover:border-purple-300 hover:bg-purple-50/50 transition-all cursor-pointer">
                    <RadioGroupItem value={false} id="size-rectangle" />
                    <Label
                      htmlFor="size-rectangle"
                      className="font-medium cursor-pointer"
                    >
                      Rectangle
                    </Label>
                  </div>
                </RadioGroup>
              </CardContent>
            </Card>

            {/* Orientation Settings */}
            <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
              <CardHeader className="pb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-orange-100 rounded-lg">
                    <Rectangle className="w-5 h-5 text-orange-600" />
                  </div>
                  <div>
                    <CardTitle className="text-xl text-slate-900">
                      Orientation
                    </CardTitle>
                    <CardDescription className="text-slate-600">
                      Choose the layout direction
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <RadioGroup
                  value={store.edit.horizontal}
                  onValueChange={(value) =>
                    setStore({
                      ...store,
                      edit: { ...store.edit, horizontal: value },
                    })
                  }
                  className="grid grid-cols-2 gap-4"
                >
                  <div className="flex items-center space-x-3 p-4 rounded-lg border-2 border-slate-200 hover:border-orange-300 hover:bg-orange-50/50 transition-all cursor-pointer">
                    <RadioGroupItem value={true} id="orient-horizontal" />
                    <Label
                      htmlFor="orient-horizontal"
                      className="font-medium cursor-pointer"
                    >
                      Horizontal
                    </Label>
                  </div>

                  <div className="flex items-center space-x-3 p-4 rounded-lg border-2 border-slate-200 hover:border-orange-300 hover:bg-orange-50/50 transition-all cursor-pointer">
                    <RadioGroupItem value={false} id="orient-vertical" />
                    <Label
                      htmlFor="orient-vertical"
                      className="font-medium cursor-pointer"
                    >
                      Vertical
                    </Label>
                  </div>
                </RadioGroup>
              </CardContent>
            </Card>

            {/* Style Settings */}
            <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
              <CardHeader className="pb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-rose-100 rounded-lg">
                    <Minimize2 className="w-5 h-5 text-rose-600" />
                  </div>
                  <div>
                    <CardTitle className="text-xl text-slate-900">
                      Design Style
                    </CardTitle>
                    <CardDescription className="text-slate-600">
                      Choose between minimal or detailed product cards
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <RadioGroup
                  value={store.edit.minimalista}
                  onValueChange={(value) =>
                    setStore({
                      ...store,
                      edit: { ...store.edit, minimalista: value },
                    })
                  }
                  className="grid grid-cols-2 gap-4"
                >
                  <div className="flex items-center space-x-3 p-4 rounded-lg border-2 border-slate-200 hover:border-rose-300 hover:bg-rose-50/50 transition-all cursor-pointer">
                    <RadioGroupItem value={true} id="style-simple" />
                    <Label
                      htmlFor="style-simple"
                      className="font-medium cursor-pointer"
                    >
                      Minimal
                    </Label>
                  </div>
                  <div className="flex items-center space-x-3 p-4 rounded-lg border-2 border-slate-200 hover:border-rose-300 hover:bg-rose-50/50 transition-all cursor-pointer">
                    <RadioGroupItem value={false} id="style-detailed" />
                    <Label
                      htmlFor="style-detailed"
                      className="font-medium cursor-pointer"
                    >
                      Detailed
                    </Label>
                  </div>
                </RadioGroup>
              </CardContent>
            </Card>
          </div>

          <div className="md:col-span-1">
            <Card className="border-0 shadow-xl bg-white/90 backdrop-blur-sm sticky top-8">
              <CardHeader className="pb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <Settings className="w-5 h-5 text-blue-600" />
                  </div>
                  <CardTitle className="text-xl text-slate-900">
                    Live Preview
                  </CardTitle>
                </div>
                <CardDescription className="text-slate-600">
                  See how your store will look
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Store Header Preview */}
                <div className="p-4 bg-gradient-to-r from-slate-100 to-slate-200 rounded-lg">
                  <Skeleton className="w-full h-8 mb-3 rounded-md" />
                  <Skeleton className="w-2/3 h-4 rounded-md" />
                </div>

                {/* Products Grid Preview */}
                <div className="space-y-4">
                  <div className="flex justify-center">
                    <Skeleton className="w-1/2 h-6 rounded-md" />
                  </div>

                  <div
                    className={`grid gap-3 ${
                      store.edit.grid ? "grid-cols-2" : "grid-cols-1"
                    }`}
                  >
                    {Array.from({ length: 5 }).map((_, index) => (
                      <div
                        key={index}
                        className={`grid bg-white rounded-lg shadow-sm space-x-2 border-slate-200 p-3 space-y-3 hover:shadow-md transition-shadow ${
                          store.edit.horizontal ? "grid-cols-2" : "grid-cols-1"
                        }`}
                      >
                        <div className="flex justify-center items-center">
                          <Skeleton
                            className={`w-full rounded-md ${
                              store.edit.square
                                ? "aspect-square"
                                : "aspect-[4/3]"
                            }`}
                          />
                        </div>
                        <div className="space-y-2">
                          <Skeleton className="w-full h-4 rounded-md" />
                          <Skeleton className="w-3/4 h-3 rounded-md" />
                          {!store.edit.minimalista ? (
                            <>
                              <Skeleton className="w-1/2 h-3 rounded-md" />
                              <div className="flex justify-between items-center pt-1">
                                <Skeleton className="w-1/3 h-4 rounded-md" />
                                <Skeleton className="w-1/4 h-6 rounded-md" />
                              </div>
                            </>
                          ) : (
                            <div className="flex justify-between items-center pt-1">
                              <Skeleton className="w-1/3 h-4 rounded-md" />
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </FromData>
    </div>
  );
}
