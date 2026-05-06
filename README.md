# Team Task Manager 🚀

Hey! This is my full-stack project that I built to manage tasks within a team. I used **Flask** for the backend (because it's super simple and powerful) and **React** for the frontend. 

I built this to learn how real-world apps handle things like permissions, JWT authentication, and connecting a frontend to a proper API.

## What this app does:
- **Auth Stuff:** You can sign up and log in. I used JWT tokens to keep things secure so only logged-in users can see their data.
- **Projects:** You can create projects easily. The person who creates it automatically becomes the "Owner" (Admin).
- **Teamwork:** Owners can add members to their projects using their emails. No more working alone!
- **Task Board:** A simple board where you can add tasks with descriptions and due dates. You can move them between **Todo**, **In-Progress**, and **Done**.
- **Role-Based Access (RBAC):** I spent a lot of time on this logic. Members can only update tasks that are assigned to them, but the Owner can manage everything and delete tasks/members.
- **Dashboard:** A cool summary of total tasks, overdue ones, and a progress view of tasks per user.

## Tech Stack:
- **Frontend:** React.js (used Axios with interceptors for clean API calls)
- **Backend:** Flask (Python) + Flask-SQLAlchemy for database stuff
- **Auth:** Flask-JWT-Extended
- **Database:** SQLite for local development, but it's ready for PostgreSQL in production.

## How to run it locally:

### 1. Backend Setup:
Go to the `Backend` folder:
```bash
cd Backend
pip install -r requirements.txt
# Create a .env file with DATABASE_URL and JWT_SECRET_KEY
python app.py
```

### 2. Frontend Setup:
Go to the `frontend` folder:
```bash
cd frontend
npm install
npm start
```
The app will open at `http://localhost:3000`.

## Deployment:
I've already added the `Procfile`, `requirements.txt`, and `railway.json` so the backend can be deployed easily on Railway. For the frontend, you can just hook it up to Vercel or Netlify.

---
*Built with ❤️ (and a lot of coffee) by a final year CS student.*
