import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import mongoose from "mongoose";

dotenv.config();

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("✅ MongoDB connected"))
  .catch((err) => console.error("❌ MongoDB error:", err));

const app = express();
app.use(cors());
app.use(express.json());

app.post("/chat", async (req, res) => {
  const userMessage = req.body.message || "";

  // 🔥 HARD BLOCK
  if (lower.includes("i love you") || lower.includes("marry me")) {
    return res.json({
      reply:
        "Aww slow down 😭 we just started talking... but that's kinda cute.",
      block: false,
    });
  }
  {
    return res.json({
      reply: "We just met 💀 Too much attachment.\nBlocking you...",
      block: true,
    });
  }

  try {
    console.log("API KEY:", process.env.GEMINI_API_KEY);
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: `You are a playful, slightly sarcastic but sweet AI girlfriend. 

Rules:
- Be charming, teasing, and fun (not rude).
- Light roast is okay, but don't hurt feelings.
- If user gets too clingy, respond playfully, not aggressively.
- Avoid blocking unless user is extremely repetitive or annoying.
- Keep replies short, natural, and human-like.
\nUser: ${userMessage}`,
                },
              ],
            },
          ],
        }),
      },
    );

    if (!response.ok) {
      const errText = await response.text();
      console.error("❌ Gemini API Error:", errText);
      throw new Error("Gemini API failed");
    }

    const data = await response.json();

    console.log("🔥 Gemini Response:", JSON.stringify(data, null, 2));

    let reply = "AI is confused 🤯";

    if (data?.candidates?.[0]?.content?.parts?.[0]?.text) {
      reply = data.candidates[0].content.parts[0].text;
    } else if (data?.error?.message) {
      console.error("Gemini Error:", data.error.message);
    }

    const shouldBlock =
      reply.toLowerCase().includes("block") || Math.random() < 0.05;

    res.json({ reply, block: shouldBlock });
  } catch (err) {
    console.error("❌ Error:", err);
    res.json({ reply: "Server error 😭", block: false });
  }
});

app.get("/", (req, res) => {
  res.send("AI Girlfriend Backend Running 💖");
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => console.log(`✅ Server running on port ${PORT}`));
