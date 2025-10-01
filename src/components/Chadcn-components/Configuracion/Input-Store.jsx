"use client";
import React, { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ChevronsUpDown, Loader2 } from "lucide-react";

export function InputStore({ name, object, value, action, type }) {
  return (
    <Input
      id={value}
      value={type == "number" ? value || 0 : value || ""}
      type={type}
      onChange={(e) =>
        action({
          ...object,
          [value]: e.target.value,
        })
      }
    />
  );
}

export function SwitchStore({ name, object, title, funcion }) {
  return (
    <Switch
      id="reservation"
      checked={name || false}
      onCheckedChange={() => {
        funcion({
          ...object,
          [title]: !name,
        });
      }}
    />
  );
}
export function SelectStore({
  array,
  placeholder,
  onSelectChange,
  value,
  disabled = false,
  status,
  loading = false,
  className = "",
}) {
  const [openCategory, setOpenCategory] = useState(false);
  return (
    <Popover open={openCategory} onOpenChange={setOpenCategory}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={openCategory}
          disabled={disabled}
          className="w-full justify-between bg-transparent"
        >
          {status || placeholder}
          {loading ? (
            <Loader2 className="animate-spin" />
          ) : (
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0">
        <Command>
          <CommandInput placeholder={placeholder} />
          <CommandList>
            <CommandEmpty>No se encontró ningúna categoría.</CommandEmpty>
            <CommandGroup>
              {array?.map((obj, ind) => (
                <CommandItem
                  key={ind}
                  value={typeof obj === "object" ? obj[value] : obj}
                  onSelect={() => {
                    onSelectChange(typeof obj === "object" ? obj[value] : obj);
                    setOpenCategory(false);
                  }}
                >
                  {typeof obj === "object" ? obj[value] : obj}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
