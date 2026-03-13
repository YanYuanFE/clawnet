import { config } from "../config";
import { isSolCliAvailable } from "./wallet";
import { execFile } from "child_process";
import { promisify } from "util";

const execFileAsync = promisify(execFile);

/**
 * X402Client handles OUTBOUND payments for skill invocations.
 *
 * Primary path: delegates to Sol CLI's `sol fetch` command which natively
 * handles the x402 flow (402 response -> sign USDC payment -> retry).
 *
 * Fallback path: if Sol CLI is not installed, uses the old simulated
 * approach (plain fetch with a fake proof header) so that dev/test still
 * works without a real wallet.
 */
export class X402Client {
  private facilitatorUrl: string;

  constructor(facilitatorUrl?: string) {
    this.facilitatorUrl = facilitatorUrl || config.facilitatorUrl;
  }

  /**
   * Fetch with x402 payment support.
   *
   * Tries Sol CLI first; falls back to simulated payment when unavailable.
   */
  async payAndFetch(
    url: string,
    options: {
      method?: string;
      headers?: Record<string, string>;
      body?: string;
    } = {}
  ): Promise<{ response: Response; paid: boolean; amount: number }> {
    const useSolCli = await isSolCliAvailable();

    if (useSolCli) {
      return this.solCliFetch(url, options);
    }

    console.warn(
      "[x402] Sol CLI not found -- falling back to simulated payment flow"
    );
    return this.simulatedFetch(url, options);
  }

  // --------------------------------------------------------------------------
  // Sol CLI path
  // --------------------------------------------------------------------------

  private async solCliFetch(
    url: string,
    options: {
      method?: string;
      headers?: Record<string, string>;
      body?: string;
    }
  ): Promise<{ response: Response; paid: boolean; amount: number }> {
    const args: string[] = ["fetch", url, "--json"];

    // Method
    const method = (options.method || "GET").toUpperCase();
    if (method !== "GET") {
      args.push("--method", method);
    }

    // Headers
    if (options.headers) {
      for (const [key, value] of Object.entries(options.headers)) {
        args.push("--header", `${key}: ${value}`);
      }
    }

    // Body
    if (options.body) {
      args.push("--body", options.body);
    }

    // Wallet name
    args.push("--wallet", config.solCliWalletName);

    try {
      const { stdout, stderr } = await execFileAsync("sol", args, {
        timeout: 60_000,
      });

      if (stderr) {
        console.log(`[x402] sol fetch stderr: ${stderr}`);
      }

      // Sol CLI --json output: { "ok": true/false, "status": 200, "data": {...}, ... }
      let parsed: any;
      try {
        parsed = JSON.parse(stdout);
      } catch {
        // Non-JSON output — wrap it
        parsed = { ok: true, data: stdout };
      }

      const status = parsed.status ?? (parsed.ok ? 200 : 500);
      const paid = parsed.paid === true;
      const amount = typeof parsed.amount === "number" ? parsed.amount : 0;

      // Build a Response object so the caller interface stays the same
      const responseBody = JSON.stringify(parsed.data ?? parsed);
      const response = new Response(responseBody, {
        status,
        headers: { "Content-Type": "application/json" },
      });

      return { response, paid, amount };
    } catch (err: any) {
      console.error(`[x402] sol fetch failed: ${err.message}`);
      // If Sol CLI itself errors, return a synthetic 500
      const response = new Response(
        JSON.stringify({ error: err.message }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
      return { response, paid: false, amount: 0 };
    }
  }

  // --------------------------------------------------------------------------
  // Simulated fallback (no Sol CLI)
  // --------------------------------------------------------------------------

  private async simulatedFetch(
    url: string,
    options: {
      method?: string;
      headers?: Record<string, string>;
      body?: string;
    }
  ): Promise<{ response: Response; paid: boolean; amount: number }> {
    const fetchOpts: RequestInit = {
      method: options.method || "GET",
      headers: options.headers,
      body: options.body,
    };

    // First attempt
    const res = await fetch(url, fetchOpts);

    if (res.status !== 402) {
      return { response: res, paid: false, amount: 0 };
    }

    // Read payment requirements from 402 response headers
    const paymentHeader = res.headers.get("X-Payment-Required");
    const amount = paymentHeader ? parseInt(paymentHeader, 10) : 0;

    console.log(`[x402] Payment required: ${amount} (simulated)`);
    console.log(`[x402] Facilitator: ${this.facilitatorUrl}`);

    // Retry with simulated proof
    const retryRes = await fetch(url, {
      ...fetchOpts,
      headers: {
        ...options.headers,
        "X-Payment-Proof": "simulated-payment-proof",
        "X-Payment-Amount": amount.toString(),
      },
    });

    return { response: retryRes, paid: true, amount };
  }
}
