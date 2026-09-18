# 🚀 ClaimPilot — AI-Powered Claims Processing Platform

ClaimPilot is an enterprise-grade, AI-assisted motor insurance claims management platform built with modern web standards, 3D visualization, and micro-motion design. 

The platform bridges policyholders and claim adjusters through two dedicated, role-tailored portals:
1. **Customer Portal (`/customer`)** — A minimalist, stress-free claim submission and tracking interface.
2. **Agent Workspace (`/agent`)** — A high-density claims adjudication workbench equipped with 3D deformation modeling, AI surface normal analysis, fraud score indicators, and decision governance.

---

## 📑 Table of Contents
- [Key Highlights](#-key-highlights)
- [Portals & Features](#-portals--features)
  - [1. Customer Portal](#1-customer-portal-customer)
  - [2. Agent Workspace](#2-agent-workspace-agent)
- [3D Vision & AI Inspection Suite](#-3d-vision--ai-inspection-suite)
- [Tech Stack](#-tech-stack)
- [Design System & UI Architecture](#-design-system--ui-architecture)
- [Getting Started](#-getting-started)
- [Authentication & Role Credentials](#-authentication--role-credentials)
- [Architecture & Data Flow (Mock vs Production)](#-architecture--data-flow-mock-vs-production)
- [Directory Structure](#-directory-structure)

---

## ✨ Key Highlights

* **3D Damage Mesh & Surface Normal Reconstruction:** Powered by **Three.js** and **React Three Fiber**, allowing adjusters to inspect vehicle deformation, surface gradients, and structural depth in real-time 3D space.
* **Granular AI Fraud & Risk Scoring:** 0–100 weighted fraud probability index, metadata consistency audits, and algorithmic risk flags.
* **Rigorous Vehicle & Identity Verification:** Multi-point check fields including Engine Number, Chassis Number, High Security Registration Plate (HSRP), and Driver's License photo/number matching.
* **Cinematic Micro-Interactions:** Smooth page transitions, score bar rollouts, and modal springs powered by **GSAP**.
* **Dual Theme Engine:** Native dark and light theme switching with custom CSS token design systems.

---

## 👥 Portals & Features

### 1. Customer Portal (`/customer`)
Designed with a focused, conversational layout inspired by modern AI productivity tools to minimize cognitive overload during an accident claim.

* **Dashboard:** Centered "How can we help?" search with quick-action tiles for common claim types (Collision, Theft, Weather/Natural Disaster).
* **New Claim Stepper:** Intuitive multi-step claim filing workflow:
  * Policy, Vehicle, and Incident details.
  * Identity & Registration verification (Engine, Chassis, HSRP, License Photo).
  * Multi-angle damage photo and video evidence upload.
* **My Claims:** Real-time claim status tracker with cost estimate ranges and status badges (`Submitted`, `Under Review`, `Approved`, `Needs Info`, `Rejected`).
* **Damage Analysis Preview:** Customer-facing view of detected damage boundaries and repair estimates.

---

### 2. Agent Workspace (`/agent`)
A dense, information-rich environment engineered for rapid case triaging and strict claim settlement workflows.

* **Agent Dashboard:** Real-time operational metrics (KPI cards for New Today, Pending Review, High Risk, SLA Risk), priority queue list, and recent audit logs.
* **Claims Queue (`/agent/claims`):** Data table with multi-filter states (All, New, Needs Review, High Risk), instant keyword search, and monospace claim IDs for fast scanning.
* **Quick Review Drawer:** Slide-out drawer on table row click for rapid previewing of claim evidence and AI flags without navigating away.
* **Deep Investigation Suite (`/agent/claims/:id`):** Multi-tab adjudication console:
  * **Overview:** Complete claimant profile, contact details, incident location, vehicle verification credentials, and an AI incident breakdown.
  * **Evidence & Damage:** High-resolution evidence viewer with interactive bounding boxes and line-item part repair/replacement cost estimates.
  * **3D AI Analysis:** Advanced interactive vehicle deformation meshes, surface normals, and segmentation maps.
  * **Fraud Analysis:** Comprehensive risk breakdown analyzing location matching, EXIF metadata, duplicate claim detection, and historical frequency.
* **Adjudication Modals:**
  * **Approve Claim:** Enforces surveyor estimates and approved settlement amounts before sign-off.
  * **Reject Claim:** Requires structured justification notes logged to the claim timeline.
  * **Request Info:** Generates inquiry notifications sent directly to the claimant.

---

### 3. Approved Claim Response Workflow

Once an agent approves a claim, the following flow takes place:

1. **Agent approves the claim** from the Agent Workspace with a settlement amount.
2. **Client receives the approval** on their portal (`/customer/claims/:id/approved`) showing the settlement details.
3. **Client responds** — they can either:
   - **Approve the settlement** (optionally updating contact details like email/phone for communication).
   - **Reject the settlement** (with a required explanation).
4. **Agent sees the client's response** in real time on the Agent Workspace (`/agent/claims/:id/response`) — no page refresh needed.
5. **If the client approved**, the agent sees an **"OK to Proceed"** button to forward the claim to the finance department for payment processing.
6. **Once "OK to Proceed" is clicked**, the "Change Decision" button disappears because the claim has been forwarded and can no longer be revised.

> **Important rule:** Client approval alone never triggers payment. The agent must explicitly click "OK to Proceed" to authorize the finance handoff.

---

### Changing a Decision

At any point before clicking "OK to Proceed", the agent can use the **"Change Decision"** button to revise their original approval/rejection. This resets the client's response back to "Awaiting Response" so the client can review the updated decision.

---

## 🛰 3D Vision & AI Inspection Suite

ClaimPilot includes interactive computer vision and 3D geometric analysis tools in the Agent Workspace:

| Component | Technology | Purpose |
| :--- | :--- | :--- |
| **Damage Deformation 3D** | `@react-three/fiber` + `three` | Generates an interactive 3D deformation topology map of impact points. |
| **Surface Normals Viewer** | Canvas + Vector Color Mapping | Computes surface gradient angles to distinguish between scratches, dents, and structural bends. |
| **Damage Segmentation** | Interactive Overlay | Segmented pixel masks identifying exact damaged panels (Bumpers, Panels, Lights). |
| **Input Comparison** | Split Comparison View | Side-by-side verification between submitted incident photos and baseline vehicle CAD/photos. |

---

## 🛠 Tech Stack

* **Framework:** [React 19](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/)
* **Build System:** [Vite](https://vitejs.dev/)
* **Routing:** [React Router v7](https://reactrouter.com/)
* **3D Graphics:** [Three.js](https://threejs.org/) + [@react-three/fiber](https://r3f.docs.pmnd.rs/) + [@react-three/drei](https://github.com/pmndrs/drei)
* **Animation & Motion:** [GSAP (GreenSock)](https://gsap.com/) + `@gsap/react`
* **Icons:** [Lucide React](https://lucide.dev/)
* **Code Quality & Linter:** [Oxlint](https://oxc.rs/)
* **Styling:** Modular CSS Architecture via CSS Custom Properties (`index.css`)

---

## 🎨 Design System & UI Architecture

ClaimPilot relies on a custom CSS token design system configured in `src/index.css`:
* **Default Theme (Dark Mode):** Deep slate palette (`#0B0E14` / `#121824`) with high-contrast text and subtle 1px structural borders.
* **Amber Accent:** Signature `#D4A853` / `#F59E0B` primary highlights tailored for enterprise trust rather than generic neon gradients.
* **Status Badging:** Strict semantic palette (Green = Approved, Amber = Under Review, Red = High Risk / Rejected, Blue = Needs Info).
* **Typography:** `Inter` for crisp body copy and `JetBrains Mono` for IDs, policy numbers, and financial estimations.

---

## 🚀 Getting Started

### Prerequisites
* **Node.js**: v18.0.0 or higher
* **Package Manager**: npm, yarn, or pnpm

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/your-org/ClaimPilot.git
   cd ClaimPilot/frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the local Vite development server:
   ```bash
   npm run dev
   ```

4. Open your browser and navigate to:
   ```text
   http://localhost:5173
   ```

---

## 🔑 Authentication & Role Credentials

The application includes mock authentication for rapid testing and demonstration. You can click the **One-Click Demo Sign In** buttons on the Login page or use the credentials below:

| Role | Email | Password | Landing Page |
| :--- | :--- | :--- | :--- |
| **Customer** | `customer@example.com` | `password` | `/customer` |
| **Claims Agent** | `agent@example.com` | `password` | `/agent` |

---

## 🔄 Architecture & Data Flow (Mock vs Production)

### Current State (Frontend Demonstration)
* **Claims Storage:** In-memory mock collection (`src/mock/claims.ts`) mutated via `src/services/claimsApi.ts`. Changes are also saved to `localStorage` so that data stays in sync across browser tabs (e.g. when the client approves in one tab and the agent views the response in another).
* **Cross-Tab Sync:** The agent workspace listens for `localStorage` changes using the browser's `storage` event, so the agent page updates automatically when the client responds — no manual refresh needed.
* **Session Persistence:** Active user credentials are saved in `localStorage` (`auth_user`) to survive page reloads.
* **AI Analysis:** Pre-computed analysis records exist for claims `CLM-1024`, `CLM-1025`, and `CLM-1026`. Any newly created claim will display fallback placeholder data until connected to a live ML inference server.
* **Reset Demo Data Button:** Since `localStorage` persists data even after page refreshes, a **"Reset Demo Data"** button is provided in both the customer TopBar and the agent header. Clicking it clears all saved claim data and reloads the page with the original mock data. This button is **temporary** — it exists purely for testing convenience and will be removed once a real backend is connected.

### Production Backend Migration Checklist
When integrating a real backend (e.g. Node.js/Express, FastAPI, or Go + PostgreSQL):
1. **Remove Mock Data:** Delete `src/mock/claims.ts` and `src/mock/analysis.ts`.
2. **Connect REST/GraphQL Services:** Update `src/services/claimsApi.ts` and `src/services/analysisApi.ts` with real `fetch` / `axios` endpoints (`GET /api/claims`, `POST /api/claims`, etc.).
3. **JWT Auth:** Replace mock user storage in `src/store/authStore.ts` with standard Bearer token management in HTTP headers.
4. **Data Isolation:** User A will query claims filtered strictly by `customerId`, while Agents will query all assigned claims.
5. **Live ML Pipeline:** Point the 3D analysis views to actual model inference outputs (YOLO / SAM segmentation masks, depth estimators).

---

## 📁 Directory Structure

```text
frontend/
├── public/                     # Static assets & sample mock evidence
├── src/
│   ├── components/
│   │   ├── analysis/           # AI inspection components (3D deformation, normals, segmentation)
│   │   ├── layout/             # TopBar, CustomerLayout, AgentLayout
│   │   ├── three/              # Three.js Canvas & 3D mesh rendering scenes
│   │   └── ui/                 # Reusable UI primitives (Card, Badge, Modal, Drawer, etc.)
│   ├── lib/
│   │   └── gsap.ts             # GSAP registration & animation utilities
│   ├── mock/                   # In-memory mock databases (claims, analysis data)
│   ├── pages/
│   │   ├── agent/              # Agent portal views (Dashboard, Queue, Details)
│   │   ├── customer/           # Customer portal views (Dashboard, New Claim, My Claims)
│   │   ├── About.tsx           # Interactive product narrative & vision
│   │   └── Login.tsx           # Authentication page with demo quick-switches
│   ├── routes/
│   │   └── AppRoutes.tsx       # Route definitions & role-based route guards
│   ├── services/               # API abstraction layer (claimsApi, analysisApi, advancedAnalysisApi)
│   ├── store/                  # Client-side stores (authStore, themeStore)
│   ├── types/                  # TypeScript interfaces (claim, analysis, auth)
│   ├── index.css               # Global stylesheet & design token system
│   └── main.tsx                # Application root mount
├── package.json
├── tsconfig.json
└── vite.config.ts
```

---

## 📄 License

Distributed under the MIT License. See `LICENSE` for more information.
