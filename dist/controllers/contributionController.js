"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.contributionController = exports.downloadDonorReceiptPdf = exports.generateDonorReceipt = exports.batchCreateContributions = exports.createSingleContribution = exports.getMemberStatement = exports.deleteContribution = exports.updateContribution = exports.getContribution = exports.listContributionFunds = exports.listContributions = void 0;
const contributionService_1 = require("../services/contributionService");
const receiptPdfService_1 = require("../services/receiptPdfService");
const documentCurrency_1 = require("../utils/documentCurrency");
const listContributions = async (req, res) => {
    const user = req.user;
    const { page = "1", pageSize = "10" } = req.query;
    const result = await contributionService_1.contributionService.listAll(Number(page), Number(pageSize), user.organizationId);
    return res.status(200).json(result);
};
exports.listContributions = listContributions;
const listContributionFunds = async (req, res) => {
    return res.status(200).json(await contributionService_1.contributionService.listFunds(req.user.organizationId));
};
exports.listContributionFunds = listContributionFunds;
const getContribution = async (req, res) => {
    const user = req.user;
    const entry = await contributionService_1.contributionService.getById(req.params.id, user.organizationId);
    if (!entry) {
        return res.status(404).json({ error: "Contribution not found" });
    }
    return res.status(200).json(entry);
};
exports.getContribution = getContribution;
const updateContribution = async (req, res) => {
    const user = req.user;
    const body = req.body;
    const entry = await contributionService_1.contributionService.updateContribution(req.params.id, {
        ...body,
        amountInKobo: body.amountInKobo === undefined ? undefined : BigInt(body.amountInKobo),
        date: body.date ? new Date(body.date) : undefined,
    }, user.organizationId, user.id);
    return res.status(200).json(entry);
};
exports.updateContribution = updateContribution;
const deleteContribution = async (req, res) => {
    const user = req.user;
    const { reason } = req.body;
    const result = await contributionService_1.contributionService.deleteContribution(req.params.id, user.organizationId, user.id, reason);
    return res.status(200).json(result);
};
exports.deleteContribution = deleteContribution;
const getMemberStatement = async (req, res) => {
    const statement = await contributionService_1.contributionService.getMemberStatement(req.params.memberId, req.user.organizationId);
    if (!statement)
        return res.status(404).json({ error: "Member not found" });
    return res.status(200).json(statement);
};
exports.getMemberStatement = getMemberStatement;
const createSingleContribution = async (req, res) => {
    const user = req.user;
    const body = req.body;
    const entry = await contributionService_1.contributionService.createSingle({
        memberId: body.memberId,
        memberName: body.memberName,
        fundId: body.fundId,
        amountInKobo: BigInt(body.amountInKobo),
        type: body.type,
        date: body.date ? new Date(body.date) : undefined,
        notes: body.notes,
        recordedById: user.id,
        organizationId: user.organizationId,
        pledgeId: body.pledgeId,
    });
    return res.status(201).json(entry);
};
exports.createSingleContribution = createSingleContribution;
const batchCreateContributions = async (req, res) => {
    const user = req.user;
    const body = req.body;
    const result = await contributionService_1.contributionService.batchCreate({
        entries: body.entries.map((e) => ({
            memberId: e.memberId,
            memberName: e.memberName,
            fundId: e.fundId,
            amountInKobo: BigInt(e.amountInKobo),
            type: e.type,
            date: e.date,
            notes: e.notes,
            pledgeId: e.pledgeId,
        })),
        recordedById: user.id,
        organizationId: user.organizationId,
    });
    return res.status(201).json(result);
};
exports.batchCreateContributions = batchCreateContributions;
const generateDonorReceipt = async (req, res) => {
    const user = req.user;
    const receipt = await (0, receiptPdfService_1.buildReceiptForContribution)(user.organizationId, req.params.id);
    // `amount` is a bigint, which cannot cross the wire; expose the minor-unit
    // string and a pre-formatted amount so the print template can render it
    // without re-deriving the currency's minor unit.
    return res.status(200).json({
        entryId: receipt.receiptId,
        receiptNumber: receipt.receiptNumber,
        fundId: receipt.fundId ?? "",
        fundName: receipt.fund,
        amountInKobo: receipt.amount.toString(),
        amountFormatted: (0, documentCurrency_1.formatMinorUnits)(receipt.amount, receipt.currency),
        date: receipt.date,
        description: receipt.description ?? "",
        contributionMethod: receipt.paymentMethod ?? null,
        notes: receipt.reference ?? null,
        payerName: receipt.payerName ?? null,
        recordedBy: receipt.recordedBy ?? null,
        verificationHash: receipt.verificationHash,
        status: receipt.status,
        organization: {
            id: user.organizationId,
            name: receipt.organizationName,
            address: receipt.organizationAddress ?? null,
            phone: receipt.organizationPhone ?? null,
            email: receipt.organizationEmail ?? null,
            logoUrl: receipt.organizationLogoUrl ?? null,
            timezone: receipt.timezone ?? "Africa/Lagos",
            currency: (0, documentCurrency_1.normalizeCurrencyCode)(receipt.currency),
        },
    });
};
exports.generateDonorReceipt = generateDonorReceipt;
const downloadDonorReceiptPdf = async (req, res) => {
    const user = req.user;
    const receiptData = await (0, receiptPdfService_1.buildReceiptForContribution)(user.organizationId, req.params.id);
    await (0, receiptPdfService_1.generateReceiptPdf)(res, receiptData, user.organizationId);
    return undefined;
};
exports.downloadDonorReceiptPdf = downloadDonorReceiptPdf;
exports.contributionController = {
    listContributions: exports.listContributions,
    listContributionFunds: exports.listContributionFunds,
    getContribution: exports.getContribution,
    updateContribution: exports.updateContribution,
    deleteContribution: exports.deleteContribution,
    getMemberStatement: exports.getMemberStatement,
    createSingleContribution: exports.createSingleContribution,
    batchCreateContributions: exports.batchCreateContributions,
    generateDonorReceipt: exports.generateDonorReceipt,
    downloadDonorReceiptPdf: exports.downloadDonorReceiptPdf,
};
//# sourceMappingURL=contributionController.js.map