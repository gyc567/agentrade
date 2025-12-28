# Backend API Specification for Crossmint Integration

**Document Version**: 1.0
**Date**: 2025-12-28
**Status**: 📋 Ready for Implementation

---

## 📋 Overview

This document specifies the backend API endpoints needed to integrate Crossmint payment system for credit purchases.

### Architecture

```
Frontend (React)
    ↓ HTTP POST
Backend API (Go)
    ↓ HTTPS POST (with Server API Key)
Crossmint API
    ↓ Response
Backend API
    ↓ Response
Frontend (displays checkout)
```

### ⚠️ Critical: Event Handling Architecture

**IMPORTANT**: When using existing `orderId` with Crossmint SDK, frontend event callbacks are **NOT supported** by the SDK.

**Payment confirmation flow**:
1. User completes payment in Crossmint iframe
2. Crossmint sends webhook to backend: `POST /api/webhooks/crossmint`
3. Backend verifies webhook signature and updates order status
4. Backend adds credits to user account
5. Frontend polls backend API or receives WebSocket notification to update UI

**Why webhooks are required**:
- Frontend `CrossmintEmbeddedCheckout` component with `orderId` prop does NOT support `onEvent` callbacks
- This is a Crossmint SDK design limitation (see SDK types: `CrossmintEmbeddedCheckoutV3ExistingOrderProps`)
- Webhooks are the **only reliable way** to confirm payment for existing orders
- Webhooks are also more secure (server-side verification)

---

## 🔑 Required Credentials

### Crossmint API Keys

You need **TWO** types of API keys:

1. **Client-side API Key** (already have ✅)
   - Format: `ck_staging_...` or `ck_production_...`
   - Used by: Frontend (browser)
   - Security: Public (can be exposed)
   - Current: Already configured in `.env.local`

2. **Server-side API Key** (need to obtain ❌)
   - Format: `sk_staging_...` or `sk_production_...`
   - Used by: Backend (Go server)
   - Security: SECRET (never expose to frontend)
   - How to get:
     1. Visit https://staging.crossmint.com/console (for staging)
     2. Navigate to `Developers` → `API Keys`
     3. Click `Create new key` in **Server-side keys** section
     4. Select scopes: `orders.create`, `orders.read`, `orders.update`
     5. Copy the key (shows only once!)

---

## 📡 API Endpoint Specification

### Endpoint 1: Create Crossmint Checkout Order

Creates a checkout order with Crossmint and returns order ID for frontend to display.

#### Request

```http
POST /api/payments/crossmint/create-order
Content-Type: application/json
Authorization: Bearer <user-jwt-token>
```

**Request Body**:
```json
{
  "packageId": "starter" | "pro" | "vip"
}
```

**Field Validation**:
- `packageId`: Required, must be one of: "starter", "pro", "vip"

#### Response

**Success (200 OK)**:
```json
{
  "success": true,
  "orderId": "order_abc123...",
  "clientSecret": "secret_xyz789...",
  "amount": 10.00,
  "currency": "USDT",
  "credits": 500,
  "expiresAt": "2025-12-28T14:30:00Z"
}
```

**Error Responses**:

```json
// 400 Bad Request - Invalid package
{
  "success": false,
  "error": "Invalid package ID",
  "code": "INVALID_PACKAGE"
}

// 401 Unauthorized - No auth token
{
  "success": false,
  "error": "Authentication required",
  "code": "UNAUTHORIZED"
}

// 500 Internal Server Error - Crossmint API failed
{
  "success": false,
  "error": "Failed to create checkout order",
  "code": "CROSSMINT_ERROR",
  "details": "Crossmint API returned: ..."
}
```

#### Implementation Guide (Go)

```go
package handlers

import (
    "bytes"
    "encoding/json"
    "fmt"
    "net/http"
    "os"
)

type CreateOrderRequest struct {
    PackageID string `json:"packageId" binding:"required"`
}

type CreateOrderResponse struct {
    Success      bool    `json:"success"`
    OrderID      string  `json:"orderId,omitempty"`
    ClientSecret string  `json:"clientSecret,omitempty"`
    Amount       float64 `json:"amount,omitempty"`
    Currency     string  `json:"currency,omitempty"`
    Credits      int     `json:"credits,omitempty"`
    ExpiresAt    string  `json:"expiresAt,omitempty"`
    Error        string  `json:"error,omitempty"`
    Code         string  `json:"code,omitempty"`
}

// Package definitions
var packages = map[string]struct {
    Amount  float64
    Credits int
}{
    "starter": {Amount: 10.00, Credits: 500},
    "pro":     {Amount: 50.00, Credits: 3300},
    "vip":     {Amount: 100.00, Credits: 9600},
}

func CreateCrossmintOrder(c *gin.Context) {
    var req CreateOrderRequest
    if err := c.ShouldBindJSON(&req); err != nil {
        c.JSON(400, CreateOrderResponse{
            Success: false,
            Error:   "Invalid request",
            Code:    "INVALID_REQUEST",
        })
        return
    }

    // Validate package
    pkg, exists := packages[req.PackageID]
    if !exists {
        c.JSON(400, CreateOrderResponse{
            Success: false,
            Error:   "Invalid package ID",
            Code:    "INVALID_PACKAGE",
        })
        return
    }

    // Get Crossmint Server API Key from environment
    serverKey := os.Getenv("CROSSMINT_SERVER_API_KEY")
    if serverKey == "" {
        c.JSON(500, CreateOrderResponse{
            Success: false,
            Error:   "Payment system not configured",
            Code:    "SYSTEM_ERROR",
        })
        return
    }

    // Prepare Crossmint API request
    crossmintReq := map[string]interface{}{
        "payment": map[string]interface{}{
            "currency": "USDT",
            "amount":   fmt.Sprintf("%.2f", pkg.Amount),
            "method":   "crypto",
        },
        "locale": "en-US",
        "metadata": map[string]interface{}{
            "packageId": req.PackageID,
            "credits":   pkg.Credits,
            "userId":    c.GetString("userId"), // From JWT
        },
    }

    jsonData, _ := json.Marshal(crossmintReq)

    // Call Crossmint API
    httpReq, _ := http.NewRequest(
        "POST",
        "https://api.crossmint.com/api/v1-alpha2/orders",
        bytes.NewBuffer(jsonData),
    )
    httpReq.Header.Set("Content-Type", "application/json")
    httpReq.Header.Set("X-API-KEY", serverKey)

    client := &http.Client{}
    resp, err := client.Do(httpReq)
    if err != nil {
        c.JSON(500, CreateOrderResponse{
            Success: false,
            Error:   "Failed to create order",
            Code:    "CROSSMINT_ERROR",
        })
        return
    }
    defer resp.Body.Close()

    var crossmintResp map[string]interface{}
    json.NewDecoder(resp.Body).Decode(&crossmintResp)

    if resp.StatusCode != 200 && resp.StatusCode != 201 {
        c.JSON(500, CreateOrderResponse{
            Success: false,
            Error:   "Crossmint API error",
            Code:    "CROSSMINT_ERROR",
        })
        return
    }

    // Extract order ID and client secret
    orderID := crossmintResp["orderId"].(string)
    clientSecret := crossmintResp["clientSecret"].(string)

    // Save order to database (for webhook verification)
    // TODO: Implement database storage

    // Return success
    c.JSON(200, CreateOrderResponse{
        Success:      true,
        OrderID:      orderID,
        ClientSecret: clientSecret,
        Amount:       pkg.Amount,
        Currency:     "USDT",
        Credits:      pkg.Credits,
        ExpiresAt:    "", // TODO: Calculate expiration
    })
}
```

---

### Endpoint 2: Crossmint Webhook Handler

Receives payment completion notifications from Crossmint.

#### Request (from Crossmint)

```http
POST /api/webhooks/crossmint
Content-Type: application/json
X-Crossmint-Signature: <hmac-signature>
```

**Request Body**:
```json
{
  "type": "order.paid",
  "data": {
    "orderId": "order_abc123...",
    "status": "paid",
    "amount": "10.00",
    "currency": "USDT",
    "metadata": {
      "packageId": "starter",
      "credits": 500,
      "userId": "user_xyz"
    },
    "paidAt": "2025-12-28T13:45:00Z"
  }
}
```

#### Response

```http
200 OK
```

#### Implementation Guide (Go)

```go
func CrossmintWebhook(c *gin.Context) {
    // 1. Verify webhook signature
    signature := c.GetHeader("X-Crossmint-Signature")
    webhookSecret := os.Getenv("CROSSMINT_WEBHOOK_SECRET")

    // TODO: Implement HMAC verification
    // if !verifySignature(signature, c.Request.Body, webhookSecret) {
    //     c.JSON(401, gin.H{"error": "Invalid signature"})
    //     return
    // }

    var webhook map[string]interface{}
    if err := c.ShouldBindJSON(&webhook); err != nil {
        c.JSON(400, gin.H{"error": "Invalid payload"})
        return
    }

    eventType := webhook["type"].(string)
    data := webhook["data"].(map[string]interface{})

    switch eventType {
    case "order.paid":
        // Extract metadata
        metadata := data["metadata"].(map[string]interface{})
        userId := metadata["userId"].(string)
        credits := int(metadata["credits"].(float64))

        // Add credits to user account
        // TODO: Implement credit addition
        // err := addCreditsToUser(userId, credits)

        c.JSON(200, gin.H{"received": true})

    case "order.failed":
        // Handle failed payment
        c.JSON(200, gin.H{"received": true})

    default:
        c.JSON(200, gin.H{"received": true})
    }
}
```

---

### Endpoint 3: Check Order Status

Frontend polling endpoint to check if payment has been completed (since frontend events are not supported).

#### Request

```http
GET /api/payments/orders/{orderId}/status
Authorization: Bearer <user-jwt-token>
```

**Path Parameters**:
- `orderId`: The Crossmint order ID returned from create-order

#### Response

**Success (200 OK)**:
```json
{
  "success": true,
  "orderId": "order_abc123...",
  "status": "pending" | "paid" | "completed" | "failed" | "cancelled",
  "creditsAdded": 500,  // Only present if status is "completed"
  "paidAt": "2025-12-28T13:45:00Z",  // Only present if paid
  "error": null
}
```

**Error Responses**:
```json
// 404 Not Found
{
  "success": false,
  "error": "Order not found",
  "code": "ORDER_NOT_FOUND"
}

// 403 Forbidden
{
  "success": false,
  "error": "Not authorized to view this order",
  "code": "UNAUTHORIZED"
}
```

#### Implementation Guide (Go)

```go
func GetOrderStatus(c *gin.Context) {
    orderId := c.Param("orderId")
    userId := c.GetString("userId") // From JWT

    // Fetch order from database
    var order Order
    // TODO: Implement database query
    // err := db.Where("crossmint_order_id = ? AND user_id = ?", orderId, userId).First(&order).Error

    // Return order status
    c.JSON(200, gin.H{
        "success":      true,
        "orderId":      order.CrossmintOrderID,
        "status":       order.Status,
        "creditsAdded": order.CreditsAdded,
        "paidAt":       order.PaidAt,
        "error":        nil,
    })
}
```

**Frontend Polling Strategy**:
```typescript
// Poll every 3 seconds for up to 5 minutes
const pollOrderStatus = async (orderId: string) => {
  const maxAttempts = 100 // 5 minutes
  let attempts = 0

  while (attempts < maxAttempts) {
    const response = await fetch(`/api/payments/orders/${orderId}/status`, {
      headers: { Authorization: `Bearer ${token}` }
    })
    const data = await response.json()

    if (data.status === "completed") {
      // Payment successful!
      return { success: true, credits: data.creditsAdded }
    } else if (data.status === "failed" || data.status === "cancelled") {
      // Payment failed
      return { success: false, error: data.error }
    }

    // Still pending, wait and retry
    await new Promise(resolve => setTimeout(resolve, 3000))
    attempts++
  }

  // Timeout
  return { success: false, error: "Payment confirmation timeout" }
}
```

