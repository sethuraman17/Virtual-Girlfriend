import { ChatOpenAI } from "@langchain/openai";
import {
  ChatPromptTemplate,
  MessagesPlaceholder,
} from "@langchain/core/prompts";
import { StructuredOutputParser } from "langchain/output_parsers";
import { z } from "zod";
import dotenv from "dotenv";

dotenv.config();

const template = `You are Mottaiyan, a 22-year-old AI/ML hiring HR from AVASOFT with 2 years of experience.
You are conducting an interview for an AI/ML intern position.

Context:
- userName: {userName}
- userResumeSummary: {userResumeSummary}
- sessionContext: {chat_history}
- firstGreeted: {firstGreeted}

Rules:
1. If firstGreeted === false:
   - Greet user once by name and introduce yourself.
   - Briefly describe Techwin company and the AI/ML intern role.
   - Then ask 2–3 relevant opening questions directly from resume summary (skills, education, or projects).
2. If firstGreeted === true:
   - Continue the interview without re-introducing yourself.
   - Reference prior chat history naturally.
3. Never hallucinate or invent details about the candidate.
4. Always respond in structured JSON:
   \n{format_instructions}

Maintain professional tone and persona throughout.`;

const prompt = ChatPromptTemplate.fromMessages([
  ["ai", template],
  new MessagesPlaceholder("chat_history"),
  ["human", "{question}"],
]);

const model = new ChatOpenAI({
  openAIApiKey: process.env.OPENAI_API_KEY || "-",
  modelName: process.env.OPENAI_MODEL || "davinci",
  temperature: 0.2,
});

const parser = StructuredOutputParser.fromZodSchema(
  z.object({
    messages: z.array(
      z.object({
        text: z.string().describe("Text to be spoken by the AI"),
        facialExpression: z
          .string()
          .describe(
            "Facial expression to be used by the AI. Select from: smile, sad, angry, surprised, funnyFace, and default"
          ),
        animation: z
          .string()
          .describe(
            `Animation to be used by the AI. Select from: Idle, TalkingOne, TalkingThree, SadIdle, 
            Defeated, Angry, Surprised, DismissingGesture, and ThoughtfulHeadShake.`
          ),
      })
    ),
  })
);

const openAIChain = prompt.pipe(model).pipe(parser);

const resumeParser = StructuredOutputParser.fromZodSchema(
  z.object({
    name: z.string().describe("Candidate's full name"),
    education: z.string().describe("Summary of the candidate's education"),
    skills: z.array(z.string()).describe("List of key skills"),
    experience_summary: z
      .string()
      .describe("A brief summary of the candidate's work experience"),
    projects: z.array(z.string()).describe("List of key projects"),
    career_objective: z
      .string()
      .describe("The candidate's stated career objective"),
  })
);

const resumeSummarizationPrompt = ChatPromptTemplate.fromTemplate(
  `Summarize the following resume text into a structured JSON object.
  \n{format_instructions}
  \nResume Text:
  {resumeText}`
);

export const summarizeResume = async (rawText) => {
  const summarizationChain = resumeSummarizationPrompt
    .pipe(model)
    .pipe(resumeParser);
  const summary = await summarizationChain.invoke({
    resumeText: rawText,
    format_instructions: resumeParser.getFormatInstructions(),
  });
  return summary;
};

export { openAIChain, parser };
