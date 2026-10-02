"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.periodController = exports.unlockPeriod = exports.lockPeriod = exports.listPeriods = void 0;
const periodService_1 = require("../services/periodService");
const listPeriods = async (req, res) => {
    const user = req.user;
    const periods = await periodService_1.periodService.list(user.organizationId);
    return res.status(200).json(periods);
};
exports.listPeriods = listPeriods;
const lockPeriod = async (req, res) => {
    const user = req.user;
    const { fiscalYear, month } = req.body;
    const period = await periodService_1.periodService.lock(fiscalYear, month, user.organizationId, user.id);
    return res.status(200).json(period);
};
exports.lockPeriod = lockPeriod;
const unlockPeriod = async (req, res) => {
    const user = req.user;
    const { fiscalYear, month } = req.body;
    const period = await periodService_1.periodService.unlock(fiscalYear, month, user.organizationId, user.id);
    return res.status(200).json(period);
};
exports.unlockPeriod = unlockPeriod;
exports.periodController = {
    listPeriods: exports.listPeriods,
    lockPeriod: exports.lockPeriod,
    unlockPeriod: exports.unlockPeriod,
};
//# sourceMappingURL=periodController.js.map