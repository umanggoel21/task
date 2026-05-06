# Team Task Manager 🚀

This is a full-stack application designed to manage projects and tasks within a team environment. It focuses on secure access, role-based permissions, and efficient task tracking.

## Core Features:

### 🔐 Secure Authentication
The app uses JWT (JSON Web Tokens) to handle user sessions. Once signed up and logged in, user identity is verified across all API requests, ensuring that data stays private and secure.

### 📂 Project Organization
Users can create multiple projects to organize their work. The creator of a project is automatically assigned as the **Owner**, giving them administrative control over that specific workspace.

### 👥 Team Collaboration
Owners can invite other users to join their projects using their email addresses. This allows teams to work together in a shared environment while keeping the project structure organized.

### 📋 Task Management Board
Each project features a dedicated task board to manage the workflow. Key capabilities include:
- Creating tasks with detailed descriptions, priority levels, and due dates.
- Assigning tasks to specific team members to establish clear accountability.
- Tracking progress through a status system (**Todo**, **In-Progress**, **Done**).

### 🛡️ Role-Based Access Control (RBAC)
The system enforces strict permission rules to ensure data integrity:
- **Owners:** Have full permissions to create, edit, and delete any task or member within their project.
- **Members:** Can view project data and update the status of tasks specifically assigned to them. They cannot delete tasks or modify the project's membership.

### 📊 Performance Dashboard
The dashboard provides a quick summary of the team's progress, including:
- Total task count and status breakdowns.
- Tracking for overdue tasks to help meet deadlines.
- Visualization of task distribution among different team members.

## Technical Overview:
- **Frontend:** Built with React.js using a centralized API client for consistent data fetching.
- **Backend:** Powered by Flask with SQLAlchemy for data management.
- **Security:** Implemented using JWT authentication and secure password hashing.
