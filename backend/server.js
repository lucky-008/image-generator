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
      model,
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
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          inputs: prompt,
          parameters: { width, height }
        })
      }
    );

    if (!hfResponse.ok) {
      const errorText = await hfResponse.text();
      return res.status(500).json({ error: errorText });
    }

    const imageBuffer = Buffer.from(await hfResponse.arrayBuffer());
    res.set("Content-Type", "image/png");
    res.send(imageBuffer);

  } catch (err) {
    console.error("❌ Generation error:", err);
    res.status(500).json({ error: err.message });
  }
});

app.listen(3000, () => {
  console.log("✅ Server running on http://localhost:3000");
});
