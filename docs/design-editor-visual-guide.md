# Design Editor Visual Guide

## Interface Layout

### Full Screen View
```
┌─────────────────────────────────────────────────────────────────────────┐
│ ← Back | Square Visiting Cards              👁 Preview    [Next]       │ Top Nav (56px)
├──┬────────┬─────────────────────────────────────────────────────────────┤
│  │        │ [Font ▼] [16] [B] [I] [≡] [≡] [≡] [🎨] ... [⬆][⬇][📋][🗑]│ Context Toolbar (56px)
│  │        ├─────────────────────────────────────────────────────────────┤
│T │ Text   │                                                              │
│  │        │                    6.67cm                                    │
│📝│ Edit   │              ┌─────────────┐                                │
│  │ text   │              │             │                                 │
│  │ below  │         6.67cm│   CANVAS   │ [Safety] [Bleed]              │
│U │        │              │             │                                 │
│📤│ Upload │              │             │                                 │
│  │ images │              └─────────────┘                                │
│  │        │                                                              │
│G │        │              [Front] [Back]                                 │
│🎨│ Add    │                                                              │
│  │ shapes │                                                              │
│  │        │                                                              │
│T │        │          [−] 100% [+] [⊡] [#]                              │
│📋│ Browse │                                                              │
│  │ templates                                                            │
│  │        │                                    [? Need design help?]    │
└──┴────────┴─────────────────────────────────────────────────────────────┘
   80px     288px                    Flexible Canvas Area
```

## Component Breakdown

