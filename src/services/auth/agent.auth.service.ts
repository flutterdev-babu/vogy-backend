import { prisma } from "../../config/prisma";
import jwt from "jsonwebtoken";
import { hashPassword, comparePassword } from "../../utils/hash";
import { validatePhoneNumber } from "../../utils/phoneValidation";

const JWT_SECRET = process.env.JWT_SECRET || "secret_jwt";

/* ============================================
    AGENT REGISTRATION
============================================ */
export const registerAgent = async (data: {
  name: string;
  phone: string;
  email?: string;
  password: string;
  profileImage?: string;
}) => {
  // Validate phone number format (E.164)
  validatePhoneNumber(data.phone);

  // Check if agent already exists
  const existsByPhone = await prisma.agent.findUnique({
    where: { phone: data.phone },
  });

  if (existsByPhone) throw new Error("Agent with this phone already exists");

  if (data.email) {
    const existsByEmail = await prisma.agent.findUnique({
      where: { email: data.email },
    });
    if (existsByEmail) throw new Error("Agent with this email already exists");
  }

  // Hash password
  const hashedPassword = await hashPassword(data.password);

  // Create agent (customId will be generated when agent creates their first city code)
  const agent = await prisma.agent.create({
    data: {
      name: data.name,
      phone: data.phone,
      email: data.email || null,
      password: hashedPassword,
      profileImage: data.profileImage || null,
    },
  });

  // Remove password from response
  const { password, ...agentWithoutPassword } = agent;
  return agentWithoutPassword;
};

/* ============================================
    AGENT LOGIN
============================================ */
export const loginAgent = async (phone: string, password: string) => {
  // Validate phone number format (E.164)
  validatePhoneNumber(phone);

  // Find agent by phone
  const agent = await prisma.agent.findUnique({
    where: { phone },
  });

  if (!agent) throw new Error("Invalid phone or password");

  // Verify password
  const isPasswordValid = await comparePassword(password, agent.password);
  if (!isPasswordValid) throw new Error("Invalid phone or password");

  // Generate JWT
  const token = jwt.sign({ id: agent.id, role: "AGENT" }, JWT_SECRET, {
    expiresIn: "7d",
  });

  // Remove password from response
  const { password: _, ...agentWithoutPassword } = agent;

  return {
    message: "Login successful",
    token,
    agent: agentWithoutPassword,
  };
};

/* ============================================
    GET AGENT PROFILE
============================================ */
export const getAgentProfile = async (agentId: string) => {
  const agent = await prisma.agent.findUnique({
    where: { id: agentId },
    include: {
      cityCodes: {
        select: {
          id: true,
          code: true,
          cityName: true,
          isActive: true,
        },
      },
      _count: {
        select: {
          vendors: true,
          corporates: true,
          rides: true,
          cityCodes: true,
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
    UPDATE AGENT PROFILE
============================================ */
export const updateAgentProfile = async (
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
      ...(data.email && { email: data.email }),
      ...(data.profileImage !== undefined && { profileImage: data.profileImage }),
    },
  });

  // Remove password from response
  const { password, ...agentWithoutPassword } = agent;
  return agentWithoutPassword;
};

/* ============================================
    GET AGENT VENDORS
============================================ */
export const getAgentVendors = async (agentId: string) => {
  const vendors = await prisma.vendor.findMany({
    where: { agentId },
    select: {
      id: true,
      name: true,
      companyName: true,
      phone: true,
      email: true,
      status: true,
      _count: {
        select: {
          vehicles: true,
          rides: true,
        },
      },
      createdAt: true,
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  return vendors;
};

/* ============================================
    GET AGENT CORPORATES
============================================ */
export const getAgentCorporates = async (agentId: string) => {
  const corporates = await prisma.corporate.findMany({
    where: { agentId },
    select: {
      id: true,
      companyName: true,
      contactPerson: true,
      phone: true,
      email: true,
      status: true,
      creditLimit: true,
      creditUsed: true,
      creditBalance: true,
      _count: {
        select: {
          rides: true,
        },
      },
      createdAt: true,
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  return corporates;
};

/* ============================================
    GET AGENT RIDES
============================================ */
export const getAgentRides = async (agentId: string) => {
  const rides = await prisma.ride.findMany({
    where: { agentId },
    include: {
      vendor: {
        select: {
          id: true,
          name: true,
          companyName: true,
        },
      },
      partner: {
        select: {
          id: true,
          name: true,
          phone: true,
        },
      },
      corporate: {
        select: {
          id: true,
          companyName: true,
        },
      },
      vehicleType: {
        select: {
          id: true,
          name: true,
          displayName: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  return rides;
};

/* ============================================
    GET AGENT ANALYTICS
============================================ */
export const getAgentAnalytics = async (agentId: string) => {
  // Get total counts
  const [vendorCount, corporateCount, totalRides, completedRides] = await Promise.all([
    prisma.vendor.count({ where: { agentId } }),
    prisma.corporate.count({ where: { agentId } }),
    prisma.ride.count({ where: { agentId } }),
    prisma.ride.count({ where: { agentId, status: "COMPLETED" } }),
  ]);

  // Get top vendors by rides
  const topVendors = await prisma.vendor.findMany({
    where: { agentId },
    select: {
      id: true,
      name: true,
      companyName: true,
      _count: {
        select: {
          rides: true,
        },
      },
    },
    orderBy: {
      rides: {
        _count: "desc",
      },
    },
    take: 5,
  });

  // Get top corporates by rides
  const topCorporates = await prisma.corporate.findMany({
    where: { agentId },
    select: {
      id: true,
      companyName: true,
      _count: {
        select: {
          rides: true,
        },
      },
    },
    orderBy: {
      rides: {
        _count: "desc",
      },
    },
    take: 5,
  });

  // Get total revenue from agent rides
  const revenueData = await prisma.ride.aggregate({
    where: { agentId, status: "COMPLETED" },
    _sum: {
      totalFare: true,
    },
  });

  return {
    totalVendors: vendorCount,
    totalCorporates: corporateCount,
    totalRides,
    completedRides,
    totalRevenue: revenueData._sum.totalFare || 0,
    topVendors: topVendors.map((v) => ({
      id: v.id,
      name: v.name,
      companyName: v.companyName,
      rideCount: v._count.rides,
    })),
    topCorporates: topCorporates.map((c) => ({
      id: c.id,
      companyName: c.companyName,
      rideCount: c._count.rides,
    })),
  };
};
