import React from "react";

// Mascot uses the user's own avatars (in public/):
//   "cheer"      → mascot.png (thumbs-up), gentle wiggle  — for workouts
//   "milestone"  → mascot-milestone.png (surprised, hands-up), excited pulse, bigger — for streak milestones
const mascotCss = `
.mascot-stage{display:flex;align-items:center;justify-content:center;}
.mascot-img{height:auto;display:block;filter:drop-shadow(0 10px 16px rgba(0,0,0,.24));}

/* workout cheer: small wiggle */
.wiggle-wrap{transform-origin:50% 92%;animation:m-wiggle .6s ease-in-out infinite;}
.wiggle-wrap .mascot-img{width:155px;}
@keyframes m-wiggle{0%,100%{transform:rotate(-7deg)}50%{transform:rotate(7deg)}}

/* milestone: bigger, excited pulse (no wiggle) */
.pulse-wrap{transform-origin:50% 80%;animation:m-pulse .85s ease-in-out infinite;}
.pulse-wrap .mascot-img{width:215px;}
@keyframes m-pulse{0%,100%{transform:scale(1)}50%{transform:scale(1.07)}}

@media (prefers-reduced-motion: reduce){
  .wiggle-wrap,.pulse-wrap{animation:none !important;}
}
`;

export default function Mascot({ mood = "cheer" }) {
  const isMilestone = mood === "milestone";
  const src = `${import.meta.env.BASE_URL}${isMilestone ? "mascot-milestone.png" : "mascot.png"}`;
  return (
    <div className="mascot-stage">
      <style>{mascotCss}</style>
      <div className={isMilestone ? "pulse-wrap" : "wiggle-wrap"}>
        <img src={src} alt="" className="mascot-img" draggable="false" />
      </div>
    </div>
  );
}
