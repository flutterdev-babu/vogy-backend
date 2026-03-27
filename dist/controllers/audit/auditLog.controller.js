"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const auditLogService = __importStar(require("../../services/audit/auditLog.service"));
exports.default = {
    /* ============================================
        GET ALL AUDIT LOGS (paginated)
    ============================================ */
    async getAuditLogs(req, res) {
        try {
            const { module, action, userId, search, startDate, endDate, page, limit, } = req.query;
            const result = await auditLogService.getAuditLogs({
                module: module,
                action: action,
                userId: userId,
                search: search,
                startDate: startDate,
                endDate: endDate,
                page: page ? parseInt(page) : undefined,
                limit: limit ? parseInt(limit) : undefined,
            });
            res.json({
                success: true,
                data: result.logs,
                pagination: result.pagination,
            });
        }
        catch (err) {
            res.status(500).json({ success: false, message: err.message });
        }
    },
    /* ============================================
        GET AUDIT LOG BY ID
    ============================================ */
    async getAuditLogById(req, res) {
        try {
            const log = await auditLogService.getAuditLogById(req.params.id);
            res.json({ success: true, data: log });
        }
        catch (err) {
            res.status(404).json({ success: false, message: err.message });
        }
    },
};
