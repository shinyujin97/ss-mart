export const COLOR_HEX: Record<string, string> = {
  "블랙": "#111111", "BLACK": "#111111",
  "화이트": "#f5f5f5", "WHITE": "#f5f5f5",
  "네이비": "#1a2a4a", "NAVY": "#1a2a4a",
  "D.네이비": "#0d1b2a", "다크네이비": "#0d1b2a",
  "M.네이비": "#1a2a6a",
  "그레이": "#8a8a8a", "GRAY": "#8a8a8a", "GREY": "#8a8a8a",
  "M.그레이": "#6e6e6e", "C.그레이": "#9c9c9c",
  "라이트그레이": "#c0c0c0", "L.그레이": "#c0c0c0",
  "차콜": "#3d3d3d",
  "블루": "#1e40af", "BLUE": "#1e40af",
  "청지": "#4a6fa5",
  "레드": "#c8161d", "RED": "#c8161d", "빨강": "#c8161d",
  "오렌지": "#f97316", "ORANGE": "#f97316",
  "노랑": "#ffd400", "형광": "#adff2f",
  "카키": "#8B8B4B", "KHAKI": "#8B8B4B",
  "베이지": "#c8b89a", "BEIGE": "#c8b89a",
  "브라운": "#8B4513", "BROWN": "#8B4513",
  "머스터드": "#e1ad21",
  "그린": "#4a7c59", "GREEN": "#4a7c59",
  "퍼플": "#6b46c1", "PURPLE": "#6b46c1",
  "핑크": "#f472b6", "PINK": "#f472b6",
};

export function expandSizeRange(range: string): string[] {
  const XL_ORDER = ["S", "M", "L", "XL", "2XL", "3XL", "4XL", "5XL"];
  const xlMatch = range.match(/^([SMLX\d]+)~(\d?XL)$/i);
  if (xlMatch) {
    const from = xlMatch[1].toUpperCase();
    const to = xlMatch[2].toUpperCase();
    const fi = XL_ORDER.indexOf(from);
    const ti = XL_ORDER.indexOf(to);
    if (fi !== -1 && ti !== -1) return XL_ORDER.slice(fi, ti + 1);
  }
  const numMatch = range.match(/^(\d+)~(\d+)$/);
  if (numMatch) {
    const from = parseInt(numMatch[1]);
    const to = parseInt(numMatch[2]);
    if (from >= 220 && to <= 310) {
      const arr: string[] = [];
      for (let i = from; i <= to; i += 5) arr.push(String(i));
      return arr;
    }
    if (from >= 26 && to <= 46) {
      const arr: string[] = [];
      for (let i = from; i <= to; i += 2) arr.push(String(i));
      return arr;
    }
    if (from >= 80 && to <= 130) {
      const arr: string[] = [];
      for (let i = from; i <= to; i += 5) arr.push(String(i));
      return arr;
    }
  }
  return [range];
}

export function parseNameOptions(name: string): {
  colors: { color: string; colorHex: string }[];
  sizes: string[];
} {
  const parts = name.split("/").map((p) => p.trim()).filter(Boolean);
  const colorCandidates = parts.slice(-3).join("/");
  const foundColors: { color: string; colorHex: string }[] = [];
  const colorNames = colorCandidates.split(/[&,+]/).map((c) => c.trim());
  for (const cn of colorNames) {
    if (COLOR_HEX[cn]) {
      if (!foundColors.find((c) => c.color === cn))
        foundColors.push({ color: cn, colorHex: COLOR_HEX[cn] });
    } else {
      const matched = Object.keys(COLOR_HEX).find((k) => cn.includes(k));
      if (matched && !foundColors.find((c) => c.color === matched))
        foundColors.push({ color: matched, colorHex: COLOR_HEX[matched] });
    }
  }

  const sizes: string[] = [];
  for (const part of parts) {
    if (/^[SMLX\d]+~[\dXL]+$/i.test(part.trim())) {
      sizes.push(...expandSizeRange(part.trim()));
      break;
    }
    const inner = part.match(/(\d+~\d+)/);
    if (inner) {
      sizes.push(...expandSizeRange(inner[1]));
      break;
    }
  }

  if (sizes.length === 0) {
    const n = name.toLowerCase();
    if (/신발|안전화|화\b|슈즈|boots|shoe/.test(n)) {
      sizes.push(...["240", "245", "250", "255", "260", "265", "270", "275", "280"]);
    } else if (/바지|하의|팬츠|pants/.test(n)) {
      sizes.push(...["28", "30", "32", "34", "36", "38"]);
    } else {
      sizes.push(...["M", "L", "XL", "2XL", "3XL", "4XL"]);
    }
  }

  return { colors: foundColors, sizes };
}
