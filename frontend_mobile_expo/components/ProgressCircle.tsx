import React from "react";
import { View, Text } from "react-native";
import Svg, { Circle } from "react-native-svg";

type Props = {
  progress: number; // 0 → fini , 1 → temps plein restant
  text?: string; // optionnel pour afficher le temps restant
  size?: number; // diamètre du cercle
};

export default function ProgressCircle({ progress, text, size = 40 }: Props) {
  const strokeWidth = 4;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  // sécurise la valeur entre 0 et 1
  const validProgress = Math.min(Math.max(progress, 0), 1);
  const strokeDashoffset = circumference * (1 - validProgress);

  return (
    <View style={{ width: size, height: size, justifyContent: "center", alignItems: "center" }}>
      <Svg width={size} height={size}>
        <Circle
          stroke="rgba(255,255,255,0.15)"
          fill="none"
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeWidth={strokeWidth}
        />
        <Circle
          stroke="#F59E0B"
          fill="none"
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeWidth={strokeWidth}
          strokeDasharray={`${circumference}`}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
        />
      </Svg>
      {text && (
        <View style={{ position: "absolute", justifyContent: "center", alignItems: "center" }}>
          <Text style={{ color: "#F59E0B", fontSize: 10, fontWeight: "600" }}>{text}</Text>
        </View>
      )}
    </View>
  );
}
