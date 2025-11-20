import axios from "axios";
import fs from "fs";
import FormData from "form-data";
import path from "path";
import { exec } from "child_process";

const chatterBoxUrl = "http://127.0.0.1:4123/v1/audio/speech/upload";
const voiceSamplePath = path.join(process.cwd(), "../../chatterbox-tts-api/voice-sample.mp3");

async function convertTextToSpeech({ text, fileName }) {
  try {
    const formData = new FormData();
    formData.append("input", text);
    formData.append("voice_file", fs.createReadStream(voiceSamplePath));

    const response = await axios.post(chatterBoxUrl, formData, {
      headers: {
        ...formData.getHeaders(),
      },
      responseType: "arraybuffer",
    });

    if (response.status === 200) {
      const wavFileName = fileName.replace(".mp3", ".wav");
      fs.writeFileSync(wavFileName, response.data);
      console.log("✅ Voice-cloned audio saved as", wavFileName);

      // Convert WAV to MP3
      await new Promise((resolve, reject) => {
        const cmd = `ffmpeg -y -i "${wavFileName}" "${fileName}"`;
        exec(cmd, (error, stdout, stderr) => {
          if (error) return reject(stderr || error);
          console.log(`✅ WAV→MP3 done for ${fileName}`);
          resolve();
        });
      });
    } else {
      throw new Error(`Chatter-box request failed with status ${response.status}: ${response.data}`);
    }
  } catch (error) {
    console.error("Error converting text to speech with chatter-box:", error.message);
    throw error;
  }
}

export { convertTextToSpeech };
