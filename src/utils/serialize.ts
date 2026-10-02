export function serializeResponse(body: unknown): unknown {
  if (body === null || body === undefined) {
    return body;
  }
  if (typeof body === "bigint") {
    return body.toString();
  }
  if (body instanceof Date) {
    return body.toISOString();
  }
  if (Array.isArray(body)) {
    return body.map(serializeResponse);
  }
  if (typeof body === "object") {
    const result: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(body as Record<string, unknown>)) {
      result[key] = serializeResponse(value);
    }
    return result;
  }
  return body;
}
