# FreelanceHub — Full Stack Freelance Bidding Platform

A production-deployed freelance marketplace where clients post jobs, freelancers bid, and payments are held in escrow until work is approved. Built with the MERN stack, Stripe PaymentIntents, Socket.IO real-time messaging, and Cloudinary file uploads.

**Live Demo:** https://freelance-platform-bice.vercel.app  
**Admin Panel:** https://freelance-admin-eosin.vercel.app  
**Backend API:** https://freelance-platform-backend-l5gj.onrender.com/api/health

---

## Tech Stack

**Backend:** Node.js, Express, MongoDB (Mongoose), JWT, Stripe, Socket.IO, Cloudinary, Winston  
**Frontend:** React 18, React Router v6, Axios, Stripe.js, Recharts  
**Admin:** Separate React app with role-protected routes and analytics charts  
**Deployment:** Render (backend) + Vercel (frontend + admin) + MongoDB Atlas + Cloudinary

---

## Architecture

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│  React Frontend │────▶│  Express API    │────▶│  MongoDB Atlas  │
│  (Vercel)       │     │  (Render)       │     │  (Cloud)        │
└─────────────────┘     └────────┬────────┘     └─────────────────┘
                                  │
                    ┌─────────────┼──────────────┬─────────────┐
                    ▼             ▼              ▼             ▼
             Socket.IO         Stripe       Cloudinary     Winston
           (Real-time)       (Payments)   (File Storage)  (Logging)

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
Freelancers browse & search with filters → submit bids
      │
Client reviews bids → accepts one → Stripe payment modal opens
      │
Payment held in escrow (Stripe PaymentIntent)
      │
Freelancer works → real-time chat with file attachments
      │
Freelancer marks complete
      │
Client approves → releases payment to freelancer
      │
Client leaves star review → freelancer rating recalculated
```

If the client is unhappy at any point they can cancel the contract — the job reopens for new bids and the escrowed payment is refunded. Clients can also withdraw open job postings, which rejects all pending bids and notifies freelancers. Either party can raise a dispute for admin resolution.

---

## Key Engineering Decisions

### Payment Security
Payment state is never derived from the frontend. The Stripe PaymentIntent is created server-side and the frontend only handles the card UI via Stripe.js. Confirming payment requires server-side verification of the PaymentIntent status directly from Stripe's API — a malicious client cannot fake a successful payment by calling the confirm endpoint with an arbitrary ID.

### Role-Based Access Control
Every protected route passes through `protect` middleware which verifies the JWT, checks the user still exists, and checks `isBanned`. Role restrictions (`restrictTo('client')`, `restrictTo('freelancer')`) are applied per-route. Admin routes use a separate `adminProtect` middleware that additionally verifies `role === 'admin'` — a regular user JWT is rejected even if the token is otherwise valid.

### Ban Enforcement
Ban checks are built into the `protect` middleware itself rather than applied per-route. This means banned users are blocked from every protected endpoint automatically — there is no risk of forgetting to add a ban check to a new route.

### Real-Time Architecture
Socket.IO uses a shared singleton connection per browser session. Both the chat and notification systems share one socket, ensuring the user's personal room (`user:${userId}`) is always joined on connect. Notifications are delivered instantly server-side via `io.to('user:XXX').emit()` without polling. Transports are configured as `["polling", "websocket"]` to support Render's infrastructure which requires an HTTP handshake before upgrading to WebSocket.

### Real-Time Messaging & File Attachments
Socket.IO chat rooms are scoped to job IDs. Authorization is checked on every `join-room` and `send-message` event — the server verifies the connecting user is either the client or the assigned freelancer. Files (images, PDFs, DOCX) are uploaded to Cloudinary before the message is sent, then the file metadata is broadcast via socket. Downloads use a frontend blob fetch to ensure correct filenames regardless of Cloudinary's Content-Disposition headers.

### Dispute System
Either party in an active contract can raise a dispute. Disputes lock the payment in escrow and flag the job for admin review. Admins can resolve with three outcomes: refund to client, release to freelancer, or cancel the contract. All resolutions trigger real-time notifications to both parties.

### State Transitions
Job status follows a strict sequence: `open → in-progress → completed`. Cancelled and withdrawn jobs are terminal states. Illegal transitions are rejected server-side with a descriptive error before any database write occurs.

### Structured Logging
Winston outputs JSON in production (compatible with Datadog, CloudWatch, Logtail) and colorized text in development. Every HTTP request is logged with method, path, status code, response time, and userId. Errors include stack traces on 5xx, warn-level on 4xx.

---

## Features

**Client**
- Post jobs with title, description, budget range, and deadline
- Edit open job postings
- Withdraw open job postings (rejects all pending bids, notifies freelancers)
- Review all bids with freelancer profiles and ratings
- Accept a bid and pay via Stripe (escrow)
- Reject individual bids with freelancer notification
- Real-time chat with assigned freelancer
- Send and receive file attachments (images, PDF, DOCX) in chat
- Cancel contract mid-project with reason (triggers refund if payment escrowed)
- Release escrowed payment on completion
- Raise a dispute for admin resolution
- Leave star rating and written review

**Freelancer**
- Browse and search open jobs
- Filter by budget range (min/max), sort by date or budget
- Status tab filtering (Open / In-Progress / Completed)
- Submit bids with proposal and amount
- Real-time notifications for bid acceptance/rejection
- Real-time project chat with file attachments
- Mark jobs as complete
- Earnings dashboard with charts (total earned, pending escrow, job history)
- Raise a dispute for admin resolution

**Admin Panel** (separate app)
- Dashboard with live platform stats (users, jobs, bids, revenue)
- Analytics charts with 7 / 30 / 90 day ranges (Recharts)
- User management — search, ban/unban with reason, soft delete
- Job management — view all jobs with status filters, force cancel
- Payment overview — all transactions with status and totals
- Dispute management — review disputes, resolve with refund/release/cancel, add admin note
- Reviews moderation — delete inappropriate reviews, auto-recalculates freelancer rating

**Notifications (real-time + bell icon)**
- New bid received (client)
- Bid accepted (freelancer)
- Bid rejected (freelancer)
- Payment secured in escrow (freelancer)
- Job marked complete (client)
- Payment released (freelancer)
- Contract cancelled (freelancer)
- Job withdrawn (all bidding freelancers)
- Dispute resolved (both parties)
- New chat message (other party)

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
PATCH  /api/jobs/:id/edit
PATCH  /api/jobs/:id/complete
PATCH  /api/jobs/:id/withdraw

GET    /api/bids
POST   /api/bids
PATCH  /api/bids/:id/accept
PATCH  /api/bids/:id/reject
POST   /api/bids/cancel/:jobId

POST   /api/payments/create-intent
POST   /api/payments/confirm
POST   /api/payments/release/:jobId
GET    /api/payments/job/:jobId

GET    /api/messages/:jobId
POST   /api/upload

POST   /api/disputes
GET    /api/disputes/:jobId

GET    /api/earnings
GET    /api/notifications
PATCH  /api/notifications/read-all
POST   /api/reviews

GET    /api/profiles/:userId
PATCH  /api/profiles

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
GET    /api/admin/disputes
PATCH  /api/admin/disputes/:id/resolve
GET    /api/analytics

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
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
GMAIL_USER=
GMAIL_APP_PASSWORD=
```

