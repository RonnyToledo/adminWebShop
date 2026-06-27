import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendInviteEmail({ to, storeName, role, inviteId }) {
  const acceptUrl = `${process.env.NEXT_PUBLIC_DEPLOYMENT}/team/invitations`;
  const rejectUrl = `${process.env.NEXT_PUBLIC_DEPLOYMENT}/team/invitations`;

  return resend.emails.send({
    from: "TuApp <invitations@tu-dominio.com>",
    to,
    subject: `Te invitaron a unirte a ${storeName}`,
    html: `
      <div style="font-family:sans-serif">
        <h2>Te invitaron a colaborar</h2>
        <p>Te invitaron a la tienda <b>${storeName}</b> como <b>${role}</b>.</p>
        <p>
          <a href="${acceptUrl}" style="display:inline-block;padding:10px 16px;background:#111;color:#fff;text-decoration:none;border-radius:8px">
            Ver invitación
          </a>
        </p>
        <p>Luego podrás aceptar o rechazarla desde la app.</p>
      </div>
    `,
  });
}
