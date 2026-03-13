import type { MiddlewareHandler } from "hono";
import {
  paymentMiddleware,
  x402ResourceServer,
} from "@x402/hono";
import { HTTPFacilitatorClient } from "@x402/core/server";
import type { RoutesConfig } from "@x402/core/server";
import type { Network } from "@x402/core/types";
import { ExactSvmScheme } from "@x402/svm/exact/server";
import { SOLANA_DEVNET_CAIP2 } from "@x402/svm";

const FACILITATOR_URL =
  (process.env.FACILITATOR_URL || "https://x402.org/facilitator").replace("://x402.org", "://www.x402.org");

const DEFAULT_PRICE =
  process.env.DEFAULT_SKILL_PRICE_USD || "0.01";

const network: Network = SOLANA_DEVNET_CAIP2 as Network;

/**
 * Create a shared x402ResourceServer instance (reused across all requests).
 * The resource server holds scheme registrations; it is stateless with respect
 * to which wallet receives payment.
 */
function createResourceServer(): x402ResourceServer {
  const facilitatorClient = new HTTPFacilitatorClient({
    url: FACILITATOR_URL,
  });
  const server = new x402ResourceServer(facilitatorClient);
  server.register(network, new ExactSvmScheme());
  return server;
}

const sharedResourceServer = createResourceServer();

// Patch: Sol CLI overrides maxTimeoutSeconds (300->60), breaking v2 deepEqual.
// Fallback to lenient matching on core fields only.
const origFind = sharedResourceServer.findMatchingRequirements.bind(sharedResourceServer);
(sharedResourceServer as any).findMatchingRequirements = (
  availableRequirements: any[],
  paymentPayload: any
) => {
  const result = origFind(availableRequirements, paymentPayload);
  if (result) return result;
  if (paymentPayload.x402Version === 2 && paymentPayload.accepted) {
    const accepted = paymentPayload.accepted;
    return availableRequirements.find((req: any) =>
      req.scheme === accepted.scheme &&
      req.network === accepted.network &&
      req.payTo === accepted.payTo &&
      req.amount === accepted.amount &&
      req.asset === accepted.asset
    );
  }
  return undefined;
};

/**
 * Build a per-agent RoutesConfig that directs USDC payments to the agent's
 * own wallet address. The route pattern matches the invoke endpoint.
 *
 * @param payTo   - The agent's Solana wallet address
 * @param price   - USD price string (e.g. "0.01")
 */
function buildRoutesConfig(payTo: string, price: string): RoutesConfig {
  return {
    "POST /*": {
      accepts: {
        scheme: "exact",
        network,
        payTo,
        price,
      },
      description: "ClawNet relay skill invocation",
      mimeType: "application/json",
    },
  };
}

/**
 * Cache of per-wallet middleware instances.
 *
 * `paymentMiddleware` creates an `x402HTTPResourceServer` internally and
 * optionally syncs with the facilitator on first use. Caching avoids
 * reconstructing that on every single request while still allowing
 * different wallets (= different agents) to each have their own config.
 */
const middlewareCache = new Map<string, MiddlewareHandler>();

/**
 * Return an x402 payment-verification middleware whose `payTo` is set to the
 * provided wallet address. Instances are cached per wallet so repeated calls
 * for the same agent are cheap.
 *
 * @param walletAddress - Solana address to receive USDC payment
 * @param priceUsd      - USD price for this invocation (default from env)
 */
export function getX402Middleware(
  walletAddress: string,
  priceUsd: string = DEFAULT_PRICE,
): MiddlewareHandler {
  const cacheKey = `${walletAddress}:${priceUsd}`;
  let mw = middlewareCache.get(cacheKey);
  if (!mw) {
    const routes = buildRoutesConfig(walletAddress, priceUsd);
    mw = paymentMiddleware(
      routes,
      sharedResourceServer,
      undefined, // paywallConfig
      undefined, // paywall provider
      true,      // syncFacilitatorOnStart
    );
    middlewareCache.set(cacheKey, mw);
  }
  return mw;
}
