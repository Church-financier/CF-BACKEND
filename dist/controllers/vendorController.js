"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.vendorController = exports.deleteVendor = exports.updateVendor = exports.createVendor = exports.getVendor = exports.listVendors = void 0;
const vendorService_1 = require("../services/vendorService");
const pagination_1 = require("../utils/pagination");
const listVendors = async (req, res) => {
    const user = req.user;
    const params = (0, pagination_1.parsePagination)(req);
    const result = await vendorService_1.vendorService.list(params.page, params.pageSize, user.organizationId);
    return res.status(200).json((0, pagination_1.buildPaginatedResponse)(result.data, result.total, params));
};
exports.listVendors = listVendors;
const getVendor = async (req, res) => {
    const user = req.user;
    const vendor = await vendorService_1.vendorService.getById(req.params.id, user.organizationId);
    if (!vendor) {
        return res.status(404).json({ error: "Vendor not found" });
    }
    return res.status(200).json(vendor);
};
exports.getVendor = getVendor;
const createVendor = async (req, res) => {
    const user = req.user;
    const body = req.body;
    const vendor = await vendorService_1.vendorService.create({
        name: body.name,
        email: body.email,
        phone: body.phone,
        address: body.address,
        taxId: body.taxId,
        bankName: body.bankName,
        bankAccountName: body.bankAccountName,
        bankAccountNumber: body.bankAccountNumber,
        organizationId: user.organizationId,
    });
    return res.status(201).json(vendor);
};
exports.createVendor = createVendor;
const updateVendor = async (req, res) => {
    const user = req.user;
    const body = req.body;
    const vendor = await vendorService_1.vendorService.update(req.params.id, {
        name: body.name,
        email: body.email,
        phone: body.phone,
        address: body.address,
        taxId: body.taxId,
        bankName: body.bankName,
        bankAccountName: body.bankAccountName,
        bankAccountNumber: body.bankAccountNumber,
    }, user.organizationId);
    return res.status(200).json(vendor);
};
exports.updateVendor = updateVendor;
const deleteVendor = async (req, res) => {
    const user = req.user;
    await vendorService_1.vendorService.delete(req.params.id, user.organizationId);
    return res.status(204).send();
};
exports.deleteVendor = deleteVendor;
exports.vendorController = { listVendors: exports.listVendors, getVendor: exports.getVendor, createVendor: exports.createVendor, updateVendor: exports.updateVendor, deleteVendor: exports.deleteVendor };
//# sourceMappingURL=vendorController.js.map