import assert from "node:assert/strict";
import test from "node:test";

import createSingleFlight from "../src/utils/createSingleFlight.js";

test("shares one in-flight operation across concurrent callers", async () => {
  let resolveOperation;
  let callCount = 0;

  const operationPromise = new Promise((resolve) => {
    resolveOperation = resolve;
  });

  const runOnce = createSingleFlight(() => {
    callCount += 1;

    return operationPromise;
  });

  const firstCall = runOnce();
  const secondCall = runOnce();
  const thirdCall = runOnce();

  assert.strictEqual(firstCall, secondCall);
  assert.strictEqual(secondCall, thirdCall);

  await Promise.resolve();

  assert.equal(callCount, 1);

  resolveOperation("refreshed");

  assert.deepEqual(await Promise.all([firstCall, secondCall, thirdCall]), [
    "refreshed",
    "refreshed",
    "refreshed",
  ]);
});

test("starts a new operation after the previous operation succeeds", async () => {
  let callCount = 0;

  const runOnce = createSingleFlight(async () => {
    callCount += 1;

    return callCount;
  });

  assert.equal(await runOnce(), 1);
  assert.equal(await runOnce(), 2);
  assert.equal(callCount, 2);
});

test("allows a later retry after the shared operation fails", async () => {
  let callCount = 0;

  const runOnce = createSingleFlight(async () => {
    callCount += 1;

    if (callCount === 1) {
      throw new Error("refresh failed");
    }

    return "recovered";
  });

  const firstCall = runOnce();
  const secondCall = runOnce();

  assert.strictEqual(firstCall, secondCall);

  await Promise.all([
    assert.rejects(firstCall, /refresh failed/),
    assert.rejects(secondCall, /refresh failed/),
  ]);

  assert.equal(callCount, 1);
  assert.equal(await runOnce(), "recovered");
  assert.equal(callCount, 2);
});
