import { sqliteTable, text, integer, real } from "drizzle-orm/sqlite-core";

export const users = sqliteTable("users", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  phone: text("phone").notNull().unique(),
  email: text("email"),
  password: text("password"),
  businessName: text("business_name"),
  role: text("role", { enum: ["user", "admin"] }).notNull().default("user"),
  whatsappApiKey: text("whatsapp_api_key"),
  createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
});

export const borrowers = sqliteTable("borrowers", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull(),
  name: text("name").notNull(),
  phone: text("phone").notNull(),
  idNumber: text("id_number"),
  address: text("address"),
  rating: text("rating", { enum: ["trusted", "average", "late"] }).notNull().default("average"),
  notes: text("notes"),
  createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
});

export const loans = sqliteTable("loans", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull(),
  borrowerId: text("borrower_id").notNull(),
  borrowerName: text("borrower_name").notNull(),
  productName: text("product_name").notNull(),
  amount: integer("amount").notNull(),
  monthlyPayment: integer("monthly_payment").notNull(),
  lastPayment: integer("last_payment").notNull(),
  monthsTotal: integer("months_total").notNull(),
  monthsPaid: integer("months_paid").notNull().default(0),
  startDate: text("start_date").notNull(),
  nextDueDate: text("next_due_date").notNull(),
  dueDay: integer("due_day").notNull().default(1),
  interestRate: real("interest_rate").notNull().default(0),
  status: text("status", { enum: ["active", "paid", "overdue"] }).notNull().default("active"),
  notes: text("notes"),
  createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
});

export const payments = sqliteTable("payments", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull(),
  loanId: text("loan_id").notNull(),
  borrowerId: text("borrower_id").notNull(),
  borrowerName: text("borrower_name").notNull(),
  amount: integer("amount").notNull(),
  date: text("date").notNull(),
  method: text("method", { enum: ["cash", "transfer", "bank"] }).notNull().default("cash"),
  notes: text("notes"),
  createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
});

export const notifications = sqliteTable("notifications", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull(),
  type: text("type", { enum: ["payment_received", "overdue", "upcoming", "loan_completed"] }).notNull(),
  message: text("message").notNull(),
  date: text("date").notNull(),
  read: integer("read", { mode: "boolean" }).notNull().default(false),
  relatedId: text("related_id"),
  createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
});

export const messageTemplates = sqliteTable("message_templates", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull(),
  name: text("name").notNull(),
  subject: text("subject").notNull(),
  body: text("body").notNull(),
  createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
});

export const autoReminders = sqliteTable("auto_reminders", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().unique(),
  enabled: integer("enabled", { mode: "boolean" }).notNull().default(false),
  daysBefore: integer("days_before").notNull().default(1),
  templateId: text("template_id"),
  whatsappApiKey: text("whatsapp_api_key"),
  createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
});

export type User = typeof users.$inferSelect;
export type Borrower = typeof borrowers.$inferSelect;
export type Loan = typeof loans.$inferSelect;
export type Payment = typeof payments.$inferSelect;
export type Notification = typeof notifications.$inferSelect;
export type MessageTemplate = typeof messageTemplates.$inferSelect;
export type AutoReminder = typeof autoReminders.$inferSelect;
