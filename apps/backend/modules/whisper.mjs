import { pipeline } from "@xenova/transformers";
import wav from "wav";
import fs from "fs";
import path from "path";
import { execCommand } from "../utils/files.mjs";

class WhisperPipeline {
  static instance = null;

  static async getInstance(progress_callback = null) {
    if (this.instance === null) {
      this.instance = pipeline(
        "automatic-speech-recognition",
        "Xenova/whisper-base.en",
        { progress_callback }
      );
    }
    return this.instance;
  }
}

async function convertAudioToWav({ audioData }) {
  const dir = "tmp";
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir);
  }
  const inputPath = path.join(dir, "input.webm");
  fs.writeFileSync(inputPath, audioData);
  const outputPath = path.join(dir, "output.wav");
  await execCommand({
    command: `ffmpeg -i ${inputPath} -ar 16000 -ac 1 -c:a pcm_s16le ${outputPath}`,
  });
  fs.unlinkSync(inputPath);
  return outputPath;
}

async function convertAudioToText({ audioData }) {
  const wavFilePath = await convertAudioToWav({ audioData });

  // Read the WAV file and convert it to the format the library expects
  const fileStream = fs.createReadStream(wavFilePath);
  const reader = new wav.Reader();

  const samples = await new Promise((resolve, reject) => {
    const chunks = [];
    reader.on("data", (chunk) => {
      chunks.push(chunk);
    });
    reader.on("end", () => {
      const buffer = Buffer.concat(chunks);
      // The buffer contains 16-bit PCM data, so we need to read it as such
      const pcmData = new Int16Array(
        buffer.buffer,
        buffer.byteOffset,
        buffer.length / 2
      );
      // Normalize the audio data to be between -1.0 and 1.0
      const samples = new Float32Array(pcmData.length);
      for (let i = 0; i < pcmData.length; i++) {
        samples[i] = pcmData[i] / 32768.0;
      }
      resolve(samples);
    });
    reader.on("error", reject);
    fileStream.pipe(reader);
  });

  fs.unlinkSync(wavFilePath);

  console.log("Transcribing audio...");
  const transcriber = await WhisperPipeline.getInstance();
  const output = await transcriber(samples, {
    chunk_length_s: 30,
    stride_length_s: 5,
  });

  console.log("Transcribed text:", output.text);
  return output.text;
}

export { convertAudioToText };
