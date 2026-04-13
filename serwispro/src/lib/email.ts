import { Resend } from "resend";

export const resend = new Resend(process.env.RESEND_API_KEY);

export const SENDER_EMAIL =
  process.env.SENDER_EMAIL || "serwis@twojadomena.pl";
