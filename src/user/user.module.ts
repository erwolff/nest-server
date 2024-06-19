import { DbModule } from '@/db/db.module';
import { LoggerModule } from '@/logger/logger.module';
import { User } from '@/user/model/user.entity';
import { UserController } from '@/user/user.controller';
import { UserRepository } from '@/user/user.repository';
import { UserService } from '@/user/user.service';
import { TypegooseModule } from '@m8a/nestjs-typegoose';
import { Module, ModuleMetadata } from '@nestjs/common';

export const userModuleMetadata: ModuleMetadata = {
  imports: [DbModule, LoggerModule, TypegooseModule.forFeature([User])],
  controllers: [UserController],
  providers: [UserRepository, UserService]
};

@Module(userModuleMetadata)
export class UserModule {}
