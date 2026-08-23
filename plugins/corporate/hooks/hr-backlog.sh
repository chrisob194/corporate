#!/usr/bin/env bash
# SessionStart: mention unfiled HR records, if the team has left any.
#
# Records under .corporate/hr/ are complaints agents filed about the team
# itself. They are worth nothing until someone runs /corporate:hr, and nothing
# else in a fresh session would mention them. Records already turned into
# issues live in .corporate/hr/filed/ and are not counted.
#
# Stdout is injected as session context. Silence is the normal case.

dir=".corporate/hr"
[ -d "$dir" ] || exit 0

count=0
for f in "$dir"/*.md; do
  [ -f "$f" ] && count=$((count + 1))
done

[ "$count" -eq 0 ] && exit 0

if [ "$count" -eq 1 ]; then
  echo "1 unfiled HR report sits in $dir — run /corporate:hr to review it."
else
  echo "$count unfiled HR reports sit in $dir — run /corporate:hr to review them."
fi

exit 0
