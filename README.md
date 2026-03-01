# 🚀 FreeLance Bidding Platform — MERN + Socket.IO

A production-grade Mini Fiverr Clone with real-time messaging.

## Architecture

\`\`\`
freelance-platform/
├── backend/
│   ├── config/          # DB connection
│   ├── controllers/     # Business logic (authController, jobController, bidController, messageController)
│   ├── middleware/       # JWT auth, RBAC, validation, error handler
│   ├── models/          # User, Job, Bid, Message (Mongoose schemas)
│   ├── routes/          # Express routes
│   ├── socket/          # Socket.IO manager with JWT auth
│   └── server.js        # Entry point
└── frontend/
    └── src/
        ├── api/         # Axios instance + API calls per domain
        ├── context/     # AuthContext (React Context)
        ├── hooks/       # useSocket (Socket.IO)
        ├── pages/       # Auth, Client, Freelancer, Shared pages
        └── components/  # Layout, common components
\`\`\`

## Quick Start

### Backend
\`\`\`bash
cd backend
npm install
cp .env.example .env   # Fill in MONGO_URI, JWT_SECRET
npm run dev            # http://localhost:5000
\`\`\`

### Frontend
\`\`\`bash
cd frontend
npm install
cp .env.example .env
npm start              # http://localhost:3000
\`\`\`

## Key Security Decisions

| Concern | Solution |
|---|---|
| Auth | JWT (stateless, self-contained, expirable) |
| Passwords | bcrypt with 12 salt rounds |
| Role enforcement | Server-side middleware restrictTo() |
| Duplicate bids | DB-level unique compound index + controller check |
| Socket auth | JWT verified in Socket.IO middleware on connect |
| Input validation | Backend validation middleware (never trust frontend) |
| Ownership | Controller validates req.user._id vs resource owner |

## API Endpoints

| Method | Path | Role | Description |
|---|---|---|---|
| POST | /api/auth/register | public | Register user |
| POST | /api/auth/login | public | Login, get JWT |
| GET | /api/auth/me | any | Get current user |
| GET | /api/jobs | any | List jobs |
| POST | /api/jobs | client | Create job |
| PATCH | /api/jobs/:id | client | Update job |
| PATCH | /api/jobs/:id/complete | freelancer | Mark complete |
| GET | /api/bids | client | Get bids for job |
| GET | /api/bids/my | freelancer | My bids |
| POST | /api/bids | freelancer | Submit bid |
| PATCH | /api/bids/:id/accept | client | Accept bid |
| GET | /api/messages/:jobId | client/freelancer | Message history |

## Socket.IO Events

| Event | Direction | Description |
|---|---|---|
| join-room | client→server | Join job's private room |
| send-message | client→server | Send chat message |
| new-message | server→client | Broadcast new message |
| room-joined | server→client | Confirm room join |
| job-updated | server→client | Bid accepted notification |
| error | server→client | Error feedback |

## Deployment

- **Frontend**: Deploy `/frontend` to Vercel. Set `REACT_APP_API_URL` and `REACT_APP_SOCKET_URL` env vars.
- **Backend**: Deploy `/backend` to Render or Railway. Set all `.env` vars in dashboard.
- **DB**: MongoDB Atlas (free tier works). Whitelist `0.0.0.0/0` in Network Access for hosted deployments.
