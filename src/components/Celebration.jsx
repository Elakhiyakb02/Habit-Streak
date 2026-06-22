import React, { useMemo, useEffect } from "react";
import Mascot from "./Mascot.jsx";
import { milestoneMessage } from "../lib/streak.js";

const CHEERS = ["Workout done! 💪", "Crushed it! 🔥", "Look at you go! ✨", "Beast mode 💪", "Proud of you! 🌟"];
const CONFETTI_COLORS = ["#f59e0b", "#10b981", "#ef4444", "#3b82f6", "#ec4899", "#fde047"];

const celebrationCss = `
.celebrate-root{position:fixed;inset:0;z-index:50;overflow:hidden;pointer-events:auto;cursor:pointer;}
.cel-backdrop{position:absolute;inset:0;background:rgba(255,255,255,.5);animation:cel-fade .25s ease both;}
.confetti{position:absolute;top:-14px;border-radius:2px;opacity:0;
  animation-name:confetti-fall;animation-timing-function:cubic-bezier(.25,.7,.4,1);animation-fill-mode:forwards;}
@keyframes confetti-fall{0%{opacity:1;transform:translateY(-10px) rotate(0deg)}100%{opacity:0;transform:translateY(106vh) rotate(720deg)}}
.cel-mascot{position:absolute;left:50%;bottom:16%;transform:translateX(-50%);
  display:flex;flex-direction:column;align-items:center;gap:12px;animation:cel-pop .35s ease-out both;}
.cel-bubble{background:#1c1917;color:#fef3c7;
  font-family:'Fredoka','ui-rounded',system-ui,sans-serif;font-weight:600;font-size:17px;letter-spacing:.3px;
  padding:9px 18px;border-radius:9999px;box-shadow:0 8px 22px rgba(0,0,0,.28);white-space:nowrap;
  animation:bubble-bob 1.1s ease-in-out infinite;}
.cel-skip{position:absolute;bottom:6%;left:50%;transform:translateX(-50%);
  font-family:'Fredoka',system-ui,sans-serif;font-size:11px;color:#78716c;opacity:.8;animation:cel-fade 1s ease both;animation-delay:.6s;}
@keyframes cel-fade{from{opacity:0}to{opacity:1}}
@keyframes cel-pop{0%{opacity:0;transform:translateX(-50%) scale(.6)}100%{opacity:1;transform:translateX(-50%) scale(1)}}
@keyframes bubble-bob{0%,100%{transform:translateY(0)}50%{transform:translateY(-4px)}}
`;

export default function Celebration({ milestone, onDone }) {
  const isMilestone = milestone != null;
  const reduce =
    typeof window !== "undefined" &&
    window.matchMedia &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const cheer = useMemo(
    () => (isMilestone ? milestoneMessage(milestone) : CHEERS[Math.floor(Math.random() * CHEERS.length)]),
    [isMilestone, milestone]
  );
  const pieces = useMemo(
    () =>
      Array.from({ length: reduce ? 0 : isMilestone ? 74 : 40 }).map(() => ({
        left: Math.random() * 100,
        delay: Math.random() * (isMilestone ? 0.6 : 0.35),
        dur: 1.6 + Math.random() * (isMilestone ? 1.8 : 1.3),
        color: CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)],
        size: 6 + Math.random() * 8,
      })),
    [reduce, isMilestone]
  );

  useEffect(() => {
    const t = setTimeout(onDone, reduce ? 1500 : isMilestone ? 4400 : 2800);
    return () => clearTimeout(t);
  }, [onDone, reduce, isMilestone]);

  return (
    <div className="celebrate-root" aria-hidden="true" onClick={onDone}>
      <style>{celebrationCss}</style>
      <div className="cel-backdrop" />
      {pieces.map((p, i) => (
        <span
          key={i}
          className="confetti"
          style={{
            left: `${p.left}%`,
            background: p.color,
            width: p.size,
            height: p.size,
            animationDelay: `${p.delay}s`,
            animationDuration: `${p.dur}s`,
          }}
        />
      ))}
      <div className="cel-mascot">
        <div className="cel-bubble">{cheer}</div>
        <Mascot mood={isMilestone ? "milestone" : "cheer"} />
      </div>
      <div className="cel-skip">tap to dismiss</div>
    </div>
  );
}