### 1. Top Navigation Bar
```
┌─────────────────────────────────────────────────────────────────┐
│ [← Back] | Square Visiting Cards      [👁 Preview] [Next]      │
│  gray      gray text                    gray btn    yellow btn  │
└─────────────────────────────────────────────────────────────────┘
```
- Height: 56px
- Background: surface-container-lowest (#ffffff)
- Border bottom: surface-container

### 2. Tool Sidebar (Left)
```
┌────┐
│ 📝 │ ← Active (yellow background)
│Text│
├────┤
│ 📤 │
│Upld│
├────┤
│ 🎨 │
│Grph│
├────┤
│ 📋 │
│Tmpl│
└────┘
```
- Width: 80px (5rem)
- Background: surface-container (#e7e8e8)
- Active: primary-container (#ffd709)
- Icons: Material Symbols, 24px
- Labels: 10px uppercase

### 3. Asset Panel (Conditional)
```
┌──────────────────────┐
│ Text                 │ ← Title (16px, bold)
│ ─────────────────── │
│ Edit your text below │ ← Description (12px)
│                      │
│ [Type text here]     │ ← Input field
│                      │
│ [New Text Field]     │ ← Primary button (yellow)
│                      │
│ Quick text styles    │
│ ┌──────────────────┐│
│ │ Heading          ││ ← Style preset
│ │ Space Grotesk    ││
│ └──────────────────┘│
│ ┌──────────────────┐│
│ │ Body Text        ││
│ │ Manrope Regular  ││
│ └──────────────────┘│
└──────────────────────┘
```
- Width: 288px (18rem)
- Background: surface-container-lowest (#ffffff)
- Scrollable content

### 4. Context Toolbar (Dynamic)

**When Text is Selected:**
```
┌─────────────────────────────────────────────────────────────────┐
│ [Manrope ▼] | [36] | [B] [I] | [≡] [≡] [≡] | [🎨] ... [🗑]   │
│  Font family  Size   Style    Alignment     Color    Delete    │
└─────────────────────────────────────────────────────────────────┘
```

**When Any Element is Selected:**
```
┌─────────────────────────────────────────────────────────────────┐
│                    ... [⬆⬆] [⬆] [⬇] [⬇⬇] | [📋] [🗑]          │
│                       Layer Controls      Duplicate Delete      │
└─────────────────────────────────────────────────────────────────┘
```

### 5. Canvas Area

**Canvas with Labels:**
```
                    6.67cm
              ┌─────────────────┐
              │ [Safety] [Bleed]│ ← Overlay buttons
         6.67cm│                 │
              │                 │
              │     CANVAS      │
              │                 │
              │                 │
              └─────────────────┘
              
              [Front] [Back]      ← Face selector
```

**Canvas Shadow:**
- Box shadow: `0 20px 40px rgba(45, 47, 47, 0.15)`
- Background: white (#ffffff)
- Centered in viewport

### 6. Zoom Controls (Bottom Center)
```
┌─────────────────────────────┐
│  [−]  100%  [+]  [⊡]  [#]  │
│  Out  Zoom  In   Fit  Grid  │
└─────────────────────────────┘
```
- Floating with glassmorphism
- Background: bg-white/90
- Backdrop blur: blur
- Shadow: shadow-lg
- Shape: rounded-full

### 7. Help Button (Bottom Right)
```
┌──────────────────────┐
│ [?] Need design help?│
└──────────────────────┘
```
- Background: primary-container (#ffd709)
- Text: on-primary-fixed (#453900)
- Shape: rounded-full
- Shadow: shadow-lg

## Color Palette

### Primary Colors
```
#ffd709  ████  primary-container (Yellow - High Energy)
#453900  ████  on-primary-fixed (Dark Yellow Text)
#6c5a00  ████  primary (Yellow Dark)
```

### Surface Colors
```
#ffffff  ████  surface-container-lowest (White)
#f6f6f6  ████  surface (Light Gray)
#f0f1f1  ████  surface-container-low
#e7e8e8  ████  surface-container
#e1e3e3  ████  surface-container-high
#dbdddd  ████  surface-container-highest
```

### Text Colors
```
#2d2f2f  ████  on-surface (Dark Text)
#acadad  ████  outline-variant (Gray)
#b02500  ████  error (Red)
```

## Typography

### Fonts
- **Headlines**: Space Grotesk (300, 400, 500, 600, 700)
- **Body**: Manrope (200, 300, 400, 500, 600, 700, 800)

### Sizes
- **Display**: 48px, 36px, 24px
- **Body**: 16px, 14px, 12px
- **Label**: 10px (uppercase)

## Icons

### Material Symbols Outlined
```css
font-variation-settings: 'FILL' 0, 'wght' 400
```

### Common Icons Used
- `text_fields` - Text tool
- `upload` - Upload tool
- `category` - Graphics tool
- `dashboard` - Template tool
- `format_align_left` - Left align
- `format_align_center` - Center align
- `format_align_right` - Right align
- `flip_to_front` - Bring to front
- `flip_to_back` - Send to back
- `arrow_upward` - Bring forward
- `arrow_downward` - Send backward
- `content_copy` - Duplicate
- `delete` - Delete
- `remove` - Zoom out
- `add` - Zoom in
- `fit_screen` - Fit to screen
- `grid_on` - Grid toggle
- `help` - Help

## Effects

### Glassmorphism
```css
background: rgba(255, 255, 255, 0.8-0.9)
backdrop-filter: blur(12px-24px)
```

### Shadows
```css
/* Canvas shadow */
box-shadow: 0 20px 40px rgba(45, 47, 47, 0.15);

/* Floating elements */
box-shadow: 0 10px 30px rgba(45, 47, 47, 0.08);
```

### Transitions
```css
transition: all 0.2s ease;
transition-property: background-color, border-color, transform;
```

## Interactions

### Hover States
- Tool buttons: background changes to primary-container
- Asset items: 2px border in primary-container
- Canvas elements: transform handles appear
- Buttons: slight background color change

### Active States
- Tool buttons: primary-container background
- Selected elements: 2px primary-container border
- Transform handles: visible at corners

### Focus States
- Input fields: primary border (2px)
- Buttons: outline-ring/50

## Responsive Behavior

### Desktop (≥768px)
- Full layout with all panels
- Asset panel visible when tool selected
- Context toolbar shows all controls

### Tablet (≥640px, <768px)
- Asset panel as overlay
- Context toolbar condensed
- Canvas scales to fit

### Mobile (<640px)
- Tool sidebar becomes bottom nav
- Asset panel as full-screen overlay
- Context toolbar shows essential controls only
- Canvas fills available space

## Keyboard Shortcuts

```
Delete/Backspace  → Remove selected element
Cmd/Ctrl + D      → Duplicate selected element
Escape            → Deselect all elements
```

## Element States

### Text Element
```
┌─────────────────┐
│ Type text here  │ ← Default state
└─────────────────┘

┌─────────────────┐
│ Type text here  │ ← Hover (cursor changes)
└─────────────────┘

╔═════════════════╗
║ Type text here  ║ ← Selected (yellow border, handles)
╚═════════════════╝

┌─────────────────┐
│ Type text here█ │ ← Editing (cursor blinking)
└─────────────────┘
```

### Shape Element
```
┌─────────┐
│         │ ← Default state
└─────────┘

╔═════════╗
║    ◯    ║ ← Selected (yellow border, handles)
╚═════════╝
```

## Loading States

```
┌─────────────────────────────────┐
│                                 │
│    Loading design editor…       │
│                                 │
└─────────────────────────────────┘
```

## Success Notifications

```
┌──────────────────────────────┐
│ ✓ Design saved successfully  │
└──────────────────────────────┘
```
- Position: Fixed, bottom-right
- Background: on-surface (#2d2f2f)
- Text: surface (#f6f6f6)
- Duration: 2 seconds
- Animation: Fade in/out

## This visual guide provides a complete reference for the design editor interface layout, colors, typography, and interactions.
