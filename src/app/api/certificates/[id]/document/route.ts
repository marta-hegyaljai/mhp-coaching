import {NextResponse} from "next/server";

import {readSessionUser} from "@/features/auth/session";
import {authorizeCertificateDownload} from "@/features/certificates/service";
import {CERTIFICATE_PDF_CONTENT_TYPE} from "@/features/certificates/constants";

export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  context: {params: Promise<{id: string}>},
) {
  const {id} = await context.params;
  const actor = await readSessionUser().catch(() => null);
  const result = await authorizeCertificateDownload({
    actor,
    certificateId: id,
  });

  if (!result.ok) {
    const message =
      result.code === "unauthenticated"
        ? "Authentication required"
        : result.code === "unavailable"
          ? "Document unavailable"
          : result.status === 403
            ? "Forbidden"
            : "Not found";

    return new NextResponse(message, {
      status: result.status,
      headers: {"Cache-Control": "no-store", "X-Content-Type-Options": "nosniff"},
    });
  }

  const asciiName = result.filename.replace(/[^\x20-\x7E]/g, "_");

  return new NextResponse(new Uint8Array(result.bytes), {
    status: 200,
    headers: {
      "Content-Type": CERTIFICATE_PDF_CONTENT_TYPE,
      "Content-Disposition": `attachment; filename="${asciiName}"`,
      "Content-Length": String(result.bytes.byteLength),
      "Cache-Control": "private, no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
