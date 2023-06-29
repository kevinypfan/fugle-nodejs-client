import * as throng from 'throng';

import { NestFactory } from '@nestjs/core';
import { Logger } from '@nestjs/common';
import { AppMode } from './enums/app-mode.enum';
import { MasterModule } from './master/master.module';
import { WorkerModule } from './worker/worker.module';

const PORT =
  parseInt(process.env.CLIENT_PORT || process.env.APP_PORT, 10) || 3000;

const subs = JSON.parse(process.env.CLIENT_SUBS) || [];

const count = subs.length;

console.log({ PORT, subs, count });

async function master() {
  const app = await NestFactory.create(MasterModule);
  await app.listen(3000);
  Logger.log(`Application master is running on port ${PORT}`, AppMode.Master);
}

async function worker(id: number) {
  await NestFactory.createApplicationContext(WorkerModule);

  Logger.log(`Application worker#${id} is running`, AppMode.Worker);
}

throng({ master, worker, count, lifetime: Infinity, grace: 0 });
