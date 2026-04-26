#!/usr/bin/env bash
# .claude/hooks/auto-format.sh
#
# PostToolUse Hook: 파일 수정 후 자동 prettier / biome 실행
#
# 등록 (settings.json):
# {
#   "PostToolUse": [{
#     "matcher": "Edit|Write",
#     "hooks": [{
#       "type": "command",
#       "command": ".claude/hooks/auto-format.sh"
#     }]
#   }]
# }

set -euo pipefail

INPUT=$(cat)
FILE_PATH=$(echo "$INPUT" | jq -r '.tool_input.file_path // ""')

if [ -z "$FILE_PATH" ] || [ ! -f "$FILE_PATH" ]; then
  exit 0
fi

# 포매팅 대상 확장자
case "$FILE_PATH" in
  *.ts|*.tsx|*.js|*.jsx|*.json|*.md|*.css|*.scss)
    # Biome 우선, 없으면 Prettier
    if [ -f "node_modules/.bin/biome" ]; then
      node_modules/.bin/biome format --write "$FILE_PATH" 2>/dev/null || true
    elif [ -f "node_modules/.bin/prettier" ]; then
      node_modules/.bin/prettier --write "$FILE_PATH" 2>/dev/null || true
    fi
    ;;
  *.prisma)
    # Prisma 자체 포매터
    if [ -f "node_modules/.bin/prisma" ]; then
      node_modules/.bin/prisma format --schema="$FILE_PATH" 2>/dev/null || true
    fi
    ;;
  *)
    # 다른 확장자는 패스
    ;;
esac

exit 0
