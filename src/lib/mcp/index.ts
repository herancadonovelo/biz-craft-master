import { auth, defineMcp } from "@lovable.dev/mcp-js";
import getMyProfile from "./tools/get-my-profile";
import redeemPromoCode from "./tools/redeem-promo-code";
import listSuppliers from "./tools/list-suppliers";
import createSupplierDiscountCode from "./tools/create-supplier-discount-code";
import validateSupplierDiscountCode from "./tools/validate-supplier-discount-code";
import listSupplierDiscountCodes from "./tools/list-supplier-discount-codes";
import listOrders from "./tools/list-orders";
import getOrder from "./tools/get-order";
import getMaterialPrices from "./tools/get-material-prices";
import updateMaterialPrice from "./tools/update-material-price";
import getStock from "./tools/get-stock";
import createTodo from "./tools/create-todo";
import listTodos from "./tools/list-todos";
import updateTodo from "./tools/update-todo";
import completeTodo from "./tools/complete-todo";

// The OAuth issuer MUST be the direct Supabase host (not the .lovable.cloud proxy).
// VITE_SUPABASE_PROJECT_ID is inlined by Vite at build time; the fallback keeps the
// issuer well-formed during the throwaway manifest-extract eval.
const projectRef = import.meta.env.VITE_SUPABASE_PROJECT_ID ?? "project-ref-unset";

export default defineMcp({
  name: "craft-business-master-mcp",
  title: "Craft Business Master",
  version: "0.2.0",
  instructions:
    "Tools for the signed-in user's Craft Business Master account. Manage suppliers and their discount codes, inspect orders and material usage, look up material prices and stock availability, and create/list/update/complete tasks (to-dos).",
  auth: auth.oauth.issuer({
    issuer: `https://${projectRef}.supabase.co/auth/v1`,
    acceptedAudiences: "authenticated",
  }),
  tools: [
    getMyProfile,
    redeemPromoCode,
    listSuppliers,
    createSupplierDiscountCode,
    validateSupplierDiscountCode,
    listSupplierDiscountCodes,
    listOrders,
    getOrder,
    getMaterialPrices,
    updateMaterialPrice,
    getStock,
    createTodo,
    listTodos,
    updateTodo,
    completeTodo,
  ],
});