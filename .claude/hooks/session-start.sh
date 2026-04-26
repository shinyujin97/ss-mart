#!/usr/bin/env bash
# .claude/hooks/session-start.sh
#
# SessionStart Hook: 세션 시작 시 프로젝트 상태 / 최근 변경 자동 로드
#
# 등록 (settings.json):
# {
#   "SessionStart": [{
#     "hooks": [{
#       "type": "command",
#       "command": ".claude/hooks/session-start.sh"
#     }]
#   }]
# }

set -euo pipefail

# CLAUDE.md 는 자동으로 로드되므로 추가 컨텍스트만

OUTPUT=""

# 1. Git 최근 커밋 5개 (있는 경우)
if [ -d ".git" ]; then
  RECENT_COMMITS=$(git log --oneline -5 2>/dev/null || echo "")
  if [ -n "$RECENT_COMMITS" ]; then
    OUTPUT="${OUTPUT}\n## 📝 최근 커밋\n\`\`\`\n${RECENT_COMMITS}\n\`\`\`\n"
  fi
fi

# 2. 변경된 파일 (있는 경우)
if [ -d ".git" ]; then
  CHANGED=$(git status --short 2>/dev/null | head -10 || echo "")
  if [ -n "$CHANGED" ]; then
    OUTPUT="${OUTPUT}\n## 🔧 변경된 파일\n\`\`\`\n${CHANGED}\n\`\`\`\n"
  fi
fi

# 3. 환경 정보
OUTPUT="${OUTPUT}\n## 🌍 환경"
OUTPUT="${OUTPUT}\n- NODE_ENV: ${NODE_ENV:-development}"
OUTPUT="${OUTPUT}\n- 작업 디렉토리: $(pwd)"

# 4. 마지막 마이그레이션 (있는 경우)
if [ -d "prisma/migrations" ]; then
  LAST_MIGRATION=$(ls -1 prisma/migrations 2>/dev/null | grep -v "migration_lock" | sort | tail -1 || echo "")
  if [ -n "$LAST_MIGRATION" ]; then
    OUTPUT="${OUTPUT}\n- 마지막 마이그레이션: $LAST_MIGRATION"
  fi
fi

# 5. 안내
OUTPUT="${OUTPUT}\n\n## 📚 빠른 참조"
OUTPUT="${OUTPUT}\n- 비즈니스 규칙: docs/domain/business-rules.md"
OUTPUT="${OUTPUT}\n- DB 스키마: docs/database/schema.md"
OUTPUT="${OUTPUT}\n- 디자인 시안: /mnt/user-data/outputs/workwear/ (15~29안)"
OUTPUT="${OUTPUT}\n- 컴포넌트 가이드: .claude/skills/component-builder/SKILL.md"

# stdout 으로 출력 (Claude 컨텍스트에 추가됨)
echo -e "$OUTPUT"

exit 0
