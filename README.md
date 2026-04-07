# Finance Frontend

A React.js frontend application for the Finance Data Processing and Access Control System.

## Features

- **Authentication**: JWT-based login and registration
- **Dashboard**: Financial overview with analytics and recent activity
- **Records Management**: View, create, edit, and delete financial records
- **Budget Tracking**: Set and monitor spending budgets by category
- **User Management**: Admin interface for managing users and roles
- **Role-based Access**: Different permissions for viewers, analysts, and admins

## Tech Stack

- React 18
- React Router DOM
- Axios for API calls
- Bootstrap 5 for styling
- JWT authentication with automatic token refresh

## Getting Started

1. **Install dependencies:**

   ```bash
   npm install
   ```

2. **Start the development server:**

   ```bash
   npm start
   ```

3. **Open your browser:**
   Navigate to `http://localhost:3000`

## Backend Requirements

This frontend requires the Django backend to be running on `http://localhost:8000`.

Make sure the backend is started first:

```bash
cd ../finance_backend
python manage.py runserver
```

## Available Scripts

- `npm start` - Runs the app in development mode
- `npm run build` - Builds the app for production
- `npm test` - Launches the test runner
- `npm run eject` - Ejects from Create React App

## User Roles

- **Viewer**: Can view records and basic analytics
- **Analyst**: Can view records, analytics, and dashboard data
- **Admin**: Full access including user management and record modifications

## API Integration

The app communicates with the Django REST API using:

- Automatic JWT token injection in requests
- Token refresh on expiration
- Error handling for authentication and permissions

## Project Structure

```
src/
├── components/     # Reusable UI components
├── context/        # React context for authentication
├── pages/          # Page components
└── services/       # API service layer
```

### Analyzing the Bundle Size

This section has moved here: [https://facebook.github.io/create-react-app/docs/analyzing-the-bundle-size](https://facebook.github.io/create-react-app/docs/analyzing-the-bundle-size)

### Making a Progressive Web App

This section has moved here: [https://facebook.github.io/create-react-app/docs/making-a-progressive-web-app](https://facebook.github.io/create-react-app/docs/making-a-progressive-web-app)

### Advanced Configuration

This section has moved here: [https://facebook.github.io/create-react-app/docs/advanced-configuration](https://facebook.github.io/create-react-app/docs/advanced-configuration)

### Deployment

This section has moved here: [https://facebook.github.io/create-react-app/docs/deployment](https://facebook.github.io/create-react-app/docs/deployment)

### `npm run build` fails to minify

This section has moved here: [https://facebook.github.io/create-react-app/docs/troubleshooting#npm-run-build-fails-to-minify](https://facebook.github.io/create-react-app/docs/troubleshooting#npm-run-build-fails-to-minify)
