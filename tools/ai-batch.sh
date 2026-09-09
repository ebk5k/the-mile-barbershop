#!/usr/bin/env bash
# Serial Grok edit batch. usage: ai-batch.sh <prompts.env> <list.txt>   (list lines: "<id> <kind>")
set -uo pipefail
S=/private/tmp/claude-501/-Users-user/9adf5716-6ccd-4812-9d9f-43350f78e91c/scratchpad/mile
source "$1"; list="$2"
while read -r id kind; do
  [[ -z "$id" ]] && continue
  out="$S/ai/$id.png"
  if [[ -s "$out" ]]; then echo "skip $id (exists)"; continue; fi
  case "$kind" in
    cut|kid) P="$PROMPT_CUT";; nail) P="$PROMPT_NAIL";; interior) P="$PROMPT_INTERIOR";; *) P="$PROMPT_CUT";;
  esac
  ar="3:4"; [[ "$kind" == "interior" ]] && ar="3:4"
  src="$S/gbp/$id.jpg"
  for attempt in 1 2 3; do
    if ~/.claude/skills/grokgen/bin/grokgen.sh "$P" "$out" --source "$src" --ar "$ar" --model grok-imagine-image-2.0 >/dev/null 2>"$S/ai/$id.err"; then
      echo "ok   $id ($kind) attempt $attempt $(date +%H:%M:%S)"; break
    else
      echo "FAIL $id attempt $attempt: $(tail -1 "$S/ai/$id.err")"; sleep 8
    fi
  done
done < "$list"
echo "BATCH DONE $(date +%H:%M:%S)"
