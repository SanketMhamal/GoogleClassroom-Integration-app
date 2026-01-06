# Classroom Sync & Analytics

A Next.js application that integrates with **Google Classroom** and **Google Forms** to provide a unified dashboard for tracking assignments, submissions, and detailed form analytics.

##  Features

-   **Seamless Integration**: Syncs Courses, Assignments, and Form Responses directly from Google.
-   **Premium Dashboard**: 
    -   Overview statistics (Active Courses, Total Responses).
    -   Grid view of all courses and assignments.
    -   **Glassmorphism** UI with modern typography ("Inter" font).
-   **Deep Analytics**:
    -   Dedicated full-screen analytics page for each assignment.
    -   **Visual Charts**: Pie charts and Bar graphs for form questions.
    -   **Response breakdown**: View individual answers and file attachments.
-   **Robust Authentication**:
    -   Handles Google OAuth token management.
    -   Automatic account linking.
    -   **Self-healing**: Built-in flow to recover from `invalid_grant` (revoked token) errors.
-   **Database Storage**: Persists data locally using MySQL (via Prisma) for fast access.

## 🛠️ Tech Stack

-   **Framework**: [Next.js 15+](https://nextjs.org/) (App Router)
-   **Language**: TypeScript
-   **Styling**: Tailwind CSS v4
-   **Database**: MySQL + Prisma ORM
-   **Auth**: NextAuth.js (v5 Beta)
-   **Charts**: Recharts
-   **APIs**: Google Classroom API, Google Forms API, Google Drive API

## ⚙️ Setup & Installation

1.  **Clone the repository**:
    ```bash
    git clone <your-repo-url>
    cd classroom-sync
    ```

2.  **Install dependencies**:
    ```bash
    npm install
    ```

3.  **Environment Variables**:
    Create a `.env` file in the root directory:
    ```env
    DATABASE_URL="file:./dev.db"
    AUTH_SECRET="your-random-secret-here"
    
    # Google OAuth Credentials
    AUTH_GOOGLE_ID="your-client-id"
    AUTH_GOOGLE_SECRET="your-client-secret"
    ```

4.  **Database Setup**:
    ```bash
    npx prisma migrate dev --name init
    npx prisma generate
    ```

5.  **Run Development Server**:
    ```bash
    npm run dev
    ```

##  Usage Guide

1.  **Sign In**: Use your Google Account.
    -   *Required Permissions*: Drive (Readonly), Forms (Body + Responses), Classroom (Courses + CourseWork).
2.  **Sync Data**: Click the circular **Sync Button** in the dashboard header.
    -   This fetches the latest courses, form structures (questions), and student submissions.
3.  **View Analytics**:
    -   Click on any **Assignment Card** to open the details view.
    -   See charts for multiple-choice questions and lists for text answers.

##  Troubleshooting

### "invalid_grant" or "Insufficient Permissions"
If you see an error about expired sessions or missing permissions:

1.  **Reset Connection**: Click the red **Reset Connection** button on the dashboard (next to Sign Out).
2.  **Confirm**: This deletes the stale connection from the local database.
3.  **Re-Authenticate**: Sign in again and ensure **ALL** checkboxes on the Google Consent screen are checked.
4.  **Sync**: Try syncing again.

---
