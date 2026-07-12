// hooks/gemini.jsx
import axios from "axios";

export async function GeminiAsk(text, retries = 2, delayMs = 1500) {
  const formData = new FormData();
  formData.append("text", text);

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const res = await axios.post(
        `${process.env.NEXT_PUBLIC_BASE_URL}/api/gemini`,
        formData,
        { headers: { "Content-Type": "multipart/form-data" } },
      );
      return res.data.result.trim();
    } catch (err) {
      const status = err?.response?.status;
      const isRetryable = status === 502 || status === 503 || status === 429;

      if (attempt < retries && isRetryable) {
        await new Promise((r) => setTimeout(r, delayMs * (attempt + 1)));
        continue;
      }
      throw err; // deja que el catch en route.js maneje el fallback
    }
  }
}
