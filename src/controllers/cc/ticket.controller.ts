import { Response } from "express";
import { AuthedRequest } from "../../middleware/auth.middleware";
import { createAuditLog, getRequestContext } from "../../services/audit/auditLog.service";
import * as ticketService from "../../services/cc/ticket.service";

export default {
  // Create ticket (admin / CC agent)
  createTicket: async (req: AuthedRequest, res: Response) => {
    try {
      const { category, priority, subject, description, customerType, customerId, customerName, customerPhone, rideId } = req.body;

      if (!category || !subject || !description || !customerType || !customerId || !customerName) {
        return res.status(400).json({ success: false, message: "category, subject, description, customerType, customerId, and customerName are required" });
      }

      const ticket = await ticketService.createTicket({
        category, priority, subject, description,
        customerType, customerId, customerName, customerPhone, rideId,
      });

      createAuditLog({
        userId: req.user?.id, userName: req.user?.name, userRole: req.user?.role,
        action: "CREATE", module: "SUPPORT_TICKET", entityId: ticket.id,
        description: `Created support ticket: ${ticket.ticketNumber}`, newData: { subject, category, customerName },
        ...getRequestContext(req),
      });

      res.status(201).json({ success: true, message: "Ticket created", data: ticket });
    } catch (err: any) {
      res.status(400).json({ success: false, message: err.message });
    }
  },

  // Get all tickets
  getAllTickets: async (req: AuthedRequest, res: Response) => {
    try {
      const { status, priority, category, assignedToId, search, rideId, customerId, page, limit } = req.query;
      const result = await ticketService.getAllTickets({
        status: status as string,
        priority: priority as string,
        category: category as string,
        assignedToId: assignedToId as string,
        search: search as string,
        rideId: rideId as string,
        customerId: customerId as string,
        page: page ? parseInt(page as string) : undefined,
        limit: limit ? parseInt(limit as string) : undefined,
      });
      res.json({ success: true, data: result });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  },

  // Get ticket stats
  getTicketStats: async (_req: AuthedRequest, res: Response) => {
    try {
      const stats = await ticketService.getTicketStats();
      res.json({ success: true, data: stats });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  },

  // Get ticket by ID
  getTicketById: async (req: AuthedRequest, res: Response) => {
    try {
      const ticket = await ticketService.getTicketById(req.params.id);
      res.json({ success: true, data: ticket });
    } catch (err: any) {
      res.status(404).json({ success: false, message: err.message });
    }
  },

  // Update ticket
  updateTicket: async (req: AuthedRequest, res: Response) => {
    try {
      const ticket = await ticketService.updateTicket(req.params.id, req.body);
      res.json({ success: true, data: ticket });
    } catch (err: any) {
      res.status(400).json({ success: false, message: err.message });
    }
  },

  // Assign ticket
  assignTicket: async (req: AuthedRequest, res: Response) => {
    try {
      const { assignedToId } = req.body;
      if (!assignedToId) {
        return res.status(400).json({ success: false, message: "assignedToId is required" });
      }
      const ticket = await ticketService.assignTicket(req.params.id, assignedToId, req.user?.name || "Admin");

      createAuditLog({
        userId: req.user?.id, userName: req.user?.name, userRole: req.user?.role,
        action: "ASSIGNMENT", module: "SUPPORT_TICKET", entityId: req.params.id,
        description: `Assigned ticket to agent`, newData: { assignedToId },
        ...getRequestContext(req),
      });

      res.json({ success: true, data: ticket });
    } catch (err: any) {
      res.status(400).json({ success: false, message: err.message });
    }
  },

  // Add message
  addMessage: async (req: AuthedRequest, res: Response) => {
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
    } catch (err: any) {
      res.status(400).json({ success: false, message: err.message });
    }
  },

  // Resolve ticket
  resolveTicket: async (req: AuthedRequest, res: Response) => {
    try {
      const { resolution } = req.body;
      if (!resolution) {
        return res.status(400).json({ success: false, message: "resolution is required" });
      }
      const ticket = await ticketService.resolveTicket(req.params.id, resolution, req.user?.name || "Admin");

      createAuditLog({
        userId: req.user?.id, userName: req.user?.name, userRole: req.user?.role,
        action: "STATUS_CHANGE", module: "SUPPORT_TICKET", entityId: req.params.id,
        description: `Resolved ticket`, newData: { status: "RESOLVED", resolution },
        ...getRequestContext(req),
      });

      res.json({ success: true, data: ticket });
    } catch (err: any) {
      res.status(400).json({ success: false, message: err.message });
    }
  },

  // ============================================
  // USER/PARTNER FACING TICKET ENDPOINTS
  // ============================================

  // Create ticket (from user/partner app)
  createCustomerTicket: async (req: AuthedRequest, res: Response) => {
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
        customerType: userRole === "VENDOR" ? "VENDOR" : userRole === "PARTNER" ? "PARTNER" : "USER",
        customerId: userId,
        customerName: userName,
        customerPhone: req.user?.account?.phone || req.user?.phone,
        rideId,
      });

      res.status(201).json({ success: true, message: "Ticket created", data: ticket });
    } catch (err: any) {
      res.status(400).json({ success: false, message: err.message });
    }
  },

  // Get my tickets (user/partner)
  getMyTickets: async (req: AuthedRequest, res: Response) => {
    try {
      const userId = req.user?.id;
      const userRole = req.user?.role;

      if (!userId) {
        return res.status(401).json({ success: false, message: "Unauthorized" });
      }

      const tickets = await ticketService.getTicketsByCustomer(
        userRole === "VENDOR" ? "VENDOR" : userRole === "PARTNER" ? "PARTNER" : "USER",
        userId
      );

      res.json({ success: true, data: tickets });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  },

  // Get ticket detail (user/partner)
  getCustomerTicketById: async (req: AuthedRequest, res: Response) => {
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
    } catch (err: any) {
      res.status(404).json({ success: false, message: err.message });
    }
  },

  // Add message (user/partner reply)
  addCustomerMessage: async (req: AuthedRequest, res: Response) => {
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
        senderType: userRole === "VENDOR" ? "VENDOR" : userRole === "PARTNER" ? "PARTNER" : "USER",
        senderId: userId,
        senderName: userName,
        message,
      });

      res.status(201).json({ success: true, data: msg });
    } catch (err: any) {
      res.status(400).json({ success: false, message: err.message });
    }
  },
};
