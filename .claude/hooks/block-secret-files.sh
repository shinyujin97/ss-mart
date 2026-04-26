#!/usr/bin/env bash
# .claude/hooks/block-secret-files.sh
#
# PreToolUse Hook: .env / credentials 파일 접근 차단
# Read / Edit / Write / Glob 도구 호출 시 검사
#
# 등록 (settings.json):
# {
#   "PreToolUse": [{
#     "matcher": "Read|Edit|Write|Glob",
#     "hooks": [{
#       "type": "command",
#       "command": ".claude/hooks/block-secret-files.sh"
#     }]
#   }]
# }

set -euo pipefail

INPUT=$(cat)

# Read / Edit / Write 의 경우 file_path
# Glob 의 경우 pattern
FILE_PATH=$(echo "$INPUT" | jq -r '.tool_input.file_path // .tool_input.path // ""')
PATTERN=$(echo "$INPUT" | jq -r '.tool_input.pattern // ""')

TARGET="${FILE_PATH}${PATTERN}"

if [ -z "$TARGET" ]; then
  exit 0
fi

# 차단 대상 파일 패턴
declare -a BLOCKED_PATTERNS=(
  '\.env$'
  '\.env\.production'
  '\.env\.local'
  '\.env\.staging'
  'credentials\.json'
  'secrets\.json'
  'private[_-]?key'
  'id_rsa'
  '\.pem$'
  '\.key$'
  '\.p12$'
  '\.pfx$'
  'aws-credentials'
  '\.aws/credentials'
  '\.npmrc'  # npm 토큰 포함 가능
  '\.netrc'
)

# 예외 (개발용 .env.example 은 OK)
declare -a ALLOWED_PATTERNS=(
  '\.env\.example'
  '\.env\.sample'
  '\.env\.template'
)

# 예외 먼저 체크
for allowed in "${ALLOWED_PATTERNS[@]}"; do
  if echo "$TARGET" | grep -qE "$allowed"; then
    exit 0
  fi
done

# 차단 패턴 체크
for pattern in "${BLOCKED_PATTERNS[@]}"; do
  if echo "$TARGET" | grep -qE "$pattern"; then
    echo "🛑 BLOCKED: 시크릿 파일 접근이 차단되었습니다." >&2
    echo "" >&2
    echo "파일: $TARGET" >&2
    echo "패턴: $pattern" >&2
    echo "" >&2
    echo "시크릿은 Claude 에 노출되어선 안 됩니다." >&2
    echo "필요한 환경 변수 정보는 docs/deployment/env-variables.md 참조." >&2
    exit 2
  fi
done

exit 0
