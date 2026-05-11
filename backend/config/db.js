import mongoose from "mongoose";

mongoose.set('strictQuery', false);

export const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI);
    console.log(`Kết nối database thành công: ${conn.connection.host}`);
  } catch (error) {
    console.error(`Đã xảy ra lỗi: ${error.message}`);
    process.exit(1);
  }
}