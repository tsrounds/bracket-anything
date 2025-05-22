"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import buttonStyles from "../quiz/[id]/button.module.css";

export default function WelcomePage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <WelcomeContent />
    </Suspense>
  );
}

function WelcomeContent() {
  const [showTitle, setShowTitle] = useState(false);
  const [showGifAndButton, setShowGifAndButton] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();

  // Get quiz id from query params (?id=...)
  const quizId = searchParams.get("id");

  useEffect(() => {
    const titleTimer = setTimeout(() => setShowTitle(true), 50); // slight delay for mount
    const gifButtonTimer = setTimeout(() => setShowGifAndButton(true), 1050); // 1s after title
    return () => {
      clearTimeout(titleTimer);
      clearTimeout(gifButtonTimer);
    };
  }, []);

  const handleStart = () => {
    // Redirect to quiz register flow with id
    if (quizId) {
      router.replace(`/quiz/${quizId}/register`);
    } else {
      // fallback: go to home or error
      router.replace("/");
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#0f172A",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Title fade-in */}
      <div
        className="integral-title"
        style={{
          position: "absolute",
          top: "55%",
          left: "50%",
          transform: "translate(-50%, -180%)",
          zIndex: 2,
          textAlign: "center",
          margin: 0,
          width: "100%",
          pointerEvents: "none",
          opacity: showTitle ? 1 : 0,
          transition: "opacity 1.5s cubic-bezier(0.4,0,0.2,1)",
        }}
      >
        PREDICT<br />THIS.
      </div>
      {/* GIF fade-in after title, always rendered */}
      <img
        src="/animations/totalgif.gif"
        alt="Predict This Animation"
        width={500}
        height={500}
        style={{
          position: "relative",
          zIndex: 1,
          maxWidth: "90vw",
          maxHeight: 500,
          display: "block",
          opacity: showGifAndButton ? 1 : 0,
          transition: "opacity 1.5s cubic-bezier(0.4,0,0.2,1)",
        }}
      />
      {/* Button fade-in after title, always rendered */}
      <button
        onClick={handleStart}
        style={{
          position: "absolute",
          top: "55%",
          left: "50%",
          transform: "translate(-50%, 250%)",
          zIndex: 2,
          background: "#F58143",
          border: "none",
          padding: 0,
          cursor: "pointer",
          outlineOffset: "4px",
          borderRadius: "12px",
        }}
        className="w-[150px] h-12 relative font-['PP_Object_Sans'] flex items-center justify-center group"
      >
        <span
          style={{
            width: "100%",
            height: "100%",
            borderRadius: "12px",
            background: "#F58143",
            color: "white",
            transform: "translateY(-4px)",
            transition: "transform 0.1s ease, background 0.2s cubic-bezier(0.4,0,0.2,1)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            userSelect: "none",
          }}
          onMouseDown={(e) => {
            e.currentTarget.style.transform = "translateY(-1px)";
          }}
          onMouseUp={(e) => {
            e.currentTarget.style.transform = "translateY(-4px)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = "translateY(-4px)";
          }}
          onMouseOver={(e) => {
            e.currentTarget.style.background = "#ffa366"; // lighter orange
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.background = "#F58143";
          }}
        >
          Start
        </span>
      </button>
    </div>
  );
} 