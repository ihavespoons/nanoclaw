import assert from 'node:assert/strict';
import test from 'node:test';
import { setImmediate as nextTurn } from 'node:timers/promises';

import { GroupQueue } from '../src/group-queue.ts';

async function runPair(secondId) {
  const queue = new GroupQueue();
  let started;
  const firstStarted = new Promise((resolve) => { started = resolve; });
  let release;
  const firstMayFinish = new Promise((resolve) => { release = resolve; });
  const invoked = [];

  queue.enqueueTask('chat-a', 'task-1', async () => {
    invoked.push('task-1');
    started();
    await firstMayFinish;
  });
  await firstStarted;
  queue.enqueueTask('chat-a', secondId, async () => {
    invoked.push(secondId);
  });
  release();
  await nextTurn();
  await queue.shutdown(100);
  return invoked;
}

test('does not run the same scheduled task twice while it is active', async () => {
  assert.deepEqual(await runPair('task-1'), ['task-1']);
});

test('still runs a different queued task after the active task', async () => {
  assert.deepEqual(await runPair('task-2'), ['task-1', 'task-2']);
});
