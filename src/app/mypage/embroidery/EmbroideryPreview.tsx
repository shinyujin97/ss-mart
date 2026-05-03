
const POSITION_COORDS: Record<string, { x: number; y: number; view: "front" | "back" }> = {
  LEFT_CHEST:   { x: 148, y: 165, view: "front" },
  RIGHT_CHEST:  { x: 252, y: 165, view: "front" },
  BACK_CENTER:  { x: 200, y: 290, view: "back"  },
  BACK_TOP:     { x: 200, y: 165, view: "back"  },
  LEFT_SLEEVE:  { x: 64,  y: 210, view: "front" },
  RIGHT_SLEEVE: { x: 336, y: 210, view: "front" },
  MULTIPLE:     { x: 200, y: 210, view: "front" },
};

const SIZE_DIMS: Record<string, { w: number; h: number }> = {
  SMALL:   { w: 44,  h: 30  },
  MEDIUM:  { w: 70,  h: 48  },
  LARGE:   { w: 88,  h: 60  },
  XLARGE:  { w: 130, h: 88  },
  XXLARGE: { w: 172, h: 116 },
};

interface ShirtSVGProps {
  position: string;
  size: string;
  text: string | null;
  imageUrl: string | null;
  customPositions?: Record<string, { x: number; y: number }> | null;
  compact?: boolean;
}

function ShirtSVG({ position, size, text, imageUrl, customPositions, compact = false }: ShirtSVGProps) {
  const defaults = POSITION_COORDS[position] ?? POSITION_COORDS.BACK_CENTER;
  const custom = customPositions?.[position];
  const x = custom?.x ?? defaults.x;
  const y = custom?.y ?? defaults.y;
  const { view } = defaults;
  const { w: W, h: H } = SIZE_DIMS[size] ?? SIZE_DIMS.MEDIUM;
  const isFront = view === "front";

  return (
    <svg viewBox="0 0 400 500" className="w-full h-full" style={{ userSelect: "none" }}>
      <defs>
        <linearGradient id={`sg-${position}`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="100%" stopColor="#f0f0f0" />
        </linearGradient>
        <linearGradient id={`shadow-${position}`} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="rgba(0,0,0,0)" />
          <stop offset="100%" stopColor="rgba(0,0,0,0.05)" />
        </linearGradient>
      </defs>

      {isFront ? (
        <g>
          <path d="M 88 88 L 18 145 L 22 155 L 45 165 L 90 165 Z" fill={`url(#sg-${position})`} stroke="rgba(0,0,0,0.1)" strokeWidth="1" />
          <path d="M 312 88 L 382 145 L 378 155 L 355 165 L 310 165 Z" fill={`url(#sg-${position})`} stroke="rgba(0,0,0,0.1)" strokeWidth="1" />
          <path d="M 88 88 L 45 165 L 45 440 L 355 440 L 355 165 L 312 88 L 260 66 C 248 110 152 110 140 66 Z" fill={`url(#sg-${position})`} stroke="rgba(0,0,0,0.1)" strokeWidth="1" />
          <path d="M 88 88 L 45 165 L 45 440 L 355 440 L 355 165 L 312 88 L 260 66 C 248 110 152 110 140 66 Z" fill={`url(#shadow-${position})`} />
          <path d="M 140 66 C 152 110 248 110 260 66" fill="none" stroke="rgba(0,0,0,0.08)" strokeWidth="1.5" />
        </g>
      ) : (
        <g>
          <path d="M 88 88 L 18 145 L 22 155 L 45 165 L 90 165 Z" fill={`url(#sg-${position})`} stroke="rgba(0,0,0,0.1)" strokeWidth="1" />
          <path d="M 312 88 L 382 145 L 378 155 L 355 165 L 310 165 Z" fill={`url(#sg-${position})`} stroke="rgba(0,0,0,0.1)" strokeWidth="1" />
          <path d="M 88 88 L 45 165 L 45 440 L 355 440 L 355 165 L 312 88 L 260 66 C 248 110 152 110 140 66 Z" fill={`url(#sg-${position})`} stroke="rgba(0,0,0,0.1)" strokeWidth="1" />
          <path d="M 88 88 L 45 165 L 45 440 L 355 440 L 355 165 L 312 88 L 260 66 C 248 110 152 110 140 66 Z" fill={`url(#shadow-${position})`} />
          <text x="200" y="120" textAnchor="middle" fill="rgba(0,0,0,0.08)" fontSize="11" fontFamily="monospace" letterSpacing="2">BACK</text>
        </g>
      )}

      <rect x={x - W/2} y={y - H/2} width={W} height={H}
        fill="rgba(200,22,29,0.07)" stroke="#c8161d" strokeWidth="1.5" />
      {!compact && ([[x-W/2,y-H/2],[x+W/2,y-H/2],[x-W/2,y+H/2],[x+W/2,y+H/2]] as [number,number][]).map(([hx,hy],i) => (
        <rect key={i} x={hx-3} y={hy-3} width={6} height={6} fill="#c8161d" />
      ))}

      {text ? (
        <text x={x} y={y + 5} textAnchor="middle" fill="#111"
          fontSize={Math.max(8, Math.min(13, W / 7))} fontWeight="bold"
          fontFamily="monospace" letterSpacing="0.3">
          {text.slice(0, compact ? 8 : 14)}
        </text>
      ) : imageUrl ? (
        <image href={imageUrl} x={x-W/2+4} y={y-H/2+4} width={W-8} height={H-8}
          preserveAspectRatio="xMidYMid meet" />
      ) : (
        <text x={x} y={y + 4} textAnchor="middle" fill="#c8161d"
          fontSize="9" fontFamily="monospace" opacity={0.7}>
          자수 영역
        </text>
      )}

      {!compact && (
        <text x={x} y={y + H/2 + 14} textAnchor="middle"
          fill="#c8161d" fontSize="9" fontFamily="monospace" fontWeight="bold">
          {position}
        </text>
      )}
    </svg>
  );
}

interface Props {
  position: string;
  size: string;
  text: string | null;
  imageUrl: string | null;
  customPositions?: Record<string, { x: number; y: number }> | null;
}

export default function EmbroideryPreview({ position, size, text, imageUrl, customPositions }: Props) {
  return (
    <div className="w-full aspect-square bg-[#f8f8f8] border-b border-[var(--line)] flex items-center justify-center p-6">
      <ShirtSVG position={position} size={size} text={text} imageUrl={imageUrl} customPositions={customPositions} compact />
    </div>
  );
}
