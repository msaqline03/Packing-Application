# Mahonys Weighbridge — Ticketing Application

A full-featured Next.js weighbridge ticketing system for Mahonys Transport. Manages incoming and outgoing commodity tickets, CMO/booking lifecycle, loader bay assignments, and flexible multi-dimensional reporting.

---

## Quick Start

```bash
npm install
npm run dev
# Open http://localhost:3000
```

---

## Pages & Navigation

| Tab | Route | Description |
|---|---|---|
| **Incoming** | `/incoming` | List, search, filter all incoming tickets. Click Edit or Create to open the ticket form. |
| **Outgoing** | `/outgoing` | Same as above for outgoing tickets. |
| **Loader View** | `/loader` | Assign bay locations to active in-tickets and mark trucks as tipped. |
| **CMO Edit** | `/cmo-edit` | Full CMO CRUD — create, edit, complete CMOs and manage their bookings. |
| **Reports** | `/reports` | Flexible reporting with live preview (see below). |

### Ticket Forms

- **`/ticket/in?mode=create`** — New incoming ticket
- **`/ticket/in?id=101`** — Edit existing incoming ticket #101
- **`/ticket/out?mode=create`** — New outgoing ticket
- **Print:** `/print/in/[id]` and `/print/out/[id]`

---

## Key Features

### Ticket Workflow
1. **Create** a ticket and link it to a CMO (or create one on the fly).
2. **Lock** the CMO to populate commodity/grade details.
3. Assign a **Truck** (or add a new one).
4. Record **Gross** and **Tare** weights. Enable **Split Load** to log multiple weigh entries per truck.
5. Enter **test results** and click **Confirm Grade** — the system checks thresholds and suggests the best-fit grade. Override with a mandatory reason if needed.
6. Select **Signoff**, **Unloaded/Loading Location**, and optional notes.
7. **Complete** the ticket → print prompt appears.
8. Completed tickets can be **Overridden** for corrections, then **Updated**.

### Reports (Enhanced)
The Reports page gives full flexibility:
- **Report Type tabs** — All / Tickets / Containers / Transactions
- **Date Range picker** with quick-select buttons (Today, This Week, This Month)
- **Multi-select filters** for Direction, Site, Customer, Commodity, and Status — all combinable
- **Live summary cards** — total tickets, net weight, completed count, pending count
- **Breakdown panels** — by commodity and by status
- **Full ticket table** that updates instantly as filters change
- **Export options** — CSV, PDF, Print
- **Email** — enter an address and send the report

### Loader View
Shows only active in-tickets (booked/processing with a truck assigned). The loader can:
- Assign or change the **Bay Location** — updates the ticket live.
- Mark the truck as **Tipped** or **Pending**.

### CMO Management
- Filter CMOs by type (In / Out / All).
- Create CMOs with customer, commodity, grade, Acuity ID, and expected weight.
- Add / Edit / Delete **bookings** per CMO.
- Mark CMOs as completed or reactivate them.

---

## File Structure

```
src/
├── context/
│   └── AppContext.js        # Global state (tickets, CMOs, trucks) + CRUD ops
├── components/
│   └── SharedComponents.js  # Navbar, Modal, StatusBadge, form inputs, buttons
├── pages/
│   ├── _app.js              # Provider wrapper
│   ├── index.js             # Redirect → /incoming
│   ├── incoming.js          # Incoming bookings list
│   ├── outgoing.js          # Outgoing bookings list
│   ├── loader.js            # Loader view
│   ├── cmo-edit.js          # CMO management
│   ├── reports.js           # Flexible reporting
│   ├── ticket/
│   │   ├── in.js            # In-ticket form (create / edit)
│   │   └── out.js           # Out-ticket form (create / edit)
│   └── print/
│       ├── in/[id].js       # Print incoming ticket
│       └── out/[id].js      # Print outgoing ticket
└── utils/
    └── mockData.js          # Sample data (sites, trucks, commodities, tickets, CMOs)
```

---

## Design Notes

- **Blue primary theme** throughout: navy navbar (`#0f1e3d` → `#1a3a6b`), blue accents (`#2563eb` / `#3b82f6`), light blue highlights.
- **Sticky navbar** with branded logo + site selector in the top bar, and **tab navigation** for all major sections.
- **Card-based layouts** with subtle borders and shadows for visual hierarchy.
- **Status badges** with semantic colours (blue = booked, amber = processing, green = completed, red = cancelled).
- **Print stylesheets** hide UI chrome and render a clean branded ticket document.
