import React, { useState, useEffect } from "react";
import { Canvas } from "@react-three/fiber";
import { Scenario } from "../components/Scenario";
import { ChatInterface } from "../components/ChatInterface";
import { useSpeech } from "../hooks/useSpeech";

export const InterviewScreen = () => {
  const [resumeSummary, setResumeSummary] = useState(null);
  const [userName, setUserName] = useState(null);
  const [interviewStarted, setInterviewStarted] = useState(false);
  const { tts } = useSpeech();

  useEffect(() => {
    const summary = localStorage.getItem("resumeSummary");
    const name = localStorage.getItem("userName");
    if (summary && name) {
      setResumeSummary(JSON.parse(summary));
      setUserName(name);
    }
  }, []);

  const startInterview = () => {
    setInterviewStarted(true);
    tts({
      message: "Hello, I am ready to start the interview.",
      userName,
    });
  };

  return (
    <>
      <div className="flex h-screen">
        <div className="w-1/2 h-full">
          <Canvas shadows camera={{ position: [0, 0, 0], fov: 10 }}>
            <Scenario />
          </Canvas>
        </div>
        <div className="w-1/2 h-full bg-gray-800 flex flex-col p-4">
          {resumeSummary && !interviewStarted && (
            <div className="bg-white p-4 rounded-lg mb-4">
              <h2 className="text-xl font-bold mb-2">Resume Summary</h2>
              <p>
                <strong>Name:</strong> {resumeSummary.name}
              </p>
              <p>
                <strong>Education:</strong> {resumeSummary.education}
              </p>
              <p>
                <strong>Skills:</strong> {resumeSummary.skills.join(", ")}
              </p>
              <p>
                <strong>Experience:</strong> {resumeSummary.experience_summary}
              </p>
              <p>
                <strong>Projects:</strong> {resumeSummary.projects.join(", ")}
              </p>
              <p>
                <strong>Career Objective:</strong>{" "}
                {resumeSummary.career_objective}
              </p>
              <button
                onClick={startInterview}
                className="bg-blue-500 text-white px-4 py-2 rounded-lg mt-4"
              >
                Start Interview
              </button>
            </div>
          )}
          {interviewStarted && <ChatInterface userName={userName} />}
        </div>
      </div>
    </>
  );
};
