import { Module } from '@nestjs/common';
import { AccountServiceController } from './account-service.controller';
import { AppService } from './account-service.service';
import { UsersModule } from './users/users.module';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from './auth/auth.module';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { AccountEventsController } from './events/account.events.controller';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env.test',
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],

      useFactory: (configService: ConfigService) => ({
        type: 'mysql',
        url: configService.get<string>('DATABASE_URL'),
        synchronize: true,
        autoLoadEntities: true,
      }),
    }),
    UsersModule,
    AuthModule,
    ClientsModule.registerAsync([
      {
        name: 'CHALLENGE_SERVICE',
        imports: [ConfigModule],
        inject: [ConfigService],
        useFactory: (configService: ConfigService) => ({
          transport: Transport.RMQ,
          options: {
            urls: [configService.get<string>('CHALLENGE_SERVICE_MQ_URL')!],
            queue: 'challenge_queue',
            queueOptions: {
              durable: false,
            },
            noAck: true,
          },
        }),
      },
    ]),
  ],
  controllers: [AccountServiceController, AccountEventsController],
  providers: [AppService],
})
export class AppModule {}
