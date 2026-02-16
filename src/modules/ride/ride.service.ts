import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { RideRequestDto } from './dto/ride-request.dto';

@Injectable()
export class RideService {
  constructor(private readonly prisma: PrismaService) {}

  async requestRide(payload: RideRequestDto) {
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

    const latDelta = payload.radius_km / 111.12;
    const lngDelta =
      payload.radius_km /
      (111.12 * Math.max(Math.cos((payload.pickup_lat * Math.PI) / 180), 0.01));

    const candidateDrivers = await this.prisma.driver.findMany({
      where: {
        isAvailable: true,
        currentLat: {
          gte: payload.pickup_lat - latDelta,
          lte: payload.pickup_lat + latDelta,
        },
        currentLng: {
          gte: payload.pickup_lng - lngDelta,
          lte: payload.pickup_lng + lngDelta,
        },
      },
      include: {
        car: {
          select: {
            model: true,
          },
        },
      },
    });

    const availableDrivers = candidateDrivers
      .map((driver) => {
        const distanceKm = this.calculateHaversineDistanceKm(
          payload.pickup_lat,
          payload.pickup_lng,
          driver.currentLat,
          driver.currentLng,
        );

        return {
          driver_id: driver.id,
          car_model: driver.car?.model ?? 'Unknown',
          distance_km: Number(distanceKm.toFixed(2)),
          location: {
            lat: driver.currentLat,
            lng: driver.currentLng,
          },
        };
      })
      .filter((driver) => driver.distance_km <= payload.radius_km)
      .sort((a, b) => a.distance_km - b.distance_km);

    return {
      success: true,
      available_drivers: availableDrivers,
    };
  }

  private calculateHaversineDistanceKm(
    lat1: number,
    lng1: number,
    lat2: number,
    lng2: number,
  ): number {
    const earthRadiusKm = 6371;
    const toRadians = (degrees: number) => (degrees * Math.PI) / 180;

    const dLat = toRadians(lat2 - lat1);
    const dLng = toRadians(lng2 - lng1);

    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(toRadians(lat1)) *
        Math.cos(toRadians(lat2)) *
        Math.sin(dLng / 2) *
        Math.sin(dLng / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return earthRadiusKm * c;
  }
}
