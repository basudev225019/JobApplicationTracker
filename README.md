# Job Application Tracker

MERN stack project for the Full Stack Development exit exam.

It's a simple app where you can save the jobs you applied for and keep track of where each one is (applied, interview, offer etc). I used MongoDB Atlas for the database, Express + Node for the backend and React (with Vite) for the frontend.

## Screenshots

Home page - shows all applications with status tabs + counts on top, search by company, status badges and the red follow-up overdue badge

![home page](screenshots/list.jpg)

Details page - shows full details, dropdown with only the next valid statuses, delete button disabled (since its in Offer) and the status history timeline

![details page](screenshots/details.jpg)

## Folder structure

```
project-root/
├── backend/
│   ├── models/        Application.js, Counter.js
│   ├── routes/        applications.js
│   ├── utils/         helpers.js
│   ├── .env
│   └── server.js
├── frontend/
│   └── src/
│       ├── pages/     home.jsx, appform.jsx, details.jsx
│       ├── api.js
│       ├── App.jsx
│       └── index.css
└── screenshots/
```

## How to run

First start the backend (runs on port 5000)

```bash
cd backend
npm install
npm start
```

Then in another terminal start the frontend (runs on port 5173)

```bash
cd frontend
npm install
npm run dev
```

Then open http://localhost:5173

Note: the `.env` file is already there inside `backend/` with `PORT` and `MONGO_URI`. The database is a free MongoDB Atlas cluster I made only for this exam so its just test data.

## APIs

All APIs start with `http://localhost:5000/api/applications`

Every API sends back the same format: `{ success, message, data }`

| Method | Route | What it does | Status codes |
|---|---|---|---|
| POST | `/` | add a new application | 201, 400, 409 |
| GET | `/` | get all applications + count of each status. can filter using `?status=` and `?search=` | 200 |
| GET | `/:id` | get one application with its status history and the next statuses allowed | 200, 404 |
| PUT | `/:id` | edit company, role, job type, salary and notes | 200, 400, 404, 409 |
| PATCH | `/:id/status` | change the status (only valid changes allowed) | 200, 400, 404 |
| DELETE | `/:id` | delete an application (not allowed in Interview or Offer) | 200, 400, 404 |

### Some example requests

adding an application

```json
POST /api/applications
{
  "company": "Infosys",
  "role": "Frontend Developer",
  "jobtype": "Full-time",
  "applieddate": "2026-10-05",
  "salary": 600000,
  "notes": "Applied through careers page"
}
```

filter + search

```
GET /api/applications?status=Applied&search=info
```

changing status

```json
PATCH /api/applications/:id/status
{ "status": "Interview" }
```

## Features / rules I implemented

- Application ID is made by the backend in the format `JA-<first 3 letters of company>-<3 digit number>` like `JA-INF-004`. the number goes up for each company prefix and the user can't set it themselves.
- Applied date can't be a future date. this is checked in both frontend and backend. Also the applied date and ID can't be edited later.
- Status flow:
  - Applied → Interview or Rejected
  - Interview → Offer or Rejected
  - Offer → Accepted or Declined
  - Rejected, Accepted and Declined are final so they can't be changed
  - if you try a wrong change the backend gives a 400 error. in the frontend the dropdown only shows the allowed next statuses anyway.
- Every status change is saved in a history with date and time, and the details page shows it like a timeline.
- Follow-up date is set to 7 days after the applied date. if that date has passed and its still in Applied, the backend sends `isOverdue: true` and a red "Follow-up Overdue" badge shows up.
- Duplicate check - you can't add the same company + job role again (not case sensitive) if the old one is still active. it gives a 409 and the error shows on the form.
- Delete is only allowed in Applied or a final status. for Interview and Offer the backend gives an error and the delete button is disabled. it also asks for confirmation before deleting.
- Works on mobile, tablet and desktop.
