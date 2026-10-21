/ Student Management System

/ About the Project
This is my Student Management System project. I made it to help a college manage student details, courses, and instructors in one place.

/ Main Features
- Admin can add, update, search, and delete student records.
- Admin can add courses and instructors and assign an instructor to a course.
- Admin can manage course/program names and study durations for student registration.
- Students can view their own profile and see the courses and instructors.
- Admin can manage user roles and view student reports.
- Student records can be imported and exported as files.

/ Technologies Used
- React
- Node.js and Express
- MongoDB and Mongoose

/ Requirements
- Node.js 20 or newer
- npm
- MongoDB Community Server or MongoDB Atlas

/ How to Run

/ Start the backend
Open PowerShell in the project folder and run:
```powershell
Copy-Item server/.env.example server/.env
cd server
npm install
```
Add your MongoDB connection and Admin details to `server/.env`. Add SMTP details if you want to use email verification. Keep this file private.
For the current Render deployment, map the URLs as follows:

- Frontend `VITE_API_URL`: `https://server-5aqd.onrender.com` (defaulted by `client/.env.production`; a Render environment variable can override it)
- Backend `CLIENT_ORIGIN`: `https://client-9foq.onrender.com`

Redeploy the frontend after changing its build-time API URL and redeploy the backend after changing its CORS configuration. The frontend static site must also rewrite unknown paths to `/index.html` so routes such as `/login` load on a direct visit or refresh; `client/public/_redirects` provides this rule for Render static sites.

Then run:

```powershell
npm run create-admin
npm run dev
```

After signing in as Admin, add the college's available options on the Programs page. Students can then choose one during registration.

/ Start the frontend
Open another PowerShell window in the project folder and run:

```powershell
Copy-Item client/.env.example client/.env
cd client
npm install
npm run dev
```
Open the address shown in the terminal. It is usually `http://localhost:5174`.

/ Testing
Run these commands from the project folder:

```powershell
npm --prefix server test
npm --prefix client test
```
To make a production build, run:

```powershell
npm --prefix client run build
```
