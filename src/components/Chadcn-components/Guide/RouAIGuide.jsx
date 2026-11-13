"use client";

import Image from "next/image";
import { useContext, useEffect, useRef, useState } from "react";
import {
  ArrowUp,
  ArrowLeft,
  ArrowUpRight,
  Check,
  CircleAlert,
  Clock3,
  Copy,
  ExternalLink,
  Globe,
  House,
  LoaderCircle,
  MessageSquareText,
  Plus,
  Search,
  ShieldCheck,
  Square,
  Trash2,
} from "lucide-react";
import { ThemeContext } from "@/context/useContext";
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
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupTextarea,
} from "@/components/ui/input-group";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Bubble, BubbleContent } from "@/components/ui/bubble";
import {
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemMedia,
  ItemTitle,
} from "@/components/ui/item";
import {
  Message,
  MessageAvatar,
  MessageContent,
  MessageFooter,
} from "@/components/ui/message";
import {
  MessageScroller,
  MessageScrollerButton,
  MessageScrollerContent,
  MessageScrollerItem,
  MessageScrollerProvider,
  MessageScrollerViewport,
} from "@/components/ui/message-scroller";
import {
  Trace,
  TraceCollapsible,
  TraceCollapsibleContent,
  TraceCollapsibleTrigger,
  TraceIcon,
  TraceLine,
  TraceTitle,
} from "@/components/ui/trace";
import Link from "next/link";

const ACTION_LABELS = {
  create_category: "Crear categoría",
  update_category: "Editar categoría",
  create_product: "Crear producto",
  update_product: "Editar producto",
  update_store: "Actualizar información del negocio",
  create_blog_post: "Crear post para el blog",
  update_blog_post: "Cambiar imagen del post",
};

const ACTION_FIELD_LABELS = {
  name: "Nombre",
  description: "Descripción",
  categoryId: "Categoría",
  productId: "Producto",
  title: "Producto",
  price: "Precio",
  stock: "Cantidad inicial",
  available: "Disponibilidad",
  imageUrl: "Imagen",
  bannerUrl: "Banner",
  posterUrl: "Póster de portada",
  blogId: "Publicación",
  parrrafo: "Mensaje de bienvenida",
  history: "Historia",
  cell: "Teléfono",
  email: "Correo",
  direccion: "Dirección",
  slug: "URL del post",
  abstract: "Extracto",
};

function flattenActionFields(value, prefix = "") {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    return Object.entries(value).flatMap(([key, nestedValue]) =>
      flattenActionFields(nestedValue, prefix ? `${prefix}.${key}` : key),
    );
  }
  return prefix ? [[prefix.split(".").at(-1), value]] : [];
}

function getActionFieldLabel(key, action) {
  if (action === "create_blog_post" && key === "title") return "Título";
  return (
    ACTION_FIELD_LABELS[key] ??
    key
      .replace(/([a-z])([A-Z])/g, "$1 $2")
      .replace(/^./, (letter) => letter.toUpperCase())
  );
}

function getExternalUrlLabel(value) {
  try {
    const url = new URL(value);
    return ["http:", "https:"].includes(url.protocol) &&
      !url.username &&
      !url.password
      ? url.hostname
      : "Abrir enlace";
  } catch {
    return "Abrir enlace";
  }
}

function getSafeExternalUrl(value) {
  try {
    const url = new URL(value);
    return ["http:", "https:"].includes(url.protocol) &&
      !url.username &&
      !url.password
      ? url.href
      : null;
  } catch {
    return null;
  }
}

function getStarterQuestions(pathname) {
  if (pathname.startsWith("/products") || pathname === "/newProduct") {
    return [
      "¿Cómo puedo crear o editar un producto?",
      "¿Cómo se configuran sus variantes?",
      "¿Qué opciones controlan su visibilidad?",
    ];
  }
  if (pathname.startsWith("/category")) {
    return [
      "¿Cómo organizo las categorías?",
      "¿Cómo edito una categoría?",
      "¿Qué opciones de visualización tengo?",
    ];
  }
  if (pathname.startsWith("/orders")) {
    return [
      "¿Cómo reviso el estado de un pedido?",
      "¿Qué acciones puedo hacer con un pedido?",
      "¿Cómo comparto el detalle con el cliente?",
    ];
  }
  if (pathname === "/configuracion" || pathname.startsWith("/configuracion/")) {
    return [
      "¿Qué puedo configurar en esta sección?",
      "¿Cómo actualizo la información del negocio?",
      "¿Dónde configuro las opciones de entrega?",
    ];
  }
  return [
    "¿Cómo funciona esta sección?",
    "¿Cómo puedo crear un producto?",
    "¿Qué herramientas tengo disponibles?",
  ];
}

