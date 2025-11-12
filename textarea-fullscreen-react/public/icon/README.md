# Extension Icons

Place your extension icons here:
- **icon-16.png** (16x16) - Toolbar icon, context menus
- **icon-48.png** (48x48) - Extension management page
- **icon-128.png** (128x128) - Chrome Web Store, installation
- **icon-512.png** (512x512) - Optional, promotional images

## Requirements

### Chrome Web Store
- Format: PNG
- Sizes: 16x16, 48x48, 128x128 (required)
- Max file size: 2MB per icon
- Transparent background recommended

### Firefox Add-ons
- Format: PNG
- Sizes: 48x48, 96x96 (recommended)
- Max file size: 4MB per icon
- Transparent background recommended

## Design Guidelines
1. **Simple & Clear** - Recognizable at small sizes
2. **Consistent** - Same design across all sizes
3. **Branded** - Reflects extension purpose
4. **Accessible** - Good contrast, not too detailed

## Tools
- [Figma](https://figma.com) - Design tool
- [Squoosh](https://squoosh.app) - Image optimization
- [RealFaviconGenerator](https://realfavicongenerator.net) - Generate all sizes

## Current Icons
For development, you can use placeholder icons:
```bash
# Generate placeholder icons (requires ImageMagick)
convert -size 16x16 xc:blue icon-16.png
convert -size 48x48 xc:blue icon-48.png
convert -size 128x128 xc:blue icon-128.png
```
