/**
 * Payment Modal Component
 * Main container for payment feature
 * Displays package selection and Crossmint checkout
 */

import { usePaymentContext } from "../contexts/PaymentProvider"
import { usePaymentPackages } from "../hooks/usePaymentPackages"
import { formatPrice, formatCredits } from "../utils/formatPrice"
import type { PaymentPackage } from "../types/payment"

interface PaymentModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess?: (creditsAdded: number) => void
}

export function PaymentModal({
  isOpen,
  onClose,
  onSuccess,
}: PaymentModalProps) {
  const context = usePaymentContext()
  const { packages } = usePaymentPackages()

  if (!isOpen) return null

  const handlePackageSelect = (pkg: PaymentPackage) => {
    context.selectPackage(pkg.id)
  }

  const handlePaymentSuccess = () => {
    if (onSuccess) {
      onSuccess(context.creditsAdded)
    }
    context.resetPayment()
    onClose()
  }

  const handleClose = () => {
    context.resetPayment()
    onClose()
  }

  const apiKey = import.meta.env.VITE_CROSSMINT_CLIENT_API_KEY

  if (!apiKey) {
    return (
      <div
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: "rgba(0,0,0,0.5)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 1000,
        }}
      >
        <div
          style={{
            backgroundColor: "white",
            borderRadius: "8px",
            padding: "24px",
            maxWidth: "400px",
            textAlign: "center",
          }}
        >
          <h2>⚠️ 支付功能暂时不可用</h2>
          <p>请联系管理员配置支付系统</p>
          <button onClick={handleClose}>关闭</button>
        </div>
      </div>
    )
  }

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: "rgba(0,0,0,0.5)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1000,
      }}
    >
      <div
        style={{
          backgroundColor: "white",
          borderRadius: "8px",
          padding: "24px",
          maxWidth: "600px",
          maxHeight: "90vh",
          overflow: "auto",
        }}
      >
        {/* Header */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "24px",
          }}
        >
          <h2 style={{ margin: 0 }}>充值积分</h2>
          <button
            onClick={handleClose}
            style={{
              background: "none",
              border: "none",
              fontSize: "24px",
              cursor: "pointer",
            }}
          >
            ✕
          </button>
        </div>

        {/* Idle State - Package Selection */}
        {context.paymentStatus === "idle" && (
          <div>
            <div style={{ marginBottom: "24px" }}>
              <p style={{ color: "#666", marginBottom: "16px" }}>
                选择你想要购买的积分套餐
              </p>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
                  gap: "12px",
                }}
              >
                {packages.map(pkg => (
                  <button
                    key={pkg.id}
                    onClick={() => handlePackageSelect(pkg)}
                    style={{
                      padding: "16px",
                      border:
                        context.selectedPackage?.id === pkg.id
                          ? "2px solid #007bff"
                          : "1px solid #ddd",
                      borderRadius: "8px",
                      backgroundColor:
                        context.selectedPackage?.id === pkg.id
                          ? "#f0f8ff"
                          : "white",
                      cursor: "pointer",
                      transition: "all 0.2s",
                    }}
                  >
                    <h4 style={{ margin: "0 0 8px 0" }}>{pkg.name}</h4>
                    <p style={{ margin: "4px 0", fontSize: "14px" }}>
                      {formatPrice(pkg.price.amount)}
                    </p>
                    <p style={{ margin: "4px 0", fontSize: "14px", color: "#007bff" }}>
                      {formatCredits(
                        pkg.credits.amount + (pkg.credits.bonusAmount || 0)
                      )}{" "}
                      积分
                    </p>
                    {pkg.badge && (
                      <span
                        style={{
                          display: "inline-block",
                          backgroundColor: "#ffc107",
                          color: "#000",
                          padding: "2px 6px",
                          borderRadius: "4px",
                          fontSize: "12px",
                          marginTop: "4px",
                        }}
                      >
                        {pkg.badge}
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {context.selectedPackage && (
              <button
                onClick={async () => {
                  await context.initiatePayment(context.selectedPackage!.id)
                }}
                style={{
                  width: "100%",
                  padding: "12px 24px",
                  backgroundColor: "#007bff",
                  color: "white",
                  border: "none",
                  borderRadius: "4px",
                  fontSize: "16px",
                  cursor: "pointer",
                  marginTop: "16px",
                }}
              >
                继续支付
              </button>
            )}
          </div>
        )}

        {/* Loading State */}
        {context.paymentStatus === "loading" && (
          <div style={{ textAlign: "center", padding: "24px" }}>
            <div
              style={{
                display: "inline-block",
                width: "40px",
                height: "40px",
                border: "4px solid #f3f3f3",
                borderTop: "4px solid #007bff",
                borderRadius: "50%",
                animation: "spin 1s linear infinite",
              }}
            />
            <p style={{ marginTop: "16px", color: "#666" }}>处理中...</p>
          </div>
        )}

        {/* Success State */}
        {context.paymentStatus === "success" && (
          <div style={{ textAlign: "center", padding: "24px" }}>
            <div style={{ fontSize: "48px", marginBottom: "16px" }}>✓</div>
            <h3 style={{ color: "#28a745", marginBottom: "16px" }}>支付成功！</h3>
            <p style={{ fontSize: "18px", marginBottom: "8px" }}>
              已获得{" "}
              <strong style={{ color: "#007bff" }}>
                {formatCredits(context.creditsAdded)}
              </strong>{" "}
              积分
            </p>
            <button
              onClick={handlePaymentSuccess}
              style={{
                marginTop: "24px",
                padding: "12px 24px",
                backgroundColor: "#28a745",
                color: "white",
                border: "none",
                borderRadius: "4px",
                cursor: "pointer",
                fontSize: "16px",
              }}
            >
              完成
            </button>
          </div>
        )}

        {/* Error State */}
        {context.paymentStatus === "error" && (
          <div style={{ textAlign: "center", padding: "24px" }}>
            <div style={{ fontSize: "48px", marginBottom: "16px", color: "#dc3545" }}>
              ✕
            </div>
            <h3 style={{ color: "#dc3545", marginBottom: "16px" }}>支付失败</h3>
            <p style={{ color: "#666", marginBottom: "16px" }}>
              {context.error || "发生错误，请重试"}
            </p>
            <div style={{ display: "flex", gap: "12px", justifyContent: "center" }}>
              <button
                onClick={() => {
                  context.resetPayment()
                }}
                style={{
                  padding: "12px 24px",
                  backgroundColor: "#ffc107",
                  color: "#000",
                  border: "none",
                  borderRadius: "4px",
                  cursor: "pointer",
                  fontSize: "16px",
                }}
              >
                重试
              </button>
              <button
                onClick={handleClose}
                style={{
                  padding: "12px 24px",
                  backgroundColor: "#6c757d",
                  color: "white",
                  border: "none",
                  borderRadius: "4px",
                  cursor: "pointer",
                  fontSize: "16px",
                }}
              >
                关闭
              </button>
            </div>
          </div>
        )}
      </div>

      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  )
}
