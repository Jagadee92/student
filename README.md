/ Student Management System

/ About the Project
This is my Student Management System project. I made it to help a college manage student details, courses, and instructors in one place.

/ Main Features
- Admin can add, update, search, and delete student records.
- Admin can add courses and instructors and assign an instructor to a course.
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

Then run:
```powershell
npm run create-admin
npm run dev
```

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
