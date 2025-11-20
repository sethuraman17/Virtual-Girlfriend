import { convertTextToSpeech } from "./chatter-box.mjs";
import { getPhonemes } from "./rhubarbLipSync.mjs";
import { readJsonTranscript, audioFileToBase64 } from "../utils/files.mjs";

const lipSync = async ({ messages }) => {
  const messagePromises = messages.map(async (message, index) => {
    const fileName = `audios/message_${index}.mp3`;
    try {
      await convertTextToSpeech({ text: message.text, fileName });
      await getPhonemes({ message: index });
      message.audio = await audioFileToBase64({ fileName });
      message.lipsync = await readJsonTranscript({
        fileName: `audios/message_${index}.json`,
      });
      return message;
    } catch (error) {
      console.error(
        `Error processing message ${index}:`,
        error.message
      );
      return null;
    }
  });

  const processedMessages = await Promise.all(messagePromises);
  const validMessages = processedMessages.filter((m) => m !== null);

  return validMessages;
};

export { lipSync };
