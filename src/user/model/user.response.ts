import { User } from '@/user/model/user.entity';
import { ApiResponseProperty } from '@nestjs/swagger';
import { Swagger } from '@/shared/swagger/swagger.examples';

export class UserResponse {
  @ApiResponseProperty({ example: Swagger.user.id })
  id: string;

  @ApiResponseProperty({ example: Swagger.user.email })
  email: string;

  constructor(user: User) {
    this.id = user.id;
    this.email = user.email;
  }
}
