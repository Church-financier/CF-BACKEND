"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.reportController = exports.getIncomeOverview = exports.getMetrics = exports.exportReport = exports.getCashFlow = exports.getTrialBalance = exports.getBudgetVsActual = exports.getStatementOfActivities = exports.getBalanceSheet = void 0;
const reportService_1 = require("../services/reportService");
const contributionService_1 = require("../services/contributionService");
const reportScopeService_1 = require("../services/reportScopeService");
/**
 * Financial report endpoints.
 *
 * Every handler resolves the caller's report scope first. Organization-wide
 * callers get everything; a DEPARTMENT_HEAD is confined to the funds their
 * department is budgeted against and to their own department's budget rows,
 * for both the on-screen preview and the export.
 */
/** Scope for the signed-in user, resolved once per request. */
async function scopeFor(req) {
    const user = req.user;
    return (0, reportScopeService_1.resolveReportScope)(user, user.organizationId);
}
const getBalanceSheet = async (req, res) => {
    const user = req.user;
    const { endDate, fundId } = req.query;
    const scope = await scopeFor(req);
    const result = await reportService_1.reportService.getBalanceSheet(user.organizationId, endDate ? new Date(endDate) : undefined, (0, reportScopeService_1.constrainFundIds)(fundId ? [fundId] : undefined, scope));
    return res.status(200).json(result);
};
exports.getBalanceSheet = getBalanceSheet;
const getStatementOfActivities = async (req, res) => {
    const user = req.user;
    const { startDate, endDate, fundId } = req.query;
    const scope = await scopeFor(req);
    const result = await reportService_1.reportService.getStatementOfActivities(user.organizationId, startDate ? new Date(startDate) : undefined, endDate ? new Date(endDate) : undefined, (0, reportScopeService_1.constrainFundIds)(fundId ? [fundId] : undefined, scope));
    return res.status(200).json(result);
};
exports.getStatementOfActivities = getStatementOfActivities;
const getBudgetVsActual = async (req, res) => {
    const user = req.user;
    const { departmentId } = req.query;
    const scope = await scopeFor(req);
    // A department head sees every department they head and nothing else; a
    // requested department is only honoured when it is one of theirs.
    const departmentIds = scope.departmentIds !== undefined
        ? scope.departmentIds
        : departmentId
            ? [departmentId]
            : undefined;
    const result = await reportService_1.reportService.getBudgetVsActual(user.organizationId, departmentIds);
    return res.status(200).json(result);
};
exports.getBudgetVsActual = getBudgetVsActual;
const getTrialBalance = async (req, res) => {
    const user = req.user;
    const { startDate, endDate, fundId } = req.query;
    const scope = await scopeFor(req);
    const result = await reportService_1.reportService.getTrialBalance(user.organizationId, startDate ? new Date(startDate) : undefined, endDate ? new Date(endDate) : undefined, (0, reportScopeService_1.constrainFundIds)(fundId ? [fundId] : undefined, scope));
    return res.status(200).json(result);
};
exports.getTrialBalance = getTrialBalance;
const getCashFlow = async (req, res) => {
    const user = req.user;
    const { startDate, endDate, fundId } = req.query;
    const scope = await scopeFor(req);
    const result = await reportService_1.reportService.getCashFlow(user.organizationId, startDate ? new Date(startDate) : undefined, endDate ? new Date(endDate) : undefined, (0, reportScopeService_1.constrainFundIds)(fundId ? [fundId] : undefined, scope));
    return res.status(200).json(result);
};
exports.getCashFlow = getCashFlow;
const exportReport = async (req, res) => {
    const user = req.user;
    const { format, reportType, ...params } = req.query;
    const scope = await scopeFor(req);
    const result = await reportService_1.reportService.exportReport(format || "CSV", reportType || "balance-sheet", params, user.organizationId, scope);
    res.setHeader("Content-Type", result.contentType);
    res.setHeader("Content-Disposition", `attachment; filename="${result.filename}"`);
    // A BOM-prefixed CSV is only decoded correctly when the charset is declared.
    if (result.format === "CSV") {
        return res.status(200).send(result.data);
    }
    return res.status(200).send(result.data);
};
exports.exportReport = exportReport;
const getMetrics = async (req, res) => {
    const user = req.user;
    const scope = await scopeFor(req);
    const result = await reportService_1.reportService.getMetrics(user.organizationId, scope.fundIds, scope.departmentIds);
    return res.status(200).json(result);
};
exports.getMetrics = getMetrics;
const getIncomeOverview = async (req, res) => {
    const result = await contributionService_1.contributionService.getIncomeOverview(req.user.organizationId);
    return res.status(200).json(result);
};
exports.getIncomeOverview = getIncomeOverview;
exports.reportController = {
    getBalanceSheet: exports.getBalanceSheet,
    getStatementOfActivities: exports.getStatementOfActivities,
    getBudgetVsActual: exports.getBudgetVsActual,
    getTrialBalance: exports.getTrialBalance,
    getCashFlow: exports.getCashFlow,
    exportReport: exports.exportReport,
    getMetrics: exports.getMetrics,
    getIncomeOverview: exports.getIncomeOverview,
};
//# sourceMappingURL=reportController.js.map