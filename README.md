# ClaimPilot

ClaimPilot is a modern, AI-powered insurance claims management platform designed with a high-density, professional UI. It features two distinct portals: a minimalist, consumer-friendly **Customer Portal** for submitting and tracking claims, and a powerful, data-rich **Agent Workspace** for reviewing claims, fraud analysis, and case resolution.

---

## 🚀 Getting Started

### Prerequisites
- Node.js (v18 or higher)
- npm or yarn

### Installation & Running Locally

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Start the development server:**
   ```bash
   npm run dev
   ```

3. **Open the app:**
   Navigate to `http://localhost:5174` (or the port specified in your terminal).

---

## 🔑 Authentication (Mock)

The application uses a mock authentication system for demonstration purposes. Use the following credentials to log into the respective portals:

**Customer Account:**
- **Email:** `customer@example.com`
- **Password:** `password`
- *(Or simply click the "Sign in as Customer" button on the login page)*

**Agent Account:**
- **Email:** `agent@example.com`
- **Password:** `password`
- *(Or simply click the "Sign in as Agent" button on the login page)*

---

## 👥 Portals Overview

### 1. Customer Portal (`/customer`)
Designed with a clean, conversational, and minimalist UI (inspired by modern AI chat interfaces) to reduce cognitive load during a stressful event like filing an insurance claim.

**Key Features:**
- **Sidebar Navigation:** A persistent sidebar displaying past claims and a quick action button to start a new claim.
- **Home Dashboard:** A centered, distraction-free "How can we help?" interface with quick shortcuts for common claim types (Collision, Theft, Own Damage).
- **New Claim Flow:** A streamlined, step-by-step form to collect incident details, location, and photo evidence.
- **Claim Tracking:** Real-time status updates and basic AI estimation feedback.

### 2. Agent Workspace (`/agent`)
Designed for high-density functionalism and professional claims operations, allowing agents to process claims efficiently.

**Key Features:**
- **Agent Dashboard:** A comprehensive overview with KPI stat cards (New Today, Pending Review, High Risk, SLA Risk), a priority queue, and a recent activity feed.
- **Claims Queue:** An enterprise-grade data table with filtering (All, New, Needs Review, High Risk), local search, and monospace IDs for quick scanning.
- **Quick Review Drawer:** Clicking a claim in the table opens a side drawer for a fast preview of evidence, AI summary, and fraud risk without leaving the queue.
- **Investigation Workspace (Claim Details):** A deep-dive page divided into three tabs:
  - **Overview:** Customer details, incident description, and high-level AI summary.
  - **Evidence & Damage:** Image galleries, AI damage boundary detection, and line-item repair cost estimations.
  - **Fraud Analysis:** A detailed 0-100 risk score scale, accompanied by specific AI-generated risk indicators (passed verifications vs. suspicious flags). 

---

## 🎨 Design System

ClaimPilot uses a custom CSS variables-based design system (`index.css`) optimized for a dark-mode, professional aesthetic. 

- **Colors:** Deep neutrals (`#0A0A0A` background) with a signature Amber accent (`#D4A853`). It strictly avoids generic "AI purple/blue" gradients for a more serious, enterprise tone.
- **Typography:** Uses `Inter` for highly legible UI text and `JetBrains Mono` for tabular data, IDs, and financial figures.
- **Borders & UI:** Thin 1px borders, subtle hover states, and structural grid layouts over heavy shadows or excessive styling. 

---

## 🛠 Tech Stack

- **Framework:** React + TypeScript
- **Routing:** React Router DOM
- **Styling:** Vanilla CSS (Custom Design System via CSS Variables)
- **Icons:** Lucide React
- **Build Tool:** Vite
