import bcrypt from "bcryptjs";
import connectDB from "../lib/db.js";
import User from "../models/User.js";

await connectDB();

const hashed = await bcrypt.hash("123456", 10);

await User.create({
  name: "Martin",
  email: "admin@gmail.com",
  phoneNo: "1234567890",
  password: hashed,
  role: "admin",
});