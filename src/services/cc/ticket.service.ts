import { prisma } from "../../config/prisma";
import { TicketStatus, TicketPriority, TicketCategory } from "@prisma/client";

/* ============================================
    TICKET NUMBER GENERATOR
============================================ */
const getCityCode = async (
  customerType: string,
  customerId: string,
  rideId?: string | null
): Promise<string> => {
  if (rideId) {
    const ride = await prisma.ride.findUnique({
      where: { id: rideId },
      include: { cityCode: true },
    });
    if (ride?.cityCode?.code) return ride.cityCode.code;
  }

  if (customerType === "PARTNER" || customerType === "RIDER" || customerType === "CAPTAIN") {
    const partner = await prisma.partner.findUnique({
      where: { id: customerId },
      include: { cityCode: true },
    });
    if (partner?.cityCode?.code) return partner.cityCode.code;
  } else if (customerType === "VENDOR") {
    const vendor = await prisma.vendor.findUnique({
      where: { id: customerId },
      include: { cityCode: true },
    });
    if (vendor?.cityCode?.code) return vendor.cityCode.code;
  } else if (customerType === "USER") {
    const lastRide = await prisma.ride.findFirst({
      where: { userId: customerId, cityCodeId: { not: null } },
      orderBy: { createdAt: "desc" },
      include: { cityCode: true },
    });
    if (lastRide?.cityCode?.code) return lastRide.cityCode.code;
  }

  return "GEN";
};

const generateTicketNumber = async (
  customerType: string,
  customerId: string,
  rideId?: string | null
): Promise<string> => {
  const today = new Date();
  
  // Format YYYYMMDD
  const yyyy = today.getFullYear();
  const mm = String(today.getMonth() + 1).padStart(2, "0");
  const dd = String(today.getDate()).padStart(2, "0");
  const dateStr = `${yyyy}${mm}${dd}`;

  // Role Letter
  let roleLetter = "U";
  if (customerType === "PARTNER") roleLetter = "P";
  else if (customerType === "CAPTAIN" || customerType === "RIDER") roleLetter = "C";
  else if (customerType === "VENDOR") roleLetter = "V";

  // City Code
  const cityCode = await getCityCode(customerType, customerId, rideId);
  const prefix = `${dateStr}-AC${roleLetter}${cityCode}`;

  // Count existing tickets with this prefix today to append XX
  const count = await prisma.supportTicket.count({
    where: { ticketNumber: { startsWith: prefix } },
  });

  return `${prefix}${String(count + 1).padStart(2, "0")}`;
};

/* ============================================
    CREATE TICKET
============================================ */
export const createTicket = async (data: {
  category: TicketCategory;
  priority?: TicketPriority;
  subject: string;
  description: string;
  customerType: string;
  customerId: string;
  customerName: string;
  customerPhone?: string;
  rideId?: string;
}) => {
  const ticketNumber = await generateTicketNumber(
    data.customerType,
    data.customerId,
    data.rideId
  );

  const ticket = await prisma.supportTicket.create({
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

/* ============================================
    GET ALL TICKETS (with filters)
============================================ */
export const getAllTickets = async (filters?: {
  status?: string;
  priority?: string;
  category?: string;
  assignedToId?: string;
  search?: string;
  page?: number;
  limit?: number;
}) => {
  const page = filters?.page || 1;
  const limit = filters?.limit || 20;
  const skip = (page - 1) * limit;

  const where: any = {};

  if (filters?.status) where.status = filters.status as TicketStatus;
  if (filters?.priority) where.priority = filters.priority as TicketPriority;
  if (filters?.category) where.category = filters.category as TicketCategory;
  if (filters?.assignedToId) where.assignedToId = filters.assignedToId;

  if (filters?.search) {
    where.OR = [
      { ticketNumber: { contains: filters.search, mode: "insensitive" } },
      { subject: { contains: filters.search, mode: "insensitive" } },
      { customerName: { contains: filters.search, mode: "insensitive" } },
      { customerPhone: { contains: filters.search } },
    ];
  }

  const [tickets, total] = await Promise.all([
    prisma.supportTicket.findMany({
      where,
      include: {
        _count: { select: { messages: true } },
      },
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    }),
    prisma.supportTicket.count({ where }),
  ]);

  return {
    tickets,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  };
};

/* ============================================
    GET TICKET BY ID
============================================ */
export const getTicketById = async (id: string) => {
  const ticket = await prisma.supportTicket.findUnique({
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

  if (!ticket) throw new Error("Ticket not found");
  return ticket;
};

/* ============================================
    UPDATE TICKET
============================================ */
export const updateTicket = async (id: string, data: {
  status?: TicketStatus;
  priority?: TicketPriority;
  category?: TicketCategory;
  assignedToId?: string;
}) => {
  const ticket = await prisma.supportTicket.update({
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

/* ============================================
    ASSIGN TICKET
============================================ */
export const assignTicket = async (ticketId: string, assignedToId: string, assignerName: string) => {
  // Get admin name for system message
  const admin = await prisma.admin.findUnique({
    where: { id: assignedToId },
    select: { name: true },
  });

  const ticket = await prisma.supportTicket.update({
    where: { id: ticketId },
    data: {
      assignedToId,
      status: "IN_PROGRESS",
    },
  });

  // Add system message
  await prisma.ticketMessage.create({
    data: {
      ticketId,
      senderType: "SYSTEM",
      senderName: "System",
      message: `Ticket assigned to ${admin?.name || "agent"} by ${assignerName}`,
    },
  });

  return ticket;
};

/* ============================================
    ADD MESSAGE
============================================ */
export const addMessage = async (ticketId: string, data: {
  senderType: string;
  senderId?: string;
  senderName: string;
  message: string;
  isInternal?: boolean;
}) => {
  const message = await prisma.ticketMessage.create({
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

/* ============================================
    RESOLVE TICKET
============================================ */
export const resolveTicket = async (ticketId: string, resolution: string, resolverName: string) => {
  const ticket = await prisma.supportTicket.update({
    where: { id: ticketId },
    data: {
      status: "RESOLVED",
      resolution,
      resolvedAt: new Date(),
    },
  });

  // Add system message
  await prisma.ticketMessage.create({
    data: {
      ticketId,
      senderType: "SYSTEM",
      senderName: "System",
      message: `Ticket resolved by ${resolverName}: ${resolution}`,
    },
  });

  return ticket;
};

/* ============================================
    GET TICKET STATS
============================================ */
export const getTicketStats = async () => {
  const [open, inProgress, waitingOnCustomer, resolved, closed, total] = await Promise.all([
    prisma.supportTicket.count({ where: { status: "OPEN" } }),
    prisma.supportTicket.count({ where: { status: "IN_PROGRESS" } }),
    prisma.supportTicket.count({ where: { status: "WAITING_ON_CUSTOMER" } }),
    prisma.supportTicket.count({ where: { status: "RESOLVED" } }),
    prisma.supportTicket.count({ where: { status: "CLOSED" } }),
    prisma.supportTicket.count(),
  ]);

  // Today's resolved
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);
  const resolvedToday = await prisma.supportTicket.count({
    where: { resolvedAt: { gte: startOfDay } },
  });

  return { open, inProgress, waitingOnCustomer, resolved, closed, total, resolvedToday };
};

/* ============================================
    GET TICKETS BY CUSTOMER
============================================ */
export const getTicketsByCustomer = async (customerType: string, customerId: string) => {
  const tickets = await prisma.supportTicket.findMany({
    where: { customerType, customerId },
    include: {
      _count: { select: { messages: true } },
    },
    orderBy: { createdAt: "desc" },
  });
  return tickets;
};
