import { prisma } from "../../config/prisma";

/* ============================================
    GET ALL AGENTS
============================================ */
export const getAllAgents = async (search?: string) => {
  const where: any = {};

  if (search) {
    where.OR = [
      { name: { contains: search, mode: "insensitive" } },
      { phone: { contains: search } },
      { email: { contains: search, mode: "insensitive" } },
    ];
  }

  const agents = await prisma.agent.findMany({
    where,
    select: {
      id: true,
      name: true,
      phone: true,
      email: true,
      profileImage: true,
      _count: {
        select: {
          vendors: true,
          corporates: true,
          rides: true,
        },
      },
      createdAt: true,
      updatedAt: true,
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  return agents;
};

/* ============================================
    GET AGENT BY ID
============================================ */
export const getAgentById = async (agentId: string) => {
  const agent = await prisma.agent.findUnique({
    where: { id: agentId },
    include: {
      vendors: {
        select: {
          id: true,
          name: true,
          companyName: true,
          phone: true,
          status: true,
          _count: {
            select: {
              rides: true,
              vehicles: true,
            },
          },
        },
      },
      corporates: {
        select: {
          id: true,
          companyName: true,
          contactPerson: true,
          phone: true,
          status: true,
          creditLimit: true,
          creditBalance: true,
          _count: {
            select: {
              rides: true,
            },
          },
        },
      },
      _count: {
        select: {
          vendors: true,
          corporates: true,
          rides: true,
        },
      },
    },
  });

  if (!agent) throw new Error("Agent not found");

  // Remove password from response
  const { password, ...agentWithoutPassword } = agent;
  return agentWithoutPassword;
};

/* ============================================
    REGISTER VENDOR UNDER AGENT
============================================ */
export const registerVendorUnderAgent = async (vendorId: string, agentId: string) => {
  // Validate agent
  const agent = await prisma.agent.findUnique({
    where: { id: agentId },
  });

  if (!agent) throw new Error("Agent not found");

  // Validate vendor
  const vendor = await prisma.vendor.findUnique({
    where: { id: vendorId },
  });

  if (!vendor) throw new Error("Vendor not found");

  // Update vendor with agent
  const updatedVendor = await prisma.vendor.update({
    where: { id: vendorId },
    data: { agentId },
    select: {
      id: true,
      name: true,
      companyName: true,
      phone: true,
      status: true,
      agent: {
        select: {
          id: true,
          name: true,
          phone: true,
        },
      },
    },
  });

  return updatedVendor;
};

/* ============================================
    REGISTER CORPORATE UNDER AGENT
============================================ */
export const registerCorporateUnderAgent = async (corporateId: string, agentId: string) => {
  // Validate agent
  const agent = await prisma.agent.findUnique({
    where: { id: agentId },
  });

  if (!agent) throw new Error("Agent not found");

  // Validate corporate
  const corporate = await prisma.corporate.findUnique({
    where: { id: corporateId },
  });

  if (!corporate) throw new Error("Corporate not found");

  // Update corporate with agent
  const updatedCorporate = await prisma.corporate.update({
    where: { id: corporateId },
    data: { agentId },
    select: {
      id: true,
      companyName: true,
      contactPerson: true,
      phone: true,
      status: true,
      agent: {
        select: {
          id: true,
          name: true,
          phone: true,
        },
      },
    },
  });

  return updatedCorporate;
};

/* ============================================
    UNASSIGN FROM AGENT
============================================ */
export const unassignVendorFromAgent = async (vendorId: string) => {
  const vendor = await prisma.vendor.update({
    where: { id: vendorId },
    data: { agentId: null },
    select: {
      id: true,
      name: true,
      companyName: true,
      agentId: true,
    },
  });

  return vendor;
};

export const unassignCorporateFromAgent = async (corporateId: string) => {
  const corporate = await prisma.corporate.update({
    where: { id: corporateId },
    data: { agentId: null },
    select: {
      id: true,
      companyName: true,
      agentId: true,
    },
  });

  return corporate;
};

/* ============================================
    UPDATE AGENT BY ADMIN
============================================ */
export const updateAgentByAdmin = async (
  agentId: string,
  data: {
    name?: string;
    email?: string;
    profileImage?: string;
  }
) => {
  // Check if email is unique if being updated
  if (data.email) {
    const existingAgent = await prisma.agent.findFirst({
      where: {
        email: data.email,
        NOT: { id: agentId },
      },
    });
    if (existingAgent) throw new Error("Email already in use by another agent");
  }

  const agent = await prisma.agent.update({
    where: { id: agentId },
    data: {
      ...(data.name && { name: data.name }),
      ...(data.email !== undefined && { email: data.email }),
      ...(data.profileImage !== undefined && { profileImage: data.profileImage }),
    },
  });

  // Remove password from response
  const { password, ...agentWithoutPassword } = agent;
  return agentWithoutPassword;
};

/* ============================================
    DELETE AGENT
============================================ */
export const deleteAgent = async (agentId: string) => {
  // Check if agent has vendors
  const vendorCount = await prisma.vendor.count({
    where: { agentId },
  });

  if (vendorCount > 0) {
    throw new Error("Cannot delete agent with assigned vendors. Unassign vendors first.");
  }

  // Check if agent has corporates
  const corporateCount = await prisma.corporate.count({
    where: { agentId },
  });

  if (corporateCount > 0) {
    throw new Error("Cannot delete agent with assigned corporates. Unassign corporates first.");
  }

  await prisma.agent.delete({
    where: { id: agentId },
  });

  return { message: "Agent deleted successfully" };
};

/* ============================================
    GET ALL USERS/RIDERS (For Agent)
============================================ */
export const getAllUsers = async (search?: string) => {
  const where: any = {};

  if (search) {
    where.OR = [
      { name: { contains: search, mode: "insensitive" } },
      { phone: { contains: search } },
      { email: { contains: search, mode: "insensitive" } },
    ];
  }

  const users = await prisma.rider.findMany({
    where,
    select: {
      id: true,
      name: true,
      phone: true,
      email: true,
      profileImage: true,
      _count: {
        select: {
          rides: true,
        },
      },
      createdAt: true,
      updatedAt: true,
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  return users;
};

/* ============================================
    CREATE USER/RIDER (For Agent)
============================================ */
export const createUser = async (data: {
  name: string;
  phone: string;
  email?: string;
  profileImage?: string;
}) => {
  // Check if rider already exists by phone
  const existingByPhone = await prisma.rider.findUnique({
    where: { phone: data.phone },
  });

  if (existingByPhone) {
    throw new Error("User with this phone already exists");
  }

  // Check if email exists
  if (data.email) {
    const existingByEmail = await prisma.rider.findUnique({
      where: { email: data.email },
    });
    if (existingByEmail) {
      throw new Error("User with this email already exists");
    }
  }

  // Check if phone already exists as Partner (prevent dual registration)
  const existsAsPartner = await prisma.partner.findUnique({
    where: { phone: data.phone },
  });

  if (existsAsPartner) {
    throw new Error("This phone number is already registered as a Partner.");
  }

  const rider = await prisma.rider.create({
    data: {
      name: data.name,
      phone: data.phone,
      email: data.email || null,
      profileImage: data.profileImage || null,
    },
    select: {
      id: true,
      name: true,
      phone: true,
      email: true,
      profileImage: true,
      createdAt: true,
    },
  });

  return rider;
};

