/**
 * Phase 2 prototype barrel — swap page imports to `@/lib/*` when Phase 1 lands.
 */
export {
  type Account,
  SEED_ACCOUNTS,
  UID_MAP,
  OUR_FEE,
  DEMO_BILL_TOTAL,
  DEMO_TIP,
  DEMO_SPEND,
} from "./accounts";
export { payBill, spend, cashOut, getState, reset } from "./ledger";
