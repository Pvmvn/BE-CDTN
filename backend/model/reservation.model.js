import mongoose from "mongoose";

const reservationSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

    phone: {
      type: String,
      required: true,
    },

    email: {
      type: String,
      required: true,
      trim: true,
    },

    date: {
      type: String,
      required: true,
    },

    time: {
      type: String,
      required: true,
    },

    reservationTime: {
      type: Date,
      required: true,
      index: true,
    },

    people: {
      type: Number,
      default: 1,
      min: 1,
      max: 20,
    },

    tableCount: {
      type: Number,
      required: true,
      min: 1,
      max: 24,
      default: 1,
    },

    tableNumber: {
      type: Number,
      min: 1,
      max: 24,
    },

    note: {
      type: String,
      default: "",
    },

    status: {
      type: String,
      enum: ["PENDING", "COMPLETED", "CANCELLED"],
      default: "PENDING",
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

const Reservation = mongoose.model("Reservation", reservationSchema);
export default Reservation;
