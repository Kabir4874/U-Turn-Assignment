import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, MinLength } from 'class-validator';

export class RegisterDto {
  @ApiProperty({ example: 'Kabir Ahmed' })
  @IsString()
  name: string;

  @ApiProperty({ example: 'kabir@example.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: '+8801700000000' })
  @IsString()
  phone: string;

  @ApiProperty({ example: 'StrongPass123' })
  @IsString()
  @MinLength(8)
  password: string;
}
