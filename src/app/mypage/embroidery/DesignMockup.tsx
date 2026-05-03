"use client";

// 자수 시안 카드용 사진 목업 컴포넌트
// 앞면/뒷면 모델 사진 위에 저장된 디자인 오버레이

const PHOTOS = {
  front_male:   "https://images.unsplash.com/photo-1620799140188-3b2a02fd9a77?w=400&h=540&fit=crop&crop=top&q=80",
  front_female: "https://images.unsplash.com/photo-1594938298603-c8148c4b4a47?w=400&h=540&fit=crop&crop=top&q=80",
  back_male:    "https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?w=400&h=540&fit=crop&crop=top&q=80",
  back_female:  "https://images.unsplash.com/photo-1571945153237-4929e783af4a?w=400&h=540&fit=crop&crop=top&q=80",
};

// 위치 → 뷰 (앞/뒤)
const POSITION_VIEW: Record<string, "front" | "back"> = {
  LEFT_CHEST:   "front",
  RIGHT_CHEST:  "front",
  BACK_CENTER:  "back",
  BACK_TOP:     "back",
  LEFT_SLEEVE:  "front",
  RIGHT_SLEEVE: "front",
  MULTIPLE:     "front",
};

// 위치 → 사진 위의 SVG 좌표 (400×540 기준)
const POSITION_COORDS: Record<string, { x: number; y: number }> = {
  LEFT_CHEST:   { x: 148, y: 210 },
  RIGHT_CHEST:  { x: 252, y: 210 },
  BACK_CENTER:  { x: 200, y: 255 },
  BACK_TOP:     { x: 200, y: 185 },
  LEFT_SLEEVE:  { x: 72,  y: 235 },
  RIGHT_SLEEVE: { x: 328, y: 235 },
  MULTIPLE:     { x: 200, y: 210 },
};

const POSITION_LABELS: Record<string, string> = {
  LEFT_CHEST:   "왼가슴",
  RIGHT_CHEST:  "오른가슴",
  BACK_CENTER:  "등판 중앙",
  BACK_TOP:     "등 상단",
  LEFT_SLEEVE:  "왼팔",
  RIGHT_SLEEVE: "오른팔",
  MULTIPLE:     "여러 곳",
};

interface MockupPanelProps {
  photoUrl: string;
  position: string;
  text: string | null;
  imageUrl: string | null;
  showDesign: boolean;
  label: string;
}

function MockupPanel({ photoUrl, position, text, imageUrl, showDesign, label }: MockupPanelProps) {
  const coords = POSITION_COORDS[position] ?? { x: 200, y: 220 };
  const { x, y } = coords;
  const W = 70; const H = 46;

  return (
    <div className="flex-1 flex flex-col gap-1">
      <svg viewBox="0 0 400 540" className="w-full border border-[#eee]">
        {/* 모델 사진 */}
        <image href={photoUrl} x="0" y="0" width="400" height="540"
          preserveAspectRatio="xMidYMid slice" />

        {/* 자수 영역 표시 */}
        {showDesign && (
          <g>
            <rect x={x-W/2} y={y-H/2} width={W} height={H}
              fill="rgba(200,22,29,0.12)" stroke="#c8161d" strokeWidth="2" />
            {/* 코너 */}
            {[[x-W/2,y-H/2],[x+W/2,y-H/2],[x-W/2,y+H/2],[x+W/2,y+H/2]].map(([hx,hy],i) => (
              <rect key={i} x={hx-3} y={hy-3} width={6} height={6} fill="#c8161d" />
            ))}
            {/* 디자인 내용 */}
            {text && (
              <text x={x} y={y+5} textAnchor="middle" fill="#111"
                fontSize="11" fontWeight="bold" fontFamily="monospace" letterSpacing="0.5">
                {text.slice(0, 12)}
              </text>
            )}
            {!text && imageUrl && (
              <image href={imageUrl} x={x-W/2+4} y={y-H/2+4} width={W-8} height={H-8}
                preserveAspectRatio="xMidYMid meet" />
            )}
            {!text && !imageUrl && (
              <text x={x} y={y+5} textAnchor="middle" fill="#c8161d"
                fontSize="9" fontFamily="monospace" opacity={0.8}>
                {POSITION_LABELS[position] ?? position}
              </text>
            )}
            {/* 위치 라벨 */}
            <text x={x} y={y+H/2+13} textAnchor="middle"
              fill="#c8161d" fontSize="9" fontFamily="monospace" fontWeight="bold">
              {POSITION_LABELS[position] ?? position}
            </text>
          </g>
        )}

        {/* 뷰 라벨 */}
        <rect x="0" y="0" width="400" height="22" fill="rgba(0,0,0,0.5)" />
        <text x="200" y="15" textAnchor="middle" fill="white"
          fontSize="10" fontFamily="monospace" fontWeight="bold" letterSpacing="2">
          {label}
        </text>
      </svg>
    </div>
  );
}

interface Props {
  position: string;
  text: string | null;
  imageUrl: string | null;
}

export default function DesignMockup({ position, text, imageUrl }: Props) {
  const primaryView = POSITION_VIEW[position] ?? "front";

  return (
    <div className="flex gap-1 bg-[#f8f8f8] p-1.5">
      {/* 앞면 */}
      <MockupPanel
        photoUrl={PHOTOS.front_male}
        position={position}
        text={text}
        imageUrl={imageUrl}
        showDesign={primaryView === "front"}
        label="앞면 · 남성"
      />
      <MockupPanel
        photoUrl={PHOTOS.front_female}
        position={position}
        text={text}
        imageUrl={imageUrl}
        showDesign={primaryView === "front"}
        label="앞면 · 여성"
      />
      {/* 뒷면 */}
      <MockupPanel
        photoUrl={PHOTOS.back_male}
        position={position}
        text={text}
        imageUrl={imageUrl}
        showDesign={primaryView === "back"}
        label="뒷면 · 남성"
      />
      <MockupPanel
        photoUrl={PHOTOS.back_female}
        position={position}
        text={text}
        imageUrl={imageUrl}
        showDesign={primaryView === "back"}
        label="뒷면 · 여성"
      />
    </div>
  );
}
