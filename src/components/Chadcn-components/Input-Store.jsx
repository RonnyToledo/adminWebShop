"use client";
import React from "react";
import { Label } from "../ui/label";
import { Input } from "../ui/input";
import {
  SelectValue,
  SelectTrigger,
  SelectItem,
  SelectGroup,
  SelectContent,
  Select,
} from "@/components/ui/select";
import { Switch } from "../ui/switch";
import { cn } from "@/lib/utils";

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
      onCheckedChange={(value) =>
        funcion({
          ...object,
          [name]: value,
        })
      }
    />
  );
}
export function SelectStore({
  array,
  placeholder,
  onSelectChange,
  value,
  title,
  disabled = false,
  icon,
  className = "",
}) {
  return (
    <div className="space-y-2">
      <Label
        className="block text-sm font-medium text-gray-700 dark:text-gray-300"
        htmlFor="category"
      >
        {title}
      </Label>
      <div className="mt-1">
        <Select
          id="category"
          name="category"
          disabled={disabled}
          onValueChange={onSelectChange}
        >
          <SelectTrigger className="w-full">
            {icon}
            <SelectValue placeholder={placeholder} />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              {array?.map((obj, ind) => (
                <SelectItem
                  className={obj?.className || ""}
                  key={ind}
                  value={typeof obj === "object" ? obj[value] : obj} // Si es objeto, toma obj[value], si no, usa obj
                >
                  {typeof obj === "object" ? obj[value] : obj}
                </SelectItem>
              ))}
            </SelectGroup>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
