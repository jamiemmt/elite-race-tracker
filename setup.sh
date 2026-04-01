#!/usr/bin/env bash
# setup.sh — First-time setup for the Garmin Workout Creator
# Run: bash setup.sh

set -e
cd "$(dirname "$0")"

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo ""
echo "╔══════════════════════════════════════════╗"
echo "║     Workout Creator — Setup              ║"
echo "╚══════════════════════════════════════════╝"
echo ""

# ── 1. Python dependency ────────────────────────────────────────────────────
echo "▶ Installing Python dependencies..."
if python3 -c "import garminconnect" 2>/dev/null; then
  echo -e "  ${GREEN}✓ garminconnect already installed${NC}"
else
  pip install garminconnect garth && echo -e "  ${GREEN}✓ Installed${NC}" || {
    echo -e "  ${RED}✗ pip install failed. Try: pip3 install garminconnect garth${NC}"
    exit 1
  }
fi

# ── 2. Credentials ──────────────────────────────────────────────────────────
echo ""
echo "▶ Configuring credentials..."
echo "  (existing .env values are kept — press Enter to skip)"
echo ""

# Load existing .env
if [ -f .env ]; then
  export $(grep -v '^#' .env | xargs) 2>/dev/null || true
fi

# Anthropic API key
if [ -z "$ANTHROPIC_API_KEY" ]; then
  echo -e "  ${YELLOW}Get your API key at: https://console.anthropic.com → API Keys${NC}"
  read -rp "  ANTHROPIC_API_KEY (sk-ant-...): " input_key
  [ -n "$input_key" ] && ANTHROPIC_API_KEY="$input_key"
else
  echo -e "  ${GREEN}✓ ANTHROPIC_API_KEY already set${NC}"
fi

# Garmin email
if [ -z "$GARMIN_EMAIL" ]; then
  read -rp "  GARMIN_EMAIL (your Garmin Connect login): " input_email
  [ -n "$input_email" ] && GARMIN_EMAIL="$input_email"
else
  echo -e "  ${GREEN}✓ GARMIN_EMAIL already set (${GARMIN_EMAIL})${NC}"
fi

# Garmin password
if [ -z "$GARMIN_PASSWORD" ]; then
  read -rsp "  GARMIN_PASSWORD: " input_pass
  echo ""
  [ -n "$input_pass" ] && GARMIN_PASSWORD="$input_pass"
else
  echo -e "  ${GREEN}✓ GARMIN_PASSWORD already set${NC}"
fi

# ── 3. Write .env ───────────────────────────────────────────────────────────
echo ""
echo "▶ Writing .env..."

# Keep any existing vars not related to this feature
existing=$(grep -v -E '^(ANTHROPIC_API_KEY|GARMIN_EMAIL|GARMIN_PASSWORD)=' .env 2>/dev/null || true)

{
  echo "$existing"
  [ -n "$ANTHROPIC_API_KEY" ] && echo "ANTHROPIC_API_KEY=$ANTHROPIC_API_KEY"
  [ -n "$GARMIN_EMAIL"      ] && echo "GARMIN_EMAIL=$GARMIN_EMAIL"
  [ -n "$GARMIN_PASSWORD"   ] && echo "GARMIN_PASSWORD=$GARMIN_PASSWORD"
} > .env.tmp && mv .env.tmp .env

echo -e "  ${GREEN}✓ .env updated${NC}"

# ── 4. Node dependencies ────────────────────────────────────────────────────
echo ""
echo "▶ Installing Node.js dependencies..."
npm install --silent && echo -e "  ${GREEN}✓ Done${NC}"

# ── 5. Test Garmin auth ─────────────────────────────────────────────────────
echo ""
echo "▶ Testing Garmin authentication..."
python3 - <<'PYEOF'
import os, sys
try:
    from garminconnect import Garmin
    email = os.environ.get("GARMIN_EMAIL", "")
    password = os.environ.get("GARMIN_PASSWORD", "")
    if not email or not password:
        print("  ⚠  Garmin credentials not set — skipping auth test")
        sys.exit(0)
    client = Garmin(email, password)
    client.login()
    info = client.get_full_name()
    print(f"  \033[0;32m✓ Logged into Garmin Connect as: {info}\033[0m")
except Exception as e:
    print(f"  \033[0;31m✗ Garmin auth failed: {e}\033[0m")
    print("    Check your GARMIN_EMAIL and GARMIN_PASSWORD in .env")
    sys.exit(1)
PYEOF

# ── 6. Local IP for iPhone ──────────────────────────────────────────────────
echo ""
echo "▶ Detecting local network address for iPhone..."

# Try multiple methods to find the LAN IP
LOCAL_IP=""
if command -v ipconfig &>/dev/null; then
  LOCAL_IP=$(ipconfig getifaddr en0 2>/dev/null || ipconfig getifaddr en1 2>/dev/null || true)
fi
if [ -z "$LOCAL_IP" ] && command -v hostname &>/dev/null; then
  LOCAL_IP=$(hostname -I 2>/dev/null | awk '{print $1}' || true)
fi
if [ -z "$LOCAL_IP" ] && command -v ip &>/dev/null; then
  LOCAL_IP=$(ip route get 1 2>/dev/null | awk '{print $NF;exit}' || true)
fi

PORT=$(grep -E '^PORT=' .env 2>/dev/null | cut -d= -f2 || echo "5000")

echo ""
echo "══════════════════════════════════════════════"
echo -e "${GREEN}  Setup complete!${NC}"
echo ""
echo "  Start the app:  npm run dev"
echo ""
if [ -n "$LOCAL_IP" ]; then
  echo "  Open on iPhone (Safari):"
  echo -e "  ${YELLOW}  http://${LOCAL_IP}:3000/garmin-workout${NC}"
  echo ""
  echo "  Then: Share → Add to Home Screen → Add"
fi
echo "══════════════════════════════════════════════"
echo ""
