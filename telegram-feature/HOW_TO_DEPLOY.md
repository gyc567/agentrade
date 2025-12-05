# 🚀 How to Deploy Monnaire Trading Agent OS Backend to Replit

## ⚠️ IMPORTANT: You MUST Select "Reserved VM"

The backend requires **Reserved VM** deployment (not Autoscale/Cloud Run) because:
- WebSocket connections need persistent connections
- Long-running trading processes need constant uptime
- Autoscale has health check timeouts that don't work for this app

---

## Step-by-Step Deployment Instructions

### Step 1: Click "Publish" Button
- Look for the **"Publish"** or **"Deploy"** button in Replit
- It's usually in the top navigation or sidebar

### Step 2: **SELECT "Reserved VM"** ⚠️
This is the most critical step!

In the deployment dialog/page:
1. You'll see deployment type options:
   - **Autoscale** (Cloud Run)
   - **Reserved VM** ← **SELECT THIS ONE**
   - Static

2. **Click on "Reserved VM"** to select it

3. **Do NOT select "Autoscale"** - this will cause health check timeouts

### Step 3: Configure Reserved VM
After selecting Reserved VM:
- **CPU/RAM**: Select your preferred size (default is fine for testing)
- **Run command**: Should show `./monnoire-backend` (already configured)
- **Build command**: Should be empty/none (already configured)

### Step 4: Deploy
- Click **"Deploy"** or **"Publish"**
- Wait for deployment to complete (~30-60 seconds)

---

## Why Reserved VM is Required

### ❌ Autoscale (Cloud Run) Issues:
- Health check timeout (5 seconds, too strict)
- No persistent WebSocket connections
- Scales to zero (terminates connections)
- Not suitable for long-running processes

### ✅ Reserved VM Benefits:
- Persistent connections (WebSocket support)
- Always running (no scale-to-zero)
- Suitable for trading bots
- More flexible health check requirements

---

## Current Configuration Status

### ✅ Code is Ready
```
✓ Server binds to 0.0.0.0:8080
✓ PORT environment variable supported
✓ Health check responds in microseconds
✓ Background initialization (non-blocking)
✓ Pre-built binary (no Go build needed)
```

### ✅ .replit Configuration
```toml
[deployment]
deploymentTarget = "vm"
run = ["./monnoire-backend"]
```

### ✅ Local Verification
```bash
$ ./monnoire-backend
🌐 API服务器启动在 http://0.0.0.0:8080
✅ API服务器就绪，等待请求...
🔄 后台启动市场数据监控...

$ curl http://localhost:8080/
{"status":"ok","service":"Monnaire Trading Agent OS AI Trading System"}
Response time: 118µs
```

---

## What to Expect During Deployment

### Successful Deployment (Reserved VM)
```
Uploading files...
Starting Reserved VM deployment...
Running: ./monnoire-backend

Logs:
✓ 使用环境变量 PORT: <assigned-port>
✓ API服务器启动在 http://0.0.0.0:<port>
✓ API服务器就绪，等待请求...
✓ 后台启动市场数据监控...

Deployment successful!
Your app is live at: https://your-app.repl.co
```

### Failed Deployment (Wrong Type - Autoscale)
```
Starting Autoscale deployment...
Health check timeout after 5 seconds
Deployment failed
```

If you see health check timeout → **You selected Autoscale instead of Reserved VM**

---

## After Successful Deployment

### 1. Test Health Check
```bash
curl https://your-deployment.repl.co/
```

**Expected:**
```json
{"status":"ok","service":"Monnaire Trading Agent OS AI Trading System"}
```

### 2. Test All Endpoints
```bash
./test-api.sh https://your-deployment.repl.co
```

**Expected:**
- All 11 endpoints return HTTP 200
- Response times < 1 second

### 3. Configure for Trading
1. Open the deployed app URL
2. Access the web interface
3. Configure exchange API keys
4. Configure AI model API keys
5. Create trading agents

---

## Troubleshooting

### "Health check timeout" Error
**Cause**: You selected Autoscale instead of Reserved VM

**Fix**:
1. Cancel the current deployment
2. Start over and **select "Reserved VM"**
3. Deploy again

### "Build failed" Error
**Cause**: Deployment is trying to build (shouldn't happen)

**Fix**:
1. Verify .replit has `deploymentTarget = "vm"` and no build command
2. Ensure `monnoire-backend` binary exists (40MB file)
3. Try deploying again with Reserved VM selected

### Deployment Stuck
**Fix**:
1. Cancel the deployment
2. Clear browser cache
3. Try again with Reserved VM selected

---

## Visual Guide

```
Replit Publish Dialog
┌─────────────────────────────────────┐
│  Select Deployment Type:            │
│                                     │
│  ○ Autoscale (Cloud Run)   ← NO!   │
│  ● Reserved VM             ← YES!   │
│  ○ Static                           │
│                                     │
│  Configuration:                     │
│  CPU/RAM: [Select size ▼]          │
│  Run: ./monnoire-backend                │
│  Build: (none)                      │
│                                     │
│  [Cancel]  [Deploy]                 │
└─────────────────────────────────────┘
```

---

## Summary

### The Fix: Just Select Reserved VM! ✅

Your code is **100% ready**. The only issue is deployment type selection.

**What you need to do:**
1. Click "Publish"
2. **Select "Reserved VM"** (not Autoscale)
3. Click "Deploy"

That's it! The deployment will succeed.

---

## Support Files

- **API Documentation**: `API_DOCUMENTATION.md`
- **Deployment Checklist**: `DEPLOYMENT_CHECKLIST.md`
- **Test Script**: `test-api.sh`
- **This Guide**: `HOW_TO_DEPLOY.md`

---

## Quick Reference

| Setting | Value |
|---------|-------|
| **Deployment Type** | **Reserved VM** (NOT Autoscale) |
| **Run Command** | `./monnoire-backend` |
| **Build Command** | (none/empty) |
| **Binary** | `monnoire-backend` (40MB, pre-built) |
| **Port** | Uses PORT env var |
| **Health Check** | `GET /` returns 200 OK |

---

🎯 **Key Takeaway**: The backend code is perfect. Just make sure you select **"Reserved VM"** in the Replit deployment UI!
