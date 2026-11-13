import { redirect } from "next/navigation";
import RouAIGuide from "@/components/Chadcn-components/Guide/RouAIGuide";
import {
  getRouAIGuideAccess,
  getSafeReturnPath,
} from "@/lib/rouai-guide/server";
import { getServerUser } from "@/lib/server-auth";

export const dynamic = "force-dynamic";

export default async function RouAIGuidePage({ searchParams }) {
  const { userId } = await getServerUser();
  if (!userId) redirect("/login");

  const access = await getRouAIGuideAccess({ allowDisabledPlan: true });
  if (access.response) {
    if (access.response.status === 401) redirect("/login");
    if (access.response.status === 403) redirect("/configuracion");
    throw new Error("No se pudo verificar el acceso a RouAI Guide.");
  }
  if (access.guideMode === "disabled") redirect("/planes");

  const params = await searchParams;
  const initialPath = getSafeReturnPath(params?.from ?? "/");

  return (
    <RouAIGuide
      initialPath={initialPath}
      advancedEnabled={access.guideMode === "advanced"}
    />
  );
}
