import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { RideQueryDto } from './dto/ride-query.dto';
import { RideRequestDto } from './dto/ride-request.dto';

@Injectable()
export class RideService {
  constructor(private readonly prisma: PrismaService) {}

  async requestRide(payload: RideRequestDto, query: RideQueryDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;
    const offset = (page - 1) * limit;

    const user = await this.prisma.user.findUnique({
      where: { id: payload.user_id },
      select: { id: true },
    });

    if (!user) {
      throw new NotFoundException('User does not exist');
    }

    await this.prisma.rideRequest.create({
      data: {
        userId: payload.user_id,
        pickupLat: payload.pickup_lat,
        pickupLng: payload.pickup_lng,
        radiusKm: payload.radius_km,
      },
    });

    const availableDrivers = await this.prisma.$queryRaw<
      Array<{
        driver_id: number;
        car_model: string | null;
        distance_km: number;
        lat: number;
        lng: number;
        total_count: bigint | number;
      }>
    >(Prisma.sql`
      SELECT
        d.id AS driver_id,
        c.model AS car_model,
        ROUND((
          ST_Distance(
            ST_SetSRID(ST_MakePoint(d."currentLng", d."currentLat"), 4326)::geography,
            ST_SetSRID(ST_MakePoint(${payload.pickup_lng}, ${payload.pickup_lat}), 4326)::geography
          ) / 1000
        )::numeric, 2) AS distance_km,
        d."currentLat" AS lat,
        d."currentLng" AS lng,
        COUNT(*) OVER() AS total_count
      FROM "Driver" d
      LEFT JOIN "Car" c ON c."driverId" = d.id
      WHERE d."isAvailable" = true
        AND ST_DWithin(
          ST_SetSRID(ST_MakePoint(d."currentLng", d."currentLat"), 4326)::geography,
          ST_SetSRID(ST_MakePoint(${payload.pickup_lng}, ${payload.pickup_lat}), 4326)::geography,
          ${payload.radius_km} * 1000
        )
      ORDER BY distance_km ASC, d.id ASC
      LIMIT ${limit}
      OFFSET ${offset}
    `);

    const total = availableDrivers[0]
      ? Number(availableDrivers[0].total_count)
      : 0;
    const totalPage = Math.ceil(total / limit);

    return {
      success: true,
      available_drivers: availableDrivers.map((driver) => ({
        driver_id: driver.driver_id,
        car_model: driver.car_model ?? 'Unknown',
        distance_km: Number(driver.distance_km),
        location: {
          lat: Number(driver.lat),
          lng: Number(driver.lng),
        },
      })),
      meta: {
        page,
        limit,
        total,
        totalPage,
      },
    };
  }
}
