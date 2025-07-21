// @/app/api/send-notification
import { supabase } from "@/lib/supa";
import { NextResponse } from "next/server";
import webpush from "web-push";

// Configura las claves VAPID
webpush.setVapidDetails(
  "mailto:ronnytoledo87@gmail.com",
  "BHyBOLbCs-3dnefChukgcdAIK_0sKP0GahEYSdd_aiK8XqLw3pUob1HVHk3TvupIvLEgw0TnuNdz1UR8NbcaUP0",
  "P12bwdvBep5H4jpIQd5GKcX9oQoohs5UWs1wApGgRd0"
);

// Manejo del método POST
export async function POST(req) {
  try {
    // Extrae los datos del cuerpo de la solicitud
    const { title, message } = await req.json();
    // Recupera las suscripciones de la tabla `subscriptions`
    const { data: subscriptions, error } = await supabase
      .from("subscriptions")
      .select("subscription");

    if (error) {
      console.error("Error obteniendo suscripciones:", error);
      return NextResponse.json(
        { error: "Error obteniendo suscripciones" },
        { status: 500 }
      );
    }

    // Envía notificaciones a todas las suscripciones
    const notifications = subscriptions.map(({ subscription }) => {
      webpush.sendNotification(
        subscription,
        JSON.stringify({ title, message })
      );
      console.log(title, message);
    });

    // Espera a que todas las notificaciones sean enviadas
    await Promise.all(notifications);

    // Responde con éxito
    return NextResponse.json({ success: true }, { status: 200 });
  } catch (err) {
    console.error("Error enviando notificaciones:", err);
    return NextResponse.json(
      { error: "Error enviando notificaciones" },
      { status: 500 }
    );
  }
}
