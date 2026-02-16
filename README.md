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

- Swagger UI: `http://localhost:8000/docs`

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

4. Run migrations (choose one path)

If your database is empty (fresh setup):

```bash
npm run prisma:migrate:deploy
```

If your database already has tables/data (baseline required):

```bash
npx prisma migrate resolve --applied 20260216120000_init
npx prisma migrate resolve --applied 20260216133000_postgis_driver_geo_index
npm run prisma:migrate:deploy
```

5. Seed mock data (users + 10 drivers + cars)

```bash
npm run prisma:seed
```

6. Run server

```bash
npm run start:dev
```

## Migration Notes

- This project contains two migrations:
  - `20260216120000_init`
  - `20260216133000_postgis_driver_geo_index`
- The PostGIS migration enables extension + geo index for fast nearby lookup.
- If your DB user cannot create extensions, run once as DB admin:

```sql
CREATE EXTENSION IF NOT EXISTS postgis;
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

## Auth Module

- `POST /api/auth/register` (user role forced to `USER`)
- `POST /api/auth/login`
- `POST /api/auth/refresh` (refresh token rotation)
- `GET /api/auth/me` (Bearer token)
- `POST /api/auth/logout` (Bearer token, revokes refresh token)

## Notes on Matching Strategy

- Uses PostGIS geo-distance query in PostgreSQL (no in-memory map over all drivers).
- Filters by radius in SQL with `ST_DWithin`.
- Sorts nearest first in SQL by computed `distance_km`.
- Adds partial GIST geo index for available drivers to scale better on large datasets.