---

## 🔧 Environment Variables

Add these to your backend `.env` file:

```bash
# Crossmint Server-side API Key (SECRET - never expose)
CROSSMINT_SERVER_API_KEY=sk_staging_YOUR_KEY_HERE

# Crossmint Webhook Secret (for signature verification)
CROSSMINT_WEBHOOK_SECRET=whsec_YOUR_SECRET_HERE

# Environment (staging or production)
CROSSMINT_ENVIRONMENT=staging
```

---

## 🧪 Testing

### Manual Testing with curl

```bash
# Test create order endpoint
curl -X POST http://localhost:8080/api/payments/crossmint/create-order \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{"packageId": "starter"}'

# Expected response:
# {
#   "success": true,
#   "orderId": "order_...",
#   "clientSecret": "secret_...",
#   "amount": 10.00,
#   "currency": "USDT",
#   "credits": 500
# }
```

### Testing Webhook Locally

Use Crossmint's webhook testing tool or:

```bash
curl -X POST http://localhost:8080/api/webhooks/crossmint \
  -H "Content-Type: application/json" \
  -H "X-Crossmint-Signature: test_signature" \
  -d '{
    "type": "order.paid",
    "data": {
      "orderId": "order_test123",
      "status": "paid",
      "metadata": {
        "userId": "user_123",
        "credits": 500,
        "packageId": "starter"
      }
    }
  }'
```

---

## 📊 Database Schema (Recommended)

```sql
CREATE TABLE payment_orders (
    id SERIAL PRIMARY KEY,
    order_id VARCHAR(255) UNIQUE NOT NULL,
    user_id VARCHAR(255) NOT NULL,
    package_id VARCHAR(50) NOT NULL,
    amount DECIMAL(10, 2) NOT NULL,
    currency VARCHAR(10) NOT NULL,
    credits INTEGER NOT NULL,
    status VARCHAR(50) DEFAULT 'pending',
    crossmint_data JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    paid_at TIMESTAMP,

    INDEX idx_user_id (user_id),
    INDEX idx_order_id (order_id),
    INDEX idx_status (status)
);
```

---

## 🚀 Integration Checklist

### Backend Team

- [ ] Obtain Crossmint Server API Key from Console
- [ ] Add environment variables to `.env`
- [ ] Implement `POST /api/payments/crossmint/create-order`
- [ ] Implement `POST /api/webhooks/crossmint`
- [ ] Set up database table for orders
- [ ] Implement credit addition logic
- [ ] Test with staging environment
- [ ] Configure webhook URL in Crossmint Console
- [ ] Deploy to production

### Crossmint Console Configuration

1. **Create Webhook**:
   - URL: `https://your-api.com/api/webhooks/crossmint`
   - Events: `order.paid`, `order.failed`, `order.cancelled`
   - Copy webhook secret to `.env`

2. **Verify API Keys**:
   - Server key has correct scopes
   - Client key is configured in frontend

---

## 📞 Support & Resources

- **Crossmint API Docs**: https://docs.crossmint.com
- **Crossmint Console**: https://staging.crossmint.com/console
- **Support**: support@crossmint.com

---

## ⚠️ Important Notes

1. **Security**:
   - NEVER expose Server API Key to frontend
   - ALWAYS verify webhook signatures
   - Use HTTPS for all endpoints

2. **Error Handling**:
   - Log all Crossmint API errors
   - Return user-friendly error messages
   - Implement retry logic for transient failures

3. **Testing**:
   - Test with staging keys first
   - Verify webhook signature verification
   - Test all error scenarios

---

**Document Status**: Ready for backend implementation
**Next Step**: Backend team implements API endpoints
**Frontend**: Already prepared and waiting for backend
