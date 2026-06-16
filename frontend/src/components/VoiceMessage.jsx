import { useRef, useState } from "react";

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
    playing ? a.pause() : a.play();
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
    <div className="flex items-center gap-2 bg-green-50 border border-green-200 rounded-2xl px-3 py-2 min-w-[200px] max-w-[280px]">
      <button
        onClick={toggle}
        className="w-8 h-8 flex items-center justify-center bg-green-500 text-white rounded-full hover:bg-green-600 transition flex-shrink-0"
        type="button"
      >
        {playing ? "⏸" : "▶"}
      </button>

      <div className="flex-1 min-w-0">
        <input
          type="range"
          min="0"
          max="100"
          value={progress}
          onChange={handleScrub}
          className="w-full h-1 accent-green-500 cursor-pointer"
        />
        <div className="flex justify-between text-xs text-gray-400 mt-0.5">
          <span>{formatTime(audioRef.current?.currentTime)}</span>
          <span>{formatTime(duration)}</span>
        </div>
      </div>

      <audio
        ref={audioRef}
        src={src}
        onLoadedMetadata={(e) => setDuration(e.target.duration)}
        onTimeUpdate={handleTimeUpdate}
        onEnded={() => { setPlaying(false); setProgress(0); }}
      />
    </div>
  );
};

export default VoiceMessage;