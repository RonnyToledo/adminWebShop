"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { LogOut, ExternalLink, AlertTriangle } from "lucide-react";

export default function MembershipsComponent({ user, memberships }) {
  const router = useRouter();
  const [isRemoving, setIsRemoving] = useState(false);
  const [selectedMembership, setSelectedMembership] = useState(null);
  const [showDialog, setShowDialog] = useState(false);

  const handleRemoveMembership = async (membership) => {
    setSelectedMembership(membership);
    setShowDialog(true);
  };

  const confirmRemove = async () => {
    if (!selectedMembership) return;

    setIsRemoving(true);
    try {
      const res = await fetch(
        `/api/team?store_id=${selectedMembership.store_id}`,
        {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
        },
      );

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.message || "Error al desvincularse");
        return;
      }

      toast.success("Te has desvinculado correctamente");
      setShowDialog(false);
      router.refresh();
    } catch (err) {
      toast.error("Error inesperado");
      console.error(err);
    } finally {
      setIsRemoving(false);
    }
  };

  const handleAccessStore = (storeId) => {
    router.push(`/team?store_id=${storeId}`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">
            Mis Equipos
          </h1>
          <p className="text-slate-600">
            Bienvenido,{" "}
            <span className="font-semibold">{user?.name || user?.email}</span>
          </p>
        </div>

        {/* Memberships List */}
        {memberships.length > 0 ? (
          <div className="grid gap-4">
            {memberships.map((membership) => (
              <Card
                key={membership.id}
                className="hover:shadow-md transition-shadow"
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg">
                        {membership.store?.name || "Tienda sin nombre"}
                      </CardTitle>
                      <CardDescription>
                        Rol:{" "}
                        <span className="font-semibold text-slate-700">
                          {membership.store_role}
                        </span>
                      </CardDescription>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="default"
                        onClick={() => handleAccessStore(membership.store_id)}
                        className="gap-2"
                      >
                        <ExternalLink className="w-4 h-4" />
                        Acceder
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleRemoveMembership(membership)}
                        className="gap-2 text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <LogOut className="w-4 h-4" />
                        Desvincularse
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-2">
                  <p className="text-sm text-slate-500">
                    Miembro desde:{" "}
                    {new Date(membership.created_at).toLocaleDateString(
                      "es-ES",
                    )}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Alert className="border-blue-200 bg-blue-50">
            <AlertTriangle className="h-4 w-4 text-blue-600" />
            <AlertDescription className="text-blue-800">
              No tienes membresías activas en ningún equipo.
            </AlertDescription>
          </Alert>
        )}

        {/* Additional Actions */}
        <div className="mt-8 pt-6 border-t">
          <div className="grid md:grid-cols-2 gap-4">
            <Card className="bg-slate-50">
              <CardHeader>
                <CardTitle className="text-base">
                  ¿Quieres crear tu tienda?
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-slate-600 mb-4">
                  Solicita ser propietario de una nueva tienda
                </p>
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => router.push("/welcome#request-owner")}
                >
                  Solicitar Tienda
                </Button>
              </CardContent>
            </Card>

            <Card className="bg-slate-50">
              <CardHeader>
                <CardTitle className="text-base">Perfil</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-slate-600 mb-4">
                  Gestiona tu información personal
                </p>
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => router.push("/user/profile")}
                >
                  Ir a Perfil
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Confirmation Dialog */}
      <AlertDialog open={showDialog} onOpenChange={setShowDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Desvincularse del equipo?</AlertDialogTitle>
            <AlertDialogDescription>
              Estás a punto de desvincularte de{" "}
              <strong>{selectedMembership?.store?.name}</strong> como{" "}
              <strong>{selectedMembership?.store_role}</strong>. No podrás
              acceder a este equipo hasta que te vuelvan a invitar.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogCancel disabled={isRemoving}>Cancelar</AlertDialogCancel>
          <AlertDialogAction
            onClick={confirmRemove}
            disabled={isRemoving}
            className="bg-red-600 hover:bg-red-700"
          >
            {isRemoving ? "Desvinculando..." : "Desvincularse"}
          </AlertDialogAction>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
