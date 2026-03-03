# FreelanceHub — Full Stack Freelance Bidding Platform

A production-deployed freelance marketplace where clients post jobs, freelancers bid, and payments are held in escrow until work is approved. Built with the MERN stack, Stripe PaymentIntents, and Socket.IO real-time messaging.

**Live Demo:** https://freelance-platform-bice.vercel.app  
**Admin Panel:** https://freelance-admin-eosin.vercel.app  
**Backend API:** https://freelance-platform-backend-l5gj.onrender.com/api/health

---

## Tech Stack

**Backend:** Node.js, Express, MongoDB (Mongoose), JWT, Stripe, Socket.IO, Winston  
**Frontend:** React 18, React Router v6, Axios, Stripe.js  
**Admin:** Separate React app with role-protected routes  
**Deployment:** Render (backend) + Vercel (frontend + admin) + MongoDB Atlas

---

## Architecture

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│  React Frontend │────▶│  Express API    │────▶│  MongoDB Atlas  │
│  (Vercel)       │     │  (Render)       │     │  (Cloud)        │
└─────────────────┘     └────────┬────────┘     └─────────────────┘
                                  │
                    ┌─────────────┼─────────────┐
                    ▼             ▼             ▼
             Socket.IO         Stripe        Winston
           (Real-time)       (Payments)     (Logging)

