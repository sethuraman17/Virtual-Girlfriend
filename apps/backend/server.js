import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import multer from "multer";
import pdfParse from "pdf-parse";
import mammoth from "mammoth";
import { openAIChain, parser, summarizeResume } from "./modules/openAI.mjs";
import { lipSync } from "./modules/lip-sync.mjs";
import {
  sendDefaultMessages,
  defaultResponse,
} from "./modules/defaultMessages.mjs";
import { convertAudioToText } from "./modules/whisper.mjs";

dotenv.config();

const elevenLabsApiKey = process.env.ELEVEN_LABS_API_KEY;

const app = express();
app.use(express.json());
app.use(cors());
const port = 3000;

const storage = multer.memoryStorage();
const upload = multer({ storage });

const sessionStore = {};

app.get("/voices", async (req, res) => {
  res.send(await voice.getVoices(elevenLabsApiKey));
});

app.post(
  "/upload-resume",
  upload.single("resume"),
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).send({ error: "No resume file uploaded." });
      }

      const { buffer, originalname } = req.file;
      const fileType = originalname.split(".").pop();
      const userName = originalname.split("_")[0];

      let rawText = "";
      if (fileType === "pdf") {
        const data = await pdfParse(buffer);
        rawText = data.text;
      } else if (fileType === "docx" || fileType === "doc") {
        const { value } = await mammoth.extractRawText({ buffer });
        rawText = value;
      } else {
        return res.status(400).send({ error: "Unsupported file type." });
      }

      const resumeSummary = await summarizeResume(rawText);

      sessionStore[userName] = {
        resumeSummary,
        firstGreeted: false,
        sessionContext: [],
      };

      res.send({ userName, resumeSummary });
    } catch (error) {
      console.error(error);
      res.status(500).send({ error: "Failed to process resume." });
    }
  }
);

app.post("/tts", async (req, res) => {
  const { userName, message, chatHistory } = req.body;
  let userSession = sessionStore[userName];

  // If no session exists, create a default one to allow conversation without resume upload
  if (!userSession) {
    console.log(`No session found for '${userName}'. Creating a default session.`);
    sessionStore[userName] = {
      resumeSummary: "No resume summary available.",
      firstGreeted: false,
      sessionContext: [],
    };
    userSession = sessionStore[userName];
  }

  const { resumeSummary, firstGreeted, sessionContext } = userSession;

  const defaultMessages = await sendDefaultMessages({ userMessage: message });
  if (defaultMessages) {
    res.send({ messages: defaultMessages });
    return;
  }

  let openAImessages;
  try {
    openAImessages = await openAIChain.invoke({
      question: message,
      chat_history: chatHistory || sessionContext,
      format_instructions: parser.getFormatInstructions(),
      userName,
      userResumeSummary: JSON.stringify(resumeSummary),
      firstGreeted,
    });

    if (!firstGreeted) {
      userSession.firstGreeted = true;
    }
    userSession.sessionContext.push({
      role: "user",
      content: message,
    });
    userSession.sessionContext.push({
      role: "ai",
      content: openAImessages.messages
        .map((m) => m.text)
        .join(" "),
    });
  } catch (error) {
    console.error(error);
    openAImessages = defaultResponse;
  }

  try {
    const messages = await lipSync({ messages: openAImessages.messages });
    res.send({ messages });
  } catch (error) {
    console.error("Error in lipSync:", error);
    res.status(500).send({ error: "Failed to process text-to-speech." });
  }
});

app.post("/sts", async (req, res) => {
  const base64Audio = req.body.audio;
  const chatHistory = await req.body.chatHistory;
  const audioData = Buffer.from(base64Audio, "base64");
  const userMessage = await convertAudioToText({ audioData });
  let openAImessages;
  try {
    openAImessages = await openAIChain.invoke({
      question: userMessage,
      chat_history: chatHistory || [],
      format_instructions: parser.getFormatInstructions(),
    });
    // If the response from OpenAI is invalid, fall back to the default.
    if (!openAImessages || !openAImessages.messages) {
      console.error("OpenAI returned an invalid or empty response, using default.");
      openAImessages = defaultResponse;
    }
  } catch (error) {
    console.error("Error invoking OpenAI chain, using default response:", error);
    openAImessages = defaultResponse;
  }

  try {
    // Now, all paths lead to lipSync with a valid message structure.
    const messages = await lipSync({ messages: openAImessages.messages });
    res.send({ messages });
  } catch (error) {
    console.error("Error in lipSync after STS:", error);
    res.status(500).send({ error: "Failed to process speech-to-text audio." });
  }
});

app.listen(port, () => {
  console.log(`Jack are listening on port ${port}`);
});
