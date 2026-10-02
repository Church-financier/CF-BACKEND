"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.portalController = exports.adminSetPortalAccess = exports.portalChangePassword = exports.portalForgotPassword = exports.portalSummary = exports.portalMe = exports.portalLogout = exports.portalRefresh = exports.portalLogin = void 0;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const prisma_1 = require("../lib/prisma");
const portalAuthService_1 = require("../services/portalAuthService");
const mailerService_1 = require("../services/mailerService");
function setPortalCookies(res, token, refreshToken) {
    res.cookie(portalAuthService_1.PORTAL_COOKIE_NAME, refreshToken, (0, portalAuthService_1.portalCookieOptions)());
    res.cookie("cf_portal", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: 7 * 24 * 60 * 60 * 1000,
    });
}
function clearPortalCookies(res) {
    res.clearCookie(portalAuthService_1.PORTAL_COOKIE_NAME, { path: "/" });
    res.clearCookie("cf_portal", { path: "/" });
}
const portalLogin = async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password)
        return res.status(400).json({ error: "Email and password are required" });
    const member = await prisma_1.prisma.member.findFirst({ where: { email } });
    if (!member || !member.portalAccess || !member.portalPasswordHash) {
        return res.status(401).json({ error: "Invalid credentials or portal not enabled" });
    }
    const ok = await bcryptjs_1.default.compare(password, member.portalPasswordHash);
    if (!ok)
        return res.status(401).json({ error: "Invalid credentials" });
    const { token, refreshToken } = await portalAuthService_1.portalAuthService.issueForMember(member.id);
    setPortalCookies(res, token, refreshToken);
    const organization = await prisma_1.prisma.organization.findUnique({
        where: { id: member.organizationId },
        select: { name: true, currency: true },
    });
    return res.status(200).json({
        token,
        member: {
            id: member.id,
            fullName: member.fullName,
            email: member.email,
            organizationId: member.organizationId,
            organizationName: organization?.name,
            organizationCurrency: organization?.currency,
        },
    });
};
exports.portalLogin = portalLogin;
const portalRefresh = async (req, res) => {
    const presented = req.cookies?.[portalAuthService_1.PORTAL_COOKIE_NAME];
    if (!presented)
        return res.status(401).json({ error: "No refresh token" });
    const payload = portalAuthService_1.portalAuthService.verifyPortalRefreshToken(presented);
    if (!payload) {
        clearPortalCookies(res);
        return res.status(401).json({ error: "Invalid or expired refresh token" });
    }
    try {
        const { token, refreshToken } = await portalAuthService_1.portalAuthService.issueForMember(payload.memberId);
        setPortalCookies(res, token, refreshToken);
        return res.status(200).json({ ok: true, token });
    }
    catch {
        clearPortalCookies(res);
        return res.status(401).json({ error: "Portal access revoked" });
    }
};
exports.portalRefresh = portalRefresh;
const portalLogout = async (_req, res) => {
    clearPortalCookies(res);
    return res.status(200).json({ message: "Logged out" });
};
exports.portalLogout = portalLogout;
const portalMe = async (req, res) => {
    if (!req.portalMember)
        return res.status(401).json({ error: "Not authenticated" });
    const member = await prisma_1.prisma.member.findUnique({
        where: { id: req.portalMember.id },
        include: { organization: { select: { id: true, name: true, currency: true } } },
    });
    if (!member)
        return res.status(401).json({ error: "Member not found" });
    return res.status(200).json({
        member: {
            id: member.id,
            fullName: member.fullName,
            email: member.email,
            memberNumber: member.memberNumber,
            organizationId: member.organizationId,
            organizationName: member.organization.name,
            organizationCurrency: member.organization.currency,
        },
    });
};
exports.portalMe = portalMe;
const portalSummary = async (req, res) => {
    if (!req.portalMember)
        return res.status(401).json({ error: "Not authenticated" });
    const memberId = req.portalMember.id;
    const organizationId = req.portalMember.organizationId;
    const [pledges, memberContributionIds] = await Promise.all([
        prisma_1.prisma.pledge.findMany({
            where: { memberId, organizationId },
            include: { fund: { select: { id: true, name: true } }, contributions: true },
            orderBy: { createdAt: "desc" },
        }),
        prisma_1.prisma.pledgeContribution.findMany({
            where: {
                pledge: { memberId, organizationId },
            },
            select: { ledgerEntryId: true },
        }),
    ]);
    const memberLedgerEntryIds = memberContributionIds.map((pc) => pc.ledgerEntryId);
    const donations = await prisma_1.prisma.ledgerEntry.findMany({
        where: {
            organizationId,
            type: "DONATION",
            reversedById: null,
            OR: [
                { id: { in: memberLedgerEntryIds } },
                { description: { contains: req.portalMember.fullName } },
            ],
        },
        include: { fund: { select: { name: true } } },
        orderBy: { createdAt: "desc" },
        take: 50,
    });
    const pledgesSerialized = pledges.map((p) => {
        const fulfilled = p.contributions.reduce((s, c) => s + c.amountInKobo, BigInt(0));
        return {
            id: p.id,
            fundName: p.fund?.name ?? "—",
            amountInKobo: p.amountInKobo.toString(),
            fulfilledInKobo: fulfilled.toString(),
            remainingInKobo: (p.amountInKobo - fulfilled).toString(),
            status: p.status,
            startDate: p.startDate,
            endDate: p.endDate,
            progress: Number(p.amountInKobo > 0 ? (Number(fulfilled) * 100) / Number(p.amountInKobo) : 0),
        };
    });
    const donationsSerialized = donations.map((d) => ({
        id: d.id,
        fundName: d.fund?.name ?? "—",
        amountInKobo: d.amountInKobo.toString(),
        date: d.createdAt,
        description: d.description,
    }));
    const totalDonated = donationsSerialized.reduce((s, d) => s + BigInt(d.amountInKobo), BigInt(0));
    const totalPledged = pledgesSerialized.reduce((s, p) => s + BigInt(p.amountInKobo), BigInt(0));
    const totalFulfilled = pledgesSerialized.reduce((s, p) => s + BigInt(p.fulfilledInKobo), BigInt(0));
    return res.status(200).json({
        summary: {
            totalDonated: totalDonated.toString(),
            totalPledged: totalPledged.toString(),
            totalFulfilled: totalFulfilled.toString(),
            activePledges: pledgesSerialized.filter((p) => p.status === "ACTIVE").length,
            donationCount: donationsSerialized.length,
        },
        pledges: pledgesSerialized,
        donations: donationsSerialized,
    });
};
exports.portalSummary = portalSummary;
const portalForgotPassword = async (req, res) => {
    const { email } = req.body;
    const member = await prisma_1.prisma.member.findFirst({ where: { email, portalAccess: true } });
    if (member?.email) {
        const tempPassword = Math.random().toString(36).slice(-10) + Math.random().toString(36).slice(-6).toUpperCase();
        const hash = await bcryptjs_1.default.hash(tempPassword, 12);
        await prisma_1.prisma.member.update({ where: { id: member.id }, data: { portalPasswordHash: hash } });
        const sendResult = await mailerService_1.mailerService.send({
            to: member.email,
            subject: "Your Church Financier Member Portal password",
            text: `Hello ${member.fullName},\n\n` +
                `A new temporary password for your Church Financier Member Portal has been generated.\n\n` +
                `Temporary password: ${tempPassword}\n\n` +
                `Sign in at the Member Portal and change it immediately.\n\n` +
                `If you did not request this, please contact your church administrator.\n`,
        });
        if (!sendResult.delivered) {
            console.error("[portal forgot-password email error]", sendResult.error);
        }
    }
    return res.status(200).json({
        message: "If the email is associated with an active portal account, a new temporary password has been sent.",
    });
};
exports.portalForgotPassword = portalForgotPassword;
const portalChangePassword = async (req, res) => {
    if (!req.portalMember)
        return res.status(401).json({ error: "Not authenticated" });
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword || newPassword.length < 6) {
        return res.status(400).json({ error: "Provide current and a new password of at least 6 characters" });
    }
    const member = await prisma_1.prisma.member.findUnique({ where: { id: req.portalMember.id } });
    if (!member || !member.portalPasswordHash) {
        return res.status(400).json({ error: "Portal not configured" });
    }
    const ok = await bcryptjs_1.default.compare(currentPassword, member.portalPasswordHash);
    if (!ok)
        return res.status(400).json({ error: "Current password is incorrect" });
    const hash = await bcryptjs_1.default.hash(newPassword, 12);
    await prisma_1.prisma.member.update({ where: { id: member.id }, data: { portalPasswordHash: hash } });
    return res.status(200).json({ message: "Password updated" });
};
exports.portalChangePassword = portalChangePassword;
const adminSetPortalAccess = async (req, res) => {
    const memberId = req.params.id;
    const organizationId = req.user.organizationId;
    const { enabled, password } = req.body;
    const member = await prisma_1.prisma.member.findFirst({ where: { id: memberId, organizationId } });
    if (!member)
        return res.status(404).json({ error: "Member not found" });
    if (!member.email)
        return res.status(400).json({ error: "Member has no email on file" });
    const data = { portalAccess: !!enabled };
    if (enabled) {
        const initialPassword = password && password.length >= 6
            ? password
            : Math.random().toString(36).slice(-8) + "A1!";
        data.portalPasswordHash = await bcryptjs_1.default.hash(initialPassword, 12);
        const sendResult = await mailerService_1.mailerService.send({
            to: member.email,
            subject: "Your Church Financier Member Portal access",
            text: `Hello ${member.fullName},\n\n` +
                `Your church administrator has enabled portal access for you.\n\n` +
                `Sign in at the Church Financier Member Portal using:\n` +
                `Email: ${member.email}\n` +
                `Temporary password: ${initialPassword}\n\n` +
                `Please change this password after signing in.\n`,
        });
        if (!sendResult.delivered) {
            console.error("[portal invite email error]", sendResult.error);
        }
        await prisma_1.prisma.member.update({ where: { id: member.id }, data });
        return res.status(200).json({ portalAccess: true, initialPassword, emailDelivered: sendResult.delivered });
    }
    else {
        data.portalPasswordHash = null;
        await prisma_1.prisma.member.update({ where: { id: member.id }, data });
        return res.status(200).json({ portalAccess: false });
    }
};
exports.adminSetPortalAccess = adminSetPortalAccess;
exports.portalController = {
    portalLogin: exports.portalLogin,
    portalRefresh: exports.portalRefresh,
    portalLogout: exports.portalLogout,
    portalMe: exports.portalMe,
    portalSummary: exports.portalSummary,
    portalForgotPassword: exports.portalForgotPassword,
    portalChangePassword: exports.portalChangePassword,
    adminSetPortalAccess: exports.adminSetPortalAccess,
};
//# sourceMappingURL=portalController.js.map