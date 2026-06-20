import { z } from "zod";

// Event validation
export const createEventSchema = z.object({
  title: z.string().min(1, "活动标题不能为空").max(100, "活动标题不能超过100字"),
  type: z.string().min(1, "活动类型不能为空"),
  city: z.string().min(1, "城市不能为空"),
  address: z.string().max(200, "地址不能超过200字").optional().nullable(),
  date: z.string().refine((date) => {
    const eventDate = new Date(date);
    return !isNaN(eventDate.getTime()) && eventDate > new Date();
  }, "活动时间必须是未来的有效时间"),
  maxAttendees: z.number().int().min(2).max(200).optional(),
  priceAmount: z.number().min(0).max(10000).optional(),
  description: z.string().max(2000, "描述不能超过2000字").optional().nullable(),
  imageUrl: z.string().url().optional().nullable(),
  matchId: z.string().optional().nullable(),
  autoInviteMembers: z.array(z.string()).optional(),
  estimatedSpend: z.string().optional().nullable(),
  estimatedSpicy: z.string().optional().nullable(),
  estimatedCuisine: z.string().optional().nullable(),
  alcoholPolicy: z.string().optional().nullable(),
});

export type CreateEventInput = z.infer<typeof createEventSchema>;

// Match validation
export const findMatchSchema = z.object({
  eventTypePreference: z.array(z.string()).optional(),
  ageMin: z.number().int().min(18).max(100).optional(),
  ageMax: z.number().int().min(18).max(100).optional(),
  maxDistance: z.number().positive().optional(),
});

export type FindMatchInput = z.infer<typeof findMatchSchema>;

// Attendance validation
export const attendEventSchema = z.object({
  eventId: z.string().min(1, "活动ID不能为空"),
  status: z.enum(["PENDING", "CONFIRMED", "WAITLISTED", "CANCELLED"]).optional(),
});

export type AttendEventInput = z.infer<typeof attendEventSchema>;

// Message validation
export const createMessageSchema = z.object({
  content: z.string().min(1, "消息不能为空").max(5000, "消息不能超过5000字"),
  eventId: z.string().min(1, "活动ID不能为空"),
});

export type CreateMessageInput = z.infer<typeof createMessageSchema>;

// Direct message validation
export const createDirectMessageSchema = z.object({
  content: z.string().min(1, "消息不能为空").max(5000, "消息不能超过5000字"),
  recipientId: z.string().min(1, "收件人ID不能为空"),
});

export type CreateDirectMessageInput = z.infer<typeof createDirectMessageSchema>;

// Rating validation
export const createRatingSchema = z.object({
  ratedUserId: z.string().min(1, "被评分用户ID不能为空"),
  score: z.number().int().min(1).max(5),
  comment: z.string().max(500, "评论不能超过500字").optional(),
  eventId: z.string().min(1, "活动ID不能为空"),
});

export type CreateRatingInput = z.infer<typeof createRatingSchema>;

// Report validation
export const createReportSchema = z.object({
  reportedUserId: z.string().min(1, "被举报用户ID不能为空"),
  reason: z.string().min(10, "举报原因至少10字").max(1000, "举报原因不能超过1000字"),
  eventId: z.string().optional(),
});

export type CreateReportInput = z.infer<typeof createReportSchema>;

// Coupon validation
export const validateCouponSchema = z.object({
  code: z.string().min(1, "优惠券代码不能为空"),
  eventId: z.string().min(1, "活动ID不能为空"),
});

export type ValidateCouponInput = z.infer<typeof validateCouponSchema>;

// Helper function to validate and handle errors
export async function validateRequest<T>(
  schema: z.ZodSchema,
  data: unknown,
): Promise<{ success: true; data: T } | { success: false; errors: z.ZodError }> {
  const result = schema.safeParse(data);
  if (!result.success) {
    return { success: false, errors: result.error };
  }
  return { success: true, data: result.data as T };
}

// Format validation errors for API response
export function formatValidationErrors(errors: z.ZodError): Record<string, string[]> {
  const formatted: Record<string, string[]> = {};
  errors.issues.forEach((issue) => {
    const path = issue.path.join(".");
    if (!formatted[path]) {
      formatted[path] = [];
    }
    formatted[path].push(issue.message);
  });
  return formatted;
}
