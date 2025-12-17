import express from "express";
import cors from "cors";
import fetch from "node-fetch";
import dotenv from "dotenv";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// 🔐 Validate API key at startup
if (!process.env.HF_API_KEY) {
  console.error("❌ HF_API_KEY is missing. Check your .env file");
  process.exit(1);
}

app.post("/generate", async (req, res) => {
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
          parameters: {
            width,
            height
          }
        })
      }
    );

    const contentType = hfResponse.headers.get("content-type");

    if (!hfResponse.ok) {
      const errorText = await hfResponse.text();
      return res.status(hfResponse.status).json({ error: errorText });
    }

    // image response
    if (contentType && contentType.includes("image")) {
      const buffer = Buffer.from(await hfResponse.arrayBuffer());
      res.set("Content-Type", "image/png");
      return res.send(buffer);
    }

    // json error response
    const json = await hfResponse.json();
    return res.json(json);

  } catch (err) {
    console.error("❌ Generation error:", err);
    res.status(500).json({ error: err.message });
  }
});



app.listen(3000, () => {
  console.log("✅ Server running on http://localhost:3000");
});
