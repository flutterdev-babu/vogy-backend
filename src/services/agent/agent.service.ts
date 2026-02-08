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
      customId: true,
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

  return agents;
};

/* ============================================
    GET AGENT BY ID
============================================ */
export const getAgentById = async (agentId: string) => {
  const agent = await prisma.agent.findUnique({
    where: { id: agentId },
    include: {
      _count: {
        select: {
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
    GET AGENT BY CODE
============================================ */
export const getAgentByCode = async (agentCode: string) => {
  const agent = await prisma.agent.findUnique({
    where: { agentCode },
    select: {
      id: true,
      agentCode: true,
      name: true,
    },
  });
  return agent;
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
    agentCode?: string;
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

  // Check if agentCode is unique
  if (data.agentCode) {
    const existingByCode = await prisma.agent.findFirst({
      where: {
        agentCode: data.agentCode,
        NOT: { id: agentId },
      },
    });
    if (existingByCode) throw new Error("Agent code already in use");
  }

  const agent = await prisma.agent.update({
    where: { id: agentId },
    data: {
      ...(data.name && { name: data.name }),
      ...(data.email !== undefined && { email: data.email }),
      ...(data.profileImage !== undefined && { profileImage: data.profileImage }),
      ...(data.agentCode !== undefined && { agentCode: data.agentCode }),
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
  await prisma.agent.delete({
    where: { id: agentId },
  });

  return { message: "Agent deleted successfully" };
};

/* ============================================
    GET ALL USERS (For Agent)
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

  const users = await prisma.user.findMany({
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
    CREATE USER (For Agent)
============================================ */
export const createUser = async (data: {
  name: string;
  phone: string;
  email?: string;
  profileImage?: string;
}) => {
  // Check if user already exists by phone
  const existingByPhone = await prisma.user.findUnique({
    where: { phone: data.phone },
  });

  if (existingByPhone) {
    throw new Error("User with this phone already exists");
  }

  // Check if email exists
  if (data.email) {
    const existingByEmail = await prisma.user.findUnique({
      where: { email: data.email },
    });
    if (existingByEmail) {
      throw new Error("User with this email already exists");
    }
  }

  // Generate unique OTP for the user
  const { generateUnique4DigitOtp } = require("../../utils/generateUniqueOtp");
  const uniqueOtp = await generateUnique4DigitOtp();

  const user = await prisma.user.create({
    data: {
      name: data.name,
      phone: data.phone,
      email: data.email || null,
      profileImage: data.profileImage || null,
      uniqueOtp: uniqueOtp,
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

  return user;
};

/* ============================================
    GET RIDES BY AGENT CODE
============================================ */
export const getAgentRides = async (agentCode: string) => {
  return await prisma.ride.findMany({
    where: { agentCode },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          phone: true,
        },
      },
      partner: {
        select: {
          id: true,
          name: true,
          phone: true,
        },
      },
      vehicleType: true,
      vehicle: true,
    },
    orderBy: { createdAt: "desc" },
  });
};
