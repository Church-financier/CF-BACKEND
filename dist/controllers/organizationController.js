"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.organizationController = exports.updateOrganization = exports.getOrganization = void 0;
const prisma_1 = require("../lib/prisma");
const getOrganization = async (req, res) => {
    const user = req.user;
    const org = await prisma_1.prisma.organization.findUnique({
        where: { id: user.organizationId },
        select: {
            id: true,
            name: true,
            currency: true,
            fiscalYearStartMonth: true,
            timezone: true,
            requireMfa: true,
            sessionTimeoutMinutes: true,
            createdAt: true,
        },
    });
    return res.status(200).json(org);
};
exports.getOrganization = getOrganization;
const updateOrganization = async (req, res) => {
    const user = req.user;
    const body = req.body;
    const org = await prisma_1.prisma.organization.update({
        where: { id: user.organizationId },
        data: body,
        select: {
            id: true,
            name: true,
            currency: true,
            fiscalYearStartMonth: true,
            timezone: true,
            requireMfa: true,
            sessionTimeoutMinutes: true,
            createdAt: true,
        },
    });
    return res.status(200).json(org);
};
exports.updateOrganization = updateOrganization;
exports.organizationController = { getOrganization: exports.getOrganization, updateOrganization: exports.updateOrganization };
//# sourceMappingURL=organizationController.js.map