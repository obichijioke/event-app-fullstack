# Seatmap Configuration - Implementation Plan

> **Feature**: Seatmap Configuration for Events
> **Priority**: High (Partially Implemented - Backend Ready)
> **Estimated Effort**: 20-30 hours
> **Date**: 2025-11-08

---

## 📋 Executive Summary

The Seatmap Configuration feature allows organizers to create and manage seating arrangements for their venues and events. The backend infrastructure is **fully implemented** with comprehensive CRUD operations. The frontend needs a visual editor and event assignment interface.

### Current Status:
- ✅ Backend: 100% complete (all endpoints working)
- ⚠️ Frontend: Stub pages only (needs full implementation)
- ✅ Database Schema: Complete with all relationships
- ⚠️ Visual Editor: Not implemented

---

## 🎯 Feature Goals

### Primary Objectives:
1. **Seatmap Management**: Create, edit, delete, and list seatmaps
2. **Visual Editor**: Interactive canvas for designing seat layouts
3. **Seat Management**: Add/remove/position individual seats
4. **Event Assignment**: Assign seatmaps to events
5. **Availability Visualization**: Show which seats are available/sold/held
6. **Template Library**: Pre-built seatmap templates for common venues

### Success Criteria:
- Organizers can create seatmaps in < 5 minutes
- Visual editor is intuitive (no training needed)
- Seatmaps can be reused across multiple events
- Seat availability updates in real-time
- Mobile-responsive for on-site management

---

## 🏗️ Architecture Overview

### Backend Infrastructure (✅ Complete)

#### Existing Endpoints:
```typescript
// Seatmap Management
POST   /seatmaps/org/:orgId           // Create seatmap
GET    /seatmaps                      // List all seatmaps
GET    /seatmaps/:id                  // Get single seatmap
PATCH  /seatmaps/:id                  // Update seatmap
DELETE /seatmaps/:id                  // Delete seatmap

// Seat Management
POST   /seatmaps/:id/seats            // Add seats (bulk)
GET    /seatmaps/:id/seats            // Get all seats
DELETE /seatmaps/seats/:seatId        // Remove seat

// Ticket Type Assignment (Organizer Controller)
POST   /organizer/tickets/:ticketTypeId/seats/bulk  // Assign seats to ticket type
```

#### Database Schema:
```prisma
model Seatmap {
  id        String   @id
  orgId     String
  name      String
  spec      Json     // Full layout specification
  seats     Seat[]
  events    Event[]
  eventSeatmaps EventSeatmap[]
}

model Seat {
  id        String  @id
  seatmapId String
  section   String?
  row       String?
  number    String?
  pos       Json?   // {x, y, w, h} for visual positioning

  ticketTypeSeats TicketTypeSeat[]
  holds           Hold[]
  orderItems      OrderItem[]
  tickets         Ticket[]
}

model EventSeatmap {
  id        String
  eventId   String  @unique
  seatmapId String
  snapshot  Json    // Frozen state at assignment time
}
```

### Frontend Requirements (⚠️ Needs Implementation)

#### Pages Needed:
1. **Seatmap List** (`/organizer/seatmaps`)
2. **Create Seatmap** (`/organizer/seatmaps/create`)
3. **Edit Seatmap** (`/organizer/seatmaps/[id]/edit`)
4. **Event Seatmap Assignment** (`/organizer/events/[eventId]/seatmap`)

#### Components Needed:
- `SeatmapList` - Table view of all seatmaps
- `SeatmapEditor` - Visual canvas editor
- `SeatmapCanvas` - HTML5 Canvas or SVG renderer
- `SeatPalette` - Toolbar for adding seats/sections
- `SeatProperties` - Edit seat details (section/row/number)
- `SeatmapPreview` - Read-only view for buyers
- `EventSeatmapAssignment` - Assign seatmap to event

---

## 🎨 UI/UX Design

### 1. Seatmap List Page

**Layout**:
```
┌─────────────────────────────────────────────────────────┐
│ Seatmaps                              [+ Create Seatmap] │
├─────────────────────────────────────────────────────────┤
│ Search: [________________]  Filter: [All ▼]             │
├─────────────────────────────────────────────────────────┤
│ ┌────────────┬──────────┬──────────┬──────────────────┐ │
│ │ Name       │ Sections │ Seats    │ Actions          │ │
│ ├────────────┼──────────┼──────────┼──────────────────┤ │
│ │ Main Hall  │ 3        │ 250      │ [Edit] [Delete]  │ │
│ │ Theater    │ 5        │ 500      │ [Edit] [Delete]  │ │
│ └────────────┴──────────┴──────────┴──────────────────┘ │
└─────────────────────────────────────────────────────────┘
```

**Features**:
- Search by name
- Filter by usage (used/unused)
- Sort by date/name/seats
- Quick actions (edit, delete, duplicate)
- Empty state with templates

### 2. Seatmap Editor

**Layout**:
```
┌─────────────────────────────────────────────────────────────────┐
│ Edit Seatmap: "Main Hall"                     [Save] [Cancel]    │
├──────────┬──────────────────────────────────────────────────────┤
│          │                                                       │
│ TOOLS    │                                                       │
│ ┌──────┐ │                   CANVAS AREA                        │
│ │ Seat │ │         (Drag & drop seat placement)                 │
│ │  🪑  │ │                                                       │
│ └──────┘ │         ┌─────────┐                                  │
│ ┌──────┐ │         │  Stage  │                                  │
│ │ Row  │ │         └─────────┘                                  │
│ │  ═══ │ │                                                       │
│ └──────┘ │         🪑 🪑 🪑 🪑 🪑     Section A                │
│ ┌──────┐ │         🪑 🪑 🪑 🪑 🪑                              │
│ │ Sect │ │                                                       │
│ │  📦  │ │         🪑 🪑 🪑 🪑 🪑     Section B                │
│ └──────┘ │         🪑 🪑 🪑 🪑 🪑                              │
│ ┌──────┐ │                                                       │
│ │Stage │ │                                                       │
│ │  🎭  │ │                                                       │
│ └──────┘ │                                                       │
│          │                                                       │
│ PROPS    │                                                       │
│ Section: │         Zoom: [- 100% +]  Grid: [x]                  │
│ [A    ▼] │                                                       │
│ Row: [1] │         Total Seats: 250                             │
│ Number:  │                                                       │
│ [1-5]    │                                                       │
└──────────┴──────────────────────────────────────────────────────┘
```

**Interaction**:
- Drag & drop seats from toolbar to canvas
- Click seat to edit properties (section, row, number)
- Multi-select for bulk operations
- Snap to grid for alignment
- Zoom in/out for detail work
- Undo/redo support
- Auto-numbering for rows
- Section grouping

### 3. Event Seatmap Assignment

**Layout**:
```
┌─────────────────────────────────────────────────────────┐
│ Assign Seatmap to Event                                  │
├─────────────────────────────────────────────────────────┤
│ Event: "Rock Concert 2025"                               │
│                                                          │
│ Select Seatmap:                                          │
│ ○ Main Hall (250 seats, 3 sections)                     │
│ ● Theater (500 seats, 5 sections)        [Preview]      │
│ ○ Small Venue (100 seats, 2 sections)                   │
│                                                          │
│ ☑ Create snapshot (recommended)                         │
│   Freezes seat layout at time of assignment             │
│                                                          │
│ [Cancel]                            [Assign Seatmap]     │
└─────────────────────────────────────────────────────────┘
```

### 4. Ticket Type Seat Assignment

