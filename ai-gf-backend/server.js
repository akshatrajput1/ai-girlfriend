import express from "express";
import cors from "cors";
import dotenv from "dotenv";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

app.post("/chat", async (req, res) => {
  const userMessage = req.body.message || "";

  // 🔥 HARD BLOCK
  if (
    userMessage.toLowerCase().includes("i love you") ||
    userMessage.toLowerCase().includes("marry me")
  ) {
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
                  text: `You are a savage, funny AI girlfriend. Roast user if needy. Keep replies short.\nUser: ${userMessage}`,
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
      reply.toLowerCase().includes("block") || Math.random() < 0.15;

    res.json({ reply, block: shouldBlock });
  } catch (err) {
    console.error("❌ Error:", err);
    res.json({ reply: "Server error 😭", block: false });
  }
});

app.listen(5000, () =>
  console.log("✅ Server running on http://localhost:5000"),
);
