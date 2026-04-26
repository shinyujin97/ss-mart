import { PrismaClient } from "../../src/generated/prisma/client";

export async function seedBrands(prisma: PrismaClient) {
  console.log("  브랜드 시드 시작...");

  const brands = [
    // 국내 작업복 브랜드
    { slug: "piozen", name: "PIOZEN", nameKr: "피오젠" },
    { slug: "burtle", name: "BURTLE", nameKr: "버틀" },
    { slug: "jawin", name: "JAWIN", nameKr: "자윈" },
    { slug: "aitoz", name: "AITOZ", nameKr: "아이토스" },
    { slug: "selfpro", name: "SELF PRO", nameKr: "셀프프로" },
    { slug: "kolon", name: "KOLON", nameKr: "코오롱" },
    { slug: "hanil", name: "HANIL", nameKr: "한일" },
    { slug: "dongsan", name: "DONGSAN", nameKr: "동산" },
    { slug: "prowork", name: "PROWORK", nameKr: "프로워크" },
    { slug: "korsar", name: "KORSAR", nameKr: "코르사" },
    // 글로벌 워크웨어
    { slug: "carhartt", name: "CARHARTT", nameKr: "칼하트" },
    { slug: "dickies", name: "DICKIES", nameKr: "딕키즈" },
    { slug: "levis", name: "LEVI'S", nameKr: "리바이스" },
    { slug: "blaklader", name: "BLAKLADER", nameKr: "블랙레이더" },
    { slug: "portwest", name: "PORTWEST", nameKr: "포트웨스트" },
    { slug: "snickers", name: "SNICKERS", nameKr: "스니커스" },
    { slug: "engelbert", name: "ENGELBERT STRAUSS", nameKr: "엥겔베르트스트라우스" },
    { slug: "fristads", name: "FRISTADS", nameKr: "프리스타즈" },
    { slug: "mascot", name: "MASCOT", nameKr: "마스코트" },
    { slug: "helly-hansen", name: "HELLY HANSEN", nameKr: "헬리한센" },
    // 안전화
    { slug: "k2-safety", name: "K2 SAFETY", nameKr: "K2 세이프티" },
    { slug: "red-wing", name: "RED WING", nameKr: "레드윙" },
    { slug: "timberland-pro", name: "TIMBERLAND PRO", nameKr: "팀버랜드 프로" },
    { slug: "caterpillar", name: "CATERPILLAR", nameKr: "캐터필러" },
    { slug: "wolverine", name: "WOLVERINE", nameKr: "울버린" },
    { slug: "rocky", name: "ROCKY", nameKr: "로키" },
    { slug: "terra", name: "TERRA", nameKr: "테라" },
    { slug: "cofra", name: "COFRA", nameKr: "코프라" },
    { slug: "honeywell-safety", name: "HONEYWELL", nameKr: "하니웰" },
    { slug: "uvex-shoes", name: "UVEX SHOES", nameKr: "우벡스 안전화" },
    // 안전용품
    { slug: "3m", name: "3M", nameKr: "쓰리엠" },
    { slug: "msa", name: "MSA", nameKr: "MSA" },
    { slug: "uvex", name: "UVEX", nameKr: "우벡스" },
    { slug: "ansell", name: "ANSELL", nameKr: "앤셀" },
    { slug: "dupont", name: "DUPONT", nameKr: "듀폰" },
    { slug: "kimberly-clark", name: "KIMBERLY-CLARK", nameKr: "킴벌리클라크" },
    { slug: "lakeland", name: "LAKELAND", nameKr: "레이클랜드" },
    { slug: "delta-plus", name: "DELTA PLUS", nameKr: "델타플러스" },
    { slug: "jsp", name: "JSP", nameKr: "JSP" },
    { slug: "petzl", name: "PETZL", nameKr: "페츨" },
    // F&B / 의료
    { slug: "haccp", name: "HACCP", nameKr: "HACCP" },
    { slug: "bragard", name: "BRAGARD", nameKr: "브라가르" },
    { slug: "chef-works", name: "CHEF WORKS", nameKr: "셰프웍스" },
    { slug: "uncommon-threads", name: "UNCOMMON THREADS", nameKr: "언커먼스레드" },
    { slug: "landau", name: "LANDAU", nameKr: "랜도" },
    { slug: "cherokee", name: "CHEROKEE", nameKr: "체로키" },
    { slug: "grey", name: "GREY'S ANATOMY", nameKr: "그레이아나토미" },
    { slug: "barco", name: "BARCO", nameKr: "바르코" },
    { slug: "wonderwink", name: "WONDERWINK", nameKr: "원더윙크" },
    { slug: "healing-hands", name: "HEALING HANDS", nameKr: "힐링핸즈" },
    // 국내 추가 브랜드
    { slug: "orion", name: "ORION", nameKr: "오리온" },
    { slug: "seongbo", name: "SEONGBO", nameKr: "성보" },
    { slug: "namyoung", name: "NAMYOUNG", nameKr: "남영" },
    { slug: "daewon", name: "DAEWON", nameKr: "대원" },
    { slug: "dongwha", name: "DONGWHA", nameKr: "동화" },
    { slug: "sungjin", name: "SUNGJIN", nameKr: "성진" },
    { slug: "korea-uniform", name: "KOREA UNIFORM", nameKr: "한국유니폼" },
    { slug: "workflex", name: "WORKFLEX", nameKr: "워크플렉스" },
    { slug: "safetex", name: "SAFETEX", nameKr: "세이프텍스" },
    { slug: "prochoice", name: "PROCHOICE", nameKr: "프로초이스" },
    // 아웃도어 / 기타
    { slug: "columbia", name: "COLUMBIA", nameKr: "컬럼비아" },
    { slug: "the-north-face", name: "THE NORTH FACE", nameKr: "노스페이스" },
    { slug: "patagonia", name: "PATAGONIA", nameKr: "파타고니아" },
    { slug: "arc-teryx", name: "ARC'TERYX", nameKr: "아크테릭스" },
    { slug: "mammut", name: "MAMMUT", nameKr: "마무트" },
    { slug: "salewa", name: "SALEWA", nameKr: "살레와" },
    { slug: "haglofs", name: "HAGLÖFS", nameKr: "호그로프스" },
    { slug: "rab", name: "RAB", nameKr: "라브" },
    { slug: "fjallraven", name: "FJÄLLRÄVEN", nameKr: "피엘라벤" },
    { slug: "bergans", name: "BERGANS", nameKr: "베르간스" },
    // 추가
    { slug: "industrial-star", name: "INDUSTRIAL STAR", nameKr: "인더스트리얼스타" },
    { slug: "worksafe", name: "WORKSAFE", nameKr: "워크세이프" },
    { slug: "kovea", name: "KOVEA", nameKr: "코베아" },
    { slug: "sata", name: "SATA", nameKr: "사타" },
    { slug: "stanley", name: "STANLEY", nameKr: "스탠리" },
    { slug: "dewalt", name: "DEWALT", nameKr: "디월트" },
    { slug: "milwaukee", name: "MILWAUKEE", nameKr: "밀워키" },
    { slug: "bosch", name: "BOSCH", nameKr: "보쉬" },
    { slug: "makita", name: "MAKITA", nameKr: "마키타" },
    { slug: "klass", name: "KLASS", nameKr: "클라스" },
  ];

  for (let i = 0; i < brands.length; i++) {
    const b = brands[i];
    await prisma.brand.upsert({
      where: { slug: b.slug },
      update: { name: b.name, nameKr: b.nameKr, sortOrder: i },
      create: { slug: b.slug, name: b.name, nameKr: b.nameKr, sortOrder: i },
    });
  }

  console.log(`  ✓ 브랜드 시드 완료 (${brands.length}개)`);
}
