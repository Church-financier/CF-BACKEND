"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.memberController = exports.deleteMember = exports.updateMember = exports.createMember = exports.getMember = exports.listMembers = void 0;
const memberService_1 = require("../services/memberService");
const pagination_1 = require("../utils/pagination");
const listMembers = async (req, res) => {
    const user = req.user;
    const params = (0, pagination_1.parsePagination)(req);
    const { search } = req.query;
    const result = await memberService_1.memberService.list(params.page, params.pageSize, user.organizationId, search);
    return res.status(200).json((0, pagination_1.buildPaginatedResponse)(result.data, result.total, params));
};
exports.listMembers = listMembers;
const getMember = async (req, res) => {
    const user = req.user;
    const m = await memberService_1.memberService.getById(req.params.id, user.organizationId);
    if (!m)
        return res.status(404).json({ error: "Member not found" });
    return res.status(200).json(m);
};
exports.getMember = getMember;
const createMember = async (req, res) => {
    const user = req.user;
    const body = req.body;
    const m = await memberService_1.memberService.create({
        organizationId: user.organizationId,
        fullName: body.fullName,
        email: body.email || undefined,
        phone: body.phone,
        address: body.address,
        memberNumber: body.memberNumber,
    });
    return res.status(201).json(m);
};
exports.createMember = createMember;
const updateMember = async (req, res) => {
    const user = req.user;
    const body = req.body;
    const data = {};
    if (body.fullName !== undefined)
        data.fullName = body.fullName;
    if (body.email !== undefined)
        data.email = body.email || null;
    if (body.phone !== undefined)
        data.phone = body.phone;
    if (body.address !== undefined)
        data.address = body.address;
    if (body.memberNumber !== undefined)
        data.memberNumber = body.memberNumber;
    if (body.isActive !== undefined)
        data.isActive = body.isActive;
    const m = await memberService_1.memberService.update(req.params.id, data, user.organizationId);
    return res.status(200).json(m);
};
exports.updateMember = updateMember;
const deleteMember = async (req, res) => {
    const user = req.user;
    await memberService_1.memberService.delete(req.params.id, user.organizationId);
    return res.status(204).send();
};
exports.deleteMember = deleteMember;
exports.memberController = {
    listMembers: exports.listMembers,
    getMember: exports.getMember,
    createMember: exports.createMember,
    updateMember: exports.updateMember,
    deleteMember: exports.deleteMember,
};
//# sourceMappingURL=memberController.js.map