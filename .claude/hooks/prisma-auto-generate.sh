#!/usr/bin/env bash
# .claude/hooks/prisma-auto-generate.sh
#
# PostToolUse Hook: prisma/schema.prisma 수정 후 자동 generate
#
# 등록 (settings.json):
# {
#   "PostToolUse": [{
#     "matcher": "Edit|Write",
#     "hooks": [{
#       "type": "command",
#       "command": ".claude/hooks/prisma-auto-generate.sh"
#     }]
#   }]
# }

set -euo pipefail

INPUT=$(cat)
FILE_PATH=$(echo "$INPUT" | jq -r '.tool_input.file_path // ""')

# Prisma 스키마 파일이 아니면 패스
case "$FILE_PATH" in
  */schema.prisma|schema.prisma)
    ;;
  *)
    exit 0
    ;;
esac

echo "🔄 Prisma 스키마 변경 감지. prisma generate 실행 중..." >&2

if [ -f "node_modules/.bin/prisma" ]; then
  if node_modules/.bin/prisma generate 2>&1; then
    echo "✅ Prisma 클라이언트 재생성 완료" >&2
  else
    echo "❌ Prisma generate 실패. 스키마를 검토하세요." >&2
    # generate 실패는 차단 안 함 (코드 작성 중일 수 있음)
  fi
else
  echo "⚠️  prisma 가 설치되지 않았습니다. npm install prisma 필요." >&2
fi

exit 0
