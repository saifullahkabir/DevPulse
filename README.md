# DevPulse – Internal Issue Tracker API

## 🌐 Live URL

https://devpulse-server-api.vercel.app

---

## Project Description

DevPulse is a backend API for an internal tech issue tracking system.  
It allows team members to report bugs, suggest features, and manage issue workflows with role-based access control.

---

## Tech Stack

- Node.js (v24+)
- TypeScript
- Express.js
- PostgreSQL (pg driver)
- JWT (jsonwebtoken)
- bcryptjs
- dotenv
- cors

---

## Features

- User Registration & Login (JWT Authentication)
- Role-based access control (Contributor / Maintainer)
- Create issues (bug / feature request)
- View all issues with filtering & sorting
- View single issue details
- Update issues (with permission rules)
- Delete issues (Maintainer only)
- Secure password hashing using bcrypt
- Protected routes using JWT middleware
- Global error handling system

---

## API Endpoints

### 🔐 Auth Module

- POST /api/auth/signup → Register User  
- POST /api/auth/login → Login User  

---

### 🐞 Issues Module

- POST /api/issues → Create Issue (Auth required)  
- GET /api/issues → Get All Issues  
- GET /api/issues/:id → Get Single Issue  
- PATCH /api/issues/:id → Update Issue (Auth required)  
- DELETE /api/issues/:id → Delete Issue (Maintainer only)  

---

## Database Schema Summary

### 👤 users table

- id → Auto-increment primary key  
- name → Full name of user  
- email → Unique login email  
- password → Hashed password (never returned)  
- role → contributor | maintainer  
- created_at → Account creation timestamp  
- updated_at → Last update timestamp  

---

### 🐞 issues table

- id → Auto-increment primary key  
- title → Issue title (max 150 chars)  
- description → Detailed issue description (min 20 chars)  
- type → bug | feature_request  
- status → open | in_progress | resolved  
- reporter_id → User ID who created issue  
- created_at → Issue creation timestamp  
- updated_at → Last update timestamp  

---

## Setup Instructions

### 1. Clone repository

```bash
git clone https://github.com/saifullahkabir/DevPulse
cd DevPulse
```

### 2. Install dependencies

```bash
npm install
```

### 3. Run development server

```bash
npm run dev
```
