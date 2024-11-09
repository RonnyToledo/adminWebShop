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
    <div className="space-y-2 p-2">
      <Label htmlFor={value}>{name}</Label>
      <Input
        id={value}
        value={object[value] || ""}
        type={type}
        onChange={(e) =>
          action({
            ...object,
            [value]: e.target.value,
          })
        }
      />
    </div>
  );
}

export function SwitchStore({ name, object, title, funcion }) {
  return (
    <div className="space-y-2 flex items-center">
      <Label htmlFor="reservation" className="mr-2">
        {title}
      </Label>
      <Switch
        id="reservation"
        checked={object[name]}
        onCheckedChange={(value) =>
          funcion({
            ...object,
            [name]: value,
          })
        }
      />
    </div>
  );
}
export function SelectStore({
  array,
  placeholder,
  onSelectChange,
  value,
  title,
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
        <Select id="category" name="category" onValueChange={onSelectChange}>
          <SelectTrigger className="w-full">
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
