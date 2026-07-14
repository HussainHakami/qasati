import { z } from "zod";
import { createRouter, authedQuery } from "./middleware";

export const whatsappRouter = createRouter({
  // Send reminder via WhatsApp
  sendReminder: authedQuery
    .input(z.object({
      phone: z.string(),
      message: z.string(),
      apiKey: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      // For now, return a mock response
      // In production, integrate with WhatsApp Business API
      console.log(`[WhatsApp] Sending to ${input.phone}: ${input.message}`);
      return {
        sent: true,
        messageId: `msg_${Date.now()}`,
        timestamp: new Date().toISOString(),
      };
    }),

  // Send bulk reminders
  sendBulk: authedQuery
    .input(z.object({
      recipients: z.array(z.object({
        phone: z.string(),
        message: z.string(),
      })),
      apiKey: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const results = [];
      for (const r of input.recipients) {
        console.log(`[WhatsApp] Bulk send to ${r.phone}: ${r.message}`);
        results.push({ phone: r.phone, sent: true });
      }
      return { sent: results.length, results };
    }),

  // Validate WhatsApp number
  validate: authedQuery
    .input(z.object({ phone: z.string() }))
    .query(async ({ input }) => {
      const isValid = /^[0-9]{10,15}$/.test(input.phone.replace(/\+/g, ""));
      return { valid: isValid, phone: input.phone };
    }),
});
