import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsNumber, IsPositive, Max, Min } from 'class-validator';

export class RideRequestDto {
  @ApiProperty({ example: 1 })
  @Type(() => Number)
  @IsNumber()
  @IsPositive()
  user_id: number;

  @ApiProperty({ example: 23.8103 })
  @Type(() => Number)
  @IsNumber()
  @Min(-90)
  @Max(90)
  pickup_lat: number;

  @ApiProperty({ example: 90.4125 })
  @Type(() => Number)
  @IsNumber()
  @Min(-180)
  @Max(180)
  pickup_lng: number;

  @ApiProperty({ example: 5 })
  @Type(() => Number)
  @IsNumber()
  @IsPositive()
  @Max(100)
  radius_km: number;
}
