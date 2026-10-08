#!/bin/bash
# Daily social-posting reminder. Enconvo Cron runs it at 19:27 and sends the
# output to Telegram. REMIND_DATE=YYYY-MM-DD previews another day.
set -u

DIR="$(cd "$(dirname "$0")" && pwd)"
ROOT="$(cd "$DIR/../.." && pwd)"
TODAY="${REMIND_DATE:-$(date +%Y-%m-%d)}"
DOW=$(date -j -f "%Y-%m-%d" "$TODAY" +%u)
WEEK=$(date -j -f "%Y-%m-%d" "$TODAY" +%V)
WEEKDAYS=(_ 周一 周二 周三 周四 周五 周六 周日)

prev_day() { date -j -v-1d -f "%Y-%m-%d" "$1" +%Y-%m-%d; }
cell() { echo "$ROW" | awk -F'|' -v n="$1" '{gsub(/^ +| +$/, "", $n); print $n}'; }

# Weekly rhythm row: | Day | Weekday | Pillar | What to post | Main platforms |
ROW=$(grep -E "^\| $DOW \|" "$DIR/THEMES.md" | head -1)
PILLAR=$(cell 4)
WHAT=$(cell 5)
WHERE=$(cell 6)

# Streak: consecutive logged days, ending today (or yesterday if today isn't logged yet).
streak=0
d="$TODAY"
grep -q "^| $d |" "$DIR/LOG.md" || d=$(prev_day "$d")
while grep -q "^| $d |" "$DIR/LOG.md"; do
  streak=$((streak + 1))
  d=$(prev_day "$d")
done

echo "📣 今日发帖 · $TODAY ${WEEKDAYS[$DOW]} · 已连续 $streak 天"
echo "主题：$PILLAR — $WHAT"
echo "主平台：$WHERE"
echo
echo "今日清单（约 15 分钟，美东早 8–10 点 = 北京 20–22 点）"
echo "• X：1 条原创（带视频或截图，链接放第一条回复）+ 回复 5–10 条相关帖子"
echo "• Reddit：3–5 条有用评论，不推广"
echo "• Facebook 主页：复用 X 那条"

if [ "$DOW" = 2 ]; then
  SUB=$(awk '/^## Reddit/{f=1; next} /^## /{f=0} f && /^[0-9]+\. /' "$DIR/THEMES.md" \
    | sed -n "$(( (10#$WEEK % 6) + 1 ))p" | sed -E 's/^[0-9]+\. //')
  echo "• 本周 Reddit 帖（每周 1 次，注明 I'm the developer）：$SUB"
fi

if [ "$DOW" = 5 ]; then
  NEWEST=$(ls -t "$ROOT"/changelogs/v*.md 2>/dev/null | head -1)
  if [ -n "$NEWEST" ]; then
    echo
    echo "本周更新素材（$(basename "$NEWEST")）："
    HIGHLIGHTS=$(grep -E '^- \*\*' "$NEWEST" | sed -E 's/^- \*\*([^*]+)\*\*.*/• \1/' | head -6)
    # An unpolished beta file has no bold highlights yet; fall back to its section headings.
    [ -n "$HIGHLIGHTS" ] || HIGHLIGHTS=$(grep -E '^## ' "$NEWEST" | grep -v Highlights | sed -E 's/^## /• /' | head -6)
    echo "$HIGHLIGHTS"
  fi
fi

echo
QUEUE="$DIR/queue/$TODAY.md"
if [ -f "$QUEUE" ]; then
  echo "今日草稿："
  cat "$QUEUE"
else
  echo "今天还没有草稿。选题库里的下一个 $PILLAR 选题："
  awk -v dow="$DOW" '$0 ~ "^### " dow " " {f=1; next} /^#/{f=0} f && /^- \[ \]/' "$DIR/THEMES.md" \
    | head -2 | sed -E 's/^- \[ \] /• /'
  echo "（在 Claude Code 里说「写今天的帖子」即可生成）"
fi

if [ "$DOW" = 7 ]; then
  echo
  echo "📝 明天周一：在 Claude Code 里说「写下周的帖子」，把 7 天草稿排进 Buffer / Meta Business Suite。"
fi

echo
echo "发完后在 social/LOG.md 记一行，或把链接发给 Claude。"