**Required environment variables (frontend & admin — Vercel):**
```
REACT_APP_API_URL=
REACT_APP_STRIPE_PUBLISHABLE_KEY=
REACT_APP_SOCKET_URL=
```

---

## Project Structure

```
├── backend/
│   ├── config/         # DB connection
│   ├── controllers/    # Route handlers
│   │   ├── authController.js
│   │   ├── jobController.js
│   │   ├── bidController.js
│   │   ├── paymentController.js
│   │   ├── messageController.js
│   │   ├── uploadController.js
│   │   ├── disputeController.js
│   │   ├── earningsController.js
│   │   ├── analyticsController.js
│   │   ├── notificationController.js
│   │   ├── reviewController.js
│   │   ├── profileController.js
│   │   └── adminController.js
│   ├── middleware/     # protect, adminProtect, errorHandler
│   ├── models/         # Mongoose schemas
│   ├── routes/         # Express routers
│   ├── socket/         # socketManager.js — room auth + messaging
│   ├── utils/          # logger, emailService
│   └── scripts/        # createAdmin seed script
├── frontend/
│   └── src/
│       ├── api/        # Axios request functions
│       ├── components/ # StarRating, PaymentForm, PaymentStatus, NotificationBell
│       ├── context/    # AuthContext
│       ├── hooks/      # useSocket (chat + notifications, shared singleton)
│       └── pages/
│           ├── auth/           # Login, Register, ForgotPassword
│           ├── shared/         # JobDetail, Jobs, FileMessage
│           ├── CreateJob.jsx
│           ├── EditJob.jsx
│           ├── Profile.jsx
│           └── Earnings.jsx
└── admin/
    └── src/
        ├── api/        # Admin API functions
        ├── components/ # Layout, Sidebar, common components
        ├── context/    # AuthContext
        └── pages/      # Dashboard, Users, Jobs, Payments, Reviews, Disputes
```

---

## Test Credentials

| Role       | Email                  | Password     |
|------------|------------------------|--------------|
| Client     | client@client.com      | client123    |
| Freelancer | test@test.com          | test123      |
| Admin      | admin@freelance.com    | Admin@123456 |

**Stripe test cards:**

| Card                  | Result            |
|-----------------------|-------------------|
| `4242 4242 4242 4242` | Payment succeeds  |
| `4000 0000 0000 9995` | Payment declined  |

Any future expiry date · any 3-digit CVC · any billing ZIP
