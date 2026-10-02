"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.pledgeController = exports.getPledgeProgress = exports.deletePledge = exports.cancelPledge = exports.updatePledge = exports.createPledge = exports.getPledge = exports.listPledges = void 0;
const pledgeService_1 = require("../services/pledgeService");
const listPledges = async (req, res) => {
    const user = req.user;
    const { page = "1", pageSize = "10" } = req.query;
    const result = await pledgeService_1.pledgeService.listAll(Number(page), Number(pageSize), user.organizationId);
    return res.status(200).json(result);
};
exports.listPledges = listPledges;
const getPledge = async (req, res) => {
    const user = req.user;
    const pledge = await pledgeService_1.pledgeService.getById(req.params.id, user.organizationId);
    if (!pledge) {
        return res.status(404).json({ error: "Pledge not found" });
    }
    return res.status(200).json(pledge);
};
exports.getPledge = getPledge;
const createPledge = async (req, res) => {
    const user = req.user;
    const body = req.body;
    const pledge = await pledgeService_1.pledgeService.create({
        memberId: req.body.memberId,
        memberName: req.body.memberName,
        fundId: req.body.fundId,
        amountInKobo: BigInt(body.amountInKobo),
        startDate: body.startDate,
        endDate: body.endDate,
        recurring: body.recurring,
        organizationId: user.organizationId,
    });
    return res.status(201).json(pledge);
};
exports.createPledge = createPledge;
const updatePledge = async (req, res) => {
    const user = req.user;
    const body = req.body;
    const pledge = await pledgeService_1.pledgeService.update(req.params.id, { ...body, amountInKobo: body.amountInKobo !== undefined ? BigInt(body.amountInKobo) : undefined }, user.organizationId);
    return res.status(200).json(pledge);
};
exports.updatePledge = updatePledge;
const cancelPledge = async (req, res) => {
    const user = req.user;
    const pledge = await pledgeService_1.pledgeService.cancel(req.params.id, user.organizationId);
    return res.status(200).json(pledge);
};
exports.cancelPledge = cancelPledge;
const deletePledge = async (req, res) => {
    const user = req.user;
    const pledge = await pledgeService_1.pledgeService.cancel(req.params.id, user.organizationId);
    return res.status(200).json(pledge);
};
exports.deletePledge = deletePledge;
const getPledgeProgress = async (req, res) => {
    const user = req.user;
    const progress = await pledgeService_1.pledgeService.getProgress(req.params.id, user.organizationId);
    return res.status(200).json(progress);
};
exports.getPledgeProgress = getPledgeProgress;
exports.pledgeController = {
    listPledges: exports.listPledges,
    getPledge: exports.getPledge,
    createPledge: exports.createPledge,
    updatePledge: exports.updatePledge,
    cancelPledge: exports.cancelPledge,
    deletePledge: exports.deletePledge,
    getPledgeProgress: exports.getPledgeProgress,
};
//# sourceMappingURL=pledgeController.js.map