import { Response } from "express";
import { TenantRequest } from "../middleware/tenantMiddleware";
import { reportService } from "../services/reportService";
import { contributionService } from "../services/contributionService";
import {
  constrainFundIds,
  resolveReportScope,
} from "../services/reportScopeService";

/**
 * Financial report endpoints.
 *
 * Every handler resolves the caller's report scope first. Organization-wide
 * callers get everything; a DEPARTMENT_HEAD is confined to the funds their
 * department is budgeted against and to their own department's budget rows,
 * for both the on-screen preview and the export.
 */

/** Scope for the signed-in user, resolved once per request. */
async function scopeFor(req: TenantRequest) {
  const user = req.user!;
  return resolveReportScope(user, user.organizationId);
}

export const getBalanceSheet = async (req: TenantRequest, res: Response) => {
  const user = req.user;
  const { endDate, fundId } = req.query as Record<string, string | undefined>;
  const scope = await scopeFor(req);
  const result = await reportService.getBalanceSheet(
    user!.organizationId,
    endDate ? new Date(endDate) : undefined,
    constrainFundIds(fundId ? [fundId] : undefined, scope)
  );
  return res.status(200).json(result);
};

export const getStatementOfActivities = async (req: TenantRequest, res: Response) => {
  const user = req.user;
  const { startDate, endDate, fundId } = req.query as Record<string, string | undefined>;
  const scope = await scopeFor(req);
  const result = await reportService.getStatementOfActivities(
    user!.organizationId,
    startDate ? new Date(startDate) : undefined,
    endDate ? new Date(endDate) : undefined,
    constrainFundIds(fundId ? [fundId] : undefined, scope)
  );
  return res.status(200).json(result);
};

export const getBudgetVsActual = async (req: TenantRequest, res: Response) => {
  const user = req.user;
  const { departmentId } = req.query as Record<string, string | undefined>;
  const scope = await scopeFor(req);

  // A department head sees every department they head and nothing else; a
  // requested department is only honoured when it is one of theirs.
  const departmentIds =
    scope.departmentIds !== undefined
      ? scope.departmentIds
      : departmentId
        ? [departmentId]
        : undefined;

  const result = await reportService.getBudgetVsActual(user!.organizationId, departmentIds);
  return res.status(200).json(result);
};

export const getTrialBalance = async (req: TenantRequest, res: Response) => {
  const user = req.user;
  const { startDate, endDate, fundId } = req.query as Record<string, string | undefined>;
  const scope = await scopeFor(req);
  const result = await reportService.getTrialBalance(
    user!.organizationId,
    startDate ? new Date(startDate) : undefined,
    endDate ? new Date(endDate) : undefined,
    constrainFundIds(fundId ? [fundId] : undefined, scope)
  );
  return res.status(200).json(result);
};

export const getCashFlow = async (req: TenantRequest, res: Response) => {
  const user = req.user;
  const { startDate, endDate, fundId } = req.query as Record<string, string | undefined>;
  const scope = await scopeFor(req);
  const result = await reportService.getCashFlow(
    user!.organizationId,
    startDate ? new Date(startDate) : undefined,
    endDate ? new Date(endDate) : undefined,
    constrainFundIds(fundId ? [fundId] : undefined, scope)
  );
  return res.status(200).json(result);
};

export const exportReport = async (req: TenantRequest, res: Response) => {
  const user = req.user;
  const { format, reportType, ...params } = req.query as Record<string, string | undefined>;
  const scope = await scopeFor(req);

  const result = await reportService.exportReport(
    (format as "CSV" | "XLSX" | "PDF") || "CSV",
    reportType || "balance-sheet",
    params,
    user!.organizationId,
    scope
  );

  res.setHeader("Content-Type", result.contentType);
  res.setHeader("Content-Disposition", `attachment; filename="${result.filename}"`);
  // A BOM-prefixed CSV is only decoded correctly when the charset is declared.
  if (result.format === "CSV") {
    return res.status(200).send(result.data as string);
  }
  return res.status(200).send(result.data as Buffer);
};

export const getMetrics = async (req: TenantRequest, res: Response) => {
  const user = req.user;
  const scope = await scopeFor(req);
  const result = await reportService.getMetrics(
    user!.organizationId,
    scope.fundIds,
    scope.departmentIds
  );
  return res.status(200).json(result);
};

export const getIncomeOverview = async (req: TenantRequest, res: Response) => {
  const result = await contributionService.getIncomeOverview(req.user!.organizationId);
  return res.status(200).json(result);
};

export const reportController = {
  getBalanceSheet,
  getStatementOfActivities,
  getBudgetVsActual,
  getTrialBalance,
  getCashFlow,
  exportReport,
  getMetrics,
  getIncomeOverview,
};