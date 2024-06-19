import { BaseRepository } from '@/db/base.repository';
import { User } from '@/user/model/user.entity';
import { InjectModel } from '@m8a/nestjs-typegoose';
import { Injectable } from '@nestjs/common';
import { ModelType } from '@typegoose/typegoose/lib/types';

@Injectable()
export class UserRepository extends BaseRepository<User> {
  constructor(@InjectModel(User) protected readonly model: ModelType<User>) {
    super(model);
  }
}
