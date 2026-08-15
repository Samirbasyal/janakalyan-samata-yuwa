import {
  boolean,
  integer,
  pgTable,
  text,
  timestamp,
} from "drizzle-orm/pg-core";

export const user = pgTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("emailVerified").notNull().default(false),
  image: text("image"),
  role: text("role").notNull().default("viewer"),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
  updatedAt: timestamp("updatedAt").notNull().defaultNow(),
});
export const session = pgTable("session", {
  id: text("id").primaryKey(),
  expiresAt: timestamp("expiresAt").notNull(),
  token: text("token").notNull().unique(),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
  updatedAt: timestamp("updatedAt").notNull().defaultNow(),
  ipAddress: text("ipAddress"),
  userAgent: text("userAgent"),
  userId: text("userId").notNull(),
});
export const account = pgTable("account", {
  id: text("id").primaryKey(),
  accountId: text("accountId").notNull(),
  providerId: text("providerId").notNull(),
  userId: text("userId").notNull(),
  accessToken: text("accessToken"),
  refreshToken: text("refreshToken"),
  idToken: text("idToken"),
  accessTokenExpiresAt: timestamp("accessTokenExpiresAt"),
  refreshTokenExpiresAt: timestamp("refreshTokenExpiresAt"),
  scope: text("scope"),
  password: text("password"),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
  updatedAt: timestamp("updatedAt").notNull().defaultNow(),
});
export const verification = pgTable("verification", {
  id: text("id").primaryKey(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: timestamp("expiresAt").notNull(),
  createdAt: timestamp("createdAt").defaultNow(),
  updatedAt: timestamp("updatedAt").defaultNow(),
});
export const members = pgTable("club_members", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  role: text("role").notNull(),
  ward: text("ward"),
  phone: text("phone"),
  email: text("email"),
  status: text("status").notNull().default("active"),
  joinedAt: timestamp("joined_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});
export const content = pgTable("club_content", {
  id: text("id").primaryKey(),
  section: text("section").notNull().unique(),
  title: text("title").notNull(),
  body: text("body").notNull(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
  updatedBy: text("updated_by"),
});
export const donations = pgTable("club_donations", {
  id: text("id").primaryKey(),
  donor: text("donor").notNull(),
  amount: integer("amount").notNull(),
  purpose: text("purpose").notNull(),
  method: text("method").notNull(),
  reference: text("reference"),
  donorPhotoUrl: text("donor_photo_url"),
  donorPhotoPathname: text("donor_photo_pathname"),
  donorPhone: text("donor_phone"),
  donorEmail: text("donor_email"),
  receiptNumber: text("receipt_number"),
  status: text("status").notNull().default("pending"),
  isPublic: boolean("is_public").notNull().default(false),
  receivedAt: timestamp("received_at").notNull().defaultNow(),
  createdBy: text("created_by").notNull(),
});
export const expenses = pgTable("club_expenses", {
  id: text("id").primaryKey(),
  title: text("title").notNull(),
  amount: integer("amount").notNull(),
  purpose: text("purpose").notNull(),
  receiptUrl: text("receipt_url"),
  spentAt: timestamp("spent_at").notNull().defaultNow(),
  createdBy: text("created_by").notNull(),
});
export const applications = pgTable("club_applications", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  phone: text("phone").notNull(),
  email: text("email"),
  message: text("message"),
  status: text("status").notNull().default("pending"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});
export const works = pgTable("club_works", {
  id: text("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  location: text("location"),
  responsible: text("responsible"),
  status: text("status").notNull().default("pending"),
  budget: integer("budget").default(0),
  actualExpense: integer("actual_expense").default(0),
  workDate: timestamp("work_date"),
  photoUrl: text("photo_url"),
  createdBy: text("created_by").notNull(),
});
export const programs = pgTable("club_programs", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  location: text("location"),
  organizedBy: text("organized_by"),
  responsible: text("responsible"),
  budget: integer("budget").default(0),
  actualExpense: integer("actual_expense").default(0),
  status: text("status").notNull().default("upcoming"),
  programDate: timestamp("program_date"),
  photoUrl: text("photo_url"),
  createdBy: text("created_by").notNull(),
});
export const gallery = pgTable("club_gallery", {
  id: text("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description"),
  category: text("category").notNull(),
  imageUrl: text("image_url").notNull(),
  takenAt: timestamp("taken_at"),
  createdBy: text("created_by").notNull(),
});
export const announcements = pgTable("club_announcements", {
  id: text("id").primaryKey(),
  title: text("title").notNull(),
  body: text("body").notNull(),
  category: text("category").notNull(),
  published: boolean("published").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  createdBy: text("created_by").notNull(),
});
export const auditLogs = pgTable("club_audit_logs", {
  id: text("id").primaryKey(),
  action: text("action").notNull(),
  entity: text("entity").notNull(),
  entityId: text("entity_id"),
  adminId: text("admin_id").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});
export const contactMessages = pgTable("club_contact_messages", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull(),
  phone: text("phone"),
  message: text("message").notNull(),
  status: text("status").notNull().default("new"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});
export const membershipProfiles = pgTable("club_membership_profiles", {
  id: text("id").primaryKey(),
  applicationId: text("application_id").notNull(),
  dateOfBirth: text("date_of_birth"),
  gender: text("gender"),
  address: text("address"),
  education: text("education"),
  occupation: text("occupation"),
  skills: text("skills"),
  emergencyContact: text("emergency_contact"),
  profilePhotoUrl: text("profile_photo_url"),
});
export const adminNotes = pgTable("admin_notes", {
  id: text("id").primaryKey(),
  title: text("title").notNull(),
  content: text("content").notNull(),
  visibility: text("visibility").notNull().default("admin"),
  createdBy: text("created_by").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});
export const loans = pgTable("loans", {
  id: text("id").primaryKey(),
  borrower: text("borrower").notNull(),
  amount: integer("amount").notNull(),
  purpose: text("purpose").notNull(),
  loanDate: timestamp("loan_date").notNull().defaultNow(),
  dueDate: timestamp("due_date"),
  notes: text("notes"),
  status: text("status").notNull().default("active"),
  agreementText: text("agreement_text"),
  agreementPhotoPath: text("agreement_photo_path"),
  createdBy: text("created_by").notNull(),
});
export const loanReturns = pgTable("loan_returns", {
  id: text("id").primaryKey(),
  loanId: text("loan_id").notNull(),
  amount: integer("amount").notNull(),
  returnDate: timestamp("return_date").notNull().defaultNow(),
  notes: text("notes"),
  createdBy: text("created_by").notNull(),
});
export const monthlyMemberContributions = pgTable(
  "monthly_member_contributions",
  {
    id: text("id").primaryKey(),
    memberId: text("member_id").notNull(),
    memberName: text("member_name").notNull(),
    collectionMonth: text("collection_month").notNull(),
    amount: integer("amount").notNull().default(20),
    status: text("status").notNull().default("unpaid"),
    paidAt: timestamp("paid_at"),
    paymentMethod: text("payment_method"),
    paymentReference: text("payment_reference"),
    paymentProofUrl: text("payment_proof_url"),
    submittedAt: timestamp("submitted_at"),
    approvedAt: timestamp("approved_at"),
    approvedBy: text("approved_by"),
    collectedBy: text("collected_by"),
    remarks: text("remarks"),
    receiptNumber: text("receipt_number"),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
);
export const committeeRecords = pgTable("committee_records", {
  id: text("id").primaryKey(),
  memberName: text("member_name").notNull(),
  position: text("position").notNull(),
  responsibilities: text("responsibilities"),
  workDetails: text("work_details"),
  workCount: integer("work_count").notNull().default(0),
  achievements: text("achievements"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});
export const memberWorkspaceItems = pgTable("member_workspace_items", {
  id: text("id").primaryKey(),
  memberId: text("member_id").notNull(),
  itemType: text("item_type").notNull(),
  title: text("title").notNull(),
  details: text("details"),
  eventDate: timestamp("event_date"),
  isPublic: boolean("is_public").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});
export const paymentSettings = pgTable("payment_settings", {
  id: text("id").primaryKey(),
  bankQrUrl: text("bank_qr_url"),
  esewaQrUrl: text("esewa_qr_url"),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
  updatedBy: text("updated_by"),
});
export const clubRecords = pgTable("club_records", {
  id: text("id").primaryKey(),
  type: text("type").notNull(), // 'income' | 'expense'
  title: text("title").notNull(),
  amount: integer("amount").notNull().default(0),
  category: text("category"),
  recordDate: timestamp("record_date").notNull().defaultNow(),
  notes: text("notes"),
  createdBy: text("created_by").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});
export const contentVisibility = pgTable("content_visibility", {
  id: text("id").primaryKey(),
  entityType: text("entity_type").notNull(),
  recordId: text("record_id").notNull(),
  visibility: text("visibility").notNull().default("public"),
  updatedBy: text("updated_by"),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});
export const bankAccounts = pgTable("bank_accounts", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  accountHolder: text("account_holder"),
  accountNumber: text("account_number"),
  qrUrl: text("qr_url"),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});
export const notifications = pgTable("club_notifications", {
  id: text("id").primaryKey(),
  type: text("type").notNull(),
  title: text("title").notNull(),
  body: text("body").notNull(),
  entityType: text("entity_type"),
  entityId: text("entity_id"),
  recipientRole: text("recipient_role").notNull().default("admin"),
  isRead: boolean("is_read").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});
export const chatMessages = pgTable("chat_messages", {
  id: text("id").primaryKey(),
  senderId: text("sender_id").notNull(),
  senderName: text("sender_name").notNull(),
  channel: text("channel").notNull().default("group"),
  threadKey: text("thread_key").notNull().default("group"),
  recipientId: text("recipient_id"),
  message: text("message").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});
export const chatReads = pgTable(
  "chat_reads",
  {
    userId: text("user_id").notNull(),
    threadKey: text("thread_key").notNull(),
    lastReadAt: timestamp("last_read_at").notNull().defaultNow(),
  },
  (table) => [table.threadKey, table.userId],
);
export const tableMap = {
  members,
  content,
  expenses,
  applications,
  works,
  programs,
  gallery,
  announcements,
  contactMessages,
  auditLogs,
} as const;
export type TableKey = keyof typeof tableMap;
export { sql } from "drizzle-orm";
