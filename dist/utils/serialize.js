"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.serializeResponse = serializeResponse;
function serializeResponse(body) {
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
        const result = {};
        for (const [key, value] of Object.entries(body)) {
            result[key] = serializeResponse(value);
        }
        return result;
    }
    return body;
}
//# sourceMappingURL=serialize.js.map