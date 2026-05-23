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
