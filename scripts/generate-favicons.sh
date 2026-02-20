#!/bin/bash
# Generate PNG favicons from SVG
# Requires: librsvg2-bin (rsvg-convert) or inkscape
# Install on Ubuntu: sudo apt install librsvg2-bin

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PUBLIC_DIR="$SCRIPT_DIR/../frontend/public"

echo "Generating favicons..."

# Check if rsvg-convert is available
if command -v rsvg-convert &> /dev/null; then
    CONVERTER="rsvg"
elif command -v inkscape &> /dev/null; then
    CONVERTER="inkscape"
else
    echo "Error: Neither rsvg-convert nor inkscape found."
    echo "Install with: sudo apt install librsvg2-bin"
    exit 1
fi

generate_png() {
    local svg="$1"
    local basename="$2"

    if [ "$CONVERTER" = "rsvg" ]; then
        rsvg-convert -w 16 -h 16 "$svg" -o "$PUBLIC_DIR/${basename}-16.png"
        rsvg-convert -w 32 -h 32 "$svg" -o "$PUBLIC_DIR/${basename}-32.png"
        rsvg-convert -w 180 -h 180 "$svg" -o "$PUBLIC_DIR/${basename}-apple-touch-icon.png"
        rsvg-convert -w 192 -h 192 "$svg" -o "$PUBLIC_DIR/${basename}-192.png"
    else
        inkscape -w 16 -h 16 "$svg" -o "$PUBLIC_DIR/${basename}-16.png"
        inkscape -w 32 -h 32 "$svg" -o "$PUBLIC_DIR/${basename}-32.png"
        inkscape -w 180 -h 180 "$svg" -o "$PUBLIC_DIR/${basename}-apple-touch-icon.png"
        inkscape -w 192 -h 192 "$svg" -o "$PUBLIC_DIR/${basename}-192.png"
    fi
}

# Generate production favicons
if [ -f "$PUBLIC_DIR/favicon.svg" ]; then
    echo "Generating production favicons..."
    generate_png "$PUBLIC_DIR/favicon.svg" "favicon"

    # Rename apple touch icon
    mv "$PUBLIC_DIR/favicon-apple-touch-icon.png" "$PUBLIC_DIR/apple-touch-icon.png" 2>/dev/null

    # Create ICO file (requires imagemagick)
    if command -v convert &> /dev/null; then
        convert "$PUBLIC_DIR/favicon-16.png" "$PUBLIC_DIR/favicon-32.png" "$PUBLIC_DIR/favicon.ico"
        echo "Created favicon.ico"
    else
        echo "Warning: ImageMagick not found, skipping .ico generation"
        echo "Install with: sudo apt install imagemagick"
    fi
fi

# Generate staging favicons
if [ -f "$PUBLIC_DIR/favicon-staging.svg" ]; then
    echo "Generating staging favicons..."
    generate_png "$PUBLIC_DIR/favicon-staging.svg" "favicon-staging"

    # Rename apple touch icon for staging
    mv "$PUBLIC_DIR/favicon-staging-apple-touch-icon.png" "$PUBLIC_DIR/apple-touch-icon-staging.png" 2>/dev/null

    # Create ICO file for staging
    if command -v convert &> /dev/null; then
        convert "$PUBLIC_DIR/favicon-staging-16.png" "$PUBLIC_DIR/favicon-staging-32.png" "$PUBLIC_DIR/favicon-staging.ico"
        echo "Created favicon-staging.ico"
    fi
fi

echo "Done! Generated favicons in $PUBLIC_DIR"
ls -la "$PUBLIC_DIR"/favicon*.png "$PUBLIC_DIR"/favicon*.ico "$PUBLIC_DIR"/apple-touch-icon*.png 2>/dev/null
