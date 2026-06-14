"use strict";
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.GroupController = void 0;
const group_service_1 = require("../services/group.service");
const helpers_1 = require("../utils/helpers");
class GroupController {
}
exports.GroupController = GroupController;
_a = GroupController;
GroupController.create = (0, helpers_1.catchAsync)(async (req, res, _next) => {
    const result = await group_service_1.GroupService.createGroup(req.user.userId, req.body);
    const response = {
        success: true,
        data: result,
        message: 'Group created successfully',
    };
    res.status(201).json(response);
});
GroupController.getAll = (0, helpers_1.catchAsync)(async (req, res, _next) => {
    const result = await group_service_1.GroupService.getGroups(req.user.userId);
    const response = {
        success: true,
        data: result,
        message: 'Groups retrieved successfully',
    };
    res.status(200).json(response);
});
GroupController.getOne = (0, helpers_1.catchAsync)(async (req, res, _next) => {
    const result = await group_service_1.GroupService.getGroupById(req.params.groupId, req.user.userId);
    const response = {
        success: true,
        data: result,
        message: 'Group retrieved successfully',
    };
    res.status(200).json(response);
});
GroupController.update = (0, helpers_1.catchAsync)(async (req, res, _next) => {
    const result = await group_service_1.GroupService.updateGroup(req.params.groupId, req.user.userId, req.body);
    const response = {
        success: true,
        data: result,
        message: 'Group updated successfully',
    };
    res.status(200).json(response);
});
GroupController.remove = (0, helpers_1.catchAsync)(async (req, res, _next) => {
    await group_service_1.GroupService.deleteGroup(req.params.groupId, req.user.userId);
    res.status(204).end();
});
GroupController.addMember = (0, helpers_1.catchAsync)(async (req, res, _next) => {
    const result = await group_service_1.GroupService.addMember(req.params.groupId, req.user.userId, req.body.email);
    const response = {
        success: true,
        data: result,
        message: 'Member added successfully',
    };
    res.status(201).json(response);
});
GroupController.removeMember = (0, helpers_1.catchAsync)(async (req, res, _next) => {
    await group_service_1.GroupService.removeMember(req.params.groupId, req.user.userId, req.params.userId);
    const response = {
        success: true,
        data: null,
        message: 'Member removed successfully',
    };
    res.status(200).json(response);
});
GroupController.linkMember = (0, helpers_1.catchAsync)(async (req, res, _next) => {
    const result = await group_service_1.GroupService.linkMember(req.params.groupId, req.user.userId, req.params.userId, req.body.email);
    const response = {
        success: true,
        data: result,
        message: 'Imported member linked successfully',
    };
    res.status(200).json(response);
});
GroupController.getBalances = (0, helpers_1.catchAsync)(async (req, res, _next) => {
    const result = await group_service_1.GroupService.getGroupBalances(req.params.groupId, req.user.userId);
    const response = {
        success: true,
        data: result,
        message: 'Group balances retrieved successfully',
    };
    res.status(200).json(response);
});
GroupController.getDashboardStats = (0, helpers_1.catchAsync)(async (req, res, _next) => {
    const result = await group_service_1.GroupService.getDashboardStats(req.user.userId);
    const response = {
        success: true,
        data: result,
        message: 'Dashboard stats retrieved successfully',
    };
    res.status(200).json(response);
});
GroupController.getBalanceBreakdown = (0, helpers_1.catchAsync)(async (req, res, _next) => {
    const result = await group_service_1.GroupService.getBalanceBreakdown(req.params.groupId, req.user.userId, req.params.userId);
    const response = {
        success: true,
        data: result,
        message: 'Balance breakdown retrieved successfully',
    };
    res.status(200).json(response);
});
//# sourceMappingURL=group.controller.js.map