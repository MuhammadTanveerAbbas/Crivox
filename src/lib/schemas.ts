import { z } from "zod";

export const profileSchema = z.object({
  display_name: z.string().max(100, "Display name too long").optional(),
  default_tone: z.string().optional(),
  default_platform: z.string().optional(),
  default_language: z.string().optional(),
});

export const aiMemorySchema = z.object({
  full_name: z.string().max(100, "Name too long").optional(),
  profession: z.string().max(100, "Profession too long").optional(),
  industry: z.string().max(100, "Industry too long").optional(),
  target_audience: z.string().max(200, "Audience too long").optional(),
  use_case: z.string().max(200, "Use case too long").optional(),
});

export const queueItemSchema = z.object({
  comment_text: z.string().min(1, "Comment is required").max(2000, "Comment too long"),
  platform: z.string().min(1, "Platform is required"),
  notes: z.string().max(500, "Notes too long").nullable().optional(),
  scheduled_date: z.string().nullable().optional(),
  scheduled_time: z.string().nullable().optional(),
});

export const templateSchema = z.object({
  title: z.string().min(1, "Title is required").max(200, "Title too long"),
  content: z.string().min(1, "Content is required").max(2000, "Content too long"),
  category: z.string().min(1, "Category is required"),
});

export const resetEmailSchema = z.object({
  email: z.string().email("Invalid email address"),
});

export type ProfileFormData = z.infer<typeof profileSchema>;
export type AiMemoryFormData = z.infer<typeof aiMemorySchema>;
export type QueueItemFormData = z.infer<typeof queueItemSchema>;
export type TemplateFormData = z.infer<typeof templateSchema>;
