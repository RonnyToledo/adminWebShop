"use client";
import React, { useState } from "react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
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

// `value` ahora es el NOMBRE del campo (key), no su contenido.
export function InputStore({ name, object, value, action, type }) {
  const current = object?.[value];
  return (
    <Input
      id={name}
      value={type == "number" ? (current ?? 0) : (current ?? "")}
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
      id={`switch-${title}`}
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
  show = "name",
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
          className={cn(
            "w-full justify-between bg-transparent font-normal",
            !status && "text-muted-foreground",
            className,
          )}
        >
          <span className="truncate">{status || placeholder}</span>
          {loading ? (
            <Loader2 className="ml-2 h-4 w-4 shrink-0 animate-spin" />
          ) : (
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0">
        <Command>
          <CommandInput placeholder={placeholder} />
          <CommandList>
            <CommandEmpty>Sin resultados.</CommandEmpty>
            <CommandGroup>
              {array?.map((obj, ind) => {
                // value para BUSCAR/mostrar en cmdk = texto legible (show)
                // selectValue = lo que realmente se guarda (value)
                const label = typeof obj === "object" ? obj[show] : obj;
                const selectValue = typeof obj === "object" ? obj[value] : obj;
                return (
                  <CommandItem
                    key={ind}
                    value={label}
                    onSelect={() => {
                      onSelectChange(selectValue);
                      setOpenCategory(false);
                    }}
                  >
                    {label}
                  </CommandItem>
                );
              })}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
