import { createContext, useContext, useEffect, useRef, useState } from "react";

const backendUrl = "http://localhost:3000";

const SpeechContext = createContext();

const SILENCE_THRESHOLD = 2000; // 2 seconds of silence triggers send
const VOICE_THRESHOLD = 0.01; // Average volume threshold to detect speech

export const SpeechProvider = ({ children }) => {
  const [recording, setRecording] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState(null);
  const [messages, setMessages] = useState([]);
  const [message, setMessage] = useState();
  const [loading, setLoading] = useState(false);

  const audioContext = useRef(null);
  const analyser = useRef(null);
  const dataArray = useRef(null);
  const source = useRef(null);
  const silenceTimer = useRef(null);
  const animationFrame = useRef(null);
  const chunks = useRef([]);

  const onDataAvailable = (e) => {
    chunks.current.push(e.data);
  };

  const sendAudioData = async () => {
    const audioBlob = new Blob(chunks.current, { type: "audio/webm" });
    chunks.current = [];
    const reader = new FileReader();
    reader.readAsDataURL(audioBlob);
    reader.onloadend = async function () {
      const base64Audio = reader.result.split(",")[1];
      setLoading(true);
      try {
        const data = await fetch(`${backendUrl}/sts`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ audio: base64Audio, chatHistory: messages }),
        });
        const response = (await data.json()).messages;
        setMessages((messages) => [...messages, ...response]);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
        // After sending, if still in recording mode, start the next recording
        if (recording) {
            mediaRecorder.start();
        }
      }
    };
  };

  const setupMediaRecorder = (stream) => {
    const newMediaRecorder = new MediaRecorder(stream);
    setMediaRecorder(newMediaRecorder);

    // Setup VAD
    audioContext.current = new (window.AudioContext || window.webkitAudioContext)();
    analyser.current = audioContext.current.createAnalyser();
    analyser.current.fftSize = 256;
    dataArray.current = new Uint8Array(analyser.current.frequencyBinCount);
    source.current = audioContext.current.createMediaStreamSource(stream);
    source.current.connect(analyser.current);
  };

  useEffect(() => {
    if (mediaRecorder) {
      mediaRecorder.ondataavailable = onDataAvailable;
      mediaRecorder.onstop = sendAudioData;
    }
  }, [mediaRecorder]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      navigator.mediaDevices
        .getUserMedia({ audio: true })
        .then(setupMediaRecorder)
        .catch((err) => console.error("Error accessing microphone:", err));
    }
    return () => {
        if (animationFrame.current) {
            cancelAnimationFrame(animationFrame.current);
        }
    }
  }, []);

  const VAD = () => {
    analyser.current.getByteFrequencyData(dataArray.current);
    const average = dataArray.current.reduce((a, b) => a + b) / dataArray.current.length / 128.0;

    if (average > VOICE_THRESHOLD) {
      clearTimeout(silenceTimer.current);
    } else {
      if (!silenceTimer.current) {
        silenceTimer.current = setTimeout(() => {
          if (mediaRecorder.state === "recording") {
            mediaRecorder.stop();
          }
          silenceTimer.current = null;
        }, SILENCE_THRESHOLD);
      }
    }
    animationFrame.current = requestAnimationFrame(VAD);
  };

  const startRecording = () => {
    if (mediaRecorder) {
      chunks.current = [];
      mediaRecorder.start();
      setRecording(true);
      animationFrame.current = requestAnimationFrame(VAD);
    }
  };

  const stopRecording = () => {
    if (mediaRecorder) {
      if (mediaRecorder.state === "recording") {
        mediaRecorder.stop();
      }
      setRecording(false);
      if (animationFrame.current) {
          cancelAnimationFrame(animationFrame.current)
      }
      if (silenceTimer.current) {
        clearTimeout(silenceTimer.current)
      }
    }
  };

  const tts = async ({ message, userName }) => {
    setLoading(true);
    try {
      const data = await fetch(`${backendUrl}/tts`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ message, chatHistory: messages, userName }),
      });
      if (!data.ok) {
        const errorText = await data.text();
        console.error("TTS request failed:", errorText);
        return;
      }
      const response = (await data.json()).messages;
      setMessages((messages) => [...messages, ...response]);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const onMessagePlayed = () => {
    setMessages((messages) => messages.slice(1));
  };

  useEffect(() => {
    if (messages.length > 0) {
      setMessage(messages[0]);
    } else {
      setMessage(null);
    }
  }, [messages]);

  return (
    <SpeechContext.Provider
      value={{
        startRecording,
        stopRecording,
        recording,
        tts,
        message,
        onMessagePlayed,
        loading,
      }}
    >
      {children}
    </SpeechContext.Provider>
  );
};

export const useSpeech = () => {
  const context = useContext(SpeechContext);
  if (!context) {
    throw new Error("useSpeech must be used within a SpeechProvider");
  }
  return context;
};
