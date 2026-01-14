#!/bin/bash
# Build script for email templates
# Compiles MJML to HTML and escapes curly braces for TinyTemplate

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SRC_DIR="$SCRIPT_DIR/../src"
BUILD_DIR="$SCRIPT_DIR/../build"

echo "📧 Building email templates..."
echo ""

echo "Step 1: Compiling MJML templates..."
npx -y mjml "$SRC_DIR"/*.mjml -o "$BUILD_DIR/"
echo "✓ MJML compilation complete"
echo ""

echo "Step 2: Escaping curly braces for TinyTemplate..."
node "$SCRIPT_DIR/escape-for-tinytemplate.js"
echo ""

echo "Email templates built successfully!"
