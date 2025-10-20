# Auth with Oso: HR App

A B2B HR application demonstrating advanced authorization using Oso Cloud. This application showcases role-based access control, managerial hierarchy, and field-level permissions.

## Features

- **User Authentication**: Login and registration system
- **Role-Based Access Control**: Employee, Manager, and CEO roles
- **Managerial Hierarchy**: Managers can view and approve requests for their direct and indirect reports
- **Field-Level Access Control**: Sensitive information (salary, SSN) is protected based on user roles
- **Time-Off Management**: Request and approve time-off with proper authorization
- **Profile Management**: View employee profiles with appropriate data visibility

## Authorization Rules

### Profile Access
- **Employees**: Can view their own profile with sensitive data, and basic info for all coworkers
- **Managers**: Can view their own profile with sensitive data, and sensitive data for their direct reports
- **CEO**: Can view sensitive data for all employees

### Time-Off Requests
- **Employees**: Can create and view their own requests
- **Managers**: Can approve requests from their direct and indirect reports
- **CEO**: Can approve all requests

## Tech Stack

- **Backend**: Node.js, Express.js
- **Database**: SQLite
- **Authorization**: Oso Cloud
- **Frontend**: HTML, CSS, JavaScript
- **Authentication**: JWT tokens

## Getting Started

### Prerequisites
- Node.js (v14 or higher)
- npm or yarn
- Oso Cloud account and API key

### Installation

1. Clone the repository:
```bash
git clone https://github.com/YOUR_USERNAME/oso-hr-app.git
cd oso-hr-app
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
# Create a .env file
echo "OSO_AUTH_API_KEY=your_oso_api_key_here" > .env
echo "JWT_SECRET=your_jwt_secret_here" >> .env
```

4. Initialize the database:
```bash
npm run migrate
```

5. Start the application:
```bash
npm start
```

6. Open your browser and navigate to `http://localhost:3000`

## Sample Accounts

The application comes with pre-configured sample accounts:

- **CEO**: `ceo@acme.com` / `oso123`
- **Manager**: `manager1@acme.com` / `oso123`
- **Employee**: `employee1@acme.com` / `oso123`

## Oso Cloud Setup

1. Sign up for an Oso Cloud account at [cloud.osohq.com](https://cloud.osohq.com)
2. Get your API key from the Oso Cloud dashboard
3. Add your API key to the `.env` file
4. The application will automatically sync user data and relationships to Oso Cloud

## Deployment

This application can be deployed to various cloud platforms. Here are the recommended options:

### Railway
1. Push your code to GitHub
2. Connect your GitHub repo to [Railway](https://railway.app)
3. Set environment variables in Railway dashboard
4. Deploy!

### Render
1. Push your code to GitHub
2. Create a new Web Service on [Render](https://render.com)
3. Connect your GitHub repo
4. Set environment variables
5. Deploy!

### Environment Variables for Production
See `.env.example` for all required environment variables. Make sure to:
- Use a strong, unique `JWT_SECRET` in production
- Set `NODE_ENV=production`
- Keep your `OSO_AUTH_API_KEY` secure

## Project Structure

```
oso-hr-app/
├── auth/
│   └── oso-cloud.js          # Oso Cloud integration
├── middleware/
│   └── auth.js               # Authentication middleware
├── models/
│   ├── database.js           # Database connection
│   ├── User.js              # User model
│   └── TimeOffRequest.js    # Time-off request model
├── routes/
│   ├── auth.js              # Authentication routes
│   ├── users.js             # User management routes
│   └── timeoff.js           # Time-off request routes
├── services/
│   └── fact-sync.js         # Oso Cloud data synchronization
├── public/
│   ├── index.html           # Frontend application
│   └── app.js               # Frontend JavaScript
├── policies.polar           # Oso authorization policies
└── server.js                # Main application file
```

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- [Oso](https://www.osohq.com/) for the authorization framework
- [Express.js](https://expressjs.com/) for the web framework
- [SQLite](https://www.sqlite.org/) for the database
