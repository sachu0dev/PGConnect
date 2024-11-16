import mongoose, { Schema, Document } from "mongoose";

export interface PGOwner extends Document {
  username: string;
  email: string;
  phoneNumber: number;
  password: string | null;
  verifyCode: string | null;
  verifyCodeExpireAt: Date | null;
  isVerified: boolean;
  _id: string;
}

const PgOwnerSchema: Schema<PGOwner> = new Schema({
  username: {
    type: String,
    required: [true, "Username is required"],
    trim: true,
    unique: true,
  },
  email: {
    type: String,
    required: [true, "Email is required"],
    unique: true,
    match: [
      /\b[\w\.-]+@[\w\.-]+\.\w{2,4}\b/gi,
      "Please fill a valid email address",
    ],
  },
  phoneNumber: {
    type: Number,
  },
  password: {
    type: String,
    default: null,
  },
  verifyCode: {
    type: String,
    default: null,
  },
  verifyCodeExpireAt: {
    type: Date,
    default: null,
  },
  isVerified: {
    type: Boolean,
    default: false,
  },
});

const PgOwnerModel =
  (mongoose.models.PgOwner as mongoose.Model<PGOwner>) ||
  mongoose.model<PGOwner>("PgOwner", PgOwnerSchema);

export default PgOwnerModel;