**Layout**:
```
┌─────────────────────────────────────────────────────────┐
│ Assign Seats to Ticket Type: "VIP"                      │
├─────────────────────────────────────────────────────────┤
│                                                          │
│         ┌─────────┐                                      │
│         │  Stage  │                                      │
│         └─────────┘                                      │
│                                                          │
│         🪑 🪑 🪑 🪑 🪑     Section A (Selected)         │
│         🪑 🪑 🪑 🪑 🪑                                  │
│                                                          │
│         ⬜ ⬜ ⬜ ⬜ ⬜     Section B (Available)          │
│         ⬜ ⬜ ⬜ ⬜ ⬜                                  │
│                                                          │
│ Instructions: Click seats or sections to assign         │
│                                                          │
│ Selected: 10 seats    [Clear Selection] [Select All]    │
│                                                          │
│ [Cancel]                               [Assign Seats]    │
└─────────────────────────────────────────────────────────┘
```

---

## 🛠️ Implementation Phases

### Phase 1: Seatmap List & CRUD (6-8 hours)

**Tasks**:
- [x] Backend complete (already done)
- [ ] Create `SeatmapList` component
- [ ] Implement list, search, filter UI
- [ ] Add create/edit/delete actions
- [ ] Empty state with "Create First Seatmap"
- [ ] Confirmation dialogs
- [ ] Loading & error states

**Files**:
- `components/organizer/seatmaps/seatmap-list.tsx`
- `components/organizer/seatmaps/seatmap-card.tsx`
- `app/(organizer)/organizer/seatmaps/page.tsx` (update)

**Dependencies**:
- Existing `seatmapsApi` client
- Toast notifications
- Organizer store

### Phase 2: Basic Seatmap Editor (10-12 hours)

**Tasks**:
- [ ] Create canvas-based editor component
- [ ] Implement seat dragging & positioning
- [ ] Add seat properties panel
- [ ] Create toolbar with seat types
- [ ] Save/load seatmap spec to JSON
- [ ] Grid system for alignment
- [ ] Zoom & pan controls

**Files**:
- `components/organizer/seatmaps/seatmap-editor.tsx`
- `components/organizer/seatmaps/seat-canvas.tsx`
- `components/organizer/seatmaps/seat-toolbar.tsx`
- `components/organizer/seatmaps/seat-properties-panel.tsx`
- `app/(organizer)/organizer/seatmaps/create/page.tsx` (update)
- `app/(organizer)/organizer/seatmaps/[id]/edit/page.tsx` (update)

**Technical Approach**:
```typescript
// Seatmap Spec Format (JSON)
{
  version: "1.0",
  canvas: {
    width: 1000,
    height: 800,
    gridSize: 20
  },
  elements: [
    {
      id: "stage-1",
      type: "stage",
      x: 400,
      y: 50,
      width: 200,
      height: 80,
      label: "Stage"
    },
    {
      id: "seat-1",
      type: "seat",
      x: 100,
      y: 200,
      section: "A",
      row: "1",
      number: "1",
      seatId: "clx..." // Database seat ID
    },
    // ... more elements
  ],
  sections: [
    { id: "A", name: "Section A", color: "#3b82f6" },
    { id: "B", name: "Section B", color: "#10b981" }
  ]
}
```

**Libraries to Consider**:
- **Konva.js** (React wrapper: react-konva) - Canvas library
- **Fabric.js** - Alternative canvas library
- **React DnD** - Drag and drop
- **Use HTML5 Canvas** - Native approach

**Recommendation**: Use **react-konva** for robust canvas manipulation

### Phase 3: Event Assignment (4-6 hours)

**Tasks**:
- [ ] Create event seatmap assignment UI
- [ ] List available seatmaps
- [ ] Preview seatmap before assignment
- [ ] Create EventSeatmap record (snapshot)
- [ ] Handle seatmap replacement
- [ ] Show assignment status on event page

**Files**:
- `components/organizer/events/assign-seatmap.tsx`
- `app/(organizer)/organizer/events/[eventId]/seatmap/page.tsx` (update)

