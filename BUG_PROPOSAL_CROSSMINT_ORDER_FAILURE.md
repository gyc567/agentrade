# Bug Proposal: Crossmint Payment Order Creation Failure

## 1. Problem Description
User reports a payment failure when attempting to top up credits in the frontend.

**Error Logs:**
```
index-Th5hJOs5.js:338 [CreateCrossmintOrder Error] 创建订单失败
index-Th5hJOs5.js:338 [PaymentOrchestrator] Failed to create order: 创建订单失败
index-Th5hJOs5.js:338 [Payment Error] 支付服务暂时不可用: 创建订单失败
```

**Analysis:**
- The error `支付服务暂时不可用` maps to `CROSSMINT_ERROR` in `errorCodes.ts`.
- The root cause message is `创建订单失败` (Failed to create order).
- The error originates in `PaymentOrchestrator` during the `createPaymentSession` flow.
- The likely source is `CrossmintService.initializeCheckout` throwing an error or a backend API call failing.

## 2. Potential Causes (Hypotheses)

### Hypothesis 1: Missing or Invalid Configuration (High Probability)
The `NEXT_PUBLIC_CROSSMINT_CLIENT_API_KEY` environment variable is missing or invalid in the frontend environment. The `CrossmintService` checks for this key and throws an error if missing. The error message might be localized to "创建订单失败" in the user's specific build/environment.

### Hypothesis 2: Backend Order Creation Failure
The `PaymentOrchestrator` or `CrossmintService` might be attempting to create a backend order (e.g., via `PaymentApiService`) before initializing Crossmint. If the backend returns a 500 error or a specific error message "创建订单失败", this would propagate to the UI.

### Hypothesis 3: Crossmint SDK Initialization Failure
The Crossmint SDK (`@crossmint/client-sdk-react-ui`) might be failing to initialize due to network restrictions, invalid `lineItems` (e.g., invalid price format), or unsupported browser environment.

## 3. Investigation & Elimination Steps

1.  **Verify Configuration:** Check if `NEXT_PUBLIC_CROSSMINT_CLIENT_API_KEY` is set in `.env` or Vercel config.
2.  **Inspect Backend Logs:** Check `api/` or `nofx-backend` logs for any 500 errors corresponding to the timestamp.
3.  **Enhance Frontend Logging:** Add detailed error logging in `PaymentOrchestrator.ts` to capture the full stack trace and original error object, not just the message.

## 4. Proposed Solution

1.  **Improve Error Handling:** Modify `PaymentOrchestrator.ts` to log the full error object.
2.  **Validate Configuration:** Update `CrossmintService.ts` to strictly validate configuration and throw specific, English-language error codes (e.g., `MISSING_API_KEY`) that can be mapped to user-friendly messages.
3.  **Check Backend:** If a backend endpoint exists for order creation, ensure it returns structured error codes.

## 5. Implementation Status

- [x] **Step 1:** Modified `web/src/features/payment/services/PaymentOrchestrator.ts` to log detailed error info.
- [x] **Step 2:** Modified `web/src/features/payment/services/CrossmintService.ts` to ensure clear API key validation and better error messages.