export function RouteSignature() {
  return (
    <svg
      viewBox="0 0 400 400"
      fill="none"
      className="h-full w-full"
      aria-hidden="true"
    >
      <defs>
        <radialGradient id="glow" cx="50%" cy="35%" r="65%">
          <stop offset="0%" stopColor="hsl(38 92% 50%)" stopOpacity="0.18" />
          <stop offset="100%" stopColor="hsl(38 92% 50%)" stopOpacity="0" />
        </radialGradient>
      </defs>
      <rect width="400" height="400" fill="url(#glow)" />

      {[...Array(6)].map((_, i) => (
        <circle
          key={i}
          cx={40 + i * 20}
          cy={40 + i * 14}
          r="1"
          fill="hsl(210 25% 90%)"
          opacity="0.3"
        />
      ))}

      <path
        d="M 62 300 C 130 210, 150 130, 240 96"
        stroke="hsl(210 25% 90%)"
        strokeOpacity="0.45"
        strokeWidth="1.5"
        strokeDasharray="1 9"
        strokeLinecap="round"
        fill="none"
      />
      <path
        d="M 240 96 C 290 78, 320 100, 336 150"
        stroke="hsl(210 25% 90%)"
        strokeOpacity="0.45"
        strokeWidth="1.5"
        strokeDasharray="1 9"
        strokeLinecap="round"
        fill="none"
      />

      <g>
        <circle cx="62" cy="300" r="5" fill="hsl(38 92% 50%)" />
        <circle cx="62" cy="300" r="9" stroke="hsl(38 92% 50%)" strokeOpacity="0.4" fill="none" />
      </g>
      <g>
        <circle cx="336" cy="150" r="4" fill="hsl(210 25% 92%)" />
      </g>

      <g transform="translate(240 96) rotate(-38)">
        <path
          d="M 0 -9 L 3 3 L 10 7 L 10 9 L 3 7 L 1 14 L 4 16 L 4 18 L 0 17 L -4 18 L -4 16 L -1 14 L -3 7 L -10 9 L -10 7 L -3 3 Z"
          fill="hsl(38 92% 50%)"
        />
      </g>
    </svg>
  );
}
