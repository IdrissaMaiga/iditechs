import { NextRequest, NextResponse } from "next/server";
import { putObject } from "@/lib/storage";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const apiKey = req.headers.get("x-admin-key");
  if (apiKey !== process.env.ADMIN_API_KEY) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const contentType = req.headers.get("content-type") || "";

  if (contentType.includes("application/json")) {
    const body = await req.json();
    const { action, prompt, filename } = body;

    if (action === "generate-image" && prompt) {
      const geminiKey = process.env.GEMINI_API_KEY;
      if (!geminiKey) {
        return NextResponse.json({ error: "GEMINI_API_KEY not configured" }, { status: 500 });
      }

      // Imagen `:predict` models were retired from the Gemini API. Native image
      // generation now goes through `generateContent` on the Gemini image models.
      // Try the best model first, then fall back to the faster ones.
      const models = [
        process.env.GEMINI_IMAGE_MODEL,
        "gemini-3-pro-image",
        "gemini-3.1-flash-image",
        "gemini-2.5-flash-image",
      ].filter((m, i, arr): m is string => !!m && arr.indexOf(m) === i);

      let base64: string | undefined;
      let mimeType = "image/png";
      let lastError = "";

      for (const model of models) {
        let geminiRes: Response;
        try {
          geminiRes = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${geminiKey}`,
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                contents: [{ parts: [{ text: prompt }] }],
                generationConfig: {
                  responseModalities: ["IMAGE"],
                  imageConfig: { aspectRatio: "16:9" },
                },
              }),
            }
          );
        } catch (err) {
          // Network-level failure (DNS, connect timeout). Try the next model.
          lastError = `${model}: ${err instanceof Error ? err.message : String(err)}`;
          console.error("Gemini error:", lastError);
          continue;
        }

        if (!geminiRes.ok) {
          lastError = `${model}: ${geminiRes.status} ${(await geminiRes.text()).slice(0, 300)}`;
          console.error("Gemini error:", lastError);
          continue;
        }

        const geminiData = await geminiRes.json();
        const parts: Array<{ inlineData?: { data?: string; mimeType?: string } }> =
          geminiData.candidates?.[0]?.content?.parts ?? [];
        const img = parts.find((p) => p.inlineData?.data);
        if (img?.inlineData?.data) {
          base64 = img.inlineData.data;
          mimeType = img.inlineData.mimeType || mimeType;
          console.log("Image generated with", model);
          break;
        }
        lastError = `${model}: no image in response`;
        console.error("Gemini error:", lastError);
      }

      if (!base64) {
        return NextResponse.json({ error: `Image generation failed (${lastError})` }, { status: 500 });
      }

      const imageBuffer = Buffer.from(base64, "base64");
      // Gemini usually returns JPEG; make the stored extension match the real format.
      const ext = mimeType === "image/jpeg" ? "jpg" : mimeType === "image/webp" ? "webp" : "png";
      const base = (filename || `generated-${Date.now()}`).replace(/\.(png|jpe?g|webp)$/i, "");
      const key = `blog/${base}.${ext}`;
      const url = await putObject(key, imageBuffer, mimeType);

      return NextResponse.json({ success: true, url, key });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  }

  if (contentType.includes("multipart/form-data")) {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json({ error: "File too large (max 10MB)" }, { status: 413 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const ext = file.name.split(".").pop() || "png";
    const key = `blog/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, "")}`;
    const url = await putObject(key, buffer, file.type || `image/${ext}`);

    return NextResponse.json({ success: true, url, key });
  }

  return NextResponse.json({ error: "Unsupported content type" }, { status: 400 });
}
