"use client";

import React from "react";
import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
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
} from "lucide-react";
import AutoAwesomeIcon from "@mui/icons-material/AutoAwesome";
import axios from "axios";
import { toast } from "sonner";
function validateHTML(html) {
  const errors = [];

  if (!html.trim()) {
    return { isValid: true, errors: [] };
  }

  const tempDiv = document.createElement("div");

  try {
    tempDiv.innerHTML = html;

    const allowedTags = [
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

    const allTags = Array.from(tempDiv.querySelectorAll("*"));
    const invalidTags = allTags.filter(
      (el) => !allowedTags.includes(el.tagName.toLowerCase())
    );

    if (invalidTags.length > 0) {
      const uniqueInvalidTags = [
        ...new Set(invalidTags.map((el) => el.tagName.toLowerCase())),
      ];
      errors.push(`Etiquetas no permitidas: ${uniqueInvalidTags.join(", ")}`);
    }

    const stack = [];
    const tagRegex = /<\/?([a-zA-Z][a-zA-Z0-9]*)[^>]*>/g;
    let match;

    while ((match = tagRegex.exec(html)) !== null) {
      const fullTag = match[0];
      const tagName = match[1].toLowerCase();

      if (fullTag.endsWith("/>") || ["br", "hr", "img"].includes(tagName)) {
        continue;
      }

      if (fullTag.startsWith("</")) {
        if (stack.length === 0) {
          errors.push(`Etiqueta de cierre sin apertura: </${tagName}>`);
        } else if (stack[stack.length - 1] !== tagName) {
          errors.push(
            `Etiqueta mal cerrada: se esperaba </${
              stack[stack.length - 1]
            }> pero se encontró </${tagName}>`
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
        `Etiquetas sin cerrar: ${stack.map((tag) => `<${tag}>`).join(", ")}`
      );
    }

    const images = tempDiv.querySelectorAll("img");
    images.forEach((img, index) => {
      if (!img.getAttribute("alt")) {
        errors.push(
          `La imagen ${index + 1} necesita un atributo "alt" para accesibilidad`
        );
      }
    });

    const links = tempDiv.querySelectorAll("a");
    links.forEach((link, index) => {
      if (!link.getAttribute("href")) {
        errors.push(`El enlace ${index + 1} necesita un atributo "href"`);
      }
    });
  } catch (error) {
    errors.push("Error al parsear el HTML: estructura inválida");
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

export function PostContentEditor({ initialContent, onBack, onComplete }) {
  const [content, setContent] = useState(initialContent);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGeminiQuestion, setIsGeminiQuestion] = useState(false);
  const [error, setError] = useState("");
  const [htmlValidation, setHtmlValidation] = useState({
    isValid: true,
    errors: [],
  });
  const textareaRef = useRef(null);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [selectedSuggestion, setSelectedSuggestion] = useState(0);

  useEffect(() => {
    if (content) {
      const validation = validateHTML(content);
      setHtmlValidation(validation);
    } else {
      setHtmlValidation({ isValid: true, errors: [] });
    }
  }, [content]);

  const htmlButtons = [
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

  const insertHTMLTag = (insert, cursorOffset) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = content;
    const before = text.substring(0, start);
    const after = text.substring(end);

    const newContent = before + insert + after;
    setContent(newContent);

    setTimeout(() => {
      const newCursorPos = start + insert.length + cursorOffset;
      textarea.focus();
      textarea.setSelectionRange(newCursorPos, newCursorPos);
    }, 0);
  };

  const handleKeyDown = (e) => {
    const textarea = e.currentTarget;
    const start = textarea.selectionStart;
    const text = content;

    const beforeCursor = text.substring(0, start);
    const lastOpenBracket = beforeCursor.lastIndexOf("<");
    const lastCloseBracket = beforeCursor.lastIndexOf(">");

    if (lastOpenBracket > lastCloseBracket) {
      const partialTag = beforeCursor
        .substring(lastOpenBracket + 1)
        .toLowerCase();

      const commonTags = [
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

      const matches = commonTags.filter((tag) => tag.startsWith(partialTag));

      if (e.key === "Tab" && matches.length > 0) {
        e.preventDefault();

        const tagToComplete = matches[0];
        const before = text.substring(0, lastOpenBracket);
        const after = text.substring(start);

        let completion = "";
        let cursorOffset = 0;

        if (["br", "hr", "img"].includes(tagToComplete)) {
          if (tagToComplete === "img") {
            completion = `<img src="/placeholder.svg" alt="" />`;
            cursorOffset = 10;
          } else {
            completion = `<${tagToComplete} />`;
            cursorOffset = completion.length;
          }
        } else {
          completion = `<${tagToComplete}></${tagToComplete}>`;
          cursorOffset = tagToComplete.length + 2;
        }

        const newContent = before + completion + after;
        setContent(newContent);

        setTimeout(() => {
          textarea.focus();
          const newPos = before.length + cursorOffset;
          textarea.setSelectionRange(newPos, newPos);
        }, 0);

        return;
      }

      if (matches.length > 0 && partialTag.length > 0) {
        setSuggestions(matches);
        setShowSuggestions(true);
        setSelectedSuggestion(0);
      } else {
        setShowSuggestions(false);
      }
    } else {
      setShowSuggestions(false);
    }

    if (showSuggestions) {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedSuggestion((prev) => (prev + 1) % suggestions.length);
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedSuggestion(
          (prev) => (prev - 1 + suggestions.length) % suggestions.length
        );
      } else if (e.key === "Enter" && suggestions.length > 0) {
        e.preventDefault();
        const tagToComplete = suggestions[selectedSuggestion];
        const beforeCursor = text.substring(0, start);
        const lastOpenBracket = beforeCursor.lastIndexOf("<");
        const before = text.substring(0, lastOpenBracket);
        const after = text.substring(start);

        let completion = "";
        let cursorOffset = 0;

        if (["br", "hr", "img"].includes(tagToComplete)) {
          if (tagToComplete === "img") {
            completion = `<img src="/placeholder.svg" alt="" />`;
            cursorOffset = 10;
          } else {
            completion = `<${tagToComplete} />`;
            cursorOffset = completion.length;
          }
        } else {
          completion = `<${tagToComplete}></${tagToComplete}>`;
          cursorOffset = tagToComplete.length + 2;
        }

        const newContent = before + completion + after;
        setContent(newContent);

        setTimeout(() => {
          textarea.focus();
          const newPos = before.length + cursorOffset;
          textarea.setSelectionRange(newPos, newPos);
        }, 0);

        setShowSuggestions(false);
      }
    }
  };

  const handleSubmit = async () => {
    setError("");

    if (!content.trim()) {
      setError("El contenido es obligatorio");
      return;
    }

    if (!htmlValidation.isValid) {
      setError(
        "El contenido HTML tiene errores. Por favor corrígelos antes de continuar."
      );
      return;
    }

    setIsSubmitting(true);

    try {
      await onComplete(content);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al crear el post");
      setIsSubmitting(false);
    }
  };
  async function GeminiQuestions() {
    try {
      setIsGeminiQuestion(true);
      const formData = new FormData();
      formData.append("text", content);
      const postPromise = axios.post("/api/gemini", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      // toast.promise espera la promesa y muestra estados
      toast.promise(postPromise, {
        loading: "Guardando descuento...",
        success: (response) => {
          // Actualiza el estado con la respuesta (usar updater para seguridad)
          console.log(response);

          // Puedes devolver el texto que quieres que muestre el toast en success
          return "Tarea Ejecutada — Información actualizada";
        },
        error: (err) => {
          // Puedes devolver un mensaje de error que se mostrará en el toast
          // Logging más detallado se hace en el catch
          return "Error al guardar el descuento";
        },
      });
    } catch (error) {
      console.error(error);
    } finally {
      setIsGeminiQuestion(false);
    }
  }
  return (
    <div className="space-y-4 p-4">
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

      <Card className="sticky top-16 z-10 shadow-md">
        <CardContent className="pt-4">
          <div className="flex flex-wrap gap-1">
            {htmlButtons.map((btn) => (
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

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 ">
        {/* Editor */}
        <div className="space-y-3 md:col-span-1 lg:col-span-2 ">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Código HTML</CardTitle>
              <CardDescription className="text-xs">
                Escribe <code className="bg-muted px-1 rounded">&lt;h2</code> +
                Tab para autocompletar
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="p-2 flex justify-end">
                <Button onClick={() => GeminiQuestions()} disabled={!content}>
                  {isGeminiQuestion ? (
                    <Loader2 className="animate-spin" />
                  ) : (
                    <AutoAwesomeIcon />
                  )}
                  Mejorar con IA
                </Button>
              </div>
              <div className="relative">
                <Textarea
                  ref={textareaRef}
                  placeholder="<h2>Mi Título</h2>&#10;<p>Escribe tu contenido aquí...</p> o puedes pegar un texto y mejorarlo con IA"
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  onKeyDown={handleKeyDown}
                  rows={24}
                  className={`font-mono text-sm ${
                    !htmlValidation.isValid ? "border-destructive" : ""
                  }`}
                />

                {showSuggestions && suggestions.length > 0 && (
                  <div className="absolute z-10 mt-1 w-40 bg-popover border rounded-md shadow-lg">
                    <div className="p-1">
                      {suggestions.map((tag, index) => (
                        <div
                          key={tag}
                          className={`px-2 py-1.5 text-xs rounded cursor-pointer font-mono ${
                            index === selectedSuggestion
                              ? "bg-accent text-accent-foreground"
                              : "hover:bg-accent/50"
                          }`}
                        >
                          &lt;{tag}&gt;
                        </div>
                      ))}
                    </div>
                    <div className="border-t px-2 py-1.5 text-[10px] text-muted-foreground">
                      ↑↓ Enter/Tab
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {!htmlValidation.isValid && htmlValidation.errors.length > 0 && (
            <Alert variant="destructive" className="py-2">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <p className="font-semibold text-sm mb-1">Errores de HTML:</p>
                <ul className="list-disc list-inside space-y-0.5 text-xs">
                  {htmlValidation.errors.map((error, index) => (
                    <li key={index}>{error}</li>
                  ))}
                </ul>
              </AlertDescription>
            </Alert>
          )}

          {htmlValidation.isValid && content && (
            <Alert className="border-green-500 bg-green-50 dark:bg-green-950 py-2">
              <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
              <AlertDescription className="text-green-600 dark:text-green-400 text-sm">
                HTML válido - Sin errores
              </AlertDescription>
            </Alert>
          )}
        </div>

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
                <div
                  className="prose prose-slate dark:prose-invert max-w-none"
                  dangerouslySetInnerHTML={{ __html: content }}
                />
              ) : (
                <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
                  <p>Escribe en el editor para ver la vista previa</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {error && (
        <Alert variant="destructive" className="py-2">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="text-sm">{error}</AlertDescription>
        </Alert>
      )}

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