function safeHref(href) {
  if (href === "https://wa.me/5352489105") return href;
  if (!href.startsWith("/") || href.startsWith("//") || href.includes("\\")) {
    return null;
  }
  const path = href.split(/[?#]/)[0];
  const knownRoutes = new Set([
    "/",
    "/products",
    "/newProduct",
    "/category",
    "/blog",
    "/blog/new",
    "/orders",
    "/ventas",
    "/analytics",
    "/codeDiscount",
    "/configuracion",
    "/configuracion/domicilios",
    "/theme",
    "/social",
    "/planes",
    "/team",
    "/premium-clientes",
    "/notifications",
    "/guia",
  ]);
  if (knownRoutes.has(path)) return href;
  return /^\/(products|category)\/[^/]+$/.test(path) ||
    /^\/blog\/[^/]+\/edit$/.test(path) ||
    /^\/orders\/[^/]+$/.test(path)
    ? href
    : null;
}

function renderInline(text) {
  const expression =
    /(\[([^\]]+)\]\((https?:\/\/[^\s)]+|\/[^\s)]+)\)|\*\*(.+?)\*\*|`([^`]+)`)/g;
  const parts = [];
  let lastIndex = 0;
  let match;

  while ((match = expression.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(text.slice(lastIndex, match.index));
    }

    if (match[2] && match[3]) {
      const href = safeHref(match[3]);
      parts.push(
        href ? (
          <a
            key={`link-${match.index}`}
            href={href}
            target={href.startsWith("http") ? "_blank" : undefined}
            rel={href.startsWith("http") ? "noreferrer" : undefined}
            className="font-medium text-primary underline underline-offset-4"
          >
            {match[2]}
          </a>
        ) : (
          match[2]
        ),
      );
    } else if (match[4]) {
      parts.push(<strong key={`bold-${match.index}`}>{match[4]}</strong>);
    } else if (match[5]) {
      parts.push(
        <code
          key={`code-${match.index}`}
          className="rounded bg-muted px-1 py-0.5 font-mono text-[0.9em]"
        >
          {match[5]}
        </code>,
      );
    }
    lastIndex = expression.lastIndex;
  }
  if (lastIndex < text.length) parts.push(text.slice(lastIndex));
  return parts;
}

function renderMarkdown(content) {
  const lines = content.split(/\r?\n/);
  const blocks = [];
  let index = 0;

  while (index < lines.length) {
    const line = lines[index].trim();
    if (!line) {
      index += 1;
      continue;
    }

    const heading = /^(#{1,3})\s+(.+)$/.exec(line);
    if (heading) {
      const Heading = heading[1].length === 1 ? "h2" : "h3";
      blocks.push(
        <Heading
          key={`heading-${index}`}
          className="mb-1 mt-3 font-semibold first:mt-0"
        >
          {renderInline(heading[2])}
        </Heading>,
      );
      index += 1;
      continue;
    }

    const unordered = /^[-*]\s+(.+)$/.exec(line);
    const ordered = /^\d+[.)]\s+(.+)$/.exec(line);
    if (unordered || ordered) {
      const isOrdered = Boolean(ordered);
      const items = [];
      while (index < lines.length) {
        const itemMatch = isOrdered
          ? /^\d+[.)]\s+(.+)$/.exec(lines[index].trim())
          : /^[-*]\s+(.+)$/.exec(lines[index].trim());
        if (!itemMatch) break;
        items.push(
          <li key={`list-${index}`} className="pl-1">
            {renderInline(itemMatch[1])}
          </li>,
        );
        index += 1;
      }
      const List = isOrdered ? "ol" : "ul";
      blocks.push(
        <List
          key={`list-block-${index}`}
          className={`my-2 space-y-1 pl-5 ${isOrdered ? "list-decimal" : "list-disc"}`}
        >
          {items}
        </List>,
      );
      continue;
    }

    const paragraph = [line];
    index += 1;
    while (
      index < lines.length &&
      lines[index].trim() &&
      !/^(#{1,3})\s+/.test(lines[index].trim()) &&
      !/^[-*]\s+/.test(lines[index].trim()) &&
      !/^\d+[.)]\s+/.test(lines[index].trim())
    ) {
      paragraph.push(lines[index].trim());
      index += 1;
    }
    blocks.push(
      <p key={`paragraph-${index}`} className="my-2 first:mt-0 last:mb-0">
        {renderInline(paragraph.join(" "))}
      </p>,
    );
  }

  return blocks;
}

export default function RouAIGuide({
  initialPath = "/",
  advancedEnabled = false,
}) {
  const { webshop, setWebshop } = useContext(ThemeContext);
  const [conversations, setConversations] = useState([]);
  const [activeConversationId, setActiveConversationId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [conversationQuery, setConversationQuery] = useState("");
  const [copiedMessageId, setCopiedMessageId] = useState(null);
  const [isSending, setIsSending] = useState(false);
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);
  const [isLoadingConversation, setIsLoadingConversation] = useState(false);
  const [isHistoryVisible, setIsHistoryVisible] = useState(false);
  const [chatToDelete, setChatToDelete] = useState(null);
  const [error, setError] = useState("");
  const [supportDraft, setSupportDraft] = useState("");
  const [actionInProgress, setActionInProgress] = useState(null);
  const [actionErrors, setActionErrors] = useState({});
  const textareaRef = useRef(null);
  const requestRef = useRef(null);
  const currentStore = webshop?.store;
  const storeRole = webshop?.store_role;

  function applyActionResult(action, entity) {
    setWebshop((current) => {
      if (action === "create_category") {
        const categories =
          current?.store?.categoria?.length > 0
            ? current.store.categoria
            : (current?.store?.categorias ?? []);
        return {
          ...current,
          store: {
            ...current?.store,
            categoria: [...categories, entity],
            categorias: [...categories, entity],
          },
        };
      }
      if (action === "update_category") {
        const categories =
          current?.store?.categoria?.length > 0
            ? current.store.categoria
            : (current?.store?.categorias ?? []);
        return {
          ...current,
          store: {
            ...current?.store,
            categoria: categories.map((category) =>
              category.id === entity?.id
                ? { ...category, ...entity }
                : category,
            ),
            categorias: categories.map((category) =>
              category.id === entity?.id
                ? { ...category, ...entity }
                : category,
            ),
          },
        };
      }
      if (action === "create_product") {
        const product = {
          ...entity,
          product_variants: entity?.variants ?? [],
          variants: entity?.variants ?? [],
        };
        return {
          ...current,
          products: [...(current?.products ?? []), product],
        };
      }
      if (action === "update_product") {
        return {
          ...current,
          products: (current?.products ?? []).map((product) => {
            if (product.productId !== entity?.productId) return product;
            const variants = (
              product.variants ??
              product.product_variants ??
              []
            ).map((variant) =>
              variant.id === entity?.variantId
                ? { ...variant, image: entity.image }
                : variant,
            );
            return {
              ...product,
              ...entity,
              variants,
              product_variants: variants,
            };
          }),
        };
      }
      if (action === "update_store") {
        return {
          ...current,
          store: { ...current?.store, ...entity },
        };
      }
      if (action === "create_blog_post") {
        return {
          ...current,
          store: {
            ...current?.store,
            blogs: [...(current?.store?.blogs ?? []), entity],
          },
        };
      }
      if (action === "update_blog_post") {
        return {
          ...current,
          store: {
            ...current?.store,
            blogs: (current?.store?.blogs ?? []).map((post) =>
              String(post.id) === String(entity?.id)
                ? { ...post, ...entity }
                : post,
            ),
          },
        };
      }
      return current;
    });
  }

  function prepareSupportReport() {
    const report = [
      "Reporte técnico preparado desde RouAI Guide",
      `Fecha: ${new Date().toISOString()}`,
      `Página: ${initialPath}`,
      `Problema: ${error || "RouAI Guide no pudo completar la solicitud."}`,
      "No se incluyen mensajes del chat, credenciales ni datos de clientes.",
    ].join("\n");
    setSupportDraft(report);
  }

  async function confirmActionProposal(message) {
    const proposal = message.metadata;
    if (
      proposal?.type !== "action_proposal" ||
      proposal.status !== "pending" ||
      actionInProgress
    ) {
      return;
    }

    setActionInProgress(message.id);
    setActionErrors((current) => ({ ...current, [message.id]: "" }));
    try {
      const response = await fetch("/api/rouai-guide/actions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: proposal.action,
          payload: proposal.payload,
          requestKey: proposal.requestKey,
          messageId: message.id,
          confirmed: true,
        }),
      });
      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || "No se pudo completar la operación.");
      }

      applyActionResult(proposal.action, result.entity);
      setMessages((items) =>
        items.map((item) =>
          item.id === message.id
            ? {
                ...item,
                metadata: {
                  ...item.metadata,
                  status: "completed",
                  executionResult: result.entity ?? null,
                },
              }
            : item,
        ),
      );
      setActionErrors((current) => ({ ...current, [message.id]: "" }));
      try {
        await refreshConversations();
      } catch (historyError) {
        console.error(
          "RouAI Guide action succeeded but history could not be refreshed:",
          historyError,
        );
        setActionErrors((current) => ({
          ...current,
          [message.id]:
            "La operación se aplicó, pero no se pudo actualizar la lista de chats.",
        }));
      }
    } catch (actionError) {
      console.error("RouAI Guide chat action failed:", actionError);
      setActionErrors((current) => ({
        ...current,
        [message.id]:
          actionError.message || "No se pudo completar la operación.",
      }));
    } finally {
      setActionInProgress(null);
    }
  }

  function renderActionProposal(message) {
    const proposal = message.metadata;
    if (proposal?.type !== "action_proposal") return null;
    const fields = proposal.payload?.fields ?? proposal.payload ?? {};
    const displayFields = { ...fields };
    delete displayFields.info_sections;
    if (proposal.action === "create_blog_post") {
      delete displayFields.content;
    }
    if (proposal.action === "create_product") {
      delete displayFields.description;
    }
    const entries = flattenActionFields(displayFields).filter(
      ([key, value]) => key !== "requestKey" && value !== "" && value != null,
    );
    const productInfoSections =
      proposal.action === "create_product" &&
      Array.isArray(proposal.payload?.info_sections)
        ? proposal.payload.info_sections
        : [];
    const completed = proposal.status === "completed";
    const failed = proposal.status === "failed";
    const pending = !completed && !failed;
    const savedPost = proposal.executionResult;

    return (
      <Card className="mt-4 gap-3 py-4 shadow-sm">
        <CardHeader className="px-4">
          <CardTitle className="text-sm">
            {ACTION_LABELS[proposal.action] ?? "Acción propuesta"}
          </CardTitle>
          <CardDescription className="text-xs">
            {completed
              ? proposal.action === "create_blog_post"
                ? "Post publicado"
                : "Operación aplicada"
              : failed
                ? "La operación no se completó"
                : proposal.action === "create_blog_post"
                  ? "Revisa esta propuesta antes de publicarla"
                  : "Revisa este borrador antes de aplicarlo"}
          </CardDescription>
          <CardAction>
            {completed && (
              <Badge className="gap-1 bg-emerald-500/10 text-emerald-700 hover:bg-emerald-500/10 dark:text-emerald-300">
                <Check aria-hidden="true" size={12} />
                Confirmado
              </Badge>
            )}
            {failed && <Badge variant="destructive">Fallida</Badge>}
            {pending && <Badge variant="secondary">Pendiente</Badge>}
          </CardAction>
        </CardHeader>

        <CardContent className="space-y-3 px-4">
          <p className="text-xs text-muted-foreground">
            Esto es lo que se propone hacer:
          </p>
          <dl className="space-y-2 rounded-lg bg-muted/40 p-3 text-sm">
            {entries.map(([key, value]) => (
              <div
                key={key}
                className="grid grid-cols-[minmax(6rem,0.8fr)_minmax(0,1.2fr)] gap-3"
              >
                <dt className="text-xs text-muted-foreground">
                  {key === "title" && proposal.presentation?.originalTitle
                    ? "Nombre propuesto"
                    : getActionFieldLabel(key, proposal.action)}
                </dt>
                <dd className="wrap-break-word text-xs font-medium">
                  {key === "categoryId" ? (
                    (currentStore?.categoria?.find(
                      (category) => String(category.id) === String(value),
                    )?.name ??
                    currentStore?.categorias?.find(
                      (category) => String(category.id) === String(value),
                    )?.name ??
                    "Seleccionada del catálogo")
                  ) : key === "productId" ? (
                    (webshop?.products?.find(
                      (product) => String(product.productId) === String(value),
                    )?.title ?? "Producto del catálogo")
                  ) : key === "available" ? (
                    value ? (
                      "Disponible para la venta"
                    ) : (
                      "No disponible para la venta"
                    )
                  ) : key === "imageUrl" ? (
                    <a
                      href={getSafeExternalUrl(value) ?? undefined}
                      target="_blank"
                      rel="noreferrer"
                      referrerPolicy="no-referrer"
                      className="inline-flex items-center gap-1 text-primary underline underline-offset-2"
                    >
                      {getExternalUrlLabel(value)}
                      <ExternalLink aria-hidden="true" size={12} />
                    </a>
                  ) : Array.isArray(value) ? (
                    value.map(String).join(", ")
                  ) : typeof value === "boolean" ? (
                    value ? (
                      "Sí"
                    ) : (
                      "No"
                    )
                  ) : (
                    String(value)
                  )}
                </dd>
              </div>
            ))}
          </dl>

          {productInfoSections.length > 0 && (
            <section
              aria-label="Información que se agregará a la ficha del producto"
              className="rounded-lg border bg-background p-3"
            >
              <p className="text-xs font-semibold">
                Información que se guardará en la ficha
              </p>
              <div className="mt-2 space-y-3">
                {productInfoSections.map((section) => (
                  <div key={section.id}>
                    <p className="text-xs font-medium">{section.label}</p>
                    <p className="mt-1 whitespace-pre-wrap wrap-break-word text-xs text-muted-foreground">
                      {section.content}
                    </p>
                  </div>
                ))}
              </div>
            </section>
          )}

          {proposal.action === "create_blog_post" && (
            <section
              aria-label="Vista previa del contenido del post"
              className="rounded-lg border bg-background p-3"
            >
              <p className="text-xs font-semibold">
                Vista previa del contenido
              </p>
              <p className="mt-2 line-clamp-6 whitespace-pre-wrap wrap-break-word text-xs text-muted-foreground">
                {proposal.payload?.content}
              </p>
            </section>
          )}

          {proposal.presentation?.originalTitle && (
            <div className="rounded-lg border border-primary/20 bg-primary/5 p-3 text-xs">
              <p className="font-medium">Revisión de escritura</p>
              <p className="mt-1 text-muted-foreground">
                Escribiste:{" "}
                <span className="font-medium text-foreground">
                  {proposal.presentation.originalTitle}
                </span>
              </p>
              {proposal.presentation.spellingNote && (
                <p className="mt-1 text-muted-foreground">
                  {proposal.presentation.spellingNote}
                </p>
              )}
            </div>
          )}

          {pending && (
            <div className="space-y-2 text-xs text-muted-foreground">
              {proposal.action === "create_blog_post" && (
                <p>
                  Al confirmar, este post se publicará. Revisa el contenido y
                  los datos antes de continuar.
                </p>
              )}
              {proposal.payload?.imageUrl && (
                <p>
                  La imagen se cargará a RouMenu solo cuando confirmes el
                  cambio.
                </p>
              )}
              {(proposal.payload?.fields?.bannerUrl ||
                proposal.payload?.fields?.posterUrl) && (
                <p>
                  La imagen de la tienda se cargará solo cuando confirmes el
                  cambio.
                </p>
              )}
              <p>
                Si algún dato no es correcto, no confirmes todavía: puedes
                explicarme qué necesitas ajustar aquí mismo en el chat.
              </p>
            </div>
          )}

          {actionErrors[message.id] && (
            <p role="alert" className="text-xs text-destructive">
              {actionErrors[message.id]}
            </p>
          )}
          {failed && proposal.executionError && (
            <p role="alert" className="text-xs text-destructive">
              {proposal.executionError} Verifica el módulo antes de volver a
              solicitar esta operación.
            </p>
          )}
        </CardContent>

        {pending && (
          <CardFooter className="border-t px-4 pt-3">
            <Item variant="outline" size="sm" className="w-full bg-muted/30">
              <ItemMedia variant="icon">
                <ShieldCheck aria-hidden="true" />
              </ItemMedia>
              <ItemContent>
                <ItemTitle>¿Aplicar este cambio?</ItemTitle>
                <ItemDescription>
                  Solo se ejecuta al confirmar. RouAI volverá a validar tus
                  permisos y que los datos pertenezcan a este negocio.
                </ItemDescription>
              </ItemContent>
              <ItemActions>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  disabled={actionInProgress !== null}
                  onClick={() => textareaRef.current?.focus()}
                >
                  Ajustar
                </Button>
                <Button
                  type="button"
                  size="sm"
                  disabled={actionInProgress !== null}
                  onClick={() => confirmActionProposal(message)}
                >
                  {actionInProgress === message.id ? (
                    <>
                      <LoaderCircle
                        aria-hidden="true"
                        size={14}
                        className="animate-spin"
                      />
                      Aplicando…
                    </>
                  ) : (
                    "Confirmar y aplicar"
                  )}
                </Button>
              </ItemActions>
            </Item>
          </CardFooter>
        )}

        {!pending && (
          <CardFooter className="flex-wrap items-center gap-3 border-t px-4 pt-3">
            <Trace className="min-w-0 flex-1">
              <TraceLine>
                <TraceIcon>
                  {completed ? (
                    <Check aria-hidden="true" />
                  ) : (
                    <CircleAlert aria-hidden="true" />
                  )}
                </TraceIcon>
                <TraceTitle>
                  {completed
                    ? "Operación aplicada"
                    : "La operación no se completó"}
                </TraceTitle>
              </TraceLine>
            </Trace>
            {/* Corregido: antes estaba dentro del <Button> y de !completed, nunca se veía */}
            {completed &&
              proposal.action === "create_blog_post" &&
              savedPost?.id && (
                <Button asChild size="sm" variant="outline">
                  <Link href={`/blog/${encodeURIComponent(savedPost.id)}/edit`}>
                    Revisar en el editor del blog
                    <ExternalLink aria-hidden="true" size={13} />
                  </Link>
                </Button>
              )}
          </CardFooter>
        )}
      </Card>
    );
  }

  function renderResearchSources(message) {
    const sources = message.metadata?.sources;
    if (!Array.isArray(sources) || sources.length === 0) return null;
    const safeSources = sources
      .map((source) => ({ source, href: getSafeExternalUrl(source.url) }))
      .filter((item) => item.href);
    if (safeSources.length === 0) return null;

    return (
      <Trace className="mt-1">
        <TraceCollapsible>
          <TraceCollapsibleTrigger>
            <TraceLine>
              <TraceIcon>
                <Globe aria-hidden="true" />
              </TraceIcon>
              <TraceTitle>
                Usó {safeSources.length}{" "}
                {safeSources.length === 1 ? "fuente" : "fuentes"}
              </TraceTitle>
            </TraceLine>
          </TraceCollapsibleTrigger>
          <TraceCollapsibleContent>
            <Trace>
              {safeSources.map(({ source, href }) => (
                <a
                  key={href}
                  href={href}
                  target="_blank"
                  rel="noreferrer"
                  referrerPolicy="no-referrer"
                >
                  <TraceLine>
                    <TraceIcon>
                      <Globe aria-hidden="true" />
                    </TraceIcon>
                    <TraceTitle>
                      {source.title || getExternalUrlLabel(href)}
                      <span className="sr-only">
                        {" "}
                        (se abre en una pestaña nueva)
                      </span>
                    </TraceTitle>
                    <TraceIcon>
                      <ArrowUpRight aria-hidden="true" />
                    </TraceIcon>
                  </TraceLine>
                </a>
              ))}
            </Trace>
          </TraceCollapsibleContent>
        </TraceCollapsible>
      </Trace>
    );
  }

  async function refreshConversations(signal) {
    const response = await fetch("/api/rouai-guide/conversations", {
      cache: "no-store",
      signal,
    });
    const result = await response.json();
    if (!response.ok)
      throw new Error(result.error || "No se pudo cargar el historial.");
    setConversations(result.conversations ?? []);
    return result.conversations ?? [];
  }

  async function loadConversation(conversationId) {
    setIsLoadingConversation(true);
    setError("");
    try {
      const response = await fetch(
        `/api/rouai-guide/conversations/${encodeURIComponent(conversationId)}`,
        { cache: "no-store" },
      );
      const result = await response.json();
      if (!response.ok)
        throw new Error(result.error || "No se pudo abrir el chat.");
      setActiveConversationId(result.conversation.id);
      setMessages(result.messages ?? []);
      setIsHistoryVisible(false);
    } catch (loadError) {
      console.error("RouAI Guide conversation could not be opened:", loadError);
      setError(loadError.message || "No se pudo abrir el chat.");
    } finally {
      setIsLoadingConversation(false);
    }
  }

  useEffect(() => {
    const controller = new AbortController();
    async function initialize() {
      try {
        const available = await refreshConversations(controller.signal);
        if (available.length) await loadConversation(available[0].id);
      } catch (loadError) {
        if (loadError.name === "AbortError") return;
        console.error("RouAI Guide history could not be loaded:", loadError);
        setError(loadError.message || "No se pudo cargar el historial.");
      } finally {
        if (!controller.signal.aborted) setIsLoadingHistory(false);
      }
    }
    initialize();
    return () => controller.abort();
  }, []);

  useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    textarea.style.height = "auto";
    const maxHeight = Number.parseFloat(getComputedStyle(textarea).maxHeight);
    const limit = Number.isFinite(maxHeight) ? maxHeight : 112;
    textarea.style.height = `${Math.min(textarea.scrollHeight, limit)}px`;
    textarea.style.overflowY =
      textarea.scrollHeight > limit ? "auto" : "hidden";
  }, [input]);

  function startNewConversation() {
    requestRef.current?.abort();
    requestRef.current = null;
    setActiveConversationId(null);
    setMessages([]);
    setInput("");
    setError("");
    setIsSending(false);
    setIsHistoryVisible(false);
  }

  async function copyMessage(message) {
    try {
      await navigator.clipboard.writeText(message.content);
      setCopiedMessageId(message.id);
      window.setTimeout(() => setCopiedMessageId(null), 1_500);
    } catch (copyError) {
      console.error("RouAI Guide message could not be copied:", copyError);
      setError("No se pudo copiar la respuesta desde este navegador.");
    }
  }

  // La confirmación ahora la hace <AlertDialog>, ya no window.confirm
  async function deleteConversation(conversationId) {
    setError("");
    try {
      const response = await fetch(
        `/api/rouai-guide/conversations/${encodeURIComponent(conversationId)}`,
        { method: "DELETE" },
      );
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "No se pudo eliminar.");
      setConversations((items) =>
        items.filter((item) => item.id !== conversationId),
      );
      if (activeConversationId === conversationId) startNewConversation();
    } catch (deleteError) {
      console.error(
        "RouAI Guide conversation could not be deleted:",
        deleteError,
      );
      setError(deleteError.message || "No se pudo eliminar el chat.");
    }
  }

  async function sendMessage(event, suggestedContent) {
    event?.preventDefault();
    const content = (suggestedContent ?? input).trim();
    if (!content || isSending || isLoadingHistory || isLoadingConversation)
      return;

    setInput("");
    setError("");
    setMessages((items) => [
      ...items,
      { id: `pending-${Date.now()}`, role: "user", content },
    ]);
    setIsSending(true);

    const controller = new AbortController();
    requestRef.current = controller;
    try {
      const response = await fetch("/api/rouai-guide/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: controller.signal,
        body: JSON.stringify({
          content,
          conversationId: activeConversationId,
          pathname: initialPath,
        }),
      });
      const result = await response.json();
      if (result.conversationId) {
        setActiveConversationId(result.conversationId);
      }
      if (!response.ok) {
        if (result.conversationId) {
          await loadConversation(result.conversationId);
          setError(result.error || "No se pudo completar la respuesta.");
        } else {
          throw new Error(result.error || "No se pudo completar la respuesta.");
        }
        return;
      }

      setMessages((items) => [
        ...items.filter(
          (message) => !String(message.id).startsWith("pending-"),
        ),
        result.userMessage,
        result.message,
      ]);
      await refreshConversations();
    } catch (requestError) {
      if (requestError.name === "AbortError") {
        try {
          const updatedConversations = await refreshConversations();
          const targetId =
            activeConversationId ?? updatedConversations[0]?.id ?? null;
          if (targetId) await loadConversation(targetId);
        } catch (historyError) {
          console.error(
            "RouAI Guide stopped response could not be restored:",
            historyError,
          );
        }
        return;
      }
      console.error("RouAI Guide message request failed:", requestError);
      setMessages((items) =>
        items.filter((message) => !String(message.id).startsWith("pending-")),
      );
      setError(requestError.message || "No se pudo conectar con RouAI Guide.");
    } finally {
      if (requestRef.current === controller) {
        requestRef.current = null;
        setIsSending(false);
      }
    }
  }

  function handleInputKeyDown(event) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      event.currentTarget.form?.requestSubmit();
    }
  }

  const activeConversation = conversations.find(
    (conversation) => conversation.id === activeConversationId,
  );
  const userName = webshop?.user?.name?.trim();
  const starterQuestions = getStarterQuestions(initialPath);
  const filteredConversations = conversations.filter((conversation) =>
    conversation.title
      .toLocaleLowerCase("es")
      .includes(conversationQuery.trim().toLocaleLowerCase("es")),
  );

  // Mismo panel para el aside de escritorio y el Sheet móvil.
  // Sin ids duplicados: el buscador usa aria-label.
  const historyPanel = (
    <>
      <nav
        className="space-y-1 px-3 pb-3 pt-3"
        aria-label="Navegación de RouAdmin"
      >
        <Button
          asChild
          variant="ghost"
          size="sm"
          className="w-full justify-start gap-2 text-xs text-muted-foreground"
        >
          <Link href="/">
            <House aria-hidden="true" size={15} />
            Inicio de RouAdmin
          </Link>
        </Button>
        <Button
          asChild
          variant="ghost"
          size="sm"
          className="w-full justify-start gap-2 text-xs text-muted-foreground"
        >
          <Link href={initialPath}>
            <ArrowLeft aria-hidden="true" size={15} />
            Volver a la página anterior
          </Link>
        </Button>
      </nav>

      <div className="px-3">
        <Button
          variant="outline"
          className="h-10 w-full justify-start gap-2 rounded-xl bg-background"
          onClick={startNewConversation}
          disabled={isSending}
        >
          <Plus aria-hidden="true" size={17} />
          Nuevo chat
        </Button>
      </div>

      <div className="px-3 pb-3 pt-4">
        <InputGroup className="h-9 rounded-xl bg-background">
          <InputGroupAddon>
            <Search aria-hidden="true" size={15} />
          </InputGroupAddon>
          <input
            type="search"
            aria-label="Buscar en chats"
            value={conversationQuery}
            onChange={(event) => setConversationQuery(event.target.value)}
            placeholder="Buscar chat"
            className="h-full min-w-0 flex-1 bg-transparent pr-3 text-xs outline-none placeholder:text-muted-foreground"
          />
        </InputGroup>
      </div>

      <nav
        className="min-h-0 flex-1 overflow-y-auto px-2 pb-3"
        aria-label="Chats"
      >
        <div className="flex items-center justify-between px-2 pb-2 pt-1">
          <h2 className="text-xs font-semibold text-muted-foreground">Chats</h2>
          <Badge variant="secondary" className="text-[10px]">
            {conversations.length}/50
          </Badge>
        </div>
        {isLoadingHistory ? (
          <p className="px-2 py-3 text-xs text-muted-foreground">
            Cargando historial…
          </p>
        ) : filteredConversations.length === 0 ? (
          <p className="px-2 py-3 text-xs leading-relaxed text-muted-foreground">
            {conversations.length
              ? "No hay chats con ese nombre."
              : "Tus chats guardados aparecerán aquí."}
          </p>
        ) : (
          <div className="space-y-1">
            {filteredConversations.map((conversation) => (
              <div
                key={conversation.id}
                className={`group flex items-center gap-1 rounded-xl ${
                  conversation.id === activeConversationId
                    ? "bg-primary/10 text-primary"
                    : "text-foreground hover:bg-muted"
                }`}
              >
                <button
                  type="button"
                  disabled={isSending}
                  onClick={() => loadConversation(conversation.id)}
                  aria-current={
                    conversation.id === activeConversationId
                      ? "true"
                      : undefined
                  }
                  className="flex min-w-0 flex-1 items-center gap-2.5 px-3 py-2.5 text-left disabled:opacity-50"
                >
                  <MessageSquareText
                    aria-hidden="true"
                    size={15}
                    className="shrink-0 opacity-70"
                  />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-xs font-medium">
                      {conversation.title}
                    </span>
                    <span className="mt-1 flex items-center gap-1 text-[10px] text-muted-foreground">
                      <Clock3 aria-hidden="true" size={10} />
                      {new Date(conversation.updated_at).toLocaleDateString(
                        "es",
                      )}
                    </span>
                  </span>
                </button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  aria-label={`Eliminar chat: ${conversation.title}`}
                  title="Eliminar chat"
                  disabled={isSending}
                  onClick={() => setChatToDelete(conversation)}
                  className="mr-1 size-8 text-muted-foreground opacity-100 hover:bg-destructive/10 hover:text-destructive md:opacity-0 md:group-hover:opacity-100 md:group-focus-within:opacity-100"
                >
                  <Trash2 aria-hidden="true" size={13} />
                </Button>
              </div>
            ))}
          </div>
        )}
      </nav>

      <div className="border-t p-3">
        <Link
          href="/configuracion"
          className="flex items-center gap-3 rounded-xl p-2 transition hover:bg-muted"
        >
          <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground">
            {(userName?.[0] ?? "U").toLocaleUpperCase("es")}
          </span>
          <span className="min-w-0 flex-1">
            <span className="block truncate text-xs font-semibold">
              {userName || "Usuario"}
            </span>
            <span className="block truncate text-[11px] text-muted-foreground">
              {currentStore?.name ?? "Negocio"} · {storeRole ?? "Equipo"}
            </span>
          </span>
          <ShieldCheck
            aria-label="Sesión protegida"
            size={15}
            className="shrink-0 text-muted-foreground"
          />
        </Link>
      </div>
    </>
  );

  return (
    <div className="flex h-[calc(100dvh-3.5rem)] min-h-0 w-full overflow-hidden bg-background">
      {/* Escritorio */}
      <aside className="hidden w-48 shrink-0 flex-col border-r bg-muted/30 md:flex">
        {historyPanel}
      </aside>

      {/* Móvil */}
      <Sheet open={isHistoryVisible} onOpenChange={setIsHistoryVisible}>
        <SheetContent
          side="left"
          className="flex w-[85vw] max-w-xs flex-col gap-0 bg-muted/30 p-0 md:hidden"
        >
          <SheetHeader className="sr-only">
            <SheetTitle>Chats</SheetTitle>
            <SheetDescription>Historial de conversaciones</SheetDescription>
          </SheetHeader>
          {historyPanel}
        </SheetContent>
      </Sheet>

      <section
        className="flex min-w-0 flex-1 flex-col bg-background"
        aria-labelledby="rouai-title"
      >
        <header className="flex min-h-17 items-center justify-between border-b px-4 sm:px-7">
          <div className="flex min-w-0 items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              aria-label="Ver chats"
              onClick={() => setIsHistoryVisible(true)}
            >
              <MessageSquareText aria-hidden="true" size={18} />
            </Button>
            <Image
              src="/rouai-guide.svg"
              alt=""
              width={36}
              height={36}
              className="hidden size-9 rounded-full bg-primary/10 p-0.5 sm:block"
            />
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h1 id="rouai-title" className="truncate text-sm font-semibold">
                  RouAI Guide
                </h1>
                <span
                  className="size-2 rounded-full bg-emerald-500"
                  aria-label="En línea"
                />
                <Badge
                  variant="secondary"
                  className="hidden text-[10px] sm:inline-flex"
                >
                  {advancedEnabled ? "Anual · avanzado" : "Pro · informativo"}
                </Badge>
              </div>
              <p className="truncate text-xs text-muted-foreground">
                {activeConversation?.title ?? "Tu asistente de RouAdmin"}
              </p>
            </div>
          </div>
          {activeConversationId && (
            <span className="hidden items-center gap-1.5 text-xs text-muted-foreground sm:flex">
              <ShieldCheck aria-hidden="true" size={14} />
              Guardado en tu cuenta
            </span>
          )}
        </header>

        {isLoadingConversation ? (
          <div className="flex min-h-0 flex-1 items-center justify-center gap-2 text-sm text-muted-foreground">
            <LoaderCircle
              aria-hidden="true"
              className="animate-spin"
              size={18}
            />
            Cargando chat...
          </div>
        ) : messages.length === 0 ? (
          <div className="min-h-0 flex-1 overflow-y-auto">
            <Empty className="mx-auto min-h-full max-w-3xl px-5 py-10 sm:px-8">
              <EmptyHeader>
                <EmptyMedia
                  variant="icon"
                  className="size-12 rounded-2xl bg-primary/10"
                >
                  <Image
                    src="/rouai-guide.svg"
                    alt=""
                    width={40}
                    height={40}
                    className="size-10"
                  />
                </EmptyMedia>
                <EmptyTitle className="text-lg">
                  ¡Hola! Soy RouAI, tu asistente de RouAdmin.
                </EmptyTitle>
                <EmptyDescription>
                  Estoy aquí para ayudarte a conocer y aprovechar las
                  funcionalidades del sistema. Te responderé según la sección
                  actual, tu rol y la guía disponible. Si quieres crear o editar
                  información, pídemelo en el chat:{" "}
                  {advancedEnabled
                    ? "prepararé un borrador y podrás confirmarlo antes de aplicarlo."
                    : "puedo explicarte cómo hacerlo; los cambios y la búsqueda web requieren el plan Anual."}
                </EmptyDescription>
              </EmptyHeader>
            </Empty>
          </div>
        ) : (
          <MessageScrollerProvider
            autoScroll
            defaultScrollPosition="last-anchor"
            scrollPreviousItemPeek={32}
          >
            <MessageScroller className="min-h-0 flex-1">
              <MessageScrollerViewport className="px-4 py-6 sm:px-8">
                <MessageScrollerContent
                  className="mx-auto w-full max-w-3xl gap-6"
                  role="log"
                  aria-label="Conversación con RouAI"
                >
                  {messages.map((message, index) => {
                    const isUser = message.role === "user";
                    const itemId = String(
                      message.id ?? `${message.role}-${index}`,
                    );
                    return (
                      <MessageScrollerItem
                        key={itemId}
                        messageId={itemId}
                        scrollAnchor={isUser}
                      >
                        {isUser ? (
                          <Message align="end">
                            <MessageContent className="max-w-[85%]">
                              <Bubble align="end" variant="muted">
                                <BubbleContent>
                                  <p className="whitespace-pre-wrap wrap-break-word">
                                    {message.content}
                                  </p>
                                </BubbleContent>
                              </Bubble>
                            </MessageContent>
                          </Message>
                        ) : (
                          <Message>
                            <MessageAvatar>
                              <Image
                                src="/rouai-guide.svg"
                                alt=""
                                width={32}
                                height={32}
                                className="size-8 rounded-full bg-primary/10 p-0.5"
                              />
                            </MessageAvatar>
                            <MessageContent className="min-w-0 gap-2">
                              <div className="text-sm leading-relaxed">
                                {renderMarkdown(message.content)}
                              </div>
                              {renderActionProposal(message)}
                              {renderResearchSources(message)}
                              <MessageFooter className="gap-0.5">
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon-sm"
                                  aria-label={
                                    copiedMessageId === message.id
                                      ? "Respuesta copiada"
                                      : "Copiar respuesta"
                                  }
                                  title="Copiar respuesta"
                                  onClick={() => copyMessage(message)}
                                  className="text-muted-foreground"
                                >
                                  {copiedMessageId === message.id ? (
                                    <Check aria-hidden="true" />
                                  ) : (
                                    <Copy aria-hidden="true" />
                                  )}
                                </Button>
                              </MessageFooter>
                            </MessageContent>
                          </Message>
                        )}
                      </MessageScrollerItem>
                    );
                  })}
                  {isSending && (
                    <MessageScrollerItem messageId="rouai-progress">
                      <Message>
                        <MessageAvatar>
                          <Image
                            src="/rouai-guide.svg"
                            alt=""
                            width={32}
                            height={32}
                            className="size-8 rounded-full bg-primary/10 p-0.5"
                          />
                        </MessageAvatar>
                        <MessageContent>
                          <Trace role="status">
                            <TraceLine>
                              <TraceIcon>
                                <LoaderCircle
                                  aria-hidden="true"
                                  className="animate-spin"
                                />
                              </TraceIcon>
                              <TraceTitle>
                                RouAI está preparando una respuesta…
                              </TraceTitle>
                            </TraceLine>
                          </Trace>
                        </MessageContent>
                      </Message>
                    </MessageScrollerItem>
                  )}
                </MessageScrollerContent>
              </MessageScrollerViewport>
              <MessageScrollerButton />
            </MessageScroller>
          </MessageScrollerProvider>
        )}

        {error && (
          <div className="mx-auto mb-2 w-full max-w-3xl px-3 sm:px-8">
            <div className="rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
              <p role="alert">{error}</p>
              <div className="mt-2 flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={prepareSupportReport}
                  className="text-xs font-medium underline underline-offset-2"
                >
                  Preparar reporte para soporte
                </button>
                {supportDraft && (
                  <a
                    href={`https://wa.me/5352489105?text=${encodeURIComponent(supportDraft)}`}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs font-medium underline underline-offset-2"
                  >
                    Revisar y abrir WhatsApp
                  </a>
                )}
              </div>
              {supportDraft && (
                <label className="mt-3 block space-y-1">
                  <span className="text-xs font-medium">
                    Revisa o modifica el reporte antes de abrir WhatsApp
                  </span>
                  <textarea
                    value={supportDraft}
                    onChange={(event) => setSupportDraft(event.target.value)}
                    rows={5}
                    maxLength={2_000}
                    className="w-full rounded-md border border-destructive/20 bg-background p-2 text-xs text-foreground"
                  />
                </label>
              )}
            </div>
          </div>
        )}

        <div className="mx-auto w-full max-w-3xl px-3 pb-1 pt-3 sm:px-8">
          {messages.length === 0 && !isLoadingConversation && (
            <div className="mb-2 flex scroll-fade-x gap-2 overflow-x-auto overscroll-x-contain scrollbar-none [&::-webkit-scrollbar]:hidden">
              {starterQuestions.map((question) => (
                <Button
                  key={question}
                  type="button"
                  variant="outline"
                  size="sm"
                  className="shrink-0 rounded-full"
                  disabled={isSending || isLoadingHistory}
                  onClick={() => sendMessage(null, question)}
                >
                  {question}
                </Button>
              ))}
            </div>
          )}
          <form onSubmit={sendMessage}>
            <label className="sr-only" htmlFor="rouai-guide-input">
              Escribe tu pregunta a RouAI Guide
            </label>
            <InputGroup className="rounded-2xl">
              <InputGroupTextarea
                ref={textareaRef}
                id="rouai-guide-input"
                value={input}
                onChange={(event) => setInput(event.target.value)}
                onKeyDown={handleInputKeyDown}
                placeholder="Pregunta sobre RouAdmin…"
                maxLength={2_000}
                rows={1}
                disabled={
                  isSending || isLoadingHistory || isLoadingConversation
                }
                className="max-h-28 min-h-12 p-3 text-sm"
              />
              <InputGroupAddon align="block-end">
                {isSending ? (
                  <InputGroupButton
                    type="button"
                    variant="outline"
                    size="icon-sm"
                    aria-label="Detener respuesta"
                    title="Detener respuesta"
                    onClick={() => requestRef.current?.abort()}
                    className="ml-auto rounded-full"
                  >
                    <Square aria-hidden="true" size={14} />
                  </InputGroupButton>
                ) : (
                  <InputGroupButton
                    type="submit"
                    variant="default"
                    size="icon-sm"
                    aria-label="Enviar mensaje"
                    title="Enviar mensaje"
                    disabled={
                      !input.trim() || isLoadingHistory || isLoadingConversation
                    }
                    className="ml-auto rounded-full"
                  >
                    <ArrowUp aria-hidden="true" size={16} />
                  </InputGroupButton>
                )}
              </InputGroupAddon>
            </InputGroup>
          </form>
        </div>
        <p className="px-4 pb-3 pt-1 text-center text-[11px] leading-relaxed text-muted-foreground">
          Enter para enviar · Shift + Enter para nueva línea · Respuestas
          generadas con Google Gemini. Tus chats son privados de esta cuenta y
          negocio. No compartas contraseñas ni datos de pago.
        </p>
      </section>

      <AlertDialog
        open={chatToDelete !== null}
        onOpenChange={(open) => !open && setChatToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar este chat?</AlertDialogTitle>
            <AlertDialogDescription>
              Se borrarán “{chatToDelete?.title}” y todos sus mensajes. Esta
              acción no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-white hover:bg-destructive/90"
              onClick={() => {
                const id = chatToDelete?.id;
                setChatToDelete(null);
                if (id) deleteConversation(id);
              }}
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
