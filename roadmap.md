# BSMS Platform Roadmap & Feature Backlog

Use this document to track, design, and implement new features for the Building/Society Management System. Mark the items as complete as we work through them.

---

## 🚨 1. Helpdesk & Complaint Management (High Priority)
A system for residents to report issues and for admins to assign maintenance staff and track resolution.

### Backend Requirements
- [ ] Create `Complaint` model (`id`, `title`, `description`, `category`, `status`, `resident_id`, `assigned_staff_id`, `created_at`, `updated_at`).
- [ ] Implement API routes:
  - [ ] `POST /complaints` (Resident: raise complaint).
  - [ ] `GET /complaints` (Resident: view their own; Admin: view all for building).
  - [ ] `PATCH /complaints/{id}` (Admin: assign staff, update status, add comments).
- [ ] Write integration and unit tests for routes.

### Frontend Requirements
- [ ] Build **Resident Ticket Portal**:
  - [ ] Ticket submission form (Category, Title, Details).
  - [ ] My Complaints list view with color-coded status badges (Pending, In Progress, Resolved).
- [ ] Build **Admin Control Center**:
  - [ ] Global complaints ledger.
  - [ ] Ticket detail page with Staff Assignment dropdown and comments thread.
- [ ] Add sidebar link and routing.

---

## 📅 2. Facility & Amenity Booking (High Priority)
Prevent scheduling conflicts for shared spaces (Clubhouse, Party Hall, Swimming Pool, Tennis Court).

### Backend Requirements
- [ ] Create `Amenity` model (`id`, `name`, `description`, `rules`, `booking_required`).
- [ ] Create `Booking` model (`id`, `amenity_id`, `resident_id`, `start_time`, `end_time`, `status`, `approved_by`).
- [ ] Implement API routes:
  - [ ] `GET /amenities` (List all available shared spaces).
  - [ ] `POST /bookings` (Request slot, with checks to prevent double-booking).
  - [ ] `GET /bookings` (List resident/admin bookings).
  - [ ] `PATCH /bookings/{id}` (Admin: Approve/Reject/Cancel booking).

### Frontend Requirements
- [ ] Build **Amenity List View**:
  - [ ] Cards detailing amenities.
- [ ] Build **Interactive Booking Calendar/Form**:
  - [ ] Time slot selector.
  - [ ] Visual overlap warnings.
- [ ] Build **Admin Approvals Panel**:
  - [ ] Pending requests list.

---

## 🚗 3. Vehicle & Parking Space Management (Medium Priority)
Security verification and structured parking allocation.

### Backend Requirements
- [x] Create `Vehicle` model (`id`, `member_id`, `license_plate`, `make_model`, `color`).
- [x] Update `Unit` model or create `ParkingSlot` model to track designated parking bays.
- [x] Implement API routes to register/list vehicles and allocate/view parking spots.

### Frontend Requirements
- [x] Add **Vehicle Management** section inside resident Profile/Dashboard.
- [x] Add **Parking Allocation Grid** inside Admin's Units & Members panel.

---

## 🔄 4. Auto-Billing & Online Payments (Medium Priority)
Automate ledger invoice generation and simulate online payment processor checkout.

### Backend Requirements
- [ ] Create an Admin endpoint `POST /billing/auto-generate` to bulk generate monthly maintenance invoices for all units in the building.
- [ ] Create payment integration simulation endpoint `POST /billing/pay` to mark invoices paid and record transactions.

### Frontend Requirements
- [ ] Add bulk auto-generation controls in Admin's Billing Dashboard.
- [ ] Create a **Resident Billing Ledger**:
  - [ ] Resident can view all invoices.
  - [ ] "Pay Now" checkout simulator with modal credit card inputs, leading to success screen and real-time status update.

---

## 🗳️ 5. Community Forums & Polls (Low Priority)
Interactive communication tools for residents.

### Backend Requirements
- [ ] Create models for `Post`, `Comment`, `Poll`, and `Vote`.
- [ ] Implement CRUD routes with role checks.

### Frontend Requirements
- [ ] Build **Community Forum** feed.
- [ ] Build **Active Polls** card in Resident/Admin dashboards.
