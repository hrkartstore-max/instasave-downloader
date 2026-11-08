import { NextResponse } from "next/server";

export async function POST() {
  // Deliberately fail closed until a vetted provider or owned object-storage adapter is configured.
  const configured = Boolean(process.env.MEDIA_PROVIDER_URL && process.env.MEDIA_PROVIDER_TOKEN);
  return NextResponse.json({
    available: false,
    providerConfigured: configured,
    error: configured
      ? "Provider credentials are present, but no provider-specific download adapter has been implemented."
      : "Downloads from remote sources are disabled until an authorized provider or owned storage adapter is configured.",
  }, { status: 501 });
}
