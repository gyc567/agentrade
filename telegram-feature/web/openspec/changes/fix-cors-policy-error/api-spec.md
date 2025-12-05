# API CORS Configuration Spec Delta

## MODIFIED Requirements

### CORS Middleware Configuration
**Requirement:** The API server must allow frontend requests from Vercel deployment origins.

#### Scenario: Handle preflight OPTIONS requests
**Given** the backend API receives an OPTIONS preflight request
**When** checking allowed headers
**Then** it should return `Access-Control-Allow-Headers` including:
- `Content-Type` (for JSON requests)
- `Authorization` (for Bearer tokens)
- `Cache-Control` (for caching headers)
- `X-Requested-With` (for AJAX detection)
- `X-Requested-By` (for custom headers)
- `If-Modified-Since` (for conditional requests)
- `Pragma` (for legacy caching)

#### Scenario: Allow frontend from Vercel domain
**Given** the backend API receives requests from `https://web-*.vercel.app`
**When** handling the request
**Then** it should return `Access-Control-Allow-Origin: *`
**And** allow the request to proceed

#### Scenario: Support common HTTP methods
**Given** frontend sends GET, POST, PUT, DELETE, OPTIONS requests
**When** checking allowed methods
**Then** it should return `Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS`
**And** allow these methods to succeed

## Implementation Details

### File: `api/server.go`

**Function:** `corsMiddleware()` (lines 52-64)

**Current Code:**
```go
func corsMiddleware() gin.HandlerFunc {
    return func(c *gin.Context) {
        c.Writer.Header().Set("Access-Control-Allow-Origin", "*")
        c.Writer.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
        c.Writer.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization")

        if c.Request.Method == "OPTIONS" {
            c.AbortWithStatus(http.StatusOK)
            return
        }

        c.Next()
    }
}
```

**Updated Code:**
```go
func corsMiddleware() gin.HandlerFunc {
    return func(c *gin.Context) {
        c.Writer.Header().Set("Access-Control-Allow-Origin", "*")
        c.Writer.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
        c.Writer.Header().Set("Access-Control-Allow-Headers",
            "Content-Type, Authorization, Cache-Control, X-Requested-With, X-Requested-By, If-Modified-Since, Pragma")

        if c.Request.Method == "OPTIONS" {
            c.AbortWithStatus(http.StatusOK)
            return
        }

        c.Next()
    }
}
```

**Change:** Added to `Access-Control-Allow-Headers`:
- `Cache-Control`
- `X-Requested-With`
- `X-Requested-By`
- `If-Modified-Since`
- `Pragma`

## Testing

### Preflight Request Test
```bash
curl -X OPTIONS https://nofx-gyc567.replit.app/api/competition \
  -H "Origin: https://web-pink-omega-40.vercel.app" \
  -H "Access-Control-Request-Method: GET" \
  -H "Access-Control-Request-Headers: cache-control" \
  -v
```

**Expected Response Headers:**
```
Access-Control-Allow-Origin: *
Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS
Access-Control-Allow-Headers: Content-Type, Authorization, Cache-Control, X-Requested-With, X-Requested-By, If-Modified-Since, Pragma
```

### Frontend Integration Test
1. Deploy backend with updated CORS
2. Visit frontend on Vercel
3. Open DevTools → Network tab
4. Refresh page
5. Verify API requests succeed (200 OK)
6. Check Console tab (no CORS errors)

### Browser Console Verification
Expected behavior after fix:
- No CORS policy errors
- API responses return with correct data
- TopTrader displays real values (99.88 USDT)

## Validation

### Post-Fix Criteria
- [ ] OPTIONS preflight includes all required headers
- [ ] GET/POST requests from Vercel succeed
- [ ] Browser console shows no CORS errors
- [ ] Network requests return 200 OK
- [ ] Frontend displays actual trading data

## Notes

This fix resolves the **immediate blocking issue** preventing frontend from accessing backend data. The CORS policy was preventing the browser from sending requests with `Cache-Control` headers, which the frontend uses for cache control.

**Security Consideration:** Using `*` for `Access-Control-Allow-Origin` is suitable for public APIs. For production with user authentication, consider restricting to specific origins.
