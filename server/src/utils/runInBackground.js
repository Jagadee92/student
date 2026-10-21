export function runInBackground(task, taskName) {
  setImmediate(async () => {
    try {
      await task();
    } catch (error) {
      console.error(`${taskName} failed:`, error.message);
    }
  });
}
