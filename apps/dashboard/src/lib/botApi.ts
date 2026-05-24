import axios from "axios";

const botApi = axios.create({
  baseURL: process.env.BOT_API_URL ?? "http://localhost:4000",
  headers: { "x-bot-secret": process.env.BOT_API_SECRET },
  timeout: 10_000,
});

export default botApi;
