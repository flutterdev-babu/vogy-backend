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
const auditLog_service_1 = require("../../services/audit/auditLog.service");
const ticketService = __importStar(require("../../services/cc/ticket.service"));
exports.default = {
    // Create ticket (admin / CC agent)
    createTicket: async (req, res) => {
        try {
            const { category, priority, subject, description, customerType, customerId, customerName, customerPhone, rideId } = req.body;
            if (!category || !subject || !description || !customerType || !customerId || !customerName) {
                return res.status(400).json({ success: false, message: "category, subject, description, customerType, customerId, and customerName are required" });
            }
            const ticket = await ticketService.createTicket({
                category, priority, subject, description,
                customerType, customerId, customerName, customerPhone, rideId,
            });
            (0, auditLog_service_1.createAuditLog)({
                userId: req.user?.id, userName: req.user?.name, userRole: req.user?.role,
                action: "CREATE", module: "SUPPORT_TICKET", entityId: ticket.id,
                description: `Created support ticket: ${ticket.ticketNumber}`, newData: { subject, category, customerName },
                ...(0, auditLog_service_1.getRequestContext)(req),
            });
            res.status(201).json({ success: true, message: "Ticket created", data: ticket });
        }
        catch (err) {
            res.status(400).json({ success: false, message: err.message });
        }
    },
    // Get all tickets
    getAllTickets: async (req, res) => {
        try {
            const { status, priority, category, assignedToId, search, page, limit } = req.query;
            const result = await ticketService.getAllTickets({
                status: status,
                priority: priority,
                category: category,
                assignedToId: assignedToId,
                search: search,
                page: page ? parseInt(page) : undefined,
                limit: limit ? parseInt(limit) : undefined,
            });
            res.json({ success: true, data: result });
        }
        catch (err) {
            res.status(500).json({ success: false, message: err.message });
        }
    },
    // Get ticket stats
    getTicketStats: async (_req, res) => {
        try {
            const stats = await ticketService.getTicketStats();
            res.json({ success: true, data: stats });
        }
        catch (err) {
            res.status(500).json({ success: false, message: err.message });
        }
    },
    // Get ticket by ID
    getTicketById: async (req, res) => {
        try {
            const ticket = await ticketService.getTicketById(req.params.id);
            res.json({ success: true, data: ticket });
        }
        catch (err) {
            res.status(404).json({ success: false, message: err.message });
        }
    },
    // Update ticket
    updateTicket: async (req, res) => {
        try {
            const ticket = await ticketService.updateTicket(req.params.id, req.body);
            res.json({ success: true, data: ticket });
        }
        catch (err) {
            res.status(400).json({ success: false, message: err.message });
        }
    },
    // Assign ticket
    assignTicket: async (req, res) => {
        try {
            const { assignedToId } = req.body;
            if (!assignedToId) {
                return res.status(400).json({ success: false, message: "assignedToId is required" });
            }
            const ticket = await ticketService.assignTicket(req.params.id, assignedToId, req.user?.name || "Admin");
            (0, auditLog_service_1.createAuditLog)({
                userId: req.user?.id, userName: req.user?.name, userRole: req.user?.role,
                action: "ASSIGNMENT", module: "SUPPORT_TICKET", entityId: req.params.id,
                description: `Assigned ticket to agent`, newData: { assignedToId },
                ...(0, auditLog_service_1.getRequestContext)(req),
            });
            res.json({ success: true, data: ticket });
        }
        catch (err) {
            res.status(400).json({ success: false, message: err.message });
        }
    },
    // Add message
    addMessage: async (req, res) => {
        try {
            const { message, isInternal } = req.body;
            if (!message) {
                return res.status(400).json({ success: false, message: "message is required" });
            }
            const msg = await ticketService.addMessage(req.params.id, {
                senderType: "ADMIN",
                senderId: req.user?.id,
                senderName: req.user?.name || "Admin",
                message,
                isInternal,
            });
            res.status(201).json({ success: true, data: msg });
        }
        catch (err) {
            res.status(400).json({ success: false, message: err.message });
        }
    },
    // Resolve ticket
    resolveTicket: async (req, res) => {
        try {
            const { resolution } = req.body;
            if (!resolution) {
                return res.status(400).json({ success: false, message: "resolution is required" });
            }
            const ticket = await ticketService.resolveTicket(req.params.id, resolution, req.user?.name || "Admin");
            (0, auditLog_service_1.createAuditLog)({
                userId: req.user?.id, userName: req.user?.name, userRole: req.user?.role,
                action: "STATUS_CHANGE", module: "SUPPORT_TICKET", entityId: req.params.id,
                description: `Resolved ticket`, newData: { status: "RESOLVED", resolution },
                ...(0, auditLog_service_1.getRequestContext)(req),
            });
            res.json({ success: true, data: ticket });
        }
        catch (err) {
            res.status(400).json({ success: false, message: err.message });
        }
    },
    // ============================================
    // USER/PARTNER FACING TICKET ENDPOINTS
    // ============================================
    // Create ticket (from user/partner app)
    createCustomerTicket: async (req, res) => {
        try {
            const userId = req.user?.id;
            const userRole = req.user?.role;
            const userName = req.user?.name || "Customer";
            if (!userId) {
                return res.status(401).json({ success: false, message: "Unauthorized" });
            }
            const { category, subject, description, rideId } = req.body;
            if (!category || !subject || !description) {
                return res.status(400).json({ success: false, message: "category, subject, and description are required" });
            }
            const ticket = await ticketService.createTicket({
                category,
                subject,
                description,
                customerType: userRole === "PARTNER" ? "PARTNER" : "USER",
                customerId: userId,
                customerName: userName,
                customerPhone: req.user?.account?.phone,
                rideId,
            });
            res.status(201).json({ success: true, message: "Ticket created", data: ticket });
        }
        catch (err) {
            res.status(400).json({ success: false, message: err.message });
        }
    },
    // Get my tickets (user/partner)
    getMyTickets: async (req, res) => {
        try {
            const userId = req.user?.id;
            const userRole = req.user?.role;
            if (!userId) {
                return res.status(401).json({ success: false, message: "Unauthorized" });
            }
            const tickets = await ticketService.getTicketsByCustomer(userRole === "PARTNER" ? "PARTNER" : "USER", userId);
            res.json({ success: true, data: tickets });
        }
        catch (err) {
            res.status(500).json({ success: false, message: err.message });
        }
    },
    // Get ticket detail (user/partner)
    getCustomerTicketById: async (req, res) => {
        try {
            const userId = req.user?.id;
            const ticket = await ticketService.getTicketById(req.params.id);
            // Ensure user owns this ticket
            if (ticket.customerId !== userId) {
                return res.status(403).json({ success: false, message: "Forbidden" });
            }
            // Remove internal messages
            ticket.messages = ticket.messages.filter(m => !m.isInternal);
            res.json({ success: true, data: ticket });
        }
        catch (err) {
            res.status(404).json({ success: false, message: err.message });
        }
    },
    // Add message (user/partner reply)
    addCustomerMessage: async (req, res) => {
        try {
            const userId = req.user?.id;
            const userRole = req.user?.role;
            const userName = req.user?.name || "Customer";
            const ticket = await ticketService.getTicketById(req.params.id);
            if (ticket.customerId !== userId) {
                return res.status(403).json({ success: false, message: "Forbidden" });
            }
            const { message } = req.body;
            if (!message) {
                return res.status(400).json({ success: false, message: "message is required" });
            }
            const msg = await ticketService.addMessage(req.params.id, {
                senderType: userRole === "PARTNER" ? "PARTNER" : "USER",
                senderId: userId,
                senderName: userName,
                message,
            });
            res.status(201).json({ success: true, data: msg });
        }
        catch (err) {
            res.status(400).json({ success: false, message: err.message });
        }
    },
};
