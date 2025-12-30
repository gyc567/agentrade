// Package payment Crossmint支付HTTP处理器
package payment

import (
        "io"
        "log"
        "net/http"
        "nofx/config"
        "nofx/service/payment"
        "strconv"

        "github.com/gin-gonic/gin"
)

// Handler 支付处理器
type Handler struct {
        service payment.Service
}

// NewHandler 创建支付处理器
func NewHandler(service payment.Service) *Handler {
        return &Handler{
                service: service,
        }
}

// CreateOrderRequest 创建订单请求
type CreateOrderRequest struct {
        PackageID string `json:"packageId" binding:"required"`
}

// CreateOrderResponse 创建订单响应
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
        Details      string  `json:"details,omitempty"`
}

// GetOrderResponse 查询订单响应
type GetOrderResponse struct {
        Success bool                `json:"success"`
        Order   *config.PaymentOrder `json:"order,omitempty"`
        Error   string              `json:"error,omitempty"`
        Code    string              `json:"code,omitempty"`
}

// GetOrdersResponse 查询订单列表响应
type GetOrdersResponse struct {
        Success bool                   `json:"success"`
        Orders  []*config.PaymentOrder `json:"orders,omitempty"`
        Total   int                    `json:"total"`
        Page    int                    `json:"page"`
        Limit   int                    `json:"limit"`
        Error   string                 `json:"error,omitempty"`
        Code    string                 `json:"code,omitempty"`
}

// ConfirmPaymentRequest 确认支付请求
type ConfirmPaymentRequest struct {
        OrderID string `json:"orderId" binding:"required"`
}

// ConfirmPaymentResponse 确认支付响应
type ConfirmPaymentResponse struct {
        Success      bool   `json:"success"`
        Status       string `json:"status"`
        CreditsAdded int    `json:"creditsAdded,omitempty"`
        Message      string `json:"message,omitempty"`
        Error        string `json:"error,omitempty"`
        Code         string `json:"code,omitempty"`
}

// CreateOrder 创建支付订单并调用Crossmint API
func (h *Handler) CreateOrder(c *gin.Context) {
        log.Printf("📦 [CreateOrder] 收到创建订单请求")

        // 获取认证用户ID
        userID, exists := c.Get("user_id")
        if !exists {
                log.Printf("❌ [CreateOrder] 认证失败: user_id不存在")
                c.JSON(http.StatusUnauthorized, CreateOrderResponse{
                        Success: false,
                        Error:   "认证失败",
                        Code:    "UNAUTHORIZED",
                })
                return
        }
        log.Printf("📦 [CreateOrder] 用户ID: %s", userID.(string))

        // 解析请求
        var req CreateOrderRequest
        if err := c.ShouldBindJSON(&req); err != nil {
                log.Printf("❌ [CreateOrder] 请求参数解析失败: %v", err)
                c.JSON(http.StatusBadRequest, CreateOrderResponse{
                        Success: false,
                        Error:   "请求参数错误",
                        Code:    "INVALID_REQUEST",
                        Details: err.Error(),
                })
                return
        }
        log.Printf("📦 [CreateOrder] 请求套餐ID: %s", req.PackageID)

        // 创建支付订单
        order, err := h.service.CreatePaymentOrder(c.Request.Context(), userID.(string), req.PackageID)
        if err != nil {
                log.Printf("❌ [CreateOrder] 创建支付订单失败 (userID=%s, packageID=%s): %v", userID.(string), req.PackageID, err)
                c.JSON(http.StatusBadRequest, CreateOrderResponse{
                        Success: false,
                        Error:   "创建订单失败",
                        Code:    "ORDER_CREATION_FAILED",
                        Details: err.Error(),
                })
                return
        }
        log.Printf("✅ [CreateOrder] 支付订单创建成功: orderID=%s", order.ID)

        // 调用Crossmint API创建checkout订单
        crossmintOrderID, clientSecret, err := h.service.CreateCrossmintOrder(c.Request.Context(), order)
        if err != nil {
                log.Printf("❌ Crossmint API调用失败: %v", err)
                c.JSON(http.StatusInternalServerError, CreateOrderResponse{
                        Success: false,
                        Error:   "创建支付失败",
                        Code:    "CROSSMINT_ERROR",
                        Details: err.Error(),
                })
                return
        }

        // 返回成功响应
        c.JSON(http.StatusOK, CreateOrderResponse{
                Success:      true,
                OrderID:      crossmintOrderID,
                ClientSecret: clientSecret,
                Amount:       order.Amount,
                Currency:     order.Currency,
                Credits:      order.Credits,
                ExpiresAt:    "", // Crossmint订单默认24小时过期
        })
}

// GetOrder 查询单个订单
func (h *Handler) GetOrder(c *gin.Context) {
        // 获取认证用户ID
        userID, exists := c.Get("user_id")
        if !exists {
                c.JSON(http.StatusUnauthorized, GetOrderResponse{
                        Success: false,
                        Error:   "认证失败",
                        Code:    "UNAUTHORIZED",
                })
                return
        }

        // 获取订单ID
        orderID := c.Param("id")
        if orderID == "" {
                c.JSON(http.StatusBadRequest, GetOrderResponse{
                        Success: false,
                        Error:   "订单ID不能为空",
                        Code:    "INVALID_REQUEST",
                })
                return
        }

        // 查询订单
        order, err := h.service.GetPaymentOrder(c.Request.Context(), orderID)
        if err != nil {
                c.JSON(http.StatusNotFound, GetOrderResponse{
                        Success: false,
                        Error:   "订单不存在",
                        Code:    "ORDER_NOT_FOUND",
                })
                return
        }

        // 验证订单所有权
        if order.UserID != userID.(string) {
                c.JSON(http.StatusForbidden, GetOrderResponse{
                        Success: false,
                        Error:   "无权访问该订单",
                        Code:    "FORBIDDEN",
                })
                return
        }

        // 隐藏敏感信息
        order.CrossmintClientSecret = ""

        c.JSON(http.StatusOK, GetOrderResponse{
                Success: true,
                Order:   order,
        })
}

// GetUserOrders 查询用户订单列表
func (h *Handler) GetUserOrders(c *gin.Context) {
        // 获取认证用户ID
        userID, exists := c.Get("user_id")
        if !exists {
                c.JSON(http.StatusUnauthorized, GetOrdersResponse{
                        Success: false,
                        Error:   "认证失败",
                        Code:    "UNAUTHORIZED",
                })
                return
        }

        // 解析分页参数
        page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
        limit, _ := strconv.Atoi(c.DefaultQuery("limit", "20"))

        // 查询订单列表
        orders, total, err := h.service.GetUserPaymentOrders(c.Request.Context(), userID.(string), page, limit)
        if err != nil {
                log.Printf("❌ 查询订单列表失败: %v", err)
                c.JSON(http.StatusInternalServerError, GetOrdersResponse{
                        Success: false,
                        Error:   "查询订单失败",
                        Code:    "QUERY_FAILED",
                })
                return
        }

        // 隐藏敏感信息
        for _, order := range orders {
                order.CrossmintClientSecret = ""
        }

        c.JSON(http.StatusOK, GetOrdersResponse{
                Success: true,
                Orders:  orders,
                Total:   total,
                Page:    page,
                Limit:   limit,
        })
}

