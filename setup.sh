#!/usr/bin/env bash
set -e

REPO_DIR="$HOME/opencode-tools"
CONFIG_DIR="$HOME/.config/opencode"

echo "🔧 Installing opencode-tools..."

mkdir -p "$CONFIG_DIR"

# Symlink agents (always up-to-date via git pull)
echo "   → Linking agents..."
rm -f "$CONFIG_DIR/agents" 2>/dev/null
ln -sf "$REPO_DIR/agents" "$CONFIG_DIR/agents"

# Symlink skills dir (remove first — ln -sf into existing dir creates inside)
echo "   → Linking skills..."
rm -rf "$CONFIG_DIR/skills" 2>/dev/null
ln -sf "$REPO_DIR/skills" "$CONFIG_DIR/skills"

# Symlink config (one source of truth — edit in repo, reflects everywhere)
echo "   → Linking config..."
ln -sf "$REPO_DIR/opencode.json" "$CONFIG_DIR/opencode.json"

# Copy package.json (not symlinked, so users can add local plugins)
cp "$REPO_DIR/package.json" "$CONFIG_DIR/package.json"

# Install plugin dependencies
echo "   → Installing dependencies..."
cd "$CONFIG_DIR" && npm install --silent 2>/dev/null

echo ""
echo "✅ opencode-tools installed successfully!"
echo "   Agents:  $CONFIG_DIR/agents/"
echo "   Skills:  $CONFIG_DIR/skills/"
echo "   Config:  $CONFIG_DIR/opencode.json"
echo ""
echo "📖 Usage:"
echo "   @explorer     — research codebase before implementation"
echo "   @proposer     — suggest technical approaches"
echo "   @designer     — plan component tree, data flow, file structure"
echo "   @spec-writer  — create structured feature specs"
echo "   @orchestrator — run the full SDD pipeline"
echo "   @verifier     — run lint, typecheck, and tests"
