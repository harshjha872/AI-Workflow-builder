export function interpolate(template: string, data: Record<string, unknown>): string {
  return template.replace(/\{\{\s*context\.([\w.]+)\s*\}\}/g, (_match, path: string) => {
    const keys = path.split('.');
    let value: unknown = data;
    for (const key of keys) {
      if (value != null && typeof value === 'object') {
        value = (value as Record<string, unknown>)[key];
      } else {
        return '';
      }
    }
    return value != null ? String(value) : '';
  });
}

export function deepInterpolate(obj: unknown, data: Record<string, unknown>): unknown {
  if (typeof obj === 'string') return interpolate(obj, data);
  if (Array.isArray(obj)) return obj.map(item => deepInterpolate(item, data));
  if (obj != null && typeof obj === 'object') {
    const result: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(obj)) {
      result[key] = deepInterpolate(value, data);
    }
    return result;
  }
  return obj;
}
