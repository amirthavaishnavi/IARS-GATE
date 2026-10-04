# IARS-GATE — Full Setup & Run Guide

Follow this in order. 4 things need to run at once, each in its **own terminal**
inside VS Code (Terminal → New Terminal → click the "+" to open more).

---

## 0. One-time setup

```bash
# In the project root (iars-gate/)

# Python packages (for AI/ML)
pip install pandas numpy scikit-learn flask flask-cors --break-system-packages

# Backend packages
cd backend
npm install
cd ..

# Frontend packages
cd frontend
npm install
cd ..
```

## 1. MongoDB Atlas (one-time)

1. Go to mongodb.com/atlas → create a free account → create a free (M0) cluster.
2. Database Access → add a user (username + password).
3. Network Access → Add IP Address → "Allow access from anywhere" (0.0.0.0/0).
4. Click "Connect" → "Drivers" → copy the connection string
   (looks like `mongodb+srv://user:pass@cluster0.xxxxx.mongodb.net/`).
5. In `backend/`, copy `.env.example` to `.env` and paste your connection
   string into `MONGO_URI` (add `/iars_gate` at the end before any `?`).

## 2. Seed the database (one-time, after MongoDB is connected)

```bash
cd backend
npm run seed
```
You should see "Inserted 320 PYQs", "Inserted ... attempts", "Demo user AMIRTHA01 ready".

## 3. Run all 3 servers (every time you work on the project)

**Terminal 1 — Flask ML service:**
```bash
cd ml-service
python3 app.py
```
Runs on http://localhost:5001

**Terminal 2 — Node/Express backend:**
```bash
cd backend
npm start
```
Runs on http://localhost:5000

**Terminal 3 — React frontend:**
```bash
cd frontend
npm run dev
```
Runs on http://localhost:5173 — open this in your browser.

## 4. What you should see

The dashboard shows a branch dropdown (CSE/Mechanical/Civil/Electrical/ECE),
and after clicking "Get Recommendations": topic performance summary (WEAK/
MODERATE/STRONG), a revision schedule, recommended next questions, and
related topics — all for the demo student (AMIRTHA01, CSE branch by default).

## Troubleshooting

- **"Could not load recommendations"** in the browser → check Terminal 1 and
  Terminal 2 are both still running without errors.
- **MongoDB connection error** → double check `MONGO_URI` in `backend/.env`
  (no `<` `>` brackets left in it, password has no typos, IP allow-list set).
- **`npm start` fails: Cannot find module** → run `npm install` again inside
  that folder.
- **Port already in use** → close any old terminal still running that server,
  or change the port in `.env` / `vite.config.js`.
