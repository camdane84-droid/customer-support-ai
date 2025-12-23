#!/bin/bash
# Claude Code Status Line - Display Usage & Cost

input=$(cat)

# Extract data from JSON input
MODEL=$(echo "$input" | jq -r '.model.display_name // "Unknown"')
COST=$(echo "$input" | jq -r '.cost.total_cost_usd // 0')
INPUT_TOKENS=$(echo "$input" | jq -r '.context_window.total_input_tokens // 0')
OUTPUT_TOKENS=$(echo "$input" | jq -r '.context_window.total_output_tokens // 0')
TOTAL_TOKENS=$((INPUT_TOKENS + OUTPUT_TOKENS))
CONTEXT_SIZE=$(echo "$input" | jq -r '.context_window.context_window_size // 200000')

# Calculate context usage percentage
if [ "$TOTAL_TOKENS" -gt 0 ]; then
    PERCENT=$((TOTAL_TOKENS * 100 / CONTEXT_SIZE))
else
    PERCENT=0
fi

# Format cost to 2 decimal places
COST_FORMATTED=$(printf "%.2f" "$COST")

# Display usage information
echo "[$MODEL] 💰 \$$COST_FORMATTED | 🔢 ${TOTAL_TOKENS}/${CONTEXT_SIZE} tokens (${PERCENT}%)"
