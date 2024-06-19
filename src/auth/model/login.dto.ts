import { toLowerCase } from '@/shared/controller/validation';
import { Swagger } from '@/shared/swagger/swagger.examples';
import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsEmail, IsNotEmpty } from 'class-validator';

export class LoginDto {
  @ApiProperty({ example: Swagger.auth.email })
  @Transform(toLowerCase)
  @IsEmail()
  email: string;

  @ApiProperty({ example: Swagger.auth.password })
  @IsNotEmpty()
  password: string;
}
