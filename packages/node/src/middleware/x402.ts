import { MiddlewareHandler } from "hono";
import {
  x402ResourceServer,
  x402HTTPResourceServer,
} from "@x402/hono";
import { HTTPFacilitatorClient } from "@x402/core/server";
import type { RoutesConfig } from "@x402/core/server";
import type { Network } from "@x402/core/types";
import { ExactSvmScheme } from "@x402/svm/exact/server";
import { SOLANA_DEVNET_CAIP2 } from "@x402/svm";
import { config } from "../config";

function isRelayVerifiedLocalRequest(c: {
  req: { header: (name: string) => string | undefined; raw: Request };
}): boolean {
  if (c.req.header("x-relay-verified") !== "true") return false;
  const host = c.req.header("host") || "";
  return (
    host.startsWith("localhost:") ||
    host.startsWith("127.0.0.1:") ||
    host.startsWith("[::1]:")
  );
}

/**
 * Patch findMatchingRequirements on a resource server instance.
 * Sol CLI overrides maxTimeoutSeconds (server sends 300, client echoes 60),
 * which breaks x402 v2's deepEqual comparison. This fallback matches on
 * the core payment fields (scheme, network, payTo, amount, asset) only.
 */
function patchLenientMatching(resourceServer: x402ResourceServer): void {
  const origFind = resourceServer.findMatchingRequirements.bind(resourceServer);
  (resourceServer as any).findMatchingRequirements = (
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
}

export function createX402Middleware(
  walletAddress: string,
  priceUsd: string = "0.01"
): MiddlewareHandler {
  const network: Network = SOLANA_DEVNET_CAIP2 as Network;
  const facilitatorUrl = config.facilitatorUrl.replace("://x402.org", "://www.x402.org");

  const facilitatorClient = new HTTPFacilitatorClient({ url: facilitatorUrl });
  const resourceServer = new x402ResourceServer(facilitatorClient);
  resourceServer.register(network, new ExactSvmScheme());
  patchLenientMatching(resourceServer);

  const routes: RoutesConfig = {
    "POST /*": {
      accepts: {
        scheme: "exact",
        network,
        payTo: walletAddress,
        price: priceUsd,
      },
      description: "ClawNet skill invocation",
      mimeType: "application/json",
    },
  };

  const httpServer = new x402HTTPResourceServer(resourceServer, routes);
  let initPromise: Promise<void> | null = httpServer.initialize();

  const wrappedMw: MiddlewareHandler = async (c, next) => {
    if (isRelayVerifiedLocalRequest(c)) {
      return next();
    }

    const paymentSig = c.req.header("x-payment") || c.req.header("payment-signature") || "";

    if (!(httpServer as any).requiresPayment({ path: c.req.path, method: c.req.method, paymentHeader: paymentSig })) {
      return next();
    }

    if (initPromise) {
      try {
        await initPromise;
      } catch (err) {
        console.error("[x402] facilitator init failed:", err);
      }
      initPromise = null;
    }

    const context = {
      adapter: {
        getHeader: (name: string) => c.req.header(name),
        getMethod: () => c.req.method,
        getPath: () => c.req.path,
        getUrl: () => c.req.url,
        getAcceptHeader: () => c.req.header("Accept") || "",
        getUserAgent: () => c.req.header("User-Agent") || "",
        getQueryParams: () => c.req.query() as Record<string, string>,
        getQueryParam: (name: string) => c.req.query(name),
        getBody: async () => { try { return await c.req.json(); } catch { return undefined; } },
      },
      path: c.req.path,
      method: c.req.method,
      paymentHeader: paymentSig || undefined,
    };

    const result = await httpServer.processHTTPRequest(context);

    switch (result.type) {
      case "no-payment-required":
        return next();

      case "payment-error": {
        const { response } = result as any;
        Object.entries(response.headers as Record<string, string>).forEach(([key, value]) => {
          c.header(key, value);
        });
        return c.json(response.body || {}, response.status);
      }

      case "payment-verified": {
        const { paymentPayload, paymentRequirements, declaredExtensions } = result as any;
        await next();
        let res = c.res;
        if (res.status >= 400) return;

        const responseBody = Buffer.from(await res.clone().arrayBuffer());
        c.res = undefined as any;
        try {
          const settleResult = await httpServer.processSettlement(
            paymentPayload,
            paymentRequirements,
            declaredExtensions,
            { request: context, responseBody }
          );
          if (!settleResult.success) {
            const sr = settleResult as any;
            const body = sr.response.isHtml ? String(sr.response.body ?? "") : JSON.stringify(sr.response.body ?? {});
            res = new Response(body, { status: sr.response.status, headers: sr.response.headers });
          } else {
            Object.entries((settleResult as any).headers as Record<string, string>).forEach(([key, value]) => {
              res.headers.set(key, value);
            });
          }
        } catch (error) {
          console.error("[x402] settlement error:", error);
          res = new Response("{}", { status: 402 });
        }
        c.res = res;
        return;
      }
    }
  };

  return wrappedMw;
}

export function buildSkillRouteConfig(
  path: string,
  walletAddress: string,
  priceUsd: string
): RoutesConfig {
  const network: Network = SOLANA_DEVNET_CAIP2 as Network;
  return {
    [`POST ${path}`]: {
      accepts: {
        scheme: "exact",
        network,
        payTo: walletAddress,
        price: priceUsd,
      },
      description: "ClawNet skill invocation",
      mimeType: "application/json",
    },
  };
}
