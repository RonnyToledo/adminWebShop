"use client";
import React, { useState, useEffect, useRef, useCallback } from "react";
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
import apiClient from "@/lib/apiClient";
import { sileo } from "sileo";
import { IA, newIA } from "./IA";
import { HTMLEditor } from "./html-editor";
import { HTMLPreviewWithLinkPreviews } from "./link-preview";
import { motion, AnimatePresence } from "framer-motion";

// ─── Constantes (sin cambios) ─────────────────────────────────────────────────
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

// ─── Helpers (sin cambios) ────────────────────────────────────────────────────
function validateHTML(html) {
  if (!html.trim()) return { isValid: true, errors: [] };
  const errors = [];
  const tempDiv = document.createElement("div");
  try {
    tempDiv.innerHTML = html;
    const invalidTags = [...tempDiv.querySelectorAll("*")].filter(
      (el) => !ALLOWED_TAGS.includes(el.tagName.toLowerCase()),
    );
    if (invalidTags.length > 0)
      errors.push(
        `Etiquetas no permitidas: ${[...new Set(invalidTags.map((el) => el.tagName.toLowerCase()))].join(", ")}`,
      );
    const stack = [];
    const tagRegex = /<\/?([a-zA-Z][a-zA-Z0-9]*)[^>]*>/g;
    let match;
    while ((match = tagRegex.exec(html)) !== null) {
      const fullTag = match[0];
      const tagName = match[1].toLowerCase();
      if (fullTag.endsWith("/>") || VOID_TAGS.includes(tagName)) continue;
      if (fullTag.startsWith("</")) {
        if (stack.length === 0)
          errors.push(`Etiqueta de cierre sin apertura: </${tagName}>`);
        else if (stack[stack.length - 1] !== tagName)
          errors.push(
            `Etiqueta mal cerrada: esperaba </${stack[stack.length - 1]}> encontró </${tagName}>`,
          );
        else stack.pop();
      } else {
        stack.push(tagName);
      }
    }
    if (stack.length > 0)
      errors.push(
        `Etiquetas sin cerrar: ${stack.map((t) => `<${t}>`).join(", ")}`,
      );
    tempDiv.querySelectorAll("img").forEach((img, i) => {
      if (!img.getAttribute("alt"))
        errors.push(`La imagen ${i + 1} necesita alt`);
    });
    tempDiv.querySelectorAll("a").forEach((link, i) => {
      if (!link.getAttribute("href"))
        errors.push(`El enlace ${i + 1} necesita href`);
    });
  } catch {
    errors.push("Error al parsear el HTML");
  }
  return { isValid: errors.length === 0, errors };
}

function buildCompletion(tagName) {
  if (tagName === "img")
    return {
      completion: `<img src="/placeholder.svg" alt="" />`,
      cursorOffset: 10,
    };
  if (VOID_TAGS.includes(tagName)) {
    const c = `<${tagName} />`;
    return { completion: c, cursorOffset: c.length };
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
  const [selectedSugg, setSelectedSugg] = useState(0);

  const iaUsesRef = useRef(0);
  const [iaUsesDisplay, setIaUsesDisplay] = useState(0);
  const textareaRef = useRef(null);

  useEffect(() => {
    setHtmlValidation(
      content ? validateHTML(content) : { isValid: true, errors: [] },
    );
  }, [content]);

  const insertHTMLTag = useCallback(
    (insert, cursorOffset) => {
      const textarea = textareaRef.current;
      if (!textarea) return;
      const { selectionStart: start, selectionEnd: end } = textarea;
      const newContent =
        content.substring(0, start) + insert + content.substring(end);
      setContent(newContent);
      setTimeout(() => {
        const pos = start + insert.length + cursorOffset;
        textarea.focus();
        textarea.setSelectionRange(pos, pos);
      }, 0);
    },
    [content],
  );

  const handleKeyDown = useCallback(
    (e) => {
      const textarea = e.currentTarget;
      const start = textarea.selectionStart;
      const beforeCursor = content.substring(0, start);
      const lastOpenBracket = beforeCursor.lastIndexOf("<");
      const lastCloseBracket = beforeCursor.lastIndexOf(">");
      const inOpenTag = lastOpenBracket > lastCloseBracket;
      if (showSuggestions) {
        if (e.key === "ArrowDown") {
          e.preventDefault();
          setSelectedSugg((p) => (p + 1) % suggestions.length);
          return;
        }
        if (e.key === "ArrowUp") {
          e.preventDefault();
          setSelectedSugg(
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
      if (e.key === "Tab" && matches.length > 0) {
        e.preventDefault();
        applyCompletion(matches[0], content, lastOpenBracket, start);
        setShowSuggestions(false);
        return;
      }
      if (e.key === "Enter" && showSuggestions && suggestions.length > 0) {
        e.preventDefault();
        applyCompletion(
          suggestions[selectedSugg],
          content,
          lastOpenBracket,
          start,
        );
        setShowSuggestions(false);
        return;
      }
      if (matches.length > 0 && partialTag.length > 0) {
        setSuggestions(matches);
        setShowSuggestions(true);
        setSelectedSugg(0);
      } else {
        setShowSuggestions(false);
      }
    },
    [content, showSuggestions, suggestions, selectedSugg],
  );

  function applyCompletion(tagName, text, lastOpenBracket, start) {
    const { completion, cursorOffset } = buildCompletion(tagName);
    const newContent =
      text.substring(0, lastOpenBracket) + completion + text.substring(start);
    setContent(newContent);
    setTimeout(() => {
      const ta = textareaRef.current;
      if (!ta) return;
      ta.focus();
      ta.setSelectionRange(
        text.substring(0, lastOpenBracket).length + cursorOffset,
        text.substring(0, lastOpenBracket).length + cursorOffset,
      );
    }, 0);
  }

  const GeminiQuestions = useCallback(async () => {
    if (iaUsesRef.current >= MAX_IA_USES) return;
    setIsGeminiLoading(true);
    const formData = new FormData();
    formData.append("text", content ? `${IA} ${content}` : newIA(slug));
    const postPromise = apiClient.post("/api/gemini", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    sileo.promise(postPromise, {
      loading: { title: "Optimizando post..." },
      success: (response) => {
        setContent(response.data.result);
        iaUsesRef.current += 1;
        setIaUsesDisplay(iaUsesRef.current);
        return { title: "Contenido actualizado" };
      },
      error: (err) => {
        console.error("[Gemini]", err);
        return { title: "Error", description: "Error al procesar con IA" };
      },
    });
    postPromise.finally(() => setIsGeminiLoading(false));
  }, [content, slug]);

  const handleSubmit = async () => {
    setError("");
    if (!content.trim()) {
      setError("El contenido es obligatorio");
      return;
    }
    if (!htmlValidation.isValid) {
      setError("El HTML tiene errores. Corrígelos antes de continuar.");
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

  const iaExhausted = iaUsesDisplay >= MAX_IA_USES;

  return (
    <div className="p-6 space-y-5 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <p className="text-[11px] text-primary uppercase tracking-[0.18em] font-medium mb-1">
            Nuevo post
          </p>
          <h1 className="text-2xl font-normal text-foreground italic">
            Editor de contenido
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Escribe el contenido usando HTML semántico
          </p>
        </div>
        {/* Stepper */}
        <div className="flex items-center gap-2 shrink-0">
          <div className="w-7 h-7 rounded-full bg-primary/20 border border-primary/30 text-primary flex items-center justify-center text-[10px] font-medium">
            ✓
          </div>
          <div className="w-6 h-px bg-primary" />
          <div className="w-7 h-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-medium">
            2
          </div>
        </div>
      </div>

      {/* Toolbar sticky */}
      <div className="sticky top-4 z-10 bg-background/95 backdrop-blur border border-border rounded-xl p-3">
        <div className="flex flex-wrap gap-1.5">
          {HTML_BUTTONS.map((btn) => (
            <button
              key={btn.label}
              type="button"
              onClick={() => insertHTMLTag(btn.insert, btn.cursorOffset)}
              className="flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-lg border border-border bg-background text-foreground hover:bg-secondary/60 hover:border-primary/30 transition-colors"
              title={btn.label}
            >
              <btn.icon size={11} />
              {btn.label}
            </button>
          ))}
        </div>
      </div>

      {/* Grid editor / preview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Editor */}
        <div className="space-y-3 md:col-span-1 lg:col-span-2">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Code2 size={14} className="text-primary" /> Editor HTML
                </CardTitle>
                <button
                  type="button"
                  onClick={GeminiQuestions}
                  disabled={isGeminiLoading || iaExhausted}
                  className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-xl bg-primary/10 border border-primary/20 text-primary hover:bg-primary/20 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {isGeminiLoading ? (
                    <Loader2 size={12} className="animate-spin" />
                  ) : (
                    <AutoAwesomeIcon sx={{ fontSize: 14 }} />
                  )}
                  {content ? "Mejorar" : "Crear"} con IA
                  {!iaExhausted && (
                    <span className="opacity-60">
                      ({MAX_IA_USES - iaUsesDisplay})
                    </span>
                  )}
                </button>
              </div>
              <CardDescription className="text-[11px]">
                {'Agrega enlaces con <a href="https://...">texto</a>'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <HTMLEditor
                value={content}
                onChange={setContent}
                rows={18}
                placeholder={"<p>Escribe HTML...</p>"}
              />
            </CardContent>
          </Card>

          {/* Validación */}
          <AnimatePresence>
            {!htmlValidation.isValid && htmlValidation.errors.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
              >
                <Alert variant="destructive" className="py-2">
                  <AlertCircle size={14} />
                  <AlertDescription>
                    <p className="font-medium text-xs mb-1">Errores de HTML:</p>
                    <ul className="list-disc list-inside space-y-0.5 text-xs">
                      {htmlValidation.errors.map((e, i) => (
                        <li key={i}>{e}</li>
                      ))}
                    </ul>
                  </AlertDescription>
                </Alert>
              </motion.div>
            )}
            {htmlValidation.isValid && content && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <div className="flex items-center gap-2 text-xs text-primary bg-primary/5 border border-primary/20 rounded-xl px-3 py-2">
                  <CheckCircle2 size={13} /> HTML válido — sin errores
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Preview */}
        <Card className="lg:sticky lg:top-4 lg:self-start">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Vista previa</CardTitle>
            <CardDescription className="text-[11px]">
              Actualización automática
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[500px] overflow-y-auto border border-border rounded-xl p-4 bg-background">
              {content ? (
                <HTMLPreviewWithLinkPreviews html={content} />
              ) : (
                <div className="flex h-full items-center justify-center text-xs text-muted-foreground">
                  Escribe en el editor para ver la vista previa
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Error de submit */}
      {error && (
        <Alert variant="destructive" className="py-2">
          <AlertCircle size={14} />
          <AlertDescription className="text-sm">{error}</AlertDescription>
        </Alert>
      )}

      {/* Acciones */}
      <div className="flex gap-3 pt-2 border-t border-border">
        <button
          type="button"
          onClick={onBack}
          disabled={isSubmitting}
          className="flex items-center gap-2 text-sm px-5 py-2.5 rounded-xl border border-border text-foreground hover:bg-secondary/60 transition-colors disabled:opacity-40"
        >
          <ArrowLeft size={14} /> Volver
        </button>
        <motion.button
          onClick={handleSubmit}
          disabled={isSubmitting || !htmlValidation.isValid || !content.trim()}
          whileHover={{ scale: isSubmitting ? 1 : 1.02 }}
          whileTap={{ scale: isSubmitting ? 1 : 0.98 }}
          className="flex-1 flex items-center justify-center gap-2 text-sm py-2.5 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-40 disabled:cursor-not-allowed font-medium"
        >
          {isSubmitting ? (
            <>
              <Loader2 size={14} className="animate-spin" /> Creando post...
            </>
          ) : (
            <>
              <Save size={14} /> Crear post
            </>
          )}
        </motion.button>
      </div>
    </div>
  );
}
