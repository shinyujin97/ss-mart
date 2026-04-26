#!/usr/bin/env bash
# .claude/hooks/block-dangerous-commands.sh
#
# PreToolUse Hook: 위험한 bash 명령을 사전 차단
# Exit code 2 = 차단 (Claude Code가 명령 실행 안 함)
#
# 등록: .claude/settings.json 의 hooks 섹션에서
# {
#   "PreToolUse": [{
#     "matcher": "Bash",
#     "hooks": [{
#       "type": "command",
#       "command": ".claude/hooks/block-dangerous-commands.sh"
#     }]
#   }]
# }

set -euo pipefail

# stdin 으로 받은 JSON 에서 명령 추출
INPUT=$(cat)
COMMAND=$(echo "$INPUT" | jq -r '.tool_input.command // ""')

# 위험 패턴 정의 (정규식)
declare -a DANGEROUS_PATTERNS=(
  # 파일 시스템 파괴
  'rm\s+-rf\s+/'
  'rm\s+-rf\s+~'
  'rm\s+-rf\s+\*'
  'rm\s+-rf\s+\.\s*$'
  ':\(\)\{ :\|:& \};:'  # fork bomb

  # DB 파괴 (프로덕션 사고 사례)
  'DROP\s+DATABASE'
  'TRUNCATE\s+TABLE'
  'prisma\s+migrate\s+reset.*--force'

  # 시크릿 노출
  'cat\s+.*\.env'
  'cat\s+.*credentials'
  'echo.*\$DATABASE_URL'
  'echo.*\$.*_SECRET'
  'echo.*\$.*_KEY'

  # 시스템 파괴
  'mkfs\.'
  'dd\s+if=/dev/zero\s+of=/'
  '> /dev/sda'

  # 보안 우회
  'curl.*\|\s*sh'
  'curl.*\|\s*bash'
  'wget.*\|\s*sh'

  # Git 강제 푸시 to main/master
  'git\s+push\s+.*--force.*\b(main|master)\b'
  'git\s+reset\s+--hard.*origin/(main|master)'
)

# 패턴 검사
for pattern in "${DANGEROUS_PATTERNS[@]}"; do
  if echo "$COMMAND" | grep -qE "$pattern"; then
    echo "🛑 BLOCKED: 위험한 명령이 감지되어 차단되었습니다." >&2
    echo "" >&2
    echo "명령: $COMMAND" >&2
    echo "패턴: $pattern" >&2
    echo "" >&2
    echo "이 명령이 정말 필요하다면:" >&2
    echo "  1. 사용자가 직접 터미널에서 실행" >&2
    echo "  2. 또는 .claude/hooks/block-dangerous-commands.sh 에서 예외 추가" >&2
    exit 2
  fi
done

# 의심스러운 패턴 (경고만)
declare -a SUSPICIOUS_PATTERNS=(
  'sudo\s+'
  'chmod\s+777'
  'chown\s+'
)

for pattern in "${SUSPICIOUS_PATTERNS[@]}"; do
  if echo "$COMMAND" | grep -qE "$pattern"; then
    echo "⚠️  의심스러운 명령: $COMMAND" >&2
    echo "필요한 경우에만 사용하세요." >&2
    # exit 0 (차단은 안 함)
  fi
done

# 통과
exit 0
