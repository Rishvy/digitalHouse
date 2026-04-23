# Canvas Size & Measurement Tools

## New Features Added

### 1. Canvas Size Configuration

Users can now customize the canvas dimensions with a professional dialog interface.

#### Features:
- **Multiple Units**: Switch between Pixels (px), Centimeters (cm), and Inches (in)
- **Custom Dimensions**: Enter any width and height
- **Real-time Conversion**: See current size in all three units
- **Preset Sizes**: Quick access to common formats:
  - Business Card (9×5 cm)
  - A4 (21×29.7 cm)
  - Letter (8.5×11 in)
  - Full HD (1920×1080 px)

#### How to Use:
1. Click the "Size" button in the tool sidebar (bottom left)
2. Select your preferred unit (px, cm, or in)
3. Enter width and height values
4. Click "Apply" or choose a preset

#### Technical Details:
- Conversion rates:
  - 1 cm = 37.795 px (at 96 DPI)
  - 1 in = 96 px (at 96 DPI)
- Canvas automatically resizes and re-centers
- All existing elements remain in place
- Zoom adjusts to fit new canvas size

### 2. Rulers (Photoshop-style)

Professional rulers appear on the top and left edges of the canvas, showing pixel measurements.

#### Features:
- **Horizontal Ruler**: Shows width measurements along the top
- **Vertical Ruler**: Shows height measurements along the left
- **Major Ticks**: Every 100px with labels
- **Minor Ticks**: Every 50px
- **Zoom-aware**: Rulers scale with canvas zoom level
- **Toggle On/Off**: Click "Rulers" button to show/hide

