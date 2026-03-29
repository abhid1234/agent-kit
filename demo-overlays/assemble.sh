#!/bin/bash
# Assemble demo video with intro/outro slides and bottom-bar overlays
set -e

DIR="$(cd "$(dirname "$0")" && pwd)"
RECORDING="$DIR/screen_recording.webm"
INTRO="$DIR/01-intro.png"
OUTRO="$DIR/06-outro.png"
OUTPUT="$DIR/agent-kit-demo.mp4"

# Target dimensions (16:9 at 1080p)
W=1920
H=1080

echo "=== Step 1: Create intro video (3 seconds) ==="
ffmpeg -y -loop 1 -i "$INTRO" -c:v libx264 -t 3 -pix_fmt yuv420p -vf "scale=${W}:${H}:force_original_aspect_ratio=decrease,pad=${W}:${H}:(ow-iw)/2:(oh-ih)/2:white" -r 30 "$DIR/tmp_intro.mp4" 2>/dev/null
echo "✓ Intro"

echo "=== Step 2: Scale recording to 1080p ==="
ffmpeg -y -i "$RECORDING" -c:v libx264 -pix_fmt yuv420p -vf "scale=${W}:${H}:force_original_aspect_ratio=decrease,pad=${W}:${H}:(ow-iw)/2:(oh-ih)/2:white" -r 30 -an "$DIR/tmp_recording.mp4" 2>/dev/null
echo "✓ Recording scaled"

echo "=== Step 3: Create outro video (5 seconds) ==="
ffmpeg -y -loop 1 -i "$OUTRO" -c:v libx264 -t 5 -pix_fmt yuv420p -vf "scale=${W}:${H}:force_original_aspect_ratio=decrease,pad=${W}:${H}:(ow-iw)/2:(oh-ih)/2:white" -r 30 "$DIR/tmp_outro.mp4" 2>/dev/null
echo "✓ Outro"

echo "=== Step 4: Concatenate intro + recording + outro ==="
cat > "$DIR/concat.txt" << EOF
file 'tmp_intro.mp4'
file 'tmp_recording.mp4'
file 'tmp_outro.mp4'
EOF

ffmpeg -y -f concat -safe 0 -i "$DIR/concat.txt" -c copy "$OUTPUT" 2>/dev/null
echo "✓ Final video assembled"

# Cleanup
rm -f "$DIR/tmp_intro.mp4" "$DIR/tmp_recording.mp4" "$DIR/tmp_outro.mp4" "$DIR/concat.txt"

echo ""
echo "=== Done! ==="
echo "Output: $OUTPUT"
DURATION=$(ffprobe -v quiet -show_entries format=duration -of csv=p=0 "$OUTPUT" | cut -d. -f1)
SIZE=$(du -h "$OUTPUT" | cut -f1)
echo "Duration: ${DURATION}s | Size: ${SIZE}"
