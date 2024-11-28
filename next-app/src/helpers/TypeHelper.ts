import axios from "axios";

export interface Pagination {
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

export interface PG {
  id: string;
  name: string;
  city: string;
  gender: string;
  bhk: number;
  rent: number;
  address: string;
  images: string[] | null;
  capacity: number;
  capacityCount: number;
  description: string;
  rentPerMonth: Float32Array;
  coordinates: string;
  createdAt: Date;
  owner: {
    id: string;
    username: string;
    email: string;
    phoneNumber: number;
  };
}

export interface FetchPGsResponse {
  success: boolean;
  data: PG[];
  pagination: Pagination;
  error?: string;
}

export const fetchPGs = async (params: {
  city: string;
  gender?: string;
  bhk?: string;
  minRent?: string;
  maxRent?: string;
  page: number;
  limit: number;
}): Promise<FetchPGsResponse> => {
  const response = await axios.get<FetchPGsResponse>("/api/get-pgs", {
    params,
  });
  return response.data;
};

interface Message {
  id: string;
  text: string;
  sender: {
    id: string;
    username: string;
  };
}

interface User {
  id: string;
  username: string;
}

interface PGData {
  id: string;
  name: string;
  rentPerMonth: number;
  address: string;
  owner: User;
}

export interface ChatData {
  id: string;
  messages: Message[];
  pg: PGData;
}
