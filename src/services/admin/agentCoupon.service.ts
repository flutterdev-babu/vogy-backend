import { prisma } from "../../config/prisma";

export const createAgentCoupon = async (data: {
  agentId: string;
  couponCode: string;
  description?: string;
  discountValue: number;
  minBookingAmount?: number;
  maxDiscountAmount?: number;
  validFrom: Date;
  validTo: Date;
}) => {
  // Check if coupon code already exists
  const existingCoupon = await prisma.agentCoupon.findUnique({
    where: { couponCode: data.couponCode },
  });

  if (existingCoupon) {
    throw new Error("Coupon code already exists");
  }

  // Check if agent exists
  const agent = await prisma.agent.findUnique({
    where: { id: data.agentId },
  });

  if (!agent) {
    throw new Error("Agent not found");
  }

  return await prisma.agentCoupon.create({
    data: {
      agentId: data.agentId,
      couponCode: data.couponCode,
      description: data.description || null,
      discountValue: data.discountValue,
      minBookingAmount: data.minBookingAmount || 0,
      maxDiscountAmount: data.maxDiscountAmount || 0,
      validFrom: data.validFrom,
      validTo: data.validTo,
    },
    include: {
      agent: {
        select: {
          id: true,
          name: true,
          customId: true,
          phone: true,
        },
      },
    },
  });
};

export const getAllAgentCoupons = async (filters?: {
  agentId?: string;
  isActive?: boolean;
}) => {
  const where: any = {};

  if (filters?.agentId) {
    where.agentId = filters.agentId;
  }

  if (filters?.isActive !== undefined) {
    where.isActive = filters.isActive;
  }

  return await prisma.agentCoupon.findMany({
    where,
    include: {
      agent: {
        select: {
          id: true,
          name: true,
          customId: true,
          phone: true,
        },
      },
    }
  });
};

export const getAgentCouponById = async (id: string) => {
  const coupon = await prisma.agentCoupon.findUnique({
    where: { id },
    include: {
      agent: {
        select: {
          id: true,
          name: true,
          customId: true,
          phone: true,
        },
      },
    }
  });

  if (!coupon) {
    throw new Error("Coupon not found");
  }

  return coupon;
};

export const updateAgentCoupon = async (
  id: string,
  data: {
    description?: string;
    discountValue?: number;
    minBookingAmount?: number;
    maxDiscountAmount?: number;
    validFrom?: Date;
    validTo?: Date;
    isActive?: boolean;
  }
) => {
  return await prisma.agentCoupon.update({
    where: { id },
    data,
    include: {
      agent: {
        select: {
          id: true,
          name: true,
          customId: true,
          phone: true,
        },
      },
    }
  });
};

export const deleteAgentCoupon = async (id: string) => {
  return await prisma.agentCoupon.delete({
    where: { id },
  });
};
