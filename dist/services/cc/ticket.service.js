"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getTicketsByCustomer = exports.getTicketStats = exports.resolveTicket = exports.addMessage = exports.assignTicket = exports.updateTicket = exports.getTicketById = exports.getAllTickets = exports.createTicket = void 0;
const prisma_1 = require("../../config/prisma");
/* ============================================
    TICKET NUMBER GENERATOR
============================================ */
const getCityCode = async (customerType, customerId, rideId) => {
    if (rideId) {
        const ride = await prisma_1.prisma.ride.findUnique({
            where: { id: rideId },
            include: { cityCode: true },
        });
        if (ride?.cityCode?.code)
            return ride.cityCode.code;
    }
    if (customerType === "PARTNER" || customerType === "RIDER" || customerType === "CAPTAIN") {
        const partner = await prisma_1.prisma.partner.findUnique({
            where: { id: customerId },
            include: { cityCode: true },
        });
        if (partner?.cityCode?.code)
            return partner.cityCode.code;
    }
    else if (customerType === "VENDOR") {
        const vendor = await prisma_1.prisma.vendor.findUnique({
            where: { id: customerId },
            include: { cityCode: true },
        });
        if (vendor?.cityCode?.code)
            return vendor.cityCode.code;
    }
    else if (customerType === "USER") {
        const lastRide = await prisma_1.prisma.ride.findFirst({
            where: { userId: customerId, cityCodeId: { not: null } },
            orderBy: { createdAt: "desc" },
            include: { cityCode: true },
        });
        if (lastRide?.cityCode?.code)
            return lastRide.cityCode.code;
    }
    return "GEN";
};
const generateTicketNumber = async (customerType, customerId, rideId) => {
    const today = new Date();
    // Format YYYYMMDD
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, "0");
    const dd = String(today.getDate()).padStart(2, "0");
    const dateStr = `${yyyy}${mm}${dd}`;
    // Role Letter
    let roleLetter = "U";
    if (customerType === "PARTNER")
        roleLetter = "P";
    else if (customerType === "CAPTAIN" || customerType === "RIDER")
        roleLetter = "C";
    else if (customerType === "VENDOR")
        roleLetter = "V";
    // City Code
    const cityCode = await getCityCode(customerType, customerId, rideId);
    const prefix = `${dateStr}-AC${roleLetter}${cityCode}`;
    // Count existing tickets with this prefix today to append XX
    const count = await prisma_1.prisma.supportTicket.count({
        where: { ticketNumber: { startsWith: prefix } },
    });
    return `${prefix}${String(count + 1).padStart(2, "0")}`;
};
/* ============================================
    CREATE TICKET
============================================ */
const createTicket = async (data) => {
    const ticketNumber = await generateTicketNumber(data.customerType, data.customerId, data.rideId);
    const ticket = await prisma_1.prisma.supportTicket.create({
        data: {
            ticketNumber,
            category: data.category,
            priority: data.priority || "MEDIUM",
            subject: data.subject,
            description: data.description,
            customerType: data.customerType,
            customerId: data.customerId,
            customerName: data.customerName,
            customerPhone: data.customerPhone,
            rideId: data.rideId || null,
            messages: {
                create: {
                    senderType: "SYSTEM",
                    senderName: "System",
                    message: `Ticket created: ${data.subject}`,
                },
            },
        },
        include: { messages: true },
    });
    return ticket;
};
exports.createTicket = createTicket;
/* ============================================
    GET ALL TICKETS (with filters)
============================================ */
const getAllTickets = async (filters) => {
    const page = filters?.page || 1;
    const limit = filters?.limit || 20;
    const skip = (page - 1) * limit;
    const where = {};
    if (filters?.status)
        where.status = filters.status;
    if (filters?.priority)
        where.priority = filters.priority;
    if (filters?.category)
        where.category = filters.category;
    if (filters?.assignedToId)
        where.assignedToId = filters.assignedToId;
    if (filters?.search) {
        where.OR = [
            { ticketNumber: { contains: filters.search, mode: "insensitive" } },
            { subject: { contains: filters.search, mode: "insensitive" } },
            { customerName: { contains: filters.search, mode: "insensitive" } },
            { customerPhone: { contains: filters.search } },
        ];
    }
    const [tickets, total] = await Promise.all([
        prisma_1.prisma.supportTicket.findMany({
            where,
            include: {
                _count: { select: { messages: true } },
            },
            orderBy: { createdAt: "desc" },
            skip,
            take: limit,
        }),
        prisma_1.prisma.supportTicket.count({ where }),
    ]);
    return {
        tickets,
        pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
};
exports.getAllTickets = getAllTickets;
/* ============================================
    GET TICKET BY ID
============================================ */
const getTicketById = async (id) => {
    const ticket = await prisma_1.prisma.supportTicket.findUnique({
        where: { id },
        include: {
            messages: { orderBy: { createdAt: "asc" } },
            ride: {
                select: {
                    id: true,
                    status: true,
                    pickupAddress: true,
                    dropAddress: true,
                    totalFare: true,
                    createdAt: true,
                },
            },
        },
    });
    if (!ticket)
        throw new Error("Ticket not found");
    return ticket;
};
exports.getTicketById = getTicketById;
/* ============================================
    UPDATE TICKET
============================================ */
const updateTicket = async (id, data) => {
    const ticket = await prisma_1.prisma.supportTicket.update({
        where: { id },
        data: {
            ...(data.status && { status: data.status }),
            ...(data.priority && { priority: data.priority }),
            ...(data.category && { category: data.category }),
            ...(data.assignedToId !== undefined && { assignedToId: data.assignedToId }),
        },
    });
    return ticket;
};
exports.updateTicket = updateTicket;
/* ============================================
    ASSIGN TICKET
============================================ */
const assignTicket = async (ticketId, assignedToId, assignerName) => {
    // Get admin name for system message
    const admin = await prisma_1.prisma.admin.findUnique({
        where: { id: assignedToId },
        select: { name: true },
    });
    const ticket = await prisma_1.prisma.supportTicket.update({
        where: { id: ticketId },
        data: {
            assignedToId,
            status: "IN_PROGRESS",
        },
    });
    // Add system message
    await prisma_1.prisma.ticketMessage.create({
        data: {
            ticketId,
            senderType: "SYSTEM",
            senderName: "System",
            message: `Ticket assigned to ${admin?.name || "agent"} by ${assignerName}`,
        },
    });
    return ticket;
};
exports.assignTicket = assignTicket;
/* ============================================
    ADD MESSAGE
============================================ */
const addMessage = async (ticketId, data) => {
    const message = await prisma_1.prisma.ticketMessage.create({
        data: {
            ticketId,
            senderType: data.senderType,
            senderId: data.senderId,
            senderName: data.senderName,
            message: data.message,
            isInternal: data.isInternal || false,
        },
    });
    return message;
};
exports.addMessage = addMessage;
/* ============================================
    RESOLVE TICKET
============================================ */
const resolveTicket = async (ticketId, resolution, resolverName) => {
    const ticket = await prisma_1.prisma.supportTicket.update({
        where: { id: ticketId },
        data: {
            status: "RESOLVED",
            resolution,
            resolvedAt: new Date(),
        },
    });
    // Add system message
    await prisma_1.prisma.ticketMessage.create({
        data: {
            ticketId,
            senderType: "SYSTEM",
            senderName: "System",
            message: `Ticket resolved by ${resolverName}: ${resolution}`,
        },
    });
    return ticket;
};
exports.resolveTicket = resolveTicket;
/* ============================================
    GET TICKET STATS
============================================ */
const getTicketStats = async () => {
    const [open, inProgress, waitingOnCustomer, resolved, closed, total] = await Promise.all([
        prisma_1.prisma.supportTicket.count({ where: { status: "OPEN" } }),
        prisma_1.prisma.supportTicket.count({ where: { status: "IN_PROGRESS" } }),
        prisma_1.prisma.supportTicket.count({ where: { status: "WAITING_ON_CUSTOMER" } }),
        prisma_1.prisma.supportTicket.count({ where: { status: "RESOLVED" } }),
        prisma_1.prisma.supportTicket.count({ where: { status: "CLOSED" } }),
        prisma_1.prisma.supportTicket.count(),
    ]);
    // Today's resolved
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const resolvedToday = await prisma_1.prisma.supportTicket.count({
        where: { resolvedAt: { gte: startOfDay } },
    });
    return { open, inProgress, waitingOnCustomer, resolved, closed, total, resolvedToday };
};
exports.getTicketStats = getTicketStats;
/* ============================================
    GET TICKETS BY CUSTOMER
============================================ */
const getTicketsByCustomer = async (customerType, customerId) => {
    const tickets = await prisma_1.prisma.supportTicket.findMany({
        where: { customerType, customerId },
        include: {
            _count: { select: { messages: true } },
        },
        orderBy: { createdAt: "desc" },
    });
    return tickets;
};
exports.getTicketsByCustomer = getTicketsByCustomer;
