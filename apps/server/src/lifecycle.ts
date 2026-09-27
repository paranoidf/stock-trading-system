export function createLifecycle() {
  const disposers = new Set<() => void>();
  return {
    add(disposer: () => void) {
      disposers.add(disposer);
      return () => disposers.delete(disposer);
    },
    close() {
      for (const dispose of [...disposers].reverse()) dispose();
      disposers.clear();
    }
  };
}
