/** A hand-built, detailed microphone illustration — not the flat line-icon-in-a-circle used
 *  elsewhere. Metallic capsule gradient, grille texture, and layered specular highlights, aiming
 *  for the glossy/product-shot look of the reference design without an image-generation tool. */
export function HeroMic({ size = 100 }: { size?: number }) {
  const gid = 'hm';
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" fill="none" aria-hidden="true">
      <defs>
        <linearGradient id={`${gid}-body`} x1="30" y1="10" x2="70" y2="60" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#f4f7ff" />
          <stop offset="18%" stopColor="#c9d6f5" />
          <stop offset="45%" stopColor="#8fa3d9" />
          <stop offset="70%" stopColor="#5a6bb0" />
          <stop offset="100%" stopColor="#37407a" />
        </linearGradient>
        <linearGradient id={`${gid}-stand`} x1="30" y1="55" x2="70" y2="85" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#dbe3fa" />
          <stop offset="100%" stopColor="#6b78b8" />
        </linearGradient>
        <radialGradient id={`${gid}-shine`} cx="38" cy="24" r="22" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.95" />
          <stop offset="55%" stopColor="#ffffff" stopOpacity="0.25" />
          <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
        </radialGradient>
        <clipPath id={`${gid}-clip`}>
          <rect x="32" y="8" width="36" height="52" rx="18" />
        </clipPath>
      </defs>

      {/* capsule body */}
      <rect x="32" y="8" width="36" height="52" rx="18" fill={`url(#${gid}-body)`} />

      {/* grille texture — horizontal mesh lines, clipped to the capsule */}
      <g clipPath={`url(#${gid}-clip)`} stroke="#2a3363" strokeOpacity="0.35" strokeWidth="1.4">
        {[14, 18, 22, 26, 30, 34, 38, 42, 46, 50, 54].map((y) => (
          <line key={y} x1="32" y1={y} x2="68" y2={y} />
        ))}
      </g>
      <g clipPath={`url(#${gid}-clip)`} stroke="#ffffff" strokeOpacity="0.18" strokeWidth="1">
        {[15, 19, 23, 27, 31, 35, 39, 43, 47, 51].map((y) => (
          <line key={y} x1="32" y1={y} x2="68" y2={y} />
        ))}
      </g>

      {/* capsule outline for crispness */}
      <rect x="32" y="8" width="36" height="52" rx="18" fill="none" stroke="#1c2350" strokeOpacity="0.4" strokeWidth="1.2" />

      {/* specular highlight */}
      <ellipse cx="38" cy="24" rx="14" ry="20" fill={`url(#${gid}-shine)`} />
      <ellipse cx="40" cy="16" rx="4.5" ry="6" fill="#ffffff" opacity="0.85" />

      {/* stand / mount */}
      <path
        d="M24 46a26 26 0 0 0 52 0"
        stroke={`url(#${gid}-stand)`}
        strokeWidth="4.5"
        strokeLinecap="round"
        fill="none"
      />
      <line x1="50" y1="72" x2="50" y2="84" stroke={`url(#${gid}-stand)`} strokeWidth="4.5" strokeLinecap="round" />
      <line x1="36" y1="88" x2="64" y2="88" stroke={`url(#${gid}-stand)`} strokeWidth="4.5" strokeLinecap="round" />
    </svg>
  );
}
