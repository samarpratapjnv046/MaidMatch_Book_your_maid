# MaidMatch - Domestic Help Booking Platform

## Project Overview
- **Project Name**: MaidMatch
- **Type**: Web Application (React SPA)
- **Core Functionality**: A platform connecting domestic workers (maids, babysitters, cooks, helpers) with customers seeking household help services
- **Target Users**: 
  - Service Providers: Maids, babysitters, cooks, elderly care helpers
  - Customers: House owners, families seeking domestic help

## UI/UX Specification

### Layout Structure

**Header (Fixed)**
- Logo (left): "MaidMatch" with house icon
- Navigation (center): Home, Find Help, Become a Helper, About
- Auth buttons (right): Login, Sign Up

**Hero Section**
- Large headline with search form
- Service type selector (dropdown)
- Location input with map picker
- Date/time duration selector
- Search button

**Featured Services Section**
- 4 service cards: House Cleaning, Baby Care, Cooking, Elder Care
- Each card with icon, title, description

**How It Works Section**
- 3-step process with illustrations
- Search → Book → Relax

**Worker Listings Section**
- Filter sidebar (left): Service type, price range, availability, rating
- Worker cards grid (right): Photo, name, rating, hourly rate, skills

**Footer**
- Company info, quick links, contact, social media

### Responsive Breakpoints
- Mobile: < 640px (single column, hamburger menu)
- Tablet: 640px - 1024px (2 column grid)
- Desktop: > 1024px (full layout, 3-4 column grid)

### Visual Design

**Color Palette**
- Primary: #2D7A4D (Forest Green - trust, reliability)
- Secondary: #F5A623 (Warm Orange - friendly, approachable)
- Accent: #E74C3C (Coral Red - CTAs, important actions)
- Background: #FEFEFE (Off-white)
- Card Background: #FFFFFF
- Text Primary: #1A1A2E
- Text Secondary: #6B7280
- Border: #E5E7EB

**Typography**
- Headings: "Playfair Display", serif (elegant, trustworthy)
- Body: "DM Sans", sans-serif (modern, readable)
- Logo: "Playfair Display" bold

**Font Sizes**
- H1: 48px / 56px (mobile: 32px)
- H2: 36px / 44px (mobile: 24px)
- H3: 24px / 32px (mobile: 20px)
- Body: 16px / 24px
- Small: 14px / 20px

**Spacing System**
- Base unit: 4px
- Section padding: 80px vertical (mobile: 48px)
- Card padding: 24px
- Component gap: 16px

**Visual Effects**
- Card shadows: 0 4px 20px rgba(0,0,0,0.08)
- Hover shadow: 0 8px 30px rgba(0,0,0,0.12)
- Border radius: 16px (cards), 12px (buttons), 8px (inputs)
- Transitions: all 0.3s cubic-bezier(0.4, 0, 0.2, 1)

### Components

**Button**
- Primary: #2D7A4D bg, white text, hover darken 10%
- Secondary: transparent, #2D7A4D border/text
- Accent: #E74C3C bg for urgent CTAs
- States: hover scale(1.02), active scale(0.98)

**Input Fields**
- Border: 1px solid #E5E7EB
- Focus: #2D7A4D border, subtle green shadow
- Padding: 12px 16px
- Border radius: 8px

**Worker Card**
- Profile image (circular, 80px)
- Name, profession badge
- Rating stars + review count
- Hourly rate
- Skills tags
- "Book Now" button

**Service Card**
- Icon in colored circle
- Title, description
- Starting price
- Hover lift effect

**Modal**
- Centered overlay
- Smooth fade-in animation
- Close button top-right

## Functionality Specification

### Core Features

**1. Worker Registration**
- Multi-step form:
  - Step 1: Personal info (name, phone, email, photo)
  - Step 2: Service type selection (checkboxes)
  - Step 3: Experience & skills
  - Step 4: Availability calendar
  - Step 5: Location & ID verification
- Form validation on each step
- Success confirmation

**2. Search & Filter**
- Search by service type
- Filter by:
  - Price range (slider)
  - Rating (star selector)
  - Availability (day selector)
  - Experience level
- Sort by: Rating, Price, Distance

**3. Worker Profiles**
- Photo gallery
- Bio/description
- Skills & certifications
- Availability calendar (visual)
- Reviews & ratings
- Response time

**4. Booking System**
- Select service type
- Choose date & time
- Select duration (hourly/daily/weekly/monthly)
- Add special instructions
- Price calculation
- Booking confirmation

**5. User Dashboard**
- Active bookings
- Booking history
- Saved workers
- Messages
- Profile settings

### User Interactions
- Smooth page transitions
- Loading skeletons
- Toast notifications for actions
- Confirmation dialogs for bookings
- Search autocomplete

### Data Handling
- Local state management (React useState/useContext)
- Mock data for workers (JSON)
- Form data persistence in localStorage
- Booking data in localStorage

### Edge Cases
- No search results: Show "No workers found" with suggestions
- Form validation errors: Inline error messages
- Network simulation: Loading states
- Empty states: Helpful illustrations and CTAs

## Page Structure

### Pages
1. **Home** (`/`) - Hero, search, featured services, how it works, featured workers
2. **Find Help** (`/search`) - Full search page with filters
3. **Worker Details** (`/worker/:id`) - Individual worker profile
4. **Become a Helper** (`/register`) - Worker registration form
5. **Login** (`/login`) - User login page
6. **Dashboard** (`/dashboard`) - User dashboard (protected)

### Components to Build
- Navbar
- Footer
- HeroSection
- SearchForm
- ServiceCard
- WorkerCard
- FilterSidebar
- BookingModal
- WorkerForm
- ProtectedRoute

## Acceptance Criteria

### Visual Checkpoints
- [ ] Header displays correctly with logo, nav, and auth buttons
- [ ] Hero section has search form with all inputs
- [ ] Service cards display in grid with hover effects
- [ ] Worker cards show all required information
- [ ] Filter sidebar works on desktop (collapsible on mobile)
- [ ] Forms have proper validation styling
- [ ] Responsive design works at all breakpoints
- [ ] Animations are smooth and performant

### Functional Checkpoints
- [ ] Search filters workers correctly
- [ ] Worker registration form saves to state
- [ ] Booking modal opens and calculates price
- [ ] Navigation between pages works
- [ ] Mobile menu opens/closes
- [ ] Form validation shows appropriate errors
- [ ] Loading states display during async operations

### Performance
- [ ] Initial load under 3 seconds
- [ ] Smooth 60fps animations
- [ ] No console errors
- [ ] Images optimized and lazy loaded
