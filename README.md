// prisma/schema.prisma

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "mongodb"
}

// ✅ Model User
model User {
  id            String    @id @default(auto()) @map("_id") @db.ObjectId
  email         String    @unique
  password      String
  firstName     String
  lastName      String
  role          String    @default("user") // admin, manager, user
  phone         String?
  profileImage  String?
  isActive      Boolean   @default(true)
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
  
  // Relations
  reviews       Review[]
  bookings      Booking[]
  sites         Site[]    @relation("SiteManager")
}

// ✅ Model Site (Lieu touristique)
model Site {
  id            String    @id @default(auto()) @map("_id") @db.ObjectId
  name          String
  description   String
  location      String
  country       String
  city          String
  latitude      Float?
  longitude     Float?
  image         String?
  images        String[]
  price         Float
  currency      String    @default("USD")
  rating        Float     @default(0)
  maxCapacity   Int
  openHours     String
  tags          String[]
  isActive      Boolean   @default(true)
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt

  // Relations
  managerId     String    @db.ObjectId
  manager       User      @relation("SiteManager", fields: [managerId], references: [id])
  reviews       Review[]
  bookings      Booking[]

  @@index([name, city, country])
}

// ✅ Model Review
model Review {
  id            String    @id @default(auto()) @map("_id") @db.ObjectId
  rating        Int       // 1-5
  comment       String
  status        String    @default("pending") // approved, pending, rejected
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt

  // Relations
  userId        String    @db.ObjectId
  user          User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  siteId        String    @db.ObjectId
  site          Site      @relation(fields: [siteId], references: [id], onDelete: Cascade)

  @@unique([userId, siteId])
  @@index([status, rating])
}

// ✅ Model Booking
model Booking {
  id            String    @id @default(auto()) @map("_id") @db.ObjectId
  status        String    @default("pending") // confirmed, cancelled, completed
  startDate     DateTime
  endDate       DateTime
  numberOfPeople Int
  totalPrice    Float
  notes         String?
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt

  // Relations
  userId        String    @db.ObjectId
  user          User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  siteId        String    @db.ObjectId
  site          Site      @relation(fields: [siteId], references: [id], onDelete: Cascade)

  @@index([status, startDate])
}

// ✅ Model Stats (Dashboard stats)
model Stats {
  id            String    @id @default(auto()) @map("_id") @db.ObjectId
  totalVisitors Int       @default(0)
  yearsOfExp    Int       @default(12)
  totalSites    Int       @default(0)
  avgRating     Float     @default(4.8)
  updatedAt     DateTime  @updatedAt
}
