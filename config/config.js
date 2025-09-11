import dotenv from "dotenv";
dotenv.config();

export const MONGO_URL = process.env.MONGO_URL;
export const JWT_SECRET = process.env.JWT_SECRET;
export const MISTRAL_API_KEY = process.env.MISTRAL_API_KEY;
export const ADMIN_INVITE_TOKEN = process.env.ADMIN_INVITE_TOKEN;
export const NODE_ENV = process.env.NODE_ENV;
export const CLIENT_URL = process.env.CLIENT_URL || "*";
export const PORT = process.env.PORT || 5000;
