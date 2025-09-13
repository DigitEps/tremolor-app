"use client";
import React from "react";

interface VoiceData {
  tu: number;
  ego: number;
  ombra: number;
}

interface VoiceAnalysisChartProps {
  data: VoiceData;
  size?: "small" | "medium" | "large";
  showLabels?: boolean;
}

export default function VoiceAnalysisChart({ 
  data, 
  size = "medium", 
  showLabels = true 
}: VoiceAnalysisChartProps) {
  const total = Math.max(data.tu + data.ego + data.ombra, 1);
  
  const segments = [
    { value: data.tu, color: "#FFD700", label: "Tu", description: "Integració i saviesa" },
    { value: data.ego, color: "#38bdf8", label: "Ego", description: "Control i protecció" },
    { value: data.ombra, color: "#a78bfa", label: "Ombra", description: "Aspectes ocults" },
  ];

  const sizeConfig = {
    small: { radius: 40, strokeWidth: 8, fontSize: "text-xs" },
    medium: { radius: 60, strokeWidth: 12, fontSize: "text-sm" },
    large: { radius: 80, strokeWidth: 16, fontSize: "text-base" }
  };

  const config = sizeConfig[size];
  const circumference = 2 * Math.PI * config.radius;
  
  let offset = 0;

  return (
    <div className="flex flex-col items-center space-y-4">
      {/* Chart SVG */}
      <div className="relative">
        <svg 
          width={config.radius * 2 + 40} 
          height={config.radius * 2 + 40} 
          className="transform -rotate-90"
        >
          {/* Background circle */}
          <circle
            cx={config.radius + 20}
            cy={config.radius + 20}
            r={config.radius}
            fill="none"
            stroke="#1f2937"
            strokeWidth={config.strokeWidth}
            opacity={0.3}
          />
          
          {/* Voice segments */}
          {segments.map((segment, index) => {
            const percentage = segment.value / total;
            const strokeDasharray = `${percentage * circumference} ${circumference}`;
            const strokeDashoffset = -offset;
            
            offset += percentage * circumference;
            
            return (
              <circle
                key={index}
                cx={config.radius + 20}
                cy={config.radius + 20}
                r={config.radius}
                fill="none"
                stroke={segment.color}
                strokeWidth={config.strokeWidth}
                strokeDasharray={strokeDasharray}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                className="transition-all duration-1000 ease-out"
                style={{
                  filter: `drop-shadow(0 0 8px ${segment.color}40)`
                }}
              />
            );
          })}
        </svg>
        
        {/* Center text */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center">
            <div className={`font-bold text-white ${config.fontSize}`}>
              {Math.round((segments.find(s => s.value === Math.max(...segments.map(seg => seg.value)))?.value || 0) / total * 100)}%
            </div>
            <div className={`text-gray-400 ${config.fontSize === "text-base" ? "text-xs" : "text-xs"}`}>
              Dominant
            </div>
          </div>
        </div>
      </div>

      {/* Labels */}
      {showLabels && (
        <div className="grid grid-cols-1 gap-3 w-full max-w-sm">
          {segments.map((segment, index) => (
            <div key={index} className="flex items-center justify-between p-3 rounded-lg bg-white/5 border border-white/10">
              <div className="flex items-center space-x-3">
                <div 
                  className="w-4 h-4 rounded-full"
                  style={{ backgroundColor: segment.color }}
                />
                <div>
                  <div className="font-medium text-white">{segment.label}</div>
                  <div className="text-xs text-gray-400">{segment.description}</div>
                </div>
              </div>
              <div className="text-right">
                <div className="font-bold text-white">
                  {Math.round(segment.value / total * 100)}%
                </div>
                <div className="text-xs text-gray-400">
                  {segment.value} respostes
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}