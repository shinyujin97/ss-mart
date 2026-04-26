#!/usr/bin/env bash
# .claude/hooks/inject-skill-hints.sh
#
# UserPromptSubmit Hook: 사용자 프롬프트의 키워드 분석하여
# 관련 Skill 사용 힌트를 주입
#
# 등록 (settings.json):
# {
#   "UserPromptSubmit": [{
#     "hooks": [{
#       "type": "command",
#       "command": ".claude/hooks/inject-skill-hints.sh"
#     }]
#   }]
# }

set -euo pipefail

INPUT=$(cat)
PROMPT=$(echo "$INPUT" | jq -r '.user_prompt // ""')

# 키워드 → Skill 매핑
HINTS=""

if echo "$PROMPT" | grep -qiE "자수|마킹|시안|simulator|embroidery"; then
  HINTS="${HINTS}\n💡 자수 관련 작업: '.claude/skills/embroidery-system/SKILL.md' 참조"
fi

if echo "$PROMPT" | grep -qiE "단체|견적|B2B|bulk|quote"; then
  HINTS="${HINTS}\n💡 단체주문 작업: '.claude/skills/bulk-order-flow/SKILL.md' 참조"
fi

if echo "$PROMPT" | grep -qiE "결제|주문|환불|payment|checkout|refund"; then
  HINTS="${HINTS}\n💡 결제 / 주문 작업: '.claude/skills/payment-flow/SKILL.md' 참조"
fi

if echo "$PROMPT" | grep -qiE "상품|카테고리|브랜드|catalog|product"; then
  HINTS="${HINTS}\n💡 상품 카탈로그 작업: '.claude/skills/product-catalog/SKILL.md' 참조"
fi

if echo "$PROMPT" | grep -qiE "마이그레이션|스키마|migration|prisma|seed"; then
  HINTS="${HINTS}\n💡 DB 작업: '.claude/skills/database-migration/SKILL.md' 참조"
fi

if echo "$PROMPT" | grep -qiE "컴포넌트|시안|HTML|디자인|component|tailwind"; then
  HINTS="${HINTS}\n💡 컴포넌트 작업: '.claude/skills/component-builder/SKILL.md' + 시안 HTML (/mnt/user-data/outputs/workwear/)"
fi

# 비즈니스 핵심 키워드 (도메인 규칙 강조)
if echo "$PROMPT" | grep -qiE "저작권|디즈니|마블|copyright"; then
  HINTS="${HINTS}\n⚠️  저작권 IP 자수 절대 금지 (docs/domain/business-rules.md 1.7)"
fi

if echo "$PROMPT" | grep -qiE "환불.*자수|자수.*환불"; then
  HINTS="${HINTS}\n⚠️  자수 추가 상품 단순 변심 환불 불가 (전자상거래법)"
fi

# 힌트가 있으면 stdout 으로 출력 (Claude 컨텍스트에 주입됨)
if [ -n "$HINTS" ]; then
  echo "## 🎯 관련 가이드"
  echo -e "$HINTS"
fi

exit 0