**Backend Endpoint Needed**:
```typescript
POST /organizer/events/:eventId/seatmap
{
  seatmapId: string;
  createSnapshot: boolean;
}
```

### Phase 4: Ticket Type Seat Assignment (4-6 hours)

**Tasks**:
- [ ] Create seat selection UI on seatmap
- [ ] Highlight available/assigned seats
- [ ] Bulk select (by section, row, range)
- [ ] Assign seats to ticket types
- [ ] Show ticket type assignments on seatmap
- [ ] Handle conflicts (seat assigned to multiple types)

**Files**:
- `components/organizer/tickets/seat-assignment-canvas.tsx`
- Component integration in ticket management

**Uses Existing Endpoint**:
```typescript
POST /organizer/tickets/:ticketTypeId/seats/bulk
{
  seatIds: string[];
}
```

### Phase 5: Templates & Advanced Features (Optional, 6-8 hours)

**Tasks**:
- [ ] Pre-built seatmap templates (theater, stadium, hall)
- [ ] Duplicate seatmap feature
- [ ] Import/export seatmap JSON
- [ ] Seat categories (VIP, regular, accessible)
- [ ] Color coding by status
- [ ] Real-time availability (WebSocket)
- [ ] Mobile touch support

---

## 📊 Technical Specifications

### Seatmap Spec Format

The `spec` field in the database stores a JSON object representing the entire seatmap layout:

```typescript
interface SeatmapSpec {
  version: string;           // "1.0"
  canvas: {
    width: number;          // Canvas width in pixels
    height: number;         // Canvas height in pixels
    gridSize: number;       // Grid snap size
    backgroundColor: string; // Hex color
  };
  elements: SeatmapElement[];
  sections: Section[];
  metadata?: {
    venueCapacity?: number;
    aisleWidth?: number;
    notes?: string;
  };
}

interface SeatmapElement {
  id: string;
  type: 'seat' | 'stage' | 'aisle' | 'section-label' | 'shape';
  x: number;
  y: number;
  width?: number;
  height?: number;

  // For seats
  section?: string;
  row?: string;
  number?: string;
  seatId?: string;          // Links to Seat table

  // For labels/shapes
  label?: string;
  color?: string;
  rotation?: number;
}

interface Section {
  id: string;
  name: string;
  color: string;
  capacity: number;
}
```

### Seat Positioning Logic

```typescript
// Convert database seat to canvas element
function seatToElement(seat: Seat): SeatmapElement {
  const pos = seat.pos as { x: number; y: number; w: number; h: number };
  return {
    id: seat.id,
    type: 'seat',
    x: pos?.x || 0,
    y: pos?.y || 0,
    width: pos?.w || 20,
    height: pos?.h || 20,
    section: seat.section || '',
    row: seat.row || '',
    number: seat.number || '',
    seatId: seat.id
  };
}

// Convert canvas element to database seat
function elementToSeat(element: SeatmapElement): CreateSeatDto {
  return {
    section: element.section,
    row: element.row,
    number: element.number,
    pos: {
      x: element.x,
      y: element.y,
      w: element.width || 20,
      h: element.height || 20
    }
  };
}
```

---

## 🔄 Data Flow

### Creating a Seatmap

```
1. User opens Seatmap Editor
2. User designs layout (drag seats, add sections)
3. Canvas state → SeatmapSpec JSON
4. Click Save
5. POST /seatmaps/org/:orgId {name, spec}
6. Backend creates Seatmap record
7. User adds individual seats (optional)
8. POST /seatmaps/:id/seats (bulk seats)
9. Backend creates Seat records with positions
10. Seatmap ready for event assignment
```

### Assigning Seatmap to Event

```
1. User navigates to Event Seatmap page
2. User selects seatmap from list
3. User clicks "Assign"
4. POST /organizer/events/:eventId/seatmap {seatmapId}
5. Backend creates EventSeatmap record
6. Creates snapshot of current seatmap state
7. Event now has seating chart
8. Ticket types can be assigned to seats
```

