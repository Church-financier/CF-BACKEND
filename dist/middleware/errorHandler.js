"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorHandler = void 0;
const errorHandler = (err, req, res, _next) => {
    console.error(`[ERROR] ${err.message}`, {
        stack: err.stack,
        path: req.path,
        method: req.method,
    });
    if (err.name === "ZodError") {
        return res.status(400).json({ error: "Validation failed", details: err });
    }
    const message = process.env.NODE_ENV === 'development' ? err.message : 'Internal server error';
    res.status(500).json({ error: message });
};
exports.errorHandler = errorHandler;
//# sourceMappingURL=errorHandler.js.map