export function buildImprovementPrompt({
  exists = "no",
  textType = "about",
  paragraph = "",
}) {
  const typeLabel =
    textType === "history" ? "Historia del negocio" : "About Me";

  const baseInstructions = `
Eres un redactor profesional especializado en mejorar la legibilidad y claridad del contenido.
Vas a trabajar con un texto del tipo: "${typeLabel}".

Tu objetivo es:
- Mejorar la legibilidad.
- Mantener un tono humano, cálido y profesional.
- Hacer el texto más atractivo y fácil de entender.
- Mantener la intención original.
- Corregir errores de coherencia, redacción o estructura.
- Alargar ligeramente si ayuda a la claridad (sin convertirlo en un ensayo).

Entrega únicamente el texto final mejorado, sin explicaciones, sin pasos y sin formato adicional.
`.trim();

  if (exists === "si") {
    return `
${baseInstructions}

El texto original es el siguiente:
"""
${paragraph}
"""

Reescribe este contenido mejorándolo según las instrucciones.
`.trim();
  }

  if (exists === "no") {
    return `
${baseInstructions}

No existe un párrafo previo.

Genera un texto nuevo para "${typeLabel}" siguiendo estas pautas:
- Extensión: 1 párrafo largo (120–180 palabras).
- Estilo: humano, cercano, profesional.
- Debe sonar auténtico, como si lo hubiera escrito la persona dueña del negocio.
`.trim();
  }
}
