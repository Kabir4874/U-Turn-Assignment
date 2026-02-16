import { Body, Controller, Post, Query } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { RideQueryDto } from './dto/ride-query.dto';
import { RideRequestDto } from './dto/ride-request.dto';
import { RideService } from './ride.service';

@ApiTags('Ride')
@Controller('ride')
export class RideController {
  constructor(private readonly rideService: RideService) {}

  @Post('request')
  @ApiOperation({
    summary: 'Request a ride and get nearest available drivers within radius',
  })
  @ApiResponse({
    status: 201,
    description: 'Available drivers sorted by nearest distance',
  })
  requestRide(@Body() body: RideRequestDto, @Query() query: RideQueryDto) {
    return this.rideService.requestRide(body, query);
  }
}
