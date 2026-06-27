import axios from "axios";
export async function GeminiAsk(text) {
  const formData = new FormData();
  formData.append("text", text);
  const postPromise = await axios.post(
    `${process.env.NEXT_PUBLIC_BASE_URL}/api/gemini`,
    formData,
    {
      headers: { "Content-Type": "multipart/form-data" },
    },
  );
  return postPromise.data.result.trim();
}
