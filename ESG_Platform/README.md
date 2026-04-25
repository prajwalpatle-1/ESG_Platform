# ESG MVP

A real-time Environmental, Social, and Governance (ESG) monitoring application.

## Features

- Real-time dashboard with emission data
- Supplier emissions tracking
- Scenario simulation
- JWT authentication
- WebSocket real-time updates
- **AI-Powered Scope 3 Emissions Prediction** using TensorFlow.js neural networks
- **Anomaly Detection** for identifying unusual emission patterns
- PostgreSQL database

## Setup

### Prerequisites

- Node.js 18+
- PostgreSQL
- Docker (optional)

### Local Development

1. Clone the repository
2. Set up PostgreSQL database
3. Run the schema and seed scripts:
   ```sql
   -- Run schema.sql and seed.sql in your PostgreSQL database
   ```
4. Backend setup:
   ```bash
   cd Backend
   npm install
   cp .env.example .env  # Update with your database URL
   npm start
   ```
5. Frontend setup:
   ```bash
   cd frontend
   npm install
   npm start
   ```

### Docker Setup

```bash
docker-compose up --build
```

This will start PostgreSQL, backend, and frontend services.

## API Endpoints

- POST /api/login - User authentication
- GET /api/dashboard - Dashboard data
- GET /api/suppliers - Supplier data
- POST /api/activities - Add activity
- POST /api/suppliers - Add supplier
- POST /api/scenario - Scenario simulation
- GET /api/report - Report data
- **POST /api/emissions/predict-scope3** - AI prediction for Scope 3 emissions
- **GET /api/emissions/anomalies** - Detect emission anomalies

## Real-time Updates

The app uses Socket.IO for real-time updates when new activities or suppliers are added.

## Environment Variables

### Backend (.env)

- DATABASE_URL: PostgreSQL connection string
- JWT_SECRET: Secret key for JWT tokens
- PORT: Server port (default 5000)

## Database Schema

See `Backend/schema.sql` for table definitions and `Backend/seed.sql` for initial data.
