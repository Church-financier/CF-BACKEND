"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.departmentController = exports.deleteDepartment = exports.updateDepartment = exports.createDepartment = exports.getDepartment = exports.listDepartments = void 0;
const departmentService_1 = require("../services/departmentService");
const pagination_1 = require("../utils/pagination");
const listDepartments = async (req, res) => {
    const user = req.user;
    const params = (0, pagination_1.parsePagination)(req);
    const isDepartmentHead = user?.role === "DEPARTMENT_HEAD";
    const result = isDepartmentHead
        ? await departmentService_1.departmentService.listForHead(params.page, params.pageSize, user.id, user.organizationId)
        : await departmentService_1.departmentService.list(params.page, params.pageSize, user.organizationId);
    return res.status(200).json((0, pagination_1.buildPaginatedResponse)(result.data, result.total, params));
};
exports.listDepartments = listDepartments;
const getDepartment = async (req, res) => {
    const user = req.user;
    const department = await departmentService_1.departmentService.getById(req.params.id, user.organizationId);
    if (!department) {
        return res.status(404).json({ error: "Department not found" });
    }
    return res.status(200).json(department);
};
exports.getDepartment = getDepartment;
const createDepartment = async (req, res) => {
    const user = req.user;
    const department = await departmentService_1.departmentService.create({ ...req.body, organizationId: user.organizationId });
    return res.status(201).json(department);
};
exports.createDepartment = createDepartment;
const updateDepartment = async (req, res) => {
    const user = req.user;
    const department = await departmentService_1.departmentService.update(req.params.id, req.body, user.organizationId);
    return res.status(200).json(department);
};
exports.updateDepartment = updateDepartment;
const deleteDepartment = async (req, res) => {
    const user = req.user;
    await departmentService_1.departmentService.delete(req.params.id, user.organizationId);
    return res.status(204).send();
};
exports.deleteDepartment = deleteDepartment;
exports.departmentController = { listDepartments: exports.listDepartments, getDepartment: exports.getDepartment, createDepartment: exports.createDepartment, updateDepartment: exports.updateDepartment, deleteDepartment: exports.deleteDepartment };
//# sourceMappingURL=departmentController.js.map