import mongoose, { Schema, Document } from "mongoose";

export interface User extends Document {
  username: string;
  email: string;
  password: string | null;
  phoneNumber: string;
  verifyCode: string | null;
  verifyCodeExpireAt: Date | null;
  isVerified: boolean;
  _id: string;
  googleId: string;
}

const UserSchema: Schema<User> = new Schema({
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
    type: String,
  },
  password: {
    type: String,
    default: null,
  },
  verifyCode: {
    type: String,
    default: null,
  },
  googleId: {
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

const UserModel =
  (mongoose.models.User as mongoose.Model<User>) ||
  mongoose.model<User>("User", UserSchema);

export default UserModel;
