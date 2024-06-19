import { AuthServiceHelper } from '@/auth/auth-service.helper';
import { AuthTokenService } from '@/auth/auth-token.service';
import { AuthController } from '@/auth/auth.controller';
import { AuthService } from '@/auth/auth.service';
import { JwtGuard } from '@/auth/guard';
import { EmailPwGuard } from '@/auth/guard/email-pw.guard';
import { EmailPwStrategy } from '@/auth/strategy/email-pw.strategy';
import { JwtStrategy } from '@/auth/strategy/jwt.strategy';
import { AwsModule } from '@/aws/aws.module';
import { DbModule } from '@/db/db.module';
import { LoggerModule } from '@/logger/logger.module';
import { User } from '@/user/model';
import { UserRepository } from '@/user/user.repository';
import { TypegooseModule } from '@m8a/nestjs-typegoose';
import { Module, ModuleMetadata } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';

export const authModuleMetadata: ModuleMetadata = {
  imports: [
    AwsModule,
    ConfigModule,
    DbModule,
    JwtModule.register({}),
    LoggerModule,
    TypegooseModule.forFeature([User]),
    PassportModule.register({ defaultStrategy: 'jwt' })
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    AuthServiceHelper,
    AuthTokenService,
    JwtStrategy,
    EmailPwStrategy,
    JwtGuard,
    EmailPwGuard,
    UserRepository
  ],
  exports: [JwtGuard]
};

@Module(authModuleMetadata)
export class AuthModule {}
