import { auth, defineMcp } from "@lovable.dev/mcp-js";
import getMyProfile from "./tools/get-my-profile";
import redeemPromoCode from "./tools/redeem-promo-code";

// The OAuth issuer MUST be the direct Supabase host (not the .lovable.cloud proxy).
// VITE_SUPABASE_PROJECT_ID is inlined by Vite at build time; the fallback keeps the
// issuer well-formed during the throwaway manifest-extract eval.
const projectRef = import.meta.env.VITE_SUPABASE_PROJECT_ID ?? "project-ref-unset";

export default defineMcp({
  name: "craft-business-master-mcp",
  title: "Craft Business Master",
  version: "0.1.0",
  instructions:
    "Tools for the signed-in user's Craft Business Master account. Use `get_my_profile` to read the user's plan and profile, and `redeem_promo_code` to apply a promo code (e.g. lifetime Premium).",
  auth: auth.oauth.issuer({
    issuer: `https://${projectRef}.supabase.co/auth/v1`,
    acceptedAudiences: "authenticated",
  }),
  tools: [getMyProfile, redeemPromoCode],
});