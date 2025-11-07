import { z } from "zod"

export const phoneNumberSchema = z
  .string()
  .min(10, "Phone number must be at least 10 digits")
  .max(15, "Phone number must be at most 15 digits")
  .regex(/^(\+?254|0)?[17]\d{8}$/, "Invalid Kenyan phone number format. Use +254XXXXXXXXX or 07XXXXXXXX")
  .transform((val) => {
    // Normalize phone number to international format
    if (val.startsWith("0")) {
      return `+254${val.slice(1)}`
    }
    if (val.startsWith("254")) {
      return `+${val}`
    }
    if (!val.startsWith("+")) {
      return `+254${val}`
    }
    return val
  })

export const emailSchema = z.string().email("Invalid email address").toLowerCase().trim()

export const feedbackSchema = z.object({
  qrId: z.string().uuid("Invalid QR code ID"),
  customerName: z
    .string()
    .min(2, "Name must be at least 2 characters")
    .max(100, "Name too long")
    .optional()
    .transform((val) => val?.trim()),
  customerPhone: phoneNumberSchema,
  rating: z.number().int().min(1, "Rating must be at least 1").max(5, "Rating must be at most 5").optional(),
  comment: z.string().max(1000, "Comment too long").optional(),
  customAnswers: z.record(z.any()).optional(),
  campaignId: z.string().uuid("Invalid campaign ID").optional(),
})

export const rewardClaimSchema = z.object({
  rewardId: z.string().uuid("Invalid reward ID"),
  phoneNumber: phoneNumberSchema,
})

export const qrValidationSchema = z.object({
  qrId: z.string().uuid("Invalid QR code ID"),
})

export const campaignSchema = z
  .object({
    name: z.string().min(3, "Campaign name must be at least 3 characters").max(100, "Campaign name too long").trim(),
    description: z.string().max(500, "Description too long").optional(),
    startDate: z.string().datetime("Invalid start date format").optional(),
    endDate: z.string().datetime("Invalid end date format").optional(),
    targetResponses: z.number().int().min(0, "Target responses must be positive").optional(),
  })
  .refine(
    (data) => {
      if (data.startDate && data.endDate) {
        return new Date(data.startDate) < new Date(data.endDate)
      }
      return true
    },
    {
      message: "End date must be after start date",
      path: ["endDate"],
    },
  )

export const productSchema = z.object({
  name: z.string().min(2, "Product name must be at least 2 characters").max(100, "Product name too long").trim(),
  category: z.string().min(2, "Category must be at least 2 characters").max(50, "Category too long").trim(),
  description: z.string().max(500, "Description too long").optional(),
})

export const skuSchema = z.object({
  productId: z.string().uuid("Invalid product ID"),
  weight: z.enum(["340g", "500g"], {
    errorMap: () => ({ message: "Weight must be either 340g or 500g" }),
  }),
  price: z.number().min(0, "Price must be positive"),
  rewardAmount: z.number().min(0, "Reward amount must be positive").max(1000, "Reward amount too large"),
  rewardDescription: z.string().min(1, "Reward description required").max(200, "Reward description too long").trim(),
})

export const qrBatchSchema = z.object({
  skuId: z.string().uuid("Invalid SKU ID"),
  quantity: z.number().int().min(1, "Quantity must be at least 1").max(10000, "Quantity cannot exceed 10,000"),
  batchNumber: z.number().int().min(1, "Batch number must be positive"),
  campaignId: z.string().uuid("Invalid campaign ID").nullable().optional(),
})

export const adminLoginSchema = z.object({
  email: emailSchema,
  password: z.string().min(6, "Password must be at least 6 characters"),
})

export const processRewardSchema = z.object({
  rewardId: z.string().uuid("Invalid reward ID"),
  phoneNumber: phoneNumberSchema,
  amount: z.number().positive("Amount must be positive"),
})

export const campaignQuestionSchema = z.object({
  campaignId: z.string().uuid("Invalid campaign ID"),
  question: z.string().min(5, "Question must be at least 5 characters").max(500, "Question too long").trim(),
  type: z.enum(["text", "textarea", "radio", "select", "checkbox"], {
    errorMap: () => ({ message: "Invalid question type" }),
  }),
  options: z.array(z.string()).optional(),
  required: z.boolean().default(false),
  order: z.number().int().min(1, "Order must be positive"),
})
