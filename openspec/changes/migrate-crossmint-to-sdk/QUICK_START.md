# Quick Start Guide - Crossmint SDK Migration

**For**: Backend Team
**Time Needed**: 4-8 hours
**Status**: Ready to implement

---

## 🚀 TL;DR

Frontend is ready. Backend needs to:
1. Get Crossmint Server API Key
2. Implement 2 endpoints
3. Test integration

---

## 📋 Step-by-Step Guide

### Step 1: Get Crossmint Server API Key (15 minutes)

```bash
# 1. Visit Crossmint Console
open https://staging.crossmint.com/console

# 2. Navigate to: Developers → API Keys

# 3. Click "Create new key" in "Server-side keys" section

# 4. Configure:
#    - Name: "Backend API Key"
#    - Scopes:
#      ✓ orders.create
#      ✓ orders.read
#      ✓ orders.update

# 5. Copy the key (format: sk_staging_...)

# 6. Add to backend .env
echo "CROSSMINT_SERVER_API_KEY=sk_staging_YOUR_KEY_HERE" >> .env
```

---

### Step 2: Implement Create Order Endpoint (2-3 hours)

**File**: `api/handlers/payment_handler.go` (or similar)

**Endpoint**: `POST /api/payments/crossmint/create-order`

**Code Template**:
```go
func CreateCrossmintOrder(c *gin.Context) {
    // 1. Parse request
    var req struct {
        PackageID string `json:"packageId"`
    }
    c.ShouldBindJSON(&req)

    // 2. Validate package
    packages := map[string]float64{
        "starter": 10.00,
        "pro": 50.00,
        "vip": 100.00,
    }
    amount, ok := packages[req.PackageID]
    if !ok {
        c.JSON(400, gin.H{"error": "Invalid package"})
        return
    }

    // 3. Call Crossmint API
    serverKey := os.Getenv("CROSSMINT_SERVER_API_KEY")
    resp, err := http.Post(
        "https://api.crossmint.com/api/v1-alpha2/orders",
        "application/json",
        // ... request body
    )

    // 4. Return response
    c.JSON(200, gin.H{
        "success": true,
        "orderId": orderId,
        "clientSecret": clientSecret,
        "amount": amount,
        "currency": "USDT",
        "credits": calculateCredits(req.PackageID),
    })
}
```

**Full Implementation**: See `backend-api-spec.md` (lines 80-170)

---

### Step 3: Implement Webhook Handler (1-2 hours)

**File**: `api/handlers/webhook_handler.go`

**Endpoint**: `POST /api/webhooks/crossmint`

**Code Template**:
```go
func CrossmintWebhook(c *gin.Context) {
    // 1. Verify signature
    signature := c.GetHeader("X-Crossmint-Signature")
    // TODO: Verify HMAC signature

    // 2. Parse webhook
    var webhook map[string]interface{}
    c.ShouldBindJSON(&webhook)

    // 3. Handle event
    switch webhook["type"] {
    case "order.paid":
        // Add credits to user
        addCreditsToUser(...)
    }

    c.JSON(200, gin.H{"received": true})
}
```

**Full Implementation**: See `backend-api-spec.md` (lines 172-220)

---

### Step 4: Configure Webhook in Crossmint Console (10 minutes)

```bash
# 1. Visit Console
open https://staging.crossmint.com/console

# 2. Navigate to: Developers → Webhooks

# 3. Click "Create webhook"

# 4. Configure:
#    - URL: https://your-api.com/api/webhooks/crossmint
#    - Events: order.paid, order.failed, order.cancelled

# 5. Copy webhook secret
echo "CROSSMINT_WEBHOOK_SECRET=whsec_YOUR_SECRET" >> .env
```

---

### Step 5: Test (30 minutes)

**Test 1: Create Order**
```bash
curl -X POST http://localhost:8080/api/payments/crossmint/create-order \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"packageId": "starter"}'

# Expected response:
# {
#   "success": true,
#   "orderId": "order_abc123",
#   "clientSecret": "secret_xyz789",
#   "amount": 10.00,
#   "currency": "USDT",
#   "credits": 500
# }
```

**Test 2: Integration Test**
```bash
# 1. Start both frontend and backend
cd web && npm run dev  # Terminal 1
cd api && go run main.go  # Terminal 2

# 2. Open browser: http://localhost:5173
# 3. Login
# 4. Click "充值积分"
# 5. Select "初级套餐"
# 6. Click "继续支付"
# 7. Verify Crossmint checkout displays
# 8. Complete payment (use test card)
# 9. Verify credits added
```

---

## 📚 Reference Documents

| Document | Purpose | Location |
|----------|---------|----------|
| **Backend API Spec** | Complete API documentation | `backend-api-spec.md` |
| **Frontend Guide** | Frontend usage guide | `frontend-integration-guide.md` |
| **Summary** | Overall summary | `../../CROSSMINT_SDK_MIGRATION_SUMMARY.md` |

---

## ⚠️ Common Issues & Solutions

### Issue 1: "API Key not configured"
**Solution**: Check `.env` file has `CROSSMINT_SERVER_API_KEY`

### Issue 2: Crossmint API returns 401
**Solution**: Verify API key has correct scopes (`orders.create`)

### Issue 3: Webhook not receiving events
**Solution**: Check webhook URL is publicly accessible (use ngrok for local testing)

### Issue 4: Frontend shows "Backend returned 500"
**Solution**: Check backend logs for error details

---

## 🎯 Success Criteria

- [ ] Backend `/create-order` endpoint returns orderId
- [ ] Frontend displays Crossmint checkout
- [ ] Payment completes successfully
- [ ] Webhook receives `order.paid` event
- [ ] Credits added to user account
- [ ] No errors in logs

---

## 💬 Need Help?

- **Backend API Spec**: Read `backend-api-spec.md` for complete details
- **Frontend Code**: Check `src/features/payment/services/`
- **Crossmint Docs**: https://docs.crossmint.com
- **Support**: support@crossmint.com

---

**Estimated Time**: 4-8 hours total
**Difficulty**: Medium
**Status**: Ready to start
