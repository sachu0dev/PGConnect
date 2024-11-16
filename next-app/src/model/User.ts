import mongoose, { Schema, Document } from "mongoose";

export interface User extends Document {
  username: string;
  email: string;
  password: string | null;
  verifyCode: string | null;
  verifyCodeExpireAt: Date | null;
  isVerified: boolean;
  isAcceptingMessages: boolean;
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
  isAcceptingMessages: {
    type: Boolean,
    default: true,
  },
});

const UserModel =
  (mongoose.models.User as mongoose.Model<User>) ||
  mongoose.model<User>("User", UserSchema);

export default UserModel;
