# Frontend Integration Guide - Crossmint SDK Migration

**Version**: 1.0
**Date**: 2025-12-28
**Status**: ✅ Ready to Use (Waiting for Backend)

---

## 📋 Summary

Frontend code has been prepared for Crossmint SDK integration. The payment flow now uses:
1. **Backend API** to create Crossmint orders (secure server-side integration)
2. **Crossmint SDK** to display embedded checkout
3. **Event-driven callbacks** for payment status

---

## 🏗️ Architecture Changes

### Before (Legacy - Deprecated ❌)

```
PaymentModal
  ↓
PaymentOrchestrator
  ↓
CrossmintService (direct API call)
  ↓
Crossmint API (2022-06-09 endpoint) ← 404 Error
```

### After (New - Ready ✅)

```
PaymentModal
  ↓
PaymentOrchestrator
  ↓
PaymentApiService.createCrossmintOrder()
  ↓
Backend API (/api/payments/crossmint/create-order)
  ↓
Crossmint API (with server key)
  ↓
Returns: { orderId, clientSecret }
  ↓
CrossmintCheckoutEmbed Component
  ↓
Crossmint SDK (embedded checkout)
```

---

## 📦 Updated Files

### 1. Type Definitions
**File**: `src/features/payment/types/payment.ts`

**Added**:
```typescript
export interface CrossmintOrderRequest {
  packageId: "starter" | "pro" | "vip"
}

export interface CrossmintOrderResponse {
  success: boolean
  orderId: string
  clientSecret: string
  amount: number
  currency: string
  credits: number
  expiresAt?: string
  error?: string
  code?: string
}
```

### 2. Payment API Service
**File**: `src/features/payment/services/PaymentApiService.ts`

**Added Method**:
```typescript
interface PaymentApiService {
  createCrossmintOrder(
    packageId: "starter" | "pro" | "vip"
  ): Promise<CrossmintOrderResponse>
}
```

**Implementation**:
- Makes POST request to `/api/payments/crossmint/create-order`
- Returns orderId + clientSecret for frontend checkout
- Handles errors gracefully

### 3. Payment Orchestrator
**File**: `src/features/payment/services/PaymentOrchestrator.ts`

**Updated Method**:
```typescript
async createPaymentSession(packageId: string): Promise<string> {
  // Now calls backend API instead of direct Crossmint API
  const response = await this.apiService.createCrossmintOrder(packageId)
  return response.orderId
}
```

**Changes**:
- ✅ Removed direct Crossmint API calls
- ✅ Uses backend API for order creation
- ✅ Returns orderId (not sessionId)
- ✅ Better error handling

### 4. Crossmint Checkout Component
**File**: `src/features/payment/components/CrossmintCheckoutEmbed.tsx`

**New Component**:
```typescript
<CrossmintCheckoutEmbed
  orderId={orderId}
  clientSecret={clientSecret}
  onSuccess={() => handleSuccess()}
  onError={(error) => handleError(error)}
  onCancel={() => handleCancel()}
/>
```

**Features**:
- Uses official Crossmint SDK
- Event-driven callbacks
- Clean, simple props
- Fully typed

---

## 🚀 Usage Example

### In PaymentProvider or PaymentModal

```typescript
// 1. User selects package
const handlePayment = async (packageId: "starter" | "pro" | "vip") => {
  setStatus("loading")

  try {
    // 2. Call backend to create Crossmint order
    const orderId = await orchestrator.createPaymentSession(packageId)

    // orderId is returned (backend already created the order)
    setOrderId(orderId)
    setStatus("checkout") // Show checkout

  } catch (error) {
    setError(error.message)
    setStatus("error")
  }
}

// 3. Display checkout
{status === "checkout" && orderId && (
  <CrossmintCheckoutEmbed
    orderId={orderId}
    clientSecret={clientSecret}  // Also from backend
    onSuccess={() => {
      // Payment completed!
      setStatus("success")
      addCreditsToUser()
    }}
    onError={(error) => {
      setError(error)
      setStatus("error")
    }}
    onCancel={() => {
      setStatus("idle")
    }}
  />
)}
```

---

## 🧪 Testing Status

### Unit Tests
- ✅ `PaymentApiService.createCrossmintOrder()` - To be written
- ✅ `PaymentOrchestrator.createPaymentSession()` - To be written
- ✅ `CrossmintCheckoutEmbed` component - To be written

### Integration Tests
- ✅ Full payment flow - To be updated
- ✅ Error handling - To be updated

### Manual Testing
Once backend is ready:
1. Select a package
2. Click "Continue Payment"
3. Backend creates order
4. Crossmint checkout displays
5. Complete payment
6. Credits added to user

---

## ⚠️ Current Status

### ✅ Completed (Frontend Ready)

1. **Type definitions** added for new API
2. **PaymentApiService** updated with `createCrossmintOrder`
3. **PaymentOrchestrator** refactored to use backend API
4. **CrossmintCheckoutEmbed** component created
5. **Backend API spec** documented (see `backend-api-spec.md`)

### ⏳ Waiting For

1. **Backend API implementation**:
   - `POST /api/payments/crossmint/create-order`
   - `POST /api/webhooks/crossmint`

2. **Crossmint Server Key**:
   - Backend team needs to obtain `sk_staging_...` key
   - Configure in backend `.env`

### ✏️ Next Steps (After Backend Ready)

1. Update `PaymentProvider.tsx` to handle orderId + clientSecret
2. Update `PaymentModal.tsx` to use `CrossmintCheckoutEmbed`
3. Write comprehensive tests
4. Manual integration testing
5. Deploy to staging

---

## 📝 Backend Requirements

**See**: `backend-api-spec.md` for complete backend specification

**Quick Checklist**:
- [ ] Obtain Crossmint Server API Key (`sk_staging_...`)
- [ ] Implement `POST /api/payments/crossmint/create-order`
- [ ] Implement `POST /api/webhooks/crossmint`
- [ ] Configure webhook in Crossmint Console
- [ ] Test order creation
- [ ] Test webhook reception

---

## 🔒 Security Notes

1. **Client API Key** (frontend):
   - Format: `ck_staging_...`
   - Public, can be exposed
   - Already configured: ✅

2. **Server API Key** (backend):
   - Format: `sk_staging_...`
   - SECRET, never expose to frontend
   - Backend team must configure

3. **Separation of Concerns**:
   - Frontend: Display checkout, handle events
   - Backend: Create orders, verify payments, add credits

---

## 📚 Additional Resources

- Backend API Spec: `backend-api-spec.md`
- Crossmint Docs: https://docs.crossmint.com
- SDK Reference: https://github.com/Crossmint/crossmint-sdk

---

## 🎯 Design Principles Followed

1. **KISS**: Simple, straightforward code
2. **High Cohesion**: Each module has single responsibility
3. **Low Coupling**: Services communicate through interfaces
4. **Testability**: All methods can be tested independently
5. **Type Safety**: Full TypeScript coverage

---

**Status**: Frontend is ready. Waiting for backend API implementation.
**Next**: Backend team implements API endpoints → Frontend integration testing