┌─────────────────┐
│  React Admin    │────▶  Same Express API (/api/admin/*)
│  (Vercel)       │       Protected by role === 'admin'
└─────────────────┘
```

The frontend and admin panel are separate React apps sharing the same backend. Admin routes are protected by dedicated middleware that verifies both JWT validity and `role === 'admin'` before any request reaches a controller.

---

## Core Workflow

```
Client posts job
      │
Freelancers submit bids
      │
Client reviews bids → accepts one → Stripe payment modal opens
      │
Payment held in escrow (Stripe PaymentIntent)
      │
Freelancer works → marks complete
      │
Client approves → releases payment
      │
Client leaves review → freelancer rating recalculated
```

If the client is unhappy at any point they can cancel the contract — the job reopens for new bids and the escrowed payment is refunded. Clients can also withdraw open job postings, which rejects all pending bids and notifies freelancers.

---

## Key Engineering Decisions

### Payment Security
Payment state is never derived from the frontend. The Stripe PaymentIntent is created server-side and the frontend only handles the card UI via Stripe.js. Confirming payment requires server-side verification of the PaymentIntent status directly from Stripe's API — a malicious client cannot fake a successful payment by calling the confirm endpoint with an arbitrary ID.

### Role-Based Access Control
Every protected route passes through `protect` middleware which verifies the JWT, checks the user still exists, and checks `isBanned`. Role restrictions (`restrictTo('client')`, `restrictTo('freelancer')`) are applied per-route. Admin routes use a separate `adminProtect` middleware that additionally verifies `role === 'admin'` — a regular user JWT is rejected even if the token is otherwise valid.

### Ban Enforcement
Ban checks are built into the `protect` middleware itself rather than applied per-route. This means banned users are blocked from every protected endpoint automatically — there is no risk of forgetting to add a ban check to a new route.

### Real-Time Messaging
Socket.IO rooms are scoped to job IDs. Authorization is checked on every `join-room` event — the server verifies the connecting user is either the client or the assigned freelancer on that specific job before allowing them into the room. Authorization is re-checked on every `send-message` event, not just on join.

### State Transitions
Job status follows a strict sequence: `open → in-progress → completed → cancelled`. Illegal transitions (e.g., marking a cancelled job complete) are rejected server-side with a descriptive error before any database write occurs.

### Structured Logging
Winston outputs JSON in production (compatible with Datadog, CloudWatch, Logtail) and colorized text in development. Every HTTP request is logged with method, path, status code, response time, and userId. Errors include stack traces on 5xx, warn-level on 4xx.

---

## Features

**Client**
- Post jobs with budget range and deadline
- Review all bids with freelancer profiles and ratings
- Accept a bid and pay via Stripe (escrow)
- Real-time chat with assigned freelancer
- Reject individual bids with freelancer notification
- Cancel contract mid-project with reason
- Withdraw open job postings (notifies all bidders)
- Release escrowed payment on completion
- Leave star rating and review

**Freelancer**
- Browse and search open jobs with filters
- Submit bids with proposal
- Real-time notifications for bid acceptance/rejection
- Real-time project chat
- Mark jobs as complete

**Admin Panel** (separate app at /admin)
- Dashboard with live platform stats
- User management — search, ban/unban with reason, delete
- Job management — view all jobs, force cancel
- Payment overview — all transactions with status and totals
- Reviews moderation — delete inappropriate reviews, auto-recalculates freelancer rating

**Email Notifications**
- New bid received (to client)
- Bid accepted (to freelancer)
- Payment released (to freelancer)
- Password reset with 1-hour expiring token

---

## API Overview

```
POST   /api/auth/register
POST   /api/auth/login
POST   /api/auth/forgot-password
POST   /api/auth/reset-password

GET    /api/jobs
POST   /api/jobs
GET    /api/jobs/:id
PATCH  /api/jobs/:id/complete
PATCH  /api/jobs/:id/withdraw

POST   /api/bids
PATCH  /api/bids/:id/accept
PATCH  /api/bids/:id/reject
POST   /api/bids/cancel/:jobId

POST   /api/payments/create-intent
POST   /api/payments/confirm
POST   /api/payments/release/:jobId
GET    /api/payments/job/:jobId

GET    /api/messages/:jobId
POST   /api/reviews

POST   /api/admin/login
GET    /api/admin/stats
GET    /api/admin/users
PATCH  /api/admin/users/:id/ban
PATCH  /api/admin/users/:id/unban
DELETE /api/admin/users/:id
GET    /api/admin/jobs
PATCH  /api/admin/jobs/:id/cancel
GET    /api/admin/payments
GET    /api/admin/reviews
DELETE /api/admin/reviews/:id

GET    /api/health
```

---

## Local Setup

```bash
# Clone
git clone https://github.com/muhdhaseeb/FreelanceHub-Full-Stack-Freelance-Bidding-Platform
cd FreelanceHub-Full-Stack-Freelance-Bidding-Platform

# Backend
cd backend
cp .env.example .env        # fill in your values
npm install
node scripts/createAdmin.js # seed admin account
npm run dev                 # runs on port 5000

# Frontend (new terminal)
cd frontend
npm install
npm start                   # runs on port 3000

# Admin (new terminal)
cd admin
npm install
npm start                   # runs on port 3001
```

**Required environment variables (backend):**
```
MONGO_URI=
JWT_SECRET=
STRIPE_SECRET_KEY=
CLIENT_URL=http://localhost:3000
ADMIN_URL=http://localhost:3001
GMAIL_USER=
GMAIL_APP_PASSWORD=
```

---

## Project Structure

```
├── backend/
│   ├── config/         # DB connection
│   ├── controllers/    # Route handlers
│   ├── middleware/     # auth, adminAuth, banCheck, errorHandler
│   ├── models/         # Mongoose schemas
│   ├── routes/         # Express routers
│   ├── socket/         # Socket.IO room auth
│   ├── utils/          # logger, emailService
│   └── scripts/        # createAdmin seed script
├── frontend/
│   └── src/
│       ├── api/        # Axios request functions
│       ├── components/ # Reusable UI components
│       ├── context/    # AuthContext
│       ├── hooks/      # useSocket
│       └── pages/      # auth/, client/, freelancer/, shared/
└── admin/
    └── src/
        ├── api/        # Admin API functions
        ├── components/ # Layout, common components
        ├── context/    # AuthContext
        └── pages/      # Dashboard, Users, Jobs, Payments, Reviews
```

---

## Interview Talking Points

**"Walk me through the payment flow."**  
The client accepts a bid which triggers a server-side Stripe PaymentIntent creation. The frontend receives only the `client_secret` and renders the Stripe Elements card form. On submission, Stripe.js handles card tokenization — raw card data never touches my server. After the user submits, the frontend calls my `/confirm` endpoint which re-fetches the PaymentIntent status directly from Stripe's API to verify success before updating the database. The freelancer's payment is released only when the client explicitly approves the completed work.

**"How do you handle authorization?"**  
JWT verification and ban checking happen in a single `protect` middleware applied to all protected routes. Role restrictions are layered on top per-route using `restrictTo()`. Admin routes use a completely separate middleware that additionally checks `role === 'admin'`. This means a regular user token is rejected by admin routes even if it's otherwise valid.

**"How does the real-time chat work?"**  
Socket.IO with room-based messaging scoped to job IDs. When a user tries to join a room, the server queries the database to verify they are either the client or the assigned freelancer on that job. Authorization is re-verified on every message send — not just on initial connection — so a user who loses their role mid-session cannot continue sending messages.

**"What would you improve with more time?"**  
MongoDB transactions for multi-document writes like bid acceptance — currently three sequential writes that could leave inconsistent state if one fails. Stripe Connect for actual payouts to freelancers instead of just tracking release in the database. Redis adapter for Socket.IO to support horizontal scaling. BullMQ for background jobs like stale job expiry and async notification dispatch.

---

## Test Credentials

| Role | Email | Password |
|------|-------|----------|
| Client | client@test.com | test123 |
| Freelancer | freelancer@test.com | test123 |
| Admin | admin@freelance.com | Admin@123456 |

Stripe test card: `4242 4242 4242 4242` · any future expiry · any CVC
