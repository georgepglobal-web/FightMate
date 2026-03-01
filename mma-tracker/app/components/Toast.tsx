"use client";

import { useState, useEffect } from "react";

interface ToastProps {
  message: string;
  type?: "success" | "error" | "info";
  duration?: number;
  onClose: () => void;
}

export default function Toast({ message, type = "info", duration = 3000, onClose }: ToastProps) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => { setVisible(false); setTimeout(onClose, 300); }, duration);
    return () => clearTimeout(timer);
  }, [duration, onClose]);

  const colors = {
    success: "bg-green-600 border-green-400",
    error: "bg-red-600 border-red-400",
    info: "bg-blue-600 border-blue-400",
  };

  return (
    <div className={`fixed top-4 right-4 z-[100] px-4 py-3 rounded-xl border text-white text-sm font-medium shadow-lg transition-all duration-300 ${colors[type]} ${visible ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-2"}`}>
      {message}
    </div>
  );
}
