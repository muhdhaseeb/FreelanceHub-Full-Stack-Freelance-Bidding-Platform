/**
 * createAdmin.js
 * Run once to create the admin account.
 * Usage: node scripts/createAdmin.js
 */
require("dotenv").config();
const mongoose = require("mongoose");
const User     = require("../models/User");

const run = async () => {
  await mongoose.connect(process.env.MONGO_URI);
  console.log("Connected to MongoDB");

  const existing = await User.findOne({ email: "admin@freelance.com" });
  if (existing) {
    console.log("Admin already exists:", existing.email);
    process.exit(0);
  }

  const admin = await User.create({
    name:     "Platform Admin",
    email:    "admin@freelance.com",
    password: "Admin@123456",
    role:     "admin",
  });

  console.log("Admin created successfully:");
  console.log("  Email:   ", admin.email);
  console.log("  Password: Admin@123456");
  console.log("  Change the password after first login!");
  process.exit(0);
};

run().catch(err => { console.error(err); process.exit(1); });
