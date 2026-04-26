const BLOCKED_KEYWORDS = [
  // 영화/애니
  "디즈니", "disney", "마블", "marvel", "DC코믹스", "닌텐도", "nintendo",
  "포켓몬", "pokemon", "피카츄", "pikachu", "미키", "mickey", "슈퍼맨", "superman",
  "배트맨", "batman", "스파이더맨", "spiderman", "헬로키티", "hello kitty",
  // 스포츠
  "NBA", "MLB", "NFL", "EPL", "레알마드리드", "바르셀로나", "맨체스터",
  // 명품
  "루이비통", "louis vuitton", "구찌", "gucci", "샤넬", "chanel", "에르메스", "hermes",
  "프라다", "prada", "버버리", "burberry",
  // 한국 애니/캐릭터
  "짱구", "crayon shin", "도라에몽", "doraemon", "드래곤볼", "나루토", "원피스", "onepiece",
  "카카오프렌즈", "라이언", "어피치", "라인프렌즈", "브라운",
  // 게임
  "마리오", "mario", "젤다", "zelda", "소닉", "sonic", "리그오브레전드", "롤캐릭",
  // 정치/종교/혐오
  "히틀러", "나치", "스와스티카", "swastika",
];

export function validateCopyright(text: string): { passed: boolean; reason?: string } {
  const lower = text.toLowerCase();
  for (const kw of BLOCKED_KEYWORDS) {
    if (lower.includes(kw.toLowerCase())) {
      return {
        passed: false,
        reason: `저작권 보호 콘텐츠가 포함되어 있습니다 ("${kw}"). 오리지널 디자인이나 자체 캐릭터를 사용해주세요.`,
      };
    }
  }
  return { passed: true };
}
