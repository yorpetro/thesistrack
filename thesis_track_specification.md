
# Software Project Requirement Document  
## Thesis Tracker  

---

## 1. Project Overview  
**Thesis Tracker** is a full-stack web application designed to assist universities in managing the submission, review, and approval process of graduate theses. The platform will allow students to submit their thesis work, track the status, receive feedback, and view key dates. Professors and Graduation Assistants will have tools to review, comment, and approve or decline thesis submissions, with clear communication and status updates for all users.  

---

## 2. Technology Stack  

### **Backend**  
- **Programming Language:** Python 3.13  
- **Framework:** FastAPI (latest version)  
- **Database:** PostgreSQL (latest version)  
- **Dependency Management:** Poetry  
- **Database Migrations:** Alembic  
- **ORM & Libraries:**  
  - SQLAlchemy (or suitable ORM for PostgreSQL)  
  - Additional libraries as needed for security, authentication, and validation  

### **Frontend**  
- **Framework:** React 18  
- **Styling:** Tailwind CSS (latest version)  
- **Build Tool:** Vite 4.1.0  
- **Language:** TypeScript 4.9.3  
- **Form Handling:** react-hook-form 7.43  
- **Validation:** zod 3.20.6, @hookform/resolvers 2.9.11  
- **HTTP Requests:** axios 1.3.4  

### **Containerization & Deployment**  
- Docker  
- docker-compose  

---

## 3. Functional Requirements  

### 3.1. User Roles  
- **Students:**  
  - Register and authenticate (standard and via Google)  
  - Upload and submit thesis documents  
  - Track thesis status (Draft, Submitted, Approved, Declined)  
  - View deadlines and defense dates via personal calendar  
  - Receive email notifications for upcoming deadlines and events  
  - View and respond to comments from reviewers  

- **Professors:**  
  - Register and authenticate (standard and via Google)  
  - Set thesis defense dates and deadlines  
  - Review and comment on submitted theses  
  - Approve, decline, or leave feedback on submissions  
  - Add official review text after thesis approval  
  - Manage personal calendar with all thesis-related events  

- **Graduation Assistants:**  
  - Register and authenticate (standard and via Google)  
  - Review and comment on submitted theses  
  - Approve or decline thesis submissions  
  - Participate as reviewers in the workflow  

---

### 3.2. Core Features  
- **Authentication System:**  
  - Strong password policy enforcement  
  - Google Authentication Integration  

- **Thesis Management:**  
  - Thesis submission with file upload (PDF, DOCX)  
  - Thesis status transitions: Draft → Submitted → Approved/Declined  
  - File explorer-like UI for navigating uploaded documents  
  - Commenting system for each thesis submission  

- **Event Management & Notifications:**  
  - Individual calendars for each user role  
  - Event scheduling for thesis submission deadlines, review deadlines, and defense dates  
  - Automated email notifications for upcoming deadlines and key events  

- **Optional Feature:**  
  - AI-powered plagiarism check  

---

## 4. Non-Functional Requirements  
- **Performance:** The system should handle multiple concurrent users with responsive UI and fast backend processing.  
- **Security:**  
  - Secure password storage and authentication protocols  
  - Protection against SQL Injection, CSRF, and XSS attacks  
  - Secure file storage and upload validation  
- **Scalability:**  
  - Scalable architecture capable of handling growing user numbers and document storage  
- **Reliability:**  
  - Backup mechanisms for thesis submissions and comments  
  - Email system reliability with retry logic for failed notifications  

---

## 5. Deliverables  
- Full backend API with all defined endpoints  
- Fully functional React-based frontend with dynamic forms, file upload, calendars, and dashboards  
- PostgreSQL database with schema migrations using Alembic  
- Dockerized environment for easy deployment  
- Documentation for API usage, frontend setup, and deployment instructions  

---

## 6. Future Enhancements  
- AI-based plagiarism checker  
- Integration with institutional platforms (LMS or university portals)  
- Multi-language support  

---

## 7. Development Steps  

### 7.1. Initial Setup  
1. Create project repository and set up version control (GitHub or GitLab).  
2. Set up Docker environment:  
   - Dockerfile for backend (Python FastAPI)  
   - Dockerfile for frontend (React + Vite)  
   - PostgreSQL service setup  
   - docker-compose.yml connecting all services  

### 7.2. Backend Development  
1. Project initialization with Poetry and Alembic.  
2. Database schema design and migrations.  
3. User authentication (password + Google OAuth).  
4. Develop core API endpoints:  
   - User registration and login  
   - Thesis submission endpoints  
   - Thesis status management endpoints  
   - Commenting endpoints  
   - Event and deadline endpoints  
5. Email notification service integration.  
6. Testing: Unit and integration tests for backend API.  

### 7.3. Frontend Development  
1. Project scaffolding with Vite + React + Tailwind setup.  
2. Authentication pages (register, login, Google login).  
3. Thesis submission form and file upload handling.  
4. Dashboard views for:  
   - Students (thesis status, deadlines, submission)  
   - Professors (review interface, calendar)  
   - Graduation Assistants (review interface, calendar)  
5. Calendar components and event handling.  
6. Comments interface and display.  
7. Notifications interface.  
8. API integration and form validation using React Hook Form and Zod.  
9. Frontend testing and UI polishing.  

### 7.4. Deployment and Finalization  
1. Prepare production Docker setup.  
2. Deployment on cloud/VPS.  
3. Final testing (functional, security, performance).  
4. Documentation and video demonstration (if required).  



####

- Professor give defence dates.
- Calender will visualise dates in the home page.
- Students see their defence date.
- Gradution Assistant have due date 2 days before the defence date to write recension.
- Students have one week due to submit their thesis.
