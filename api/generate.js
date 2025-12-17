import fetch from "node-fetch";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const {
      model = "stabilityai/stable-diffusion-xl-base-1.0",
      prompt,
      width = 512,
      height = 512
    } = req.body;

    const hfResponse = await fetch(
      `https://router.huggingface.co/hf-inference/models/${model}`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.HF_API_KEY}`,
          "Content-Type": "application/json",
          "X-HF-Provider": "hf-inference"
        },
        body: JSON.stringify({
          inputs: prompt,
          parameters: { width, height }
        })
      }
    );

    if (!hfResponse.ok) {
      const errorText = await hfResponse.text();
      return res.status(hfResponse.status).json({ error: errorText });
    }

    const buffer = Buffer.from(await hfResponse.arrayBuffer());
    res.setHeader("Content-Type", "image/png");
    res.send(buffer);

  } catch (err) {
    console.error("❌ Generation error:", err);
    res.status(500).json({ error: err.message });
  }
}
