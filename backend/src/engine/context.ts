export class ExecutionContext {
  public data: Record<string, unknown>;

  constructor(input: Record<string, unknown>) {
    this.data = { input };
  }

  set(key: string, value: unknown): void {
    this.data[key] = value;
  }

  get(key: string): unknown {
    return this.data[key];
  }

  snapshot(): Record<string, unknown> {
    return structuredClone(this.data);
  }
}
