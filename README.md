# IGS-Site-For-class

**International GoldStars School — MYP 3 Activity Hub** (Class Leaders: **Yahyo & Fazliya**).

A production-ready full-stack House Points, Combo Streak, Weekly Honors & Account Portal built with **Next.js 14 (App Router)**, **TypeScript**, **Tailwind CSS**, **Recharts**, and **Supabase (PostgreSQL)**.

## Features
- **Account Registration (`/register`) & Login (`/login`)**:
  - Register with **Phone Number + Username + Password** (secured with salted `scrypt` password hashing).
  - Log in using **either your Phone Number OR your Username** + Password.
  - Pre-configured primary Admin account (`Yahyoo_Erikovich`) with full Leader Console access and ability to promote co-leaders.
- **Public Dashboard (`/`)**: Live 3-Team House Race with **Fair Average (Pts / Student)** vs **Total Points** toggle, Overall MVP, Subject Champions, Most Improved Student, Filterable Class Leaderboard, and Transparent Activity Feed.
- **Class Leader Admin Console (`/admin`)**: One-Click Daily Input across 3 Team columns, Undo Toasts, Mandatory Fair-Play Reason Modal, Dynamic `+5 Team Combo Streak`, and Weeks / Students / Subjects / Accounts Management.
- **Classroom TV Mode (`/tv`)**: High-contrast Homeroom projector view with auto-refresh and Fullscreen toggle.
- **Weekly Teacher Report (`/report`)**: Formal A4 printable report (`@media print` optimized).

## Deploy on Render.com + Supabase (100% Free)
1. In **Supabase → SQL Editor**, paste and run `schema.sql` once.
2. In **Render.com → New + → Web Service**, connect this GitHub repository (`Yahyoo1FrontentPro/IGS-Site-For-class`).
3. Set:
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm run start`
   - **Environment Variables**:
     - `NEXT_PUBLIC_SUPABASE_URL`
     - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
     - `SUPABASE_SERVICE_ROLE_KEY`
     - `SESSION_SECRET` *(any random 32+ character string)*