#### Visual Design:
- Background: surface-container-lowest (#ffffff)
- Major ticks: Full opacity, 3px height
- Minor ticks: 40% opacity, 2px height
- Labels: 9px font size, positioned above/beside ticks
- Corner square: Decorative element at top-left intersection

### 3. Measurement Tool (Photoshop-style)

Interactive tool for measuring distances on the canvas, just like Photoshop's ruler tool.

#### Features:
- **Click and Drag**: Click starting point, drag to end point
- **Visual Line**: Yellow dashed line shows measurement path
- **Distance Display**: Shows distance in both pixels and centimeters
- **Persistent**: Measurement stays visible until you make a new one
- **Zoom-aware**: Works correctly at any zoom level

#### How to Use:
1. Click the "Measure" button in the tool sidebar
2. Click on the canvas at your starting point
3. Drag to your ending point
4. Release to see the measurement
5. Click and drag again to create a new measurement
6. Click "Measure" button again to exit measurement mode

#### Visual Design:
- Line: Yellow (#ffd709), 2px width, dashed (5px dash, 5px gap)
- End points: Yellow circles, 4px radius
- Label: Yellow background with dark text
- Shows: "123px / 3.25cm" format

### 4. Enhanced Tool Sidebar

Two new buttons added to the bottom of the tool sidebar:

```
┌────┐
│ 📝 │ Text
├────┤
│ 📤 │ Uploads
├────┤
│ 🎨 │ Graphics
├────┤
│ 📋 │ Template
├────┤
│    │ (spacer)
├────┤
│ 📐 │ Size      ← NEW
├────┤
│ 📏 │ Rulers    ← NEW (toggle)
├────┤
│ 📐 │ Measure   ← NEW (toggle)
└────┘
```

## UI Components

### Canvas Size Dialog

```
┌─────────────────────────────────────┐
│ Canvas Size                    [×]  │
├─────────────────────────────────────┤
│                                     │
│ Unit: [Centimeters (cm)      ▼]    │
│                                     │
│ Width:  [9.00]    Height: [5.00]   │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │ Current size:                   │ │
│ │ 340px × 189px                   │ │
│ │ 9.00cm × 5.00cm                 │ │
│ │ 3.54in × 1.97in                 │ │
│ └─────────────────────────────────┘ │
│                                     │
│ Presets:                            │
│ ┌──────────┬──────────┐            │
│ │Business  │   A4     │            │
│ │Card      │21×29.7 cm│            │
│ │9×5 cm    │          │            │
│ ├──────────┼──────────┤            │
│ │ Letter   │ Full HD  │            │
│ │8.5×11 in │1920×1080 │            │
│ └──────────┴──────────┘            │
│                                     │
│        [Cancel]  [Apply]            │
└─────────────────────────────────────┘
```

### Rulers Display

```
        0    100   200   300   400
        ├────┼────┼────┼────┼
    ┌───┴────────────────────────┐
  0 ┤                             │
    │                             │
100 ┤                             │
    │      CANVAS                 │
200 ┤                             │
    │                             │
300 ┤                             │
    └─────────────────────────────┘
```

### Measurement Tool Display

```
┌─────────────────────────────┐
│         ┌─────────┐         │
│         │ 245px   │         │
│         │ 6.48cm  │         │
│         └─────────┘         │
│          ●- - - - ●         │
│     (start)    (end)        │
│                             │
└─────────────────────────────┘
```

## Keyboard Shortcuts

No new keyboard shortcuts added, but existing shortcuts still work:
- **Delete/Backspace**: Remove selected element
- **Cmd/Ctrl + D**: Duplicate selected element
- **Escape**: Deselect all / Exit measurement mode

## Technical Implementation

### State Management

```typescript
const [showRulers, setShowRulers] = useState(true);
const [showSizeDialog, setShowSizeDialog] = useState(false);
const [canvasWidth, setCanvasWidth] = useState(frame.width);
const [canvasHeight, setCanvasHeight] = useState(frame.height);
const [unit, setUnit] = useState<"px" | "cm" | "in">("cm");
const [measurementTool, setMeasurementTool] = useState(false);
const [measureStart, setMeasureStart] = useState<{ x: number; y: number } | null>(null);
const [measureEnd, setMeasureEnd] = useState<{ x: number; y: number } | null>(null);
```

### Conversion Functions

```typescript
const convertToPixels = (value: number, fromUnit: "px" | "cm" | "in"): number => {
  if (fromUnit === "px") return value;
  if (fromUnit === "cm") return value * 37.795; // 96 DPI
  if (fromUnit === "in") return value * 96;
  return value;
};

const convertFromPixels = (value: number, toUnit: "px" | "cm" | "in"): number => {
  if (toUnit === "px") return value;
  if (toUnit === "cm") return value / 37.795;
  if (toUnit === "in") return value / 96;
  return value;
};
```

### Canvas Resize Logic

```typescript
const applyCanvasSize = (width: number, height: number, fromUnit: "px" | "cm" | "in") => {
  const widthPx = convertToPixels(width, fromUnit);
  const heightPx = convertToPixels(height, fromUnit);
  setCanvasWidth(widthPx);
  setCanvasHeight(heightPx);
  
  const canvas = getCanvas();
  if (canvas) {
    canvas.setWidth(widthPx);
    canvas.setHeight(heightPx);
    fitCanvasToContainer();
  }
  setShowSizeDialog(false);
};
```

### Measurement Calculation

```typescript
const dx = measureEnd.x - measureStart.x;
const dy = measureEnd.y - measureStart.y;
const distancePx = Math.sqrt(dx * dx + dy * dy);
const distanceCm = convertFromPixels(distancePx, "cm");
```

## Design System Compliance

All new components follow the K.T Digital House design system:

### Colors
- Dialog background: surface-container-lowest (#ffffff)
- Input fields: surface-container (#e7e8e8)
- Primary button: primary-container (#ffd709)
- Measurement line: primary-container (#ffd709)
- Ruler background: surface-container-lowest (#ffffff)

### Typography
- Dialog title: Space Grotesk, 20px, semibold
- Labels: Manrope, 14px, medium
- Input text: Manrope, 14px
- Ruler labels: Manrope, 9px

### Effects
- Dialog shadow: shadow-2xl
- Backdrop: bg-on-surface/50 with backdrop-blur-sm
- Button transitions: 200ms ease

## Browser Compatibility

- ✅ Chrome/Edge (latest)
- ✅ Firefox (latest)
- ✅ Safari (latest)
- ✅ Works on all screen sizes

## Performance Considerations

- Rulers render efficiently with Array.from() and conditional rendering
- Measurement tool uses SVG for crisp lines at any zoom
- Canvas resize maintains all existing elements
- No performance impact when rulers/measurement tool are hidden

## Future Enhancements

Potential improvements for future versions:

1. **Ruler Units**: Allow switching ruler display between px, cm, in
2. **Guides**: Draggable guides from rulers (like Photoshop)
3. **Snap to Ruler**: Elements snap to ruler increments
4. **Multiple Measurements**: Keep multiple measurements visible
5. **Angle Display**: Show angle of measurement line
6. **Copy Measurements**: Copy measurement values to clipboard
7. **Ruler Color**: Customizable ruler colors
8. **Grid Overlay**: Snap-to-grid functionality
9. **Custom Presets**: Save custom canvas size presets
10. **DPI Settings**: Adjust DPI for print projects

## Usage Tips

1. **For Print Projects**: Use cm or in units with appropriate DPI
2. **For Web Projects**: Use px units
3. **Precise Measurements**: Use measurement tool to verify element spacing
4. **Quick Resize**: Use presets for common formats
5. **Hide Rulers**: Toggle off rulers for cleaner workspace when not needed
6. **Zoom First**: Zoom in for more precise measurements

## Troubleshooting

**Q: Rulers not showing?**
A: Click the "Rulers" button in the tool sidebar to toggle them on.

**Q: Measurement tool not working?**
A: Make sure the "Measure" button is highlighted (yellow). Click it to activate.

**Q: Canvas size not applying?**
A: Check that you've entered valid positive numbers for width and height.

**Q: Measurements seem off?**
A: Ensure you're at the correct zoom level. Measurements are accurate at all zoom levels.

**Q: Can't see the full canvas after resize?**
A: Click the "Fit to screen" button in the zoom controls to auto-fit the canvas.
