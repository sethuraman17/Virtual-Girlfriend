import { useAnimations, useGLTF } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { button, useControls } from "leva";
import React, { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { useSpeech } from "../hooks/useSpeech";
import facialExpressions from "../constants/facialExpressions";
import visemesMapping from "../constants/visemesMapping";
import morphTargets from "../constants/morphTargets";

export function Avatar(props) {
  const { nodes, materials, scene } = useGLTF("/models/model.glb");
  const { animations } = useGLTF("/models/animations.glb");
  const { message, onMessagePlayed } = useSpeech();
  const [lipsync, setLipsync] = useState();
  const [setupMode, setSetupMode] = useState(false);
  const [blink, setBlink] = useState(false);
  const [facialExpression, setFacialExpression] = useState("");
  const [audio, setAudio] = useState();

  const group = useRef();
  const { actions, mixer } = useAnimations(animations, group);
  const [animation, setAnimation] = useState(
    animations.find((a) => a.name === "Idle") ? "Idle" : animations[0].name
  );

  // 🔄 Handle Speech + Audio
  useEffect(() => {
    if (!message) {
      setAnimation("Idle");
      return;
    }
    setAnimation(message.animation);
    setFacialExpression(message.facialExpression);
    setLipsync(message.lipsync);
    const audio = new Audio("data:audio/mp3;base64," + message.audio);
    audio.play();
    setAudio(audio);
    audio.onended = onMessagePlayed;
  }, [message]);

  // 🔁 Handle Animation Playback
  useEffect(() => {
    if (actions[animation]) {
      actions[animation].reset().fadeIn(0.5).play();
      return () => {
        if (actions[animation]) actions[animation].fadeOut(0.5);
      };
    }
  }, [animation]);

  // 🧩 Smooth morph target blending
  const lerpMorphTarget = (target, value, speed = 0.1) => {
    scene.traverse((child) => {
      if (child.isSkinnedMesh && child.morphTargetDictionary) {
        const index = child.morphTargetDictionary[target];
        if (index !== undefined && child.morphTargetInfluences[index] !== undefined) {
          child.morphTargetInfluences[index] = THREE.MathUtils.lerp(
            child.morphTargetInfluences[index],
            value,
            speed
          );
        }
      }
    });
  };

  // 🧠 Blink Behavior
  useEffect(() => {
    let blinkTimeout;
    const nextBlink = () => {
      blinkTimeout = setTimeout(() => {
        setBlink(true);
        setTimeout(() => {
          setBlink(false);
          nextBlink();
        }, 150);
      }, THREE.MathUtils.randInt(1500, 5000));
    };
    nextBlink();
    return () => clearTimeout(blinkTimeout);
  }, []);

  // 🧏‍♀️ Frame Update Loop (facial expressions + lipsync)
  useFrame(() => {
    if (!setupMode) {
      morphTargets.forEach((key) => {
        const mapping = facialExpressions[facialExpression];
        if (key !== "eyeBlinkLeft" && key !== "eyeBlinkRight") {
          lerpMorphTarget(key, mapping?.[key] || 0, 0.1);
        }
      });

      lerpMorphTarget("eyeBlinkLeft", blink ? 1 : 0, 0.5);
      lerpMorphTarget("eyeBlinkRight", blink ? 1 : 0, 0.5);
    }

    // Lipsync
    if (message && lipsync && audio) {
      const currentAudioTime = audio.currentTime;
      const appliedMorphTargets = [];

      for (let i = 0; i < lipsync.mouthCues.length; i++) {
        const mouthCue = lipsync.mouthCues[i];
        if (currentAudioTime >= mouthCue.start && currentAudioTime <= mouthCue.end) {
          const viseme = visemesMapping[mouthCue.value];
          if (viseme) {
            appliedMorphTargets.push(viseme);
            lerpMorphTarget(viseme, 1, 0.2);
          }
          break;
        }
      }

      Object.values(visemesMapping).forEach((value) => {
        if (!appliedMorphTargets.includes(value)) lerpMorphTarget(value, 0, 0.1);
      });
    }
  });

  // 🧪 Leva Controls
  useControls("FacialExpressions", {
    animation: {
      value: animation,
      options: animations.map((a) => a.name),
      onChange: (value) => setAnimation(value),
    },
    facialExpression: {
      options: Object.keys(facialExpressions),
      onChange: (value) => setFacialExpression(value),
    },
    toggleSetup: button(() => setSetupMode(!setupMode)),
  });

  return (
    <group {...props} dispose={null} ref={group} position={[0, -0.5, 0]}>
      <primitive object={nodes.Hips} />
      {Object.values(nodes)
        .filter((n) => n.isSkinnedMesh)
        .map((mesh) => (
          <skinnedMesh
            key={mesh.name}
            geometry={mesh.geometry}
            material={mesh.material || materials.Head}
            skeleton={mesh.skeleton}
            morphTargetDictionary={mesh.morphTargetDictionary}
            morphTargetInfluences={mesh.morphTargetInfluences}
          />
        ))}
    </group>
  );
}

useGLTF.preload("/models/model.glb");
