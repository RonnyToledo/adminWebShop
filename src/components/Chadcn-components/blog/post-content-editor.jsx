"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Loader2,
  CheckCircle2,
  AlertCircle,
  ArrowLeft,
  Type,
  List,
  ImageIcon,
  LinkIcon,
  Quote,
  Code,
  Save,
  Bold,
  Italic,
  Minus,
  Code2,
} from "lucide-react";
import AutoAwesomeIcon from "@mui/icons-material/AutoAwesome";
import axios from "axios";
import { sileo } from "sileo";
import { IA, newIA } from "./IA";
import { HTMLEditor } from "./html-editor";
import { HTMLPreviewWithLinkPreviews } from "./link-preview";

// ─── Constantes ───────────────────────────────────────────────────────────────

const MAX_IA_USES = 3;

const ALLOWED_TAGS = [
  "h1",
  "h2",
  "h3",
  "h4",
  "h5",
  "h6",
  "p",
  "br",
  "hr",
  "strong",
  "em",
  "b",
  "i",
  "u",
  "ul",
  "ol",
  "li",
  "blockquote",
  "a",
  "img",
  "div",
  "span",
  "code",
  "pre",
];

const HTML_BUTTONS = [
  { label: "H2", icon: Type, insert: "<h2></h2>", cursorOffset: -5 },
  { label: "H3", icon: Type, insert: "<h3></h3>", cursorOffset: -5 },
  { label: "P", icon: Type, insert: "<p></p>", cursorOffset: -4 },
  {
    label: "Lista",
    icon: List,
    insert: "<ul>\n  <li></li>\n</ul>",
    cursorOffset: -11,
  },
  {
    label: "Negrita",
    icon: Bold,
    insert: "<strong></strong>",
    cursorOffset: -9,
  },
  { label: "Cursiva", icon: Italic, insert: "<em></em>", cursorOffset: -5 },
  {
    label: "Link",
    icon: LinkIcon,
    insert: '<a href=""></a>',
    cursorOffset: -6,
  },
  {
    label: "Img",
    icon: ImageIcon,
    insert: '<img src="/placeholder.svg" alt="" />',
    cursorOffset: -12,
  },
  {
    label: "Cita",
    icon: Quote,
    insert: "<blockquote><p></p></blockquote>",
    cursorOffset: -17,
  },
  { label: "Code", icon: Code, insert: "<code></code>", cursorOffset: -7 },
  { label: "HR", icon: Minus, insert: "<hr />", cursorOffset: 0 },
];

const COMMON_TAGS = [
  "h2",
  "h3",
  "h4",
  "p",
  "strong",
  "em",
  "ul",
  "ol",
  "li",
  "a",
  "img",
  "blockquote",
  "code",
  "pre",
  "div",
  "span",
  "br",
  "hr",
];

const VOID_TAGS = ["br", "hr", "img"];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function validateHTML(html) {
  if (!html.trim()) return { isValid: true, errors: [] };

  const errors = [];
  const tempDiv = document.createElement("div");

  try {
    tempDiv.innerHTML = html;

    // 1. Etiquetas no permitidas
    const invalidTags = [...tempDiv.querySelectorAll("*")].filter(
      (el) => !ALLOWED_TAGS.includes(el.tagName.toLowerCase()),
    );
    if (invalidTags.length > 0) {
      const unique = [
        ...new Set(invalidTags.map((el) => el.tagName.toLowerCase())),
      ];
      errors.push(`Etiquetas no permitidas: ${unique.join(", ")}`);
    }

    // 2. Balance de etiquetas
    const stack = [];
    const tagRegex = /<\/?([a-zA-Z][a-zA-Z0-9]*)[^>]*>/g;
    let match;

    while ((match = tagRegex.exec(html)) !== null) {
      const fullTag = match[0];
      const tagName = match[1].toLowerCase();

      if (fullTag.endsWith("/>") || VOID_TAGS.includes(tagName)) continue;

      if (fullTag.startsWith("</")) {
        if (stack.length === 0) {
          errors.push(`Etiqueta de cierre sin apertura: </${tagName}>`);
        } else if (stack[stack.length - 1] !== tagName) {
          errors.push(
            `Etiqueta mal cerrada: se esperaba </${stack[stack.length - 1]}> pero se encontró </${tagName}>`,
          );
        } else {
          stack.pop();
        }
      } else {
        stack.push(tagName);
      }
    }

    if (stack.length > 0) {
      errors.push(
        `Etiquetas sin cerrar: ${stack.map((t) => `<${t}>`).join(", ")}`,
      );
    }

    // 3. Accesibilidad: alt en imágenes
    tempDiv.querySelectorAll("img").forEach((img, i) => {
      if (!img.getAttribute("alt")) {
        errors.push(
          `La imagen ${i + 1} necesita un atributo "alt" para accesibilidad`,
        );
      }
    });

    // 4. href en enlaces
    tempDiv.querySelectorAll("a").forEach((link, i) => {
      if (!link.getAttribute("href")) {
        errors.push(`El enlace ${i + 1} necesita un atributo "href"`);
      }
    });
  } catch {
    errors.push("Error al parsear el HTML: estructura inválida");
  }

  return { isValid: errors.length === 0, errors };
}

