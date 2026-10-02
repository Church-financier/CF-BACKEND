"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.userController = exports.deleteUser = exports.updateUserRole = exports.createUser = exports.listUsers = void 0;
const userService_1 = require("../services/userService");
const listUsers = async (req, res) => {
    const user = req.user;
    const users = await userService_1.userService.list(user.organizationId);
    return res.status(200).json(users);
};
exports.listUsers = listUsers;
const createUser = async (req, res) => {
    const user = req.user;
    const { email, password, name, role } = req.body;
    const newUser = await userService_1.userService.create({ email, password, name, role, organizationId: user.organizationId });
    return res.status(201).json(newUser);
};
exports.createUser = createUser;
const updateUserRole = async (req, res) => {
    const user = req.user;
    const { role } = req.body;
    const updatedUser = await userService_1.userService.updateRole(req.params.id, role, user.organizationId);
    return res.status(200).json(updatedUser);
};
exports.updateUserRole = updateUserRole;
const deleteUser = async (req, res) => {
    const user = req.user;
    await userService_1.userService.delete(req.params.id, user.organizationId);
    return res.status(200).json({ message: "User deleted successfully" });
};
exports.deleteUser = deleteUser;
exports.userController = { listUsers: exports.listUsers, createUser: exports.createUser, updateUserRole: exports.updateUserRole, deleteUser: exports.deleteUser };
//# sourceMappingURL=userController.js.map