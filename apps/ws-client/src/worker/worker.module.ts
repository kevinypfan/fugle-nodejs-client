import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { WorkerService } from './worker.service';

@Module({
  imports: [ConfigModule.forRoot()],
  controllers: [],
  providers: [WorkerService],
})
export class WorkerModule {}