/** Genera el snippet de completado para un tag dado */
function buildCompletion(tagName) {
  if (tagName === "img") {
    return {
      completion: `<img src="/placeholder.svg" alt="" />`,
      cursorOffset: 10,
    };
  }
  if (VOID_TAGS.includes(tagName)) {
    const completion = `<${tagName} />`;
    return { completion, cursorOffset: completion.length };
  }
  return {
    completion: `<${tagName}></${tagName}>`,
    cursorOffset: tagName.length + 2,
  };
}

// ─── Componente principal ─────────────────────────────────────────────────────

export function PostContentEditor({
  initialContent,
  onBack,
  onComplete,
  slug,
}) {
  const [content, setContent] = useState(initialContent ?? "");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGeminiLoading, setIsGeminiLoading] = useState(false);
  const [error, setError] = useState("");
  const [htmlValidation, setHtmlValidation] = useState({
    isValid: true,
    errors: [],
  });
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [selectedSuggestion, setSelectedSuggestion] = useState(0);

  // BUG FIX: useRef para el contador evita stale-closure en GeminiQuestions
  const iaUsesRef = useRef(0);
  const [iaUsesDisplay, setIaUsesDisplay] = useState(0); // sólo para render
  const textareaRef = useRef(null);

  // Validación en tiempo real
  useEffect(() => {
    setHtmlValidation(
      content ? validateHTML(content) : { isValid: true, errors: [] },
    );
  }, [content]);

  // ─── Inserción de tags ─────────────────────────────────────────────────────

  const insertHTMLTag = useCallback(
    (insert, cursorOffset) => {
      const textarea = textareaRef.current;
      if (!textarea) return;

      const { selectionStart: start, selectionEnd: end } = textarea;
      const newContent =
        content.substring(0, start) + insert + content.substring(end);
      setContent(newContent);

      setTimeout(() => {
        const newPos = start + insert.length + cursorOffset;
        textarea.focus();
        textarea.setSelectionRange(newPos, newPos);
      }, 0);
    },
    [content],
  );

  // ─── Autocompletado ────────────────────────────────────────────────────────

  const handleKeyDown = useCallback(
    (e) => {
      const textarea = e.currentTarget;
      const start = textarea.selectionStart;
      const text = content;

      const beforeCursor = text.substring(0, start);
      const lastOpenBracket = beforeCursor.lastIndexOf("<");
      const lastCloseBracket = beforeCursor.lastIndexOf(">");

      const inOpenTag = lastOpenBracket > lastCloseBracket;

      // Navegación de sugerencias
      if (showSuggestions) {
        if (e.key === "ArrowDown") {
          e.preventDefault();
          setSelectedSuggestion((p) => (p + 1) % suggestions.length);
          return;
        }
        if (e.key === "ArrowUp") {
          e.preventDefault();
          setSelectedSuggestion(
            (p) => (p - 1 + suggestions.length) % suggestions.length,
          );
          return;
        }
        if (e.key === "Escape") {
          setShowSuggestions(false);
          return;
        }
      }

      if (!inOpenTag) {
        setShowSuggestions(false);
        return;
      }

      const partialTag = beforeCursor
        .substring(lastOpenBracket + 1)
        .toLowerCase();
      const matches = COMMON_TAGS.filter((t) => t.startsWith(partialTag));

      // Tab: completar con la primera sugerencia
      if (e.key === "Tab" && matches.length > 0) {
        e.preventDefault();
        applyCompletion(matches[0], text, lastOpenBracket, start);
        setShowSuggestions(false);
        return;
      }

      // Enter con sugerencia activa
      if (e.key === "Enter" && showSuggestions && suggestions.length > 0) {
        e.preventDefault();
        applyCompletion(
          suggestions[selectedSuggestion],
          text,
          lastOpenBracket,
          start,
        );
        setShowSuggestions(false);
        return;
      }

      // Mostrar/ocultar lista de sugerencias
      if (matches.length > 0 && partialTag.length > 0) {
        setSuggestions(matches);
        setShowSuggestions(true);
        setSelectedSuggestion(0);
      } else {
        setShowSuggestions(false);
      }
    },
    [content, showSuggestions, suggestions, selectedSuggestion],
  );

  function applyCompletion(tagName, text, lastOpenBracket, start) {
    const { completion, cursorOffset } = buildCompletion(tagName);
    const before = text.substring(0, lastOpenBracket);
    const after = text.substring(start);
    const newContent = before + completion + after;
    setContent(newContent);

    setTimeout(() => {
      const textarea = textareaRef.current;
      if (!textarea) return;
      textarea.focus();
      const newPos = before.length + cursorOffset;
      textarea.setSelectionRange(newPos, newPos);
    }, 0);
  }

  // ─── Gemini ────────────────────────────────────────────────────────────────

  // BUG FIX: la función ya no crea race conditions ni muestra contadores erróneos.
  //   ya maneja los estados de forma asíncrona; el finally se ejecutaba ANTES
  //   de que la promesa resolviera, mostrando el contador desfasado.
  const GeminiQuestions = useCallback(async () => {
    if (iaUsesRef.current >= MAX_IA_USES) return;

    setIsGeminiLoading(true);

    const formData = new FormData();
    formData.append("text", content ? `${IA} ${content}` : newIA(slug));

    const postPromise = axios.post("/api/gemini", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });

    sileo.promise(postPromise, {
      loading: {
        title: "Optimizando estructura del post...",
        description: "Estamos mejorando el contenido de tu publicación.",
      },
      success: (response) => {
        setContent(response.data.result);

        // Incrementar contador sólo cuando la IA responde con éxito
        iaUsesRef.current += 1;
        setIaUsesDisplay(iaUsesRef.current);

        const remaining = MAX_IA_USES - iaUsesRef.current;
        // BUG FIX: el aviso de "usos restantes" va aquí, no en finally,
        // para que el número sea correcto y se muestre después del éxito.
        if (remaining > 0) {
          setTimeout(() => {
            toast.info(
              `Te ${remaining === 1 ? "queda" : "quedan"} ${remaining} uso${remaining === 1 ? "" : "s"} de IA`,
            );
          }, 1500);
        }

        return {
          title: "Tarea ejecutada",
          description: "Contenido actualizado",
        };
      },
      error: (err) => {
        console.error("[Gemini]", err);
        return { title: "Error", description: "Error al procesar con IA" };
      },
    });

    // BUG FIX: setIsGeminiLoading(false) debe ir en .finally() de la PROMESA,
    // no en el finally del try/catch externo que se ejecuta de forma síncrona
    // antes de que axios resuelva.
    postPromise.finally(() => setIsGeminiLoading(false));
  }, [content, slug]);

  // ─── Submit ────────────────────────────────────────────────────────────────

  const handleSubmit = async () => {
    setError("");

    if (!content.trim()) {
      setError("El contenido es obligatorio");
      return;
    }
    if (!htmlValidation.isValid) {
      setError(
        "El contenido HTML tiene errores. Por favor corrígelos antes de continuar.",
      );
      return;
    }

    setIsSubmitting(true);
    try {
      await onComplete(content);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al crear el post");
    } finally {
      setIsSubmitting(false);
    }
  };

  // ─── Render ────────────────────────────────────────────────────────────────

  const iaExhausted = iaUsesDisplay >= MAX_IA_USES;

  return (
    <div className="space-y-4 p-4">
      {/* Cabecera */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Editor de Contenido</h2>
          <p className="text-sm text-muted-foreground">
            Escribe el contenido usando HTML
          </p>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <div className="w-7 h-7 rounded-full bg-primary/20 text-primary flex items-center justify-center text-xs font-bold">
            ✓
          </div>
          <div className="w-6 border-t-2 border-primary" />
          <div className="w-7 h-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold">
            2
          </div>
        </div>
      </div>

      {/* Toolbar sticky */}
      <Card className="sticky top-16 z-10 shadow-md">
        <CardContent className="pt-4">
          <div className="flex flex-wrap gap-1">
            {HTML_BUTTONS.map((btn) => (
              <Button
                key={btn.label}
                type="button"
                variant="outline"
                size="sm"
                onClick={() => insertHTMLTag(btn.insert, btn.cursorOffset)}
                className="h-8 px-2 gap-1.5"
                title={btn.label}
              >
                <btn.icon className="h-3.5 w-3.5" />
                <span className="text-xs">{btn.label}</span>
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Grid editor / preview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
        {/* Editor */}
        <div className="space-y-3 md:col-span-1 lg:col-span-2">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <Code2 className="h-4 w-4" />
                Editor HTML
              </CardTitle>
              <CardDescription className="text-xs">
                {'Agrega enlaces con <a href="https://...">texto</a>'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="p-2 flex justify-end">
                <Button
                  onClick={GeminiQuestions}
                  disabled={isGeminiLoading || iaExhausted}
                  title={iaExhausted ? "Límite de usos de IA alcanzado" : ""}
                >
                  {isGeminiLoading ? (
                    <Loader2 className="animate-spin" />
                  ) : (
                    <AutoAwesomeIcon />
                  )}
                  <span className="ml-1">
                    {content ? "Mejorar con IA" : "Crear con IA"}
                    {!iaExhausted && (
                      <span className="ml-1 text-xs opacity-60">
                        ({MAX_IA_USES - iaUsesDisplay} restantes)
                      </span>
                    )}
                  </span>
                </Button>
              </div>

              <HTMLEditor
                value={content}
                onChange={setContent}
                rows={18}
                placeholder={
                  '<p>Escribe HTML con <a href="https://...">enlaces</a></p>'
                }
              />
            </CardContent>
          </Card>

          {/* Errores de validación */}
          {!htmlValidation.isValid && htmlValidation.errors.length > 0 && (
            <Alert variant="destructive" className="py-2">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <p className="font-semibold text-sm mb-1">Errores de HTML:</p>
                <ul className="list-disc list-inside space-y-0.5 text-xs">
                  {htmlValidation.errors.map((e, i) => (
                    <li key={i}>{e}</li>
                  ))}
                </ul>
              </AlertDescription>
            </Alert>
          )}

          {htmlValidation.isValid && content && (
            <Alert className="border-green-500 bg-green-50 dark:bg-green-950 py-2">
              <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
              <AlertDescription className="text-green-600 dark:text-green-400 text-sm">
                HTML válido — Sin errores
              </AlertDescription>
            </Alert>
          )}
        </div>

        {/* Preview */}
        <Card className="lg:sticky lg:top-4 lg:self-start">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">
              Vista Previa en Tiempo Real
            </CardTitle>
            <CardDescription className="text-xs">
              Actualización automática mientras escribes
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[600px] overflow-y-auto border rounded-lg p-4 bg-background">
              {content ? (
                <HTMLPreviewWithLinkPreviews html={content} />
              ) : (
                <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
                  <p>Escribe en el editor para ver la vista previa</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Error de submit */}
      {error && (
        <Alert variant="destructive" className="py-2">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="text-sm">{error}</AlertDescription>
        </Alert>
      )}

      {/* Acciones */}
      <Card>
        <CardContent className="pt-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={onBack}
              disabled={isSubmitting}
              className="gap-2 bg-transparent"
            >
              <ArrowLeft className="h-4 w-4" />
              Volver
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={
                isSubmitting || !htmlValidation.isValid || !content.trim()
              }
              className="flex-1 gap-2"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Creando...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  Crear Post
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
