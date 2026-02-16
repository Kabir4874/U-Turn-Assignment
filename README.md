# Nearby Car & Driver Matching System

NestJS + Prisma backend for ride matching.  
Primary requirement endpoint: `POST /api/ride/request`

## Tech Stack
- NestJS
- Prisma ORM
- PostgreSQL
- Swagger (`/docs`)

## Implemented Requirements
- `POST /api/ride/request` implemented
- Input: `user_id`, `pickup_lat`, `pickup_lng`, `radius_km`
- Returns available drivers within radius
- Uses Haversine distance calculation
- Sorted by nearest driver first
- Includes driver's current location and car model
- Database schema includes `users`, `drivers`, `cars`
- Seed script pre-populates 10 drivers in different regions
- Index added for driver availability + location filter:
  - `@@index([isAvailable, currentLat, currentLng])`

## API Docs
- Swagger UI: `http://localhost:5000/docs` (or your configured port)

## Project Setup
1. Install dependencies
```bash
npm install
```

2. Configure your `.env` file.

3. Generate Prisma client
```bash
npm run prisma:generate
```

4. Run migrations
```bash
npm run prisma:migrate:dev -- --name init
```

5. Seed mock data (users + 10 drivers + cars)
```bash
npm run prisma:seed
```

6. Run server
```bash
npm run start:dev
```

## Main Endpoint
### Request
`POST /api/ride/request`

```json
{
  "user_id": 1,
  "pickup_lat": 23.8103,
  "pickup_lng": 90.4125,
  "radius_km": 5
}
```

### Response
```json
{
  "success": true,
  "available_drivers": [
    {
      "driver_id": 12,
      "car_model": "Toyota Axio",
      "distance_km": 2.4,
      "location": {
        "lat": 23.809,
        "lng": 90.41
      }
    }
  ]
}
```

## Auth Module (Implemented)
- `POST /api/auth/register` (user role forced to `USER`)
- `POST /api/auth/login`
- `GET /api/auth/me` (Bearer token)

## Notes on Matching Strategy
- Uses bounding-box prefilter in SQL for performance.
- Then computes exact Haversine distance in service layer.
- Final results are filtered by radius and sorted ascending by `distance_km`.