### Assigning Seats to Ticket Type

```
1. User opens ticket type management
2. User clicks "Assign Seats"
3. Seatmap canvas loads with availability
4. User selects seats (click or drag-select)
5. User clicks "Assign"
6. POST /organizer/tickets/:ticketTypeId/seats/bulk {seatIds}
7. Backend creates TicketTypeSeat records
8. Seats now reserved for that ticket type
9. Available inventory = assigned seats
```

---

## 🎨 Canvas Implementation Options

### Option 1: React-Konva (Recommended)

**Pros**:
- Battle-tested canvas library
- React-friendly API
- Drag & drop built-in
- Shape manipulation
- Export to image/PDF
- Good performance (uses Konva.js)

**Cons**:
- Additional dependency (~100KB)
- Learning curve

**Example**:
```tsx
import { Stage, Layer, Circle, Rect, Text } from 'react-konva';

function SeatmapCanvas() {
  const [seats, setSeats] = useState([]);

  return (
    <Stage width={800} height={600}>
      <Layer>
        {/* Stage */}
        <Rect x={300} y={50} width={200} height={80} fill="#1e40af" />
        <Text x={350} y={75} text="STAGE" fill="white" />

        {/* Seats */}
        {seats.map(seat => (
          <Circle
            key={seat.id}
            x={seat.x}
            y={seat.y}
            radius={10}
            fill={seat.status === 'available' ? '#10b981' : '#ef4444'}
            draggable
            onDragEnd={(e) => handleSeatMove(seat.id, e.target.x(), e.target.y())}
          />
        ))}
      </Layer>
    </Stage>
  );
}
```

### Option 2: HTML5 Canvas (Native)

**Pros**:
- No dependencies
- Full control
- Lightweight

**Cons**:
- More code to write
- Manual hit testing
- Manual drag & drop
- More complexity

### Option 3: SVG

**Pros**:
- DOM-based (easier debugging)
- CSS styling
- Good for simple layouts

**Cons**:
- Performance issues with 1000+ seats
- Complex transformations

**Recommendation**: Use **React-Konva** for the best balance of features and ease of use.

---

## 🧪 Testing Strategy

### Unit Tests:
- [ ] Seatmap CRUD operations
- [ ] Seat positioning calculations
- [ ] Spec JSON validation
- [ ] Seat assignment logic

### Integration Tests:
- [ ] Create seatmap E2E
- [ ] Assign seatmap to event
- [ ] Assign seats to ticket type
- [ ] Seat availability queries

### UI Tests:
- [ ] Drag & drop seats
- [ ] Zoom & pan canvas
- [ ] Multi-select operations
- [ ] Save/load seatmap state

### Performance Tests:
- [ ] Render 1000+ seats smoothly
- [ ] Save large seatmap < 2s
- [ ] Load seatmap < 1s

---

## 📦 Dependencies

### New NPM Packages:
```bash
npm install react-konva konva
npm install @types/react-konva --save-dev
```

### Existing Packages (Already Available):
- `react-hot-toast` - Notifications
- `lucide-react` - Icons
- `zustand` - State management

---

## 🚨 Challenges & Solutions

### Challenge 1: Performance with Large Seatmaps
**Problem**: 1000+ seats cause lag
**Solution**:
- Use virtualization (only render visible seats)
- Implement level-of-detail (LOD) rendering
- Use OffscreenCanvas for background elements

### Challenge 2: Seat Numbering Automation
**Problem**: Manual numbering is tedious
**Solution**:
- Implement "auto-number" feature
- Support patterns (A1-A10, Row 1 Seat 1-20)
- Smart numbering (left-to-right, top-to-bottom)

### Challenge 3: Mobile Touch Support
**Problem**: Canvas hard to use on mobile
**Solution**:
- Implement pinch-to-zoom
- Touch-friendly seat size
- Simplified mobile editor (list view option)

