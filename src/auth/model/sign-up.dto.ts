import { toLowerCase } from '@/shared/controller/validation';
import { Swagger } from '@/shared/swagger/swagger.examples';
import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsEmail, Length } from 'class-validator';

export class SignUpDto {
  @ApiProperty({ example: Swagger.auth.email })
  @Transform(toLowerCase)
  @IsEmail()
  email: string;

  @ApiProperty({ example: Swagger.auth.password })
  @Length(16, 256, { message: 'password must be between 16 and 256 characters long' })
  password: string;
}
