# Design Editor Interface

## Overview

The Design Editor Interface is a Vistaprint-style web-based visual design tool that enables customers to customize print products through an intuitive drag-and-drop interface. Built with Fabric.js and React, it provides a professional canvas-based editing experience.

## Features

### 1. Canvas Rendering
- Accurate product dimensions with visual labels (in cm)
- White background with subtle shadow effects
- Zoom controls (25% - 400%)
- Fit-to-screen functionality
- Safety Area and Bleed indicators

### 2. Tool Sidebar
Located on the left edge with vertical navigation:
- **Text Tool**: Add and edit text elements
- **Uploads Tool**: Upload custom images
- **Graphics Tool**: Add shapes, lines, and decorative elements
- **Templates Tool**: Browse and apply pre-designed templates

Active tools are highlighted with the brand's primary-container color (#ffd709).

### 3. Asset Panel
Opens adjacent to the Tool Sidebar (288px width) when a tool is selected:
- **Text Panel**: 
  - New text field button
  - Quick text styles (Heading, Body Text)
  - Text input field
- **Uploads Panel**: Image uploader component
- **Graphics Panel**: 
  - Basic shapes (Rectangle, Circle, Triangle)
  - Lines & Dividers
- **Templates Panel**: Template thumbnails (coming soon)

### 4. Context Toolbar
Horizontal toolbar below the top navigation showing formatting options:
- **For Text Elements**:
  - Font family dropdown (Manrope, Space Grotesk, Arial, Georgia)
  - Font size input (8pt - 144pt)
  - Bold and Italic toggles
  - Text alignment (Left, Center, Right)
  - Color picker
- **For All Elements**:
  - Layer controls (Bring to Front, Forward, Backward, Send to Back)
  - Duplicate button
  - Delete button

### 5. Canvas Manipulation
- Click to select elements
- Drag to move elements
- Corner handles for resizing
- Double-click text to edit inline
- Delete key to remove selected elements
- Cmd/Ctrl+D to duplicate (via button)

### 6. Zoom Controls
Floating controls at bottom center with glassmorphism effect:
- Zoom out button (-)
- Current zoom percentage display
- Zoom in button (+)
- Fit to screen button
- Grid toggle button

### 7. Top Navigation
- Back button to return to previous page
- Product name display
- Preview button
- Next button (Add to Cart) with primary-container styling

### 8. Design System Compliance
- **Fonts**: Space Grotesk (headlines), Manrope (body text)
- **Colors**: 
  - Primary Container: #ffd709 (high-energy yellow)
  - On Surface: #2d2f2f (dark text)
  - Surface variants for layering
- **No 1px borders**: Uses background color shifts for boundaries
- **Glassmorphism**: 70-90% opacity with backdrop blur for floating elements
- **Material Symbols Icons**: Weight 400, Fill 0
- **Ambient Shadows**: rgba(45, 47, 47, 0.08-0.15)

## Technical Implementation

### Components
- **VistaEditor.tsx**: Main editor component
- **DesignEditor.tsx**: Wrapper with dynamic import
- Uses Fabric.js for canvas manipulation
- Zustand for cart state management
- Next.js App Router

### Key Functions
- `addText()`: Creates new text element at canvas center
- `addRectangle()`, `addCircle()`: Add shape elements
- `addImage(url)`: Places uploaded image on canvas
- `updateActiveObject(patch)`: Updates selected element properties
- `saveDesign()`: Serializes canvas to JSON
- `saveAndAddToCart()`: Exports design and navigates to cart

### Canvas State
- Fabric.js canvas instance stored in ref
- Active element tracking for toolbar updates
- Zoom level state (0.25 - 4.0)
- Auto-fit on window resize

## Usage

Navigate to `/design/[productId]` to open the editor for a specific product. The editor will:
1. Load the product's template from the database
2. Initialize the canvas with correct dimensions
3. Allow full customization
4. Save design state to cart on "Next" button click

## Future Enhancements

- [ ] Template library with thumbnails
- [ ] More graphic elements (icons, decorations)
- [ ] Image filters and effects
- [ ] Text effects (shadow, outline, gradient)
- [ ] Undo/Redo functionality
- [ ] Auto-save every 30 seconds
- [ ] Multi-face support (front/back)
- [ ] Collaborative editing
- [ ] Design history
- [ ] Export to high-resolution PDF

## Design Reference

The interface is inspired by Vistaprint's design editor, featuring:
- Clean, professional layout
- Intuitive tool organization
- Real-time canvas manipulation
- Contextual formatting controls
- Glassmorphism effects for modern polish
- K.T Digital House brand identity throughout