### Challenge 4: Real-time Availability
**Problem**: Multiple organizers editing simultaneously
**Solution**:
- Implement optimistic locking
- Show "locked by user X" warnings
- Auto-save drafts every 30s

---

## 📈 Success Metrics

### User Adoption:
- 80% of seated events use seatmap feature
- Average seatmap creation time < 10 minutes
- 90% of seatmaps reused across multiple events

### Performance:
- Seatmap editor loads in < 2 seconds
- Canvas operations feel responsive (60fps)
- No crashes with 2000+ seat venues

### Business Impact:
- Increase seated event bookings by 30%
- Reduce seat allocation errors by 90%
- Improve attendee satisfaction (better seat selection)

---

## 🎯 Implementation Priority

### Must Have (MVP):
1. ✅ Backend CRUD (complete)
2. Seatmap list page
3. Basic canvas editor (drag & drop seats)
4. Event seatmap assignment
5. Seat-to-ticket-type assignment

### Should Have:
6. Section grouping
7. Auto-numbering
8. Grid snapping
9. Undo/redo
10. Seatmap templates

### Nice to Have:
11. Real-time collaboration
12. Import/export
13. Mobile optimization
14. Accessibility features (wheelchair seats)
15. Analytics (most popular sections)

---

## 📅 Timeline Estimate

### Week 1 (40 hours):
- Days 1-2: Seatmap list & CRUD UI (8h)
- Days 3-5: Basic canvas editor (16h)
  - Canvas setup & rendering
  - Seat dragging & positioning
  - Properties panel
  - Save/load functionality

### Week 2 (40 hours):
- Days 1-2: Event assignment (8h)
- Days 3-4: Ticket type seat assignment (10h)
- Day 5: Testing & bug fixes (8h)

### Week 3 (Optional - Advanced Features):
- Templates & bulk operations
- Performance optimization
- Mobile support
- Real-time features

**Total MVP**: 80 hours (2 weeks for one developer)

---

## ✅ Definition of Done

The Seatmap Configuration feature is complete when:

- [ ] Organizers can create seatmaps with visual editor
- [ ] Seatmaps can be assigned to events
- [ ] Seats can be assigned to ticket types
- [ ] Seat availability is tracked correctly
- [ ] All CRUD operations work reliably
- [ ] UI is responsive on desktop (mobile optional)
- [ ] No performance issues with 500+ seat venues
- [ ] All tests pass (unit, integration, E2E)
- [ ] Documentation updated
- [ ] QA approved
- [ ] Deployed to production

---

## 📚 Resources

### Libraries:
- [React-Konva Documentation](https://konvajs.org/docs/react/)
- [Konva Demos](https://konvajs.org/docs/sandbox/)
- [Fabric.js](http://fabricjs.com/) (alternative)

### Inspiration:
- Ticketmaster seat selection
- Eventbrite reserved seating
- SeatGeek interactive maps

### Similar Projects:
- [Seat.io](https://www.seats.io/) - Commercial solution
- [Stadium.js](https://github.com/stadium-software/stadium-js) - Open source

---

## 🎊 Conclusion

The Seatmap Configuration feature is a **high-value addition** that differentiates the platform from basic ticketing systems. With the backend complete, the focus is entirely on building an **intuitive visual editor** and **seamless integration** with events and ticket types.

**Estimated Effort**: 2-3 weeks for MVP
**Business Impact**: High (enables premium seated events)
**Technical Risk**: Medium (canvas complexity, but proven libraries available)

**Recommendation**: Start with Phase 1 (List & CRUD) and Phase 2 (Basic Editor) to deliver core value quickly, then iterate with advanced features based on user feedback.

---

**Next Steps**:
1. Review and approve this plan
2. Install react-konva dependency
3. Begin Phase 1 implementation
4. Set up canvas prototyping environment
5. Design seatmap spec JSON structure

Ready to build! 🚀
