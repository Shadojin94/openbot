import { type ReportTransport, telemetryIO } from "./queue";

// ZETABOT : transport neutralisé. Aucun envoi réseau, aucun endpoint OpenBot.
// La signature est conservée pour ne rien casser côté appelants.
export function openPanelTransport(options: {
  clientId: string;
  clientSecret?: string;
  origin?: string;
  endpoint?: string;
  fetch?: typeof fetch;
}): ReportTransport {
  void options;
  return () => telemetryIO(async () => false);
}
