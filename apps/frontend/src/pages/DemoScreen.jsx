import { Loader } from "@react-three/drei";
import { Canvas } from "@react-three/fiber";
import { Leva } from "leva";
import { Scenario } from "../components/Scenario";
import { ChatInterface } from "../components/ChatInterface";
import { Malpractice } from "../components/Malpractice";

export const DemoScreen = () => {
  return (
    <>
      <Loader />
      <Leva collapsed hidden />
      <div className="flex flex-col h-screen">
        <div className="flex flex-1 overflow-hidden">
          <div className="w-1/2 h-full">
            <Canvas shadows camera={{ position: [0, 0, 0], fov: 10 }}>
              <Scenario />
            </Canvas>
          </div>
          <div className="w-1/2 h-full bg-gray-800 flex items-center justify-center">
            <Malpractice />
          </div>
        </div>
        <div className="w-full">
          <ChatInterface />
        </div>
      </div>
    </>
  );
};
