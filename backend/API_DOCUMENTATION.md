# EAi Backend API Documentation

## Base URL
```
http://localhost:3000/api
```

## Authentication
All protected routes require a Bearer token in the Authorization header:
```
Authorization: Bearer <your-jwt-token>
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/profile` - Get user profile (protected)

### Health Monitoring
- `POST /api/health/records` - Create health record (protected)
- `GET /api/health/records` - Get health records (protected)
- `GET /api/health/summary` - Get health summary (protected)
- `PUT /api/health/records/:id` - Update health record (protected)
- `DELETE /api/health/records/:id` - Delete health record (protected)

### Activities & Games
- `POST /api/activities` - Create activity (protected)
- `GET /api/activities` - Get activities (protected)
- `PUT /api/activities/:id/complete` - Complete activity (protected)
- `GET /api/activities/stats` - Get activity statistics (protected)
- `POST /api/activities/games/scores` - Submit game score (protected)
- `GET /api/activities/games/scores` - Get game scores (protected)

### Chat
- `POST /api/chat/messages` - Send message (protected)
- `GET /api/chat/history` - Get chat history (protected)
- `DELETE /api/chat/history` - Clear chat history (protected)

### Medications
- `POST /api/medications` - Create medication (protected)
- `GET /api/medications` - Get medications (protected)
- `PUT /api/medications/:id` - Update medication (protected)
- `DELETE /api/medications/:id` - Delete medication (protected)
- `GET /api/medications/reminders` - Get medication reminders (protected)

### Health Check
- `GET /api/health-check` - Server health check (public)

## Example Requests

### Register User
```json
POST /api/auth/register
{
  "email": "user@example.com",
  "firstName": "John",
  "lastName": "Doe",
  "userType": "HIRE",
  "password": "password123"
}
```

### Login
```json
POST /api/auth/login
{
  "email": "user@example.com",
  "password": "password123"
}
```

### Create Health Record
```json
POST /api/health/records
Authorization: Bearer <token>
{
  "type": "BLOOD_PRESSURE",
  "value": "120/80",
  "unit": "mmHg",
  "notes": "Morning reading"
}
```

### Send Chat Message
```json
POST /api/chat/messages
Authorization: Bearer <token>
{
  "message": "I need help with my blood pressure",
  "isUser": true
}
```

## Database Schema
The backend uses SQLite with the following main entities:
- Users (authentication and profiles)
- HealthRecords (vital signs, measurements)
- Activities (health activities and exercises)
- GameScores (brain game results)
- ChatMessages (AI chat history)
- Medications (medication tracking)
- Appointments (medical appointments)

