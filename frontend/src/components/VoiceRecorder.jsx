import { useState, useRef } from "react";
import { messageService } from "../services/api";
import { Mic, Square } from "lucide-react";

const VoiceRecorder = ({ chatId, onSent }) => {
  const [recording, setRecording] = useState(false);
  const [duration, setDuration] = useState(0);
  const mediaRef = useRef(null);
  const chunksRef = useRef([]);
  const timerRef = useRef(null);

  const getMimeType = () => {
    const types = ["audio/webm", "audio/mp4", "audio/ogg"];
    for (const type of types) {
      if (MediaRecorder.isTypeSupported(type)) return type;
    }
    return "";
  };

  const start = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mimeType = getMimeType();
      const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : {});
      chunksRef.current = [];

      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) chunksRef.current.push(e.data);
      };

      recorder.onstop = () => {
        stream.getTracks().forEach((t) => t.stop());
        upload();
      };
      recorder.start();
      mediaRef.current = recorder;
      setRecording(true);
      setDuration(0);
      timerRef.current = setInterval(() => setDuration((d) => d + 1), 1000);
    } catch (err) {
      alert("Microphone access denied. Please allow microphone permission.");
    }
  };

  const stop = () => {
    if (mediaRef.current && mediaRef.current.state !== "inactive") {
      mediaRef.current.stop();
    }
    clearInterval(timerRef.current);
    setRecording(false);
  };

  const upload = async () => {
    if (chunksRef.current.length === 0) return;

    const actualMimeType = chunksRef.current[0]?.type || getMimeType() || "audio/webm";
    const baseMimeType = actualMimeType.split(";")[0] || "audio/webm";
    let ext = actualMimeType.split("/")[1]?.split(";")[0] || "webm";

    if (ext.includes("mp4") || ext.includes("m4a")) ext = "mp4";
    else if (ext.includes("ogg") || ext.includes("opus")) ext = "ogg";

    const blob = new Blob(chunksRef.current, { type: actualMimeType });

    if (blob.size < 1000) {
      console.warn("Recording was too short");
      return;
    }

    const formData = new FormData();
    const file = new File([blob], `voice.${ext}`, { type: baseMimeType });
    formData.append("file", file);

    try {
      const response = await messageService.uploadFile(formData);
      onSent({
        fileUrl: response.data.fileUrl,
        fileType: "audio",
        fileName: response.data.fileName || `voice.${ext}`,
      });
    } catch (err) {
      console.error("Voice upload failed:", err.response?.data || err);
      alert(err.response?.data?.message || "Failed to send voice note.");
    }
  };

  const formatDuration = (s) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;

  return (
    <button
      onMouseDown={start}
      onMouseUp={stop}
      onTouchStart={(e) => { e.preventDefault(); start(); }}
      onTouchEnd={(e) => { e.preventDefault(); stop(); }}
      className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition select-none ${
        recording
          ? "bg-rose-500 text-white animate-pulse shadow-lg shadow-rose-500/30"
          : "text-slate-400 hover:text-emerald-400 hover:bg-white/5 active:scale-95"
      }`}
      title={recording ? "Release to send" : "Hold to record voice"}
      type="button"
    >
      <Mic className="w-4 h-4" />
      {recording && <span>{formatDuration(duration)}</span>}
    </button>
  );
};

export default VoiceRecorder;