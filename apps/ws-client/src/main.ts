import * as throng from 'throng';

import { NestFactory } from '@nestjs/core';
import { Logger } from '@nestjs/common';
import { AppMode } from './enums/app-mode.enum';
import { MasterModule } from './master/master.module';
import { WorkerModule } from './worker/worker.module';
import { WorkerService } from './worker/worker.service';

const PORT =
  parseInt(process.env.CLIENT_PORT || process.env.APP_PORT, 10) || 3000;

const subs = JSON.parse(process.env.CLIENT_SUBS) || [];

const count = subs.length;

async function master() {
  const appContext = await NestFactory.create(MasterModule);
  await appContext.listen(PORT);
  Logger.log(`Application master is running on port ${PORT}`, AppMode.Master);
}

async function worker(id: number) {
  const appContext = await NestFactory.createApplicationContext(WorkerModule);
  const workerService = appContext.get(WorkerService);
  workerService.workerId = id;
  Logger.log(`Application worker#${id} is running`, AppMode.Worker);
}

throng({ master, worker, count, lifetime: Infinity, grace: 0 });
