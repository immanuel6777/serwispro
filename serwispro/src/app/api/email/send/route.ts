import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { resend, SENDER_EMAIL } from "@/lib/email";

export async function POST(request: NextRequest) {
  try {
    const { to, subject, body, repairId, type } = await request.json();

    if (!to || !subject || !body || !repairId) {
      return Response.json(
        { error: "Wymagane pola: to, subject, body, repairId" },
        { status: 400 }
      );
    }

    const repair = await prisma.repair.findUnique({
      where: { id: repairId },
    });

    if (!repair) {
      return Response.json(
        { error: "Nie znaleziono naprawy" },
        { status: 404 }
      );
    }

    // Send email via Resend
    const { data, error } = await resend.emails.send({
      from: SENDER_EMAIL,
      to: [to],
      subject,
      html: body.replace(/\n/g, "<br>"),
    });

    if (error) {
      return Response.json(
        { error: `Błąd wysyłki: ${error.message}` },
        { status: 500 }
      );
    }

    // Log the email
    const emailLog = await prisma.emailLog.create({
      data: {
        repairId,
        to,
        subject,
        body,
        type: type || "custom",
      },
    });

    return Response.json({ success: true, emailId: data?.id, log: emailLog });
  } catch (error) {
    console.error("Email send error:", error);
    return Response.json(
      { error: "Błąd serwera przy wysyłce emaila" },
      { status: 500 }
    );
  }
}
