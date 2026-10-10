# H4B Dashboard — HandForBrand Rebuild

A fully-functional business dashboard built with React + Vite, Tailwind CSS, Lucide React, and Supabase.

## Quick Start

### 1. Clone / open the project
```bash
cd /Users/v/Documents/dj
npm install
```

### 2. Set up Supabase

1. Go to [https://app.supabase.com](https://app.supabase.com) and create a new project.
2. In the SQL Editor, run the contents of **`supabase/schema.sql`** (creates all tables + RLS policies).
3. Copy your **Project URL** and **anon public key** from Settings → API.

### 3. Configure environment variables

Edit `.env.local` and fill in your credentials:
```
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

> **Never** commit `.env.local` to version control. It is already in `.gitignore`.

### 4. Run the dev server
```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

---

## Tech Stack

| Layer | Technology |
|---|---|
| UI | React 19 + JSX |
| Build | Vite 8 |
| Styling | Tailwind CSS v4 |
| Icons | Lucide React |
| Routing | React Router v7 |
| Database | Supabase PostgreSQL |
| Auth | Supabase Auth |

---

## Project Structure

```
src/
├── App.jsx                    # Router + route definitions
├── main.jsx                   # React entry point
├── index.css                  # Tailwind + global styles
│
├── lib/
│   └── supabase.js            # Supabase client (reads from env vars)
│
├── contexts/
│   └── AuthContext.jsx        # Auth state + signIn/signOut/signUp
│
├── services/                  # Business logic (no UI)
│   ├── ordersService.js
│   ├── customersService.js
│   ├── productsService.js
│   └── dashboardService.js
│
├── components/
│   ├── auth/
│   │   └── ProtectedRoute.jsx
│   ├── layout/
│   │   ├── AppLayout.jsx
│   │   ├── Sidebar.jsx        # Collapsible sidebar with nav
│   │   └── Header.jsx
│   ├── ui/                    # Reusable design system atoms
│   │   ├── Button.jsx
│   │   ├── Input.jsx
│   │   ├── Select.jsx
│   │   ├── Modal.jsx
│   │   ├── Badge.jsx
│   │   ├── Alert.jsx
│   │   └── Spinner.jsx
│   ├── orders/
│   │   ├── NewOrderModal.jsx
│   │   └── OrderDetailPanel.jsx
│   └── customers/
│       └── AddCustomerModal.jsx
│
└── pages/
    ├── LoginPage.jsx
    ├── DashboardPage.jsx
    ├── OrdersPage.jsx
    ├── CustomersPage.jsx
    ├── ProductsPage.jsx
    ├── FormsPage.jsx
    ├── AutomationsPage.jsx
    ├── PayoutsPage.jsx
    └── SettingsPage.jsx

supabase/
└── schema.sql                 # Run this in Supabase SQL Editor
```

---

## Pages Implemented

| Page | Route | Status |
|---|---|---|
| Login / Sign Up | `/login` | ✅ Full auth |
| Dashboard | `/dashboard` | ✅ Stats + revenue card |
| Orders | `/orders` | ✅ List, search, filter, detail panel |
| Customers | `/customers` | ✅ Table, search, filter |
| Products | `/products` | ✅ Card grid, add/edit/delete |
| Forms | `/forms` | 🔲 Stub |
| Automations | `/automations` | 🔲 Stub |
| Payouts | `/payouts` | 🔲 Stub |
| Settings | `/settings` | ✅ Profile + password |

---

## Data Model

- **profiles** — user account info (name, business, plan)
- **customers** — contacts with phone/email/source
- **products** — service/product catalog with price
- **orders** — customer orders with progress, priority, due date
- **order_items** — line items per order
- **payments** — payment record per order (base, advance, balance)

All tables are protected with **Row Level Security** — each user can only access their own data.
