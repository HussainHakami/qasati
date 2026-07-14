import {
  mysqlTable,
  mysqlEnum,
  serial,
  varchar,
  text,
  timestamp,
  // bigint,
} from "drizzle-orm/mysql-core";

export const users = mysqlTable("users", {
  id: serial("id").primaryKey(),
  unionId: varchar("unionId", { length: 255 }).notNull().unique(),
  name: varchar("name", { length: 255 }),
  email: varchar("email", { length: 320 }),
  avatar: text("avatar"),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt")
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date()),
  lastSignInAt: timestamp("lastSignInAt").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

export const borrowers = mysqlTable("borrowers", {
  id: serial("id").primaryKey(),
  userId: varchar("userId", { length: 64 }).notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  phone: varchar("phone", { length: 32 }).notNull(),
  idNumber: varchar("idNumber", { length: 64 }),
  address: varchar("address", { length: 255 }),
  avatar: text("avatar"),
  rating: mysqlEnum("rating", ["trusted", "average", "late"]).default("average").notNull(),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const loans = mysqlTable("loans", {
  id: serial("id").primaryKey(),
  userId: varchar("userId", { length: 64 }).notNull(),
  borrowerId: varchar("borrowerId", { length: 64 }).notNull(),
  borrowerName: varchar("borrowerName", { length: 255 }).notNull(),
  productName: varchar("productName", { length: 255 }).notNull(),
  amount: serial("amount").notNull(),
  monthlyPayment: serial("monthlyPayment").notNull(),
  lastPayment: serial("lastPayment").notNull(),
  monthsTotal: serial("monthsTotal").notNull(),
  monthsPaid: serial("monthsPaid").default(0).notNull(),
  startDate: varchar("startDate", { length: 32 }).notNull(),
  nextDueDate: varchar("nextDueDate", { length: 128 }).notNull(),
  dueDay: serial("dueDay").default(1).notNull(),
  interestRate: serial("interestRate").default(0).notNull(),
  status: mysqlEnum("status", ["active", "overdue", "paid"]).default("active").notNull(),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const payments = mysqlTable("payments", {
  id: serial("id").primaryKey(),
  userId: varchar("userId", { length: 64 }).notNull(),
  loanId: varchar("loanId", { length: 64 }).notNull(),
  borrowerId: varchar("borrowerId", { length: 64 }).notNull(),
  borrowerName: varchar("borrowerName", { length: 255 }).notNull(),
  amount: serial("amount").notNull(),
  method: mysqlEnum("method", ["cash", "transfer", "bank"]).default("cash").notNull(),
  date: varchar("date", { length: 32 }).notNull(),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Borrower = typeof borrowers.$inferSelect;
export type Loan = typeof loans.$inferSelect;
export type Payment = typeof payments.$inferSelect;
