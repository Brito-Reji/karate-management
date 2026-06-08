
import connectDB from "../lib/db.js";
import User from "../models/User.js";

await connectDB();


await User.create({
  name: "Martin",
  email: process.env.ADMIN_EMAIL,
  phone: "1234567890",
  password: process.env.ADMIN_PASSWORD,
  role: "admin",
});