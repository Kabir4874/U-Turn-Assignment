import { Body, Controller, Post } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Public } from '../../common/decorators/public.decorator';
import { RideRequestDto } from './dto/ride-request.dto';
import { RideService } from './ride.service';

@ApiTags('Ride')
@Controller('ride')
export class RideController {
  constructor(private readonly rideService: RideService) {}

  @Public()
  @Post('request')
  @ApiOperation({
    summary: 'Request a ride and get nearest available drivers within radius',
  })
  @ApiResponse({
    status: 201,
    description: 'Available drivers sorted by nearest distance',
  })
  requestRide(@Body() body: RideRequestDto) {
    return this.rideService.requestRide(body);
  }
}
