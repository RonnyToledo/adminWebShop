"use client";
import { useState, useEffect, useCallback } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  UserPlus,
  Shield,
  Trash2,
  Loader2,
  Mail,
  Inbox,
  LogOut,
  AlertTriangle,
} from "lucide-react";
import { toast } from "sonner";

const ROLE_LABELS = {
  owner: { label: "Owner", color: "bg-primary/20 text-primary" },
  admin: { label: "Admin", color: "bg-blue-500/20 text-blue-600" },
  editor: { label: "Editor", color: "bg-yellow-500/20 text-yellow-600" },
  analyst: { label: "Analista", color: "bg-purple-500/20 text-purple-600" },
  support: { label: "Soporte", color: "bg-amber-500/20 text-amber-600" },
};

const ASSIGNABLE_ROLES = {
  owner: ["admin", "editor", "analyst", "support"],
  admin: ["editor", "analyst", "support"],
};

// Quién puede invitar / gestionar al equipo
const CAN_MANAGE = ["owner", "admin"];

export default function TeamPage({ storeId, currentUserId, storeRole }) {
  const [members, setMembers] = useState([]);
  const [loadingMembers, setLoadingMembers] = useState(true);
  const [membersError, setMembersError] = useState("");

  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("editor");
  const [inviting, setInviting] = useState(false);

  // Confirmación de desvinculación propia
  const [confirmLeave, setConfirmLeave] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const [memberToRemove, setMemberToRemove] = useState(null);
  const [removingMemberId, setRemovingMemberId] = useState(null);

  const canManage = CAN_MANAGE.includes(storeRole);
  const assignable = ASSIGNABLE_ROLES[storeRole] ?? [];

  // ─── fetchers ────────────────────────────────────────────────────────────
  const fetchMembers = useCallback(async () => {
    setLoadingMembers(true);
    setMembersError("");
    try {
      const res = await fetch(`/api/team?store_id=${storeId}`);
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || "No se pudieron cargar los miembros");
      }
      setMembers(data.members ?? []);
    } catch (error) {
      setMembersError(error.message || "No se pudieron cargar los miembros");
      toast.error("No se pudieron cargar los miembros", {
        description: error.message,
      });
    } finally {
      setLoadingMembers(false);
    }
  }, [storeId]);

  useEffect(() => {
    if (!storeId) {
      setMembersError("No se pudo identificar la tienda.");
      setLoadingMembers(false);
      return;
    }
    fetchMembers();
  }, [storeId, fetchMembers]);

  // ─── acciones ─────────────────────────────────────────────────────────────
  async function handleInvite(e) {
    e.preventDefault();
    if (!inviteEmail) return;
    setInviting(true);
    try {
      const res = await fetch("/api/team", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          store_id: storeId,
          email: inviteEmail,
          store_role: inviteRole,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      toast.success("Invitación enviada", { description: data.message });
      setInviteEmail("");
    } catch (err) {
      toast.error(err.message);
    } finally {
      setInviting(false);
    }
  }

  async function handleRoleChange(memberId, newRole) {
    try {
      const res = await fetch("/api/team", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ member_id: memberId, store_role: newRole }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.message || "No se pudo actualizar el rol");
      }
      toast.success("Rol actualizado");
      await fetchMembers();
    } catch (error) {
      toast.error("No se pudo actualizar el rol", {
        description: error.message,
      });
    }
  }

  async function handleRemoveMember(memberId) {
    setRemovingMemberId(memberId);
    try {
      const res = await fetch(`/api/team?member_id=${memberId}`, {
        method: "DELETE",
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.message || "No se pudo eliminar el miembro");
      toast.success("Miembro eliminado");
      setMemberToRemove(null);
      await fetchMembers();
    } catch (error) {
      toast.error("No se pudo eliminar el miembro", {
        description: error.message,
      });
    } finally {
      setRemovingMemberId(null);
    }
  }

  // Desvincularse a uno mismo — redirige a /welcome al terminar
  async function handleLeave() {
    setLeaving(true);
    try {
      const res = await fetch(`/api/team?store_id=${storeId}`, {
        method: "DELETE",
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        toast.success("Te desvinculaste de la tienda");
        window.location.href = "/welcome";
      } else {
        toast.error(data.message || "No se pudo desvincular");
        setConfirmLeave(false);
      }
    } catch (error) {
      toast.error("No se pudo desvincular", {
        description: error.message,
      });
      setConfirmLeave(false);
    } finally {
      setLeaving(false);
    }
  }

  const isOwner = storeRole === "owner";

  // ─── render ───────────────────────────────────────────────────────────────
  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-3xl">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-normal text-foreground italic">
            Equipo
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Gestioná quién tiene acceso a tu tienda
          </p>
        </div>

        {/* Botón desvincularse — solo para no-owners */}
        {!isOwner && (
          <button
            onClick={() => setConfirmLeave(true)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
          >
            <LogOut size={14} />
            Desvincularse
          </button>
        )}
      </div>

      {/* Modal confirmación desvinculación */}
      {confirmLeave && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-background border border-border rounded-2xl p-6 max-w-sm w-full mx-4 shadow-xl space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-destructive/10 flex items-center justify-center">
                <AlertTriangle size={18} className="text-destructive" />
              </div>
              <div>
                <p className="font-medium text-foreground text-sm">
                  ¿Desvincularse de la tienda?
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Perderás acceso inmediatamente.
                </p>
              </div>
            </div>
            <div className="flex gap-2 justify-end pt-1">
              <button
                onClick={() => setConfirmLeave(false)}
                disabled={leaving}
                className="px-4 py-2 rounded-lg text-sm border border-border hover:bg-secondary/50 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleLeave}
                disabled={leaving}
                className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm bg-destructive text-destructive-foreground hover:bg-destructive/90 transition-colors disabled:opacity-60"
              >
                {leaving ? (
                  <Loader2 size={13} className="animate-spin" />
                ) : (
                  <LogOut size={13} />
                )}
                Confirmar
              </button>
            </div>
          </div>
        </div>
      )}

      <AlertDialog
        open={Boolean(memberToRemove)}
        onOpenChange={(open) => {
          if (!open && !removingMemberId) setMemberToRemove(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar a este miembro?</AlertDialogTitle>
            <AlertDialogDescription>
              {memberToRemove?.user?.email ??
                memberToRemove?.user?.name ??
                "Este usuario"}{" "}
              perderá el acceso a la tienda. Esta acción se puede revertir
              invitándolo de nuevo.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={Boolean(removingMemberId)}>
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              disabled={Boolean(removingMemberId)}
              onClick={(event) => {
                event.preventDefault();
                if (memberToRemove) {
                  void handleRemoveMember(memberToRemove.id);
                }
              }}
              className="bg-destructive hover:bg-destructive/90"
            >
              {removingMemberId ? "Eliminando..." : "Eliminar miembro"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* ── Formulario de invitación (solo owner/admin) ── */}
      {canManage && (
        <form
          onSubmit={handleInvite}
          className="flex flex-col sm:flex-row gap-3 p-4 bg-secondary/30 rounded-xl border border-border"
        >
          <input
            type="email"
            value={inviteEmail}
            onChange={(e) => setInviteEmail(e.target.value)}
            placeholder="correo@ejemplo.com"
            required
            className="flex-1 bg-background rounded-lg px-3 py-2.5 text-sm border border-border outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all"
          />
          <select
            value={inviteRole}
            onChange={(e) => setInviteRole(e.target.value)}
            className="bg-background rounded-lg px-3 py-2.5 text-sm border border-border outline-none focus:border-primary transition-all"
          >
            {assignable.map((r) => (
              <option key={r} value={r}>
                {ROLE_LABELS[r].label}
              </option>
            ))}
          </select>
          <button
            type="submit"
            disabled={inviting || assignable.length === 0}
            className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
          >
            {inviting ? (
              <Loader2 size={14} className="animate-spin" />
            ) : (
              <UserPlus size={14} />
            )}
            Invitar
          </button>
        </form>
      )}

      {/* ── Lista de miembros ── */}
      <div className="bg-background border border-border rounded-xl overflow-hidden">
        <div className="px-4 py-3 border-b border-border flex items-center justify-between">
          <div>
            <h2 className="text-sm font-medium text-foreground">Miembros</h2>
            <p className="text-xs text-muted-foreground">
              Usuarios activos en la tienda
            </p>
          </div>
          <Shield size={16} className="text-muted-foreground" />
        </div>

        {loadingMembers ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 size={20} className="animate-spin text-muted-foreground" />
          </div>
        ) : membersError ? (
          <div role="alert" className="flex flex-col items-center gap-3 py-12">
            <p className="text-sm text-destructive">{membersError}</p>
            <button
              onClick={fetchMembers}
              className="text-sm text-primary hover:underline"
            >
              Reintentar
            </button>
          </div>
        ) : members.length === 0 ? (
          <div className="flex flex-col items-center py-12 gap-2">
            <Shield size={24} className="text-muted-foreground" />
            <p className="text-sm text-muted-foreground">Sin miembros aún</p>
          </div>
        ) : (
          members.map((m) => {
            const roleInfo = ROLE_LABELS[m.store_role] ?? ROLE_LABELS.editor;
            const isMe = m.user_id === currentUserId;

            // canEdit: owner puede editar a todos menos a sí mismo
            //          admin puede editar a editor/analyst/support que no sean owner
            const canEdit =
              canManage &&
              !isMe &&
              m.store_role !== "owner" &&
              !(storeRole === "admin" && m.store_role === "admin");

            return (
              <div
                key={m.id}
                className="flex items-center gap-3 px-4 py-3.5 border-b border-border last:border-0"
              >
                {/* Avatar */}
                <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center shrink-0 text-sm font-medium text-primary">
                  {(m.user?.name ?? m.user?.email ?? "?")[0].toUpperCase()}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">
                    {m.user?.name ?? "—"}
                    {isMe && (
                      <span className="ml-2 text-xs text-muted-foreground">
                        (vos)
                      </span>
                    )}
                  </p>
                  <p className="text-xs text-muted-foreground truncate flex items-center gap-1">
                    <Mail size={10} /> {m.user?.email}
                  </p>
                </div>

                {/* Rol — editable o badge estático */}
                {canEdit ? (
                  <select
                    value={m.store_role}
                    onChange={(e) => handleRoleChange(m.id, e.target.value)}
                    className={`text-xs px-2.5 py-1 rounded-full border-0 font-medium cursor-pointer outline-none ${roleInfo.color}`}
                  >
                    {assignable.map((r) => (
                      <option key={r} value={r}>
                        {ROLE_LABELS[r].label}
                      </option>
                    ))}
                  </select>
                ) : (
                  <span
                    className={`text-xs px-2.5 py-1 rounded-full font-medium ${roleInfo.color}`}
                  >
                    {roleInfo.label}
                  </span>
                )}

                {/* Eliminar miembro */}
                {canEdit && (
                  <button
                    onClick={() => setMemberToRemove(m)}
                    className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                    title="Eliminar miembro"
                  >
                    <Trash2 size={14} />
                  </button>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
