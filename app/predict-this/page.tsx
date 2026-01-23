"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../components/UserAuth";
import { db } from "../lib/firebase/firebase-client";
import { doc, getDoc } from "firebase/firestore";
import buttonStyles from "../bracket/quiz/[id]/button.module.css";

export default function PredictThisPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <PredictThisContent />
    </Suspense>
  );
}

function PredictThisContent() {
  const [showTitle, setShowTitle] = useState(false);
  const [showGifAndButton, setShowGifAndButton] = useState(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();

  useEffect(() => {
    const titleTimer = setTimeout(() => setShowTitle(true), 50);
    const gifButtonTimer = setTimeout(() => setShowGifAndButton(true), 1050);
    return () => {
      clearTimeout(titleTimer);
      clearTimeout(gifButtonTimer);
    };
  }, []);

  useEffect(() => {
    if (!authLoading) {
      setIsCheckingAuth(false);
    }
  }, [authLoading]);

  const handleEnter = async () => {
    // With anonymous auth, all users are authenticated
    // Just send them directly to the menu
    router.push('/predict-this/menu');
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

      {/* GIF fade-in after title */}
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

      {/* Enter Button */}
      <button
        onClick={handleEnter}
        disabled={isCheckingAuth}
        style={{
          position: "absolute",
          top: "55%",
          left: "50%",
          transform: "translate(-50%, 250%)",
          zIndex: 2,
          background: "#F58143",
          border: "none",
          padding: 0,
          cursor: isCheckingAuth ? "wait" : "pointer",
          outlineOffset: "4px",
          borderRadius: "12px",
          opacity: isCheckingAuth ? 0.5 : 1,
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
            if (!isCheckingAuth) {
              e.currentTarget.style.transform = "translateY(-1px)";
            }
          }}
          onMouseUp={(e) => {
            e.currentTarget.style.transform = "translateY(-4px)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = "translateY(-4px)";
          }}
          onMouseOver={(e) => {
            if (!isCheckingAuth) {
              e.currentTarget.style.background = "#ffa366";
            }
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.background = "#F58143";
          }}
        >
          Enter
        </span>
      </button>
    </div>
  );
}
