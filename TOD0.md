# MaidMatch Dashboard Implementation TODO

## Phase 1: Backend Changes
- [x] Add OTP schema with expiry and security features
- [x] Add wallet/balance field to worker schema  
- [x] Add Messages schema
- [x] Create OTP generation/verification endpoints
- [x] Update booking status flow
- [x] Add worker wallet management endpoints

## Phase 2: Frontend - User Dashboard (REVERTED)
- [x] Previous UI restored - no collapsible sidebar

## Phase 3: Frontend - Worker Dashboard (REVERTED)
- [x] Previous UI restored - no collapsible sidebar

## Phase 4: Booking Flow Updates
- [x] Status = "offer_pending" when user sends booking request
- [x] Worker can Accept or Reject
- [x] Payment option appears ONLY after worker accepts
- [x] Pay button disabled before acceptance

## Phase 5: OTP System
- [x] Generate 6-digit OTP after successful payment
- [x] Save OTP in database with expiry
- [x] Send OTP to user in Messages section
- [x] Worker enters OTP to complete job
- [x] OTP expiry after certain time
- [x] Prevent multiple OTP submissions

## Phase 6: Wallet System
- [x] Add reward amount to worker balance on completion
- [x] Show earnings in worker dashboard
- [x] No auto-transfer to bank
