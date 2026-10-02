"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateOptional = exports.validateSchema = void 0;
const validateSchema = (schema, data) => {
    const result = schema.safeParse(data);
    if (!result.success) {
        const errors = result.error.flatten();
        throw new Error(`Validation failed: ${JSON.stringify(errors)}`);
    }
    return result.data;
};
exports.validateSchema = validateSchema;
const validateOptional = (schema, data) => {
    if (data === undefined || data === null)
        return null;
    return (0, exports.validateSchema)(schema, data);
};
exports.validateOptional = validateOptional;
//# sourceMappingURL=validateSchema.js.map