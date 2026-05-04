import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import mongoose from "mongoose";

dotenv.config();

// MongoDB connect
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("✅ MongoDB connected"))
  .catch((err) => console.error("❌ MongoDB error:", err));

// Schema
const userSchema = new mongoose.Schema({
  userId: String,
  name: String,
  history: [String],
});

const User = mongoose.model("User", userSchema);

const app = express();
app.use(cors());
app.use(express.json());

app.post("/chat", async (req, res) => {
  const userMessage = req.body.message?.trim();

  if (!userMessage) {
    return res.json({ reply: "Say something first 🤨", block: false });
  }

  const lower = userMessage.toLowerCase();
  const userId = req.ip;

  // Find or create user
  let user = await User.findOne({ userId });

  if (!user) {
    user = await User.create({
      userId,
      name: null,
      history: [],
    });
  }

  // Name memory
  const nameMatch = userMessage.match(/my name is (\w+)/i);
  if (nameMatch) {
    user.name = nameMatch[1];
    await user.save();

    return res.json({
      reply: `Okayy ${user.name} 😌 I'll remember that.`,
      block: false,
    });
  }

  // Soft response (no harsh block)
  if (lower.includes("i love you") || lower.includes("marry me")) {
    return res.json({
      reply: `Aww slow down 😭 ${
        user.name ? user.name + "," : ""
      } we just started talking... but that's kinda cute.`,
      block: false,
    });
  }

  // Store user message
  user.history.push(`User: ${userMessage}`);
  if (user.history.length > 6) user.history.shift();

  try {
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
                  text: `
You are a playful, slightly sarcastic but sweet AI girlfriend.

User name: ${user.name || "unknown"}

Recent conversation:
${user.history.join("\n")}

Rules:
- Be charming, teasing, and fun
- Not rude
- Remember user's name
- Keep replies short and natural

User: ${userMessage}
`,
                },
              ],
            },
          ],
        }),
      },
    );

    const data = await response.json();

    let reply =
      data?.candidates?.[0]?.content?.parts?.[0]?.text || "AI is confused 🤯";

    // Save AI reply
    user.history.push(`AI: ${reply}`);
    await user.save();

    const shouldBlock =
      reply.toLowerCase().includes("block") || Math.random() < 0.05;

    res.json({ reply, block: shouldBlock });
  } catch (err) {
    console.error("❌ Error:", err);
    res.json({ reply: "Server error 😭", block: false });
  }
});

// Health route
app.get("/", (req, res) => {
  res.send("AI Girlfriend Backend Running 💖");
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => console.log(`✅ Server running on port ${PORT}`));
