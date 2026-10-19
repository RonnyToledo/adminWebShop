"use client";

import { useEffect, useState } from "react";
import {
  AlertTriangle,
  ArrowRightLeft,
  Loader2,
  ShieldCheck,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { CARD_CLASS, CardHeading } from "./section-primitives";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function TransferOwnership({ store }) {
  const storeId = store?.UUID;
  const [members, setMembers] = useState([]);
  const [targetUserId, setTargetUserId] = useState("");
  const [confirmationStep, setConfirmationStep] = useState(0);
  const [confirmation, setConfirmation] = useState("");
  const [loadingMembers, setLoadingMembers] = useState(false);
  const [transferring, setTransferring] = useState(false);

  useEffect(() => {
    if (!storeId) return;

    let cancelled = false;
    async function loadMembers() {
      setLoadingMembers(true);
      try {
        const response = await fetch(
          `/api/team/transfer-owner?store_id=${encodeURIComponent(storeId)}`,
        );
        const body = await response.json();
        if (!response.ok)
          throw new Error(body.message ?? "No se pudieron cargar los miembros");
        if (!cancelled) setMembers(body.members ?? []);
      } catch (error) {
        if (!cancelled) toast.error(error.message);
      } finally {
        if (!cancelled) setLoadingMembers(false);
      }
    }

    loadMembers();
    return () => {
      cancelled = true;
    };
  }, [storeId]);

  const selectedMember = members.find(
    (member) => member.user_id === targetUserId,
  );

  const resetConfirmation = () => {
    setConfirmationStep(0);
    setConfirmation("");
  };

  const transfer = async () => {
    if (!selectedMember || confirmation !== "TRANSFERIR") return;

    setTransferring(true);
    try {
      const response = await fetch("/api/team/transfer-owner", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          store_id: storeId,
          target_user_id: targetUserId,
          confirmation,
        }),
      });
      const body = await response.json();
      if (!response.ok)
        throw new Error(body.message ?? "No se pudo transferir la propiedad");

      toast.success("Propiedad transferida correctamente");
      window.location.assign("/");
    } catch (error) {
      toast.error(error.message);
      setTransferring(false);
    }
  };

  return (
    <Card className={`${CARD_CLASS} border-destructive/30`}>
      <CardHeading
        icon={ArrowRightLeft}
        title="Transferir propiedad"
        description={`Entrega el control de ${store?.name ?? "esta tienda"} a un miembro activo.`}
      />
      <CardContent className="space-y-4">
        <div className="rounded-xl border border-border bg-secondary p-3 text-sm text-foreground">
          <div className="flex gap-2">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
            <p>
              El cambio es permanente. Tú dejarás de ser owner y conservarás
              acceso como administrador de la tienda.
            </p>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="transfer-target">Nuevo propietario</Label>
          <select
            id="transfer-target"
            className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
            value={targetUserId}
            onChange={(event) => setTargetUserId(event.target.value)}
            disabled={loadingMembers || confirmationStep > 0 || transferring}
          >
            <option value="">
              {loadingMembers
                ? "Cargando miembros..."
                : "Selecciona un miembro activo"}
            </option>
            {members.map((member) => (
              <option value={member.user_id} key={member.id}>
                {member.user?.name || member.user?.email || "Usuario"} ·{" "}
                {member.store_role}
              </option>
            ))}
          </select>
          {!loadingMembers && members.length === 0 && (
            <p className="text-xs text-muted-foreground">
              No hay miembros activos disponibles para recibir la propiedad.
            </p>
          )}
        </div>

        {confirmationStep === 0 && (
          <Button
            type="button"
            variant="outline"
            className="max-w-full whitespace-normal text-center"
            disabled={!selectedMember}
            onClick={() => setConfirmationStep(1)}
          >
            <ShieldCheck className="mr-2 h-4 w-4" /> Continuar con la
            transferencia
          </Button>
        )}

        {confirmationStep === 1 && selectedMember && (
          <div className="space-y-3 rounded-lg border border-destructive/30 bg-destructive/5 p-4">
            <p className="text-sm font-medium">
              ¿Estás seguro de transferir la propiedad a{" "}
              {selectedMember.user?.name || selectedMember.user?.email}?
            </p>
            <p className="text-xs text-muted-foreground">
              Después de confirmar, la tienda tendrá un nuevo owner y esta
              sesión perderá la propiedad.
            </p>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={resetConfirmation}
              >
                Cancelar
              </Button>
              <Button
                type="button"
                variant="destructive"
                onClick={() => setConfirmationStep(2)}
              >
                Sí, continuar
              </Button>
            </div>
          </div>
        )}

        {confirmationStep === 2 && (
          <div className="space-y-3 rounded-lg border border-destructive/30 bg-destructive/5 p-4">
            <p className="text-sm font-medium">Confirmación final</p>
            <p className="text-xs text-muted-foreground">
              Escribe exactamente <strong>TRANSFERIR</strong> para completar la
              operación.
            </p>
            <Input
              value={confirmation}
              onChange={(event) =>
                setConfirmation(event.target.value.toUpperCase())
              }
              placeholder="TRANSFERIR"
              autoComplete="off"
            />
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={resetConfirmation}
                disabled={transferring}
              >
                Cancelar
              </Button>
              <Button
                type="button"
                variant="destructive"
                onClick={transfer}
                disabled={confirmation !== "TRANSFERIR" || transferring}
              >
                {transferring && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                {transferring
                  ? "Transfiriendo..."
                  : "Transferir definitivamente"}
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
