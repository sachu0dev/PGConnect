import mongoose, { Schema, Document } from "mongoose";

export interface PG extends Document {
  name: string;
  contact: string;
  gender: { male: boolean; female: boolean };
  address: string;
  city: string;
  coordinates: {
    long: string;
    lat: string;
  };
  rentPerMonth: number;
  isDummy: boolean;
  isAcceptingGuest: boolean;
  _id: string;
}

const PgSchema: Schema<PG> = new Schema({
  name: {
    type: String,
    required: [true, "pg name is required"],
    trim: true,
  },
  city: {
    type: String,
    trim: true,
  },
  gender: {
    male: {
      type: Boolean,
    },
    female: {
      type: Boolean,
    },
  },
  contact: {
    type: String,
    required: false,
  },
  coordinates: {
    long: {
      type: String,
    },
    lat: {
      type: String,
    },
  },
  address: {
    type: String,
    default: null,
  },
  rentPerMonth: {
    type: Number,
    default: null,
  },
  isDummy: {
    type: Boolean,
    default: false,
  },
  isAcceptingGuest: {
    type: Boolean,
    default: true,
  },
});

const PgModel =
  (mongoose.models.Pg as mongoose.Model<PG>) ||
  mongoose.model<PG>("Pg", PgSchema);

export default PgModel;