// HandleWebhook 处理Crossmint webhook
func (h *Handler) HandleWebhook(c *gin.Context) {
        // 读取请求体
        body, err := io.ReadAll(c.Request.Body)
        if err != nil {
                log.Printf("❌ 读取webhook请求体失败: %v", err)
                c.JSON(http.StatusBadRequest, gin.H{
                        "success": false,
                        "error":   "Invalid request body",
                })
                return
        }

        // 获取签名
        signature := c.GetHeader("X-Crossmint-Signature")
        if signature == "" {
                signature = c.GetHeader("Crossmint-Signature") // 兼容不同签名头格式
        }

        // 处理webhook
        err = h.service.ProcessWebhook(c.Request.Context(), signature, body)
        if err != nil {
                log.Printf("❌ 处理webhook失败: %v", err)
                c.JSON(http.StatusBadRequest, gin.H{
                        "success": false,
                        "error":   err.Error(),
                })
                return
        }

        // 返回成功（重要：必须返回200，否则Crossmint会重试）
        c.JSON(http.StatusOK, gin.H{
                "success": true,
                "received": true,
        })
}

// ConfirmPayment 确认支付完成
// 前端在支付成功后调用此接口查询订单状态和积分到账情况
func (h *Handler) ConfirmPayment(c *gin.Context) {
        log.Printf("📦 [ConfirmPayment] 收到确认支付请求")

        // 获取认证用户ID
        userID, exists := c.Get("user_id")
        if !exists {
                log.Printf("❌ [ConfirmPayment] 认证失败: user_id不存在")
                c.JSON(http.StatusUnauthorized, ConfirmPaymentResponse{
                        Success: false,
                        Error:   "认证失败",
                        Code:    "UNAUTHORIZED",
                })
                return
        }
        log.Printf("📦 [ConfirmPayment] 用户ID: %s", userID.(string))

        // 解析请求
        var req ConfirmPaymentRequest
        if err := c.ShouldBindJSON(&req); err != nil {
                log.Printf("❌ [ConfirmPayment] 请求参数解析失败: %v", err)
                c.JSON(http.StatusBadRequest, ConfirmPaymentResponse{
                        Success: false,
                        Error:   "订单ID不能为空",
                        Code:    "INVALID_REQUEST",
                })
                return
        }
        log.Printf("📦 [ConfirmPayment] 查询订单: %s", req.OrderID)

        // 根据Crossmint订单ID查询订单
        order, err := h.service.GetPaymentOrderByCrossmintID(c.Request.Context(), req.OrderID)
        if err != nil {
                log.Printf("❌ [ConfirmPayment] 订单不存在: %s, error: %v", req.OrderID, err)
                c.JSON(http.StatusNotFound, ConfirmPaymentResponse{
                        Success: false,
                        Error:   "订单不存在",
                        Code:    "ORDER_NOT_FOUND",
                })
                return
        }

        // 验证订单所有权
        if order.UserID != userID.(string) {
                log.Printf("❌ [ConfirmPayment] 无权访问订单: orderID=%s, orderUserID=%s, requestUserID=%s",
                        req.OrderID, order.UserID, userID.(string))
                c.JSON(http.StatusForbidden, ConfirmPaymentResponse{
                        Success: false,
                        Error:   "无权访问该订单",
                        Code:    "FORBIDDEN",
                })
                return
        }

        // 根据订单状态返回消息
        var message string
        switch order.Status {
        case config.PaymentStatusCompleted:
                message = "支付成功，积分已到账"
        case config.PaymentStatusPending:
                message = "支付处理中，请稍候"
        case config.PaymentStatusProcessing:
                message = "支付确认中，请稍候"
        case config.PaymentStatusFailed:
                message = "支付失败"
        case config.PaymentStatusCancelled:
                message = "订单已取消"
        default:
                message = "未知状态"
        }

        log.Printf("✅ [ConfirmPayment] 订单状态查询成功: orderID=%s, status=%s, credits=%d",
                req.OrderID, order.Status, order.Credits)

        // 返回订单状态和积分信息
        c.JSON(http.StatusOK, ConfirmPaymentResponse{
                Success:      order.Status == config.PaymentStatusCompleted,
                Status:       string(order.Status),
                CreditsAdded: order.Credits,
                Message:      message,
        })
}
