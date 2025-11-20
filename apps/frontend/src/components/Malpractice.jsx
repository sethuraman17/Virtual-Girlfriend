import React, { useRef, useState, useEffect } from "react";
import * as tf from "@tensorflow/tfjs";
import * as cocossd from "@tensorflow-models/coco-ssd";
import Webcam from "react-webcam";
import { WarningDialog } from "./WarningDialog";

export const Malpractice = () => {
  const webcamRef = useRef(null);
  const canvasRef = useRef(null);
  const [isWebcamOn, setIsWebcamOn] = useState(false);
  const [warning, setWarning] = useState(null);
  const [net, setNet] = useState(null);

  // Load the COCO-SSD model once when the component mounts.
  useEffect(() => {
    const loadNet = async () => {
      const loadedNet = await cocossd.load();
      setNet(loadedNet);
    };
    loadNet();
  }, []);

  const drawRect = (detections, ctx) => {
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    let personCount = 0;
    let mobilePhoneDetected = false;

    detections.forEach((prediction) => {
      const [x, y, width, height] = prediction["bbox"];
      const text = prediction["class"];

      if (text === "person") {
        personCount++;
      }
      if (text === "cell phone") {
        mobilePhoneDetected = true;
      }

      const color = "green";
      ctx.strokeStyle = color;
      ctx.font = "18px Arial";
      ctx.fillStyle = color;

      ctx.beginPath();
      ctx.fillText(text, x, y > 10 ? y - 5 : 10);
      ctx.rect(x, y, width, height);
      ctx.stroke();
    });

    if (personCount > 1) {
      setWarning("More than one person detected.");
    } else if (mobilePhoneDetected) {
      setWarning("Mobile phone detected.");
    } else {
      setWarning(null);
    }
  };

  // The main detection logic
  const detect = async (net) => {
    if (
      webcamRef.current &&
      webcamRef.current.video.readyState === 4
    ) {
      const video = webcamRef.current.video;
      const videoWidth = video.videoWidth;
      const videoHeight = video.videoHeight;

      webcamRef.current.video.width = videoWidth;
      webcamRef.current.video.height = videoHeight;

      canvasRef.current.width = videoWidth;
      canvasRef.current.height = videoHeight;

      const obj = await net.detect(video);
      const ctx = canvasRef.current.getContext("2d");
      drawRect(obj, ctx);
    }
  };

  // This effect runs the detection loop when the webcam is on and the model is loaded.
  useEffect(() => {
    let intervalId;
    if (isWebcamOn && net) {
      intervalId = setInterval(() => {
        detect(net);
      }, 100); // Run detection every 100ms
    }
    // Cleanup function to clear the interval when the component unmounts or dependencies change.
    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [isWebcamOn, net]);

  return (
    <div className="w-full h-full flex flex-col items-center justify-center">
      {warning && <WarningDialog message={warning} onClose={() => setWarning(null)} />}
      <button
        onClick={() => setIsWebcamOn(!isWebcamOn)}
        className="bg-blue-500 text-white px-4 py-2 rounded-lg mb-4"
      >
        {isWebcamOn ? "Turn Off Webcam" : "Turn On Webcam"}
      </button>
      {isWebcamOn && (
        <div className="relative w-[640px] h-[480px]">
          <Webcam
            ref={webcamRef}
            muted={true}
            style={{
              position: "absolute",
              marginLeft: "auto",
              marginRight: "auto",
              left: 0,
              right: 0,
              textAlign: "center",
              zIndex: 8,
              width: 640,
              height: 480,
            }}
          />
          <canvas
            ref={canvasRef}
            style={{
              position: "absolute",
              marginLeft: "auto",
              marginRight: "auto",
              left: 0,
              right: 0,
              textAlign: "center",
              zIndex: 9,
              width: 640,
              height: 480,
            }}
          />
        </div>
      )}
    </div>
  );
};
