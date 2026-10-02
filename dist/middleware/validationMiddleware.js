"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateQuery = exports.validateBody = void 0;
const validateBody = (schema) => {
    return (req, res, next) => {
        const parsed = schema.safeParse(req.body);
        if (!parsed.success) {
            return res.status(400).json({ error: parsed.error.flatten() });
        }
        req.body = parsed.data;
        next();
    };
};
exports.validateBody = validateBody;
const validateQuery = (schema) => {
    return (req, res, next) => {
        const parsed = schema.safeParse(req.query);
        if (!parsed.success) {
            return res.status(400).json({ error: parsed.error.flatten() });
        }
        req.validatedQuery = parsed.data;
        next();
    };
};
exports.validateQuery = validateQuery;
//# sourceMappingURL=validationMiddleware.js.map