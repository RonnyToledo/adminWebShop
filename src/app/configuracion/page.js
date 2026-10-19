import React from "react";
import { ThemeContext } from "@/context/useContext";
import Configuracion from "@/components/Chadcn-components/Configuracion/Configuracion";
import fs from "fs/promises";
import path from "path";
import { fetchConfigurationData } from "@/lib/supabaseApi";
import { getServerUser } from "@/lib/server-auth";

async function getCountries() {
  try {
    const filePath = path.join(process.cwd(), "public", "country.json");
    const raw = await fs.readFile(filePath, "utf8");
    const parsed = JSON.parse(raw);
    return parsed
      .map((obj) => ({ name: obj.name, isoCode: obj.isoCode }))
      .filter((c) => c.name && c.isoCode);
  } catch {
    return [];
  }
}

export default async function page() {
  const country = await getCountries();
  const user = await getServerUser();
  const result = user?.userId
    ? await fetchConfigurationData(user.userId)
    : { data: null };

  return (
    <Configuracion
      ThemeContext={ThemeContext}
      country={country}
      initialData={result.data}
    />
  );
}
