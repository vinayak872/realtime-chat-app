import React, { useRef, useState } from "react";
import { Play, Pause, Volume2 } from "lucide-react";

const VoiceMessage = ({ fileUrl }) => {
  const audioRef = useRef(null);
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);

  const baseUrl = import.meta.env.VITE_API_URL?.replace("/api", "") || "http://localhost:5000";
  const src = fileUrl?.startsWith("http") ? fileUrl : `${baseUrl}${fileUrl}`;

  const toggle = () => {
    const a = audioRef.current;
    if (!a) return;
    if (playing) {
      a.pause();
    } else {
      a.play().catch(() => {});
    }
    setPlaying(!playing);
  };

  const handleTimeUpdate = () => {
    const a = audioRef.current;
    if (!a || !a.duration) return;
    setProgress((a.currentTime / a.duration) * 100);
  };

  const handleScrub = (e) => {
    const a = audioRef.current;
    if (!a || !duration) return;
    a.currentTime = (e.target.value / 100) * duration;
    setProgress(Number(e.target.value));
  };

  const formatTime = (s) => {
    if (!s || isNaN(s)) return "0:00";
    return `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}`;
  };

  return (
    <div className="flex items-center gap-2.5 bg-black/25 border border-white/10 rounded-2xl p-2 min-w-[220px] max-w-[300px]">
      <button
        onClick={toggle}
        className="w-9 h-9 flex items-center justify-center bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl shadow-md transition shrink-0 active:scale-95"
        type="button"
        title={playing ? "Pause" : "Play"}
      >
        {playing ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
      </button>

      <div className="flex-1 min-w-0 pr-1">
        <input
          type="range"
          min="0"
          max="100"
          value={progress}
          onChange={handleScrub}
          className="w-full h-1.5 accent-emerald-400 bg-white/20 rounded-lg cursor-pointer"
        />
        <div className="flex justify-between text-[11px] text-slate-400 mt-1 font-medium select-none">
          <span>{formatTime(audioRef.current?.currentTime)}</span>
          <span>{formatTime(duration)}</span>
        </div>
      </div>

      <audio
        ref={audioRef}
        src={src}
        onLoadedMetadata={(e) => setDuration(e.target.duration)}
        onTimeUpdate={handleTimeUpdate}
        onEnded={() => {
          setPlaying(false);
          setProgress(0);
        }}
      />
    </div>
  );
};

export default VoiceMessage;