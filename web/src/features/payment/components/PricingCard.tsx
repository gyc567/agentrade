/**
 * PricingCard Component
 *
 * Displays a single credit package with pricing and credits information.
 * Features: responsive design, badge support, bonus credits calculation
 */

import React, { useMemo } from 'react'
import type { PaymentPackage } from '../types/payment'

interface PricingCardProps {
  package: PaymentPackage
  isRecommended?: boolean
  onPurchase?: (packageId: string) => void
  isDisabled?: boolean
}

export const PricingCard: React.FC<PricingCardProps> = ({
  package: pkg,
  isRecommended = false,
  onPurchase,
  isDisabled = false,
}) => {
  // 计算总积分（基础 + 赠送）
  const totalCredits = useMemo(() => {
    return pkg.credits.amount + (pkg.credits.bonusAmount || 0)
  }, [pkg.credits])

  // 计算成本效益（每 USDT 能获得多少积分）
  const creditPerUsd = useMemo(() => {
    return (totalCredits / pkg.price.amount).toFixed(1)
  }, [totalCredits, pkg.price.amount])

  const handlePurchase = () => {
    if (!isDisabled && onPurchase) {
      onPurchase(pkg.id)
    }
  }

  const borderColor = pkg.highlightColor || '#e5e7eb'
  const bgColor = pkg.highlightColor ? `${pkg.highlightColor}15` : '#ffffff'

  return (
    <div
      className="pricing-card"
      style={{
        borderColor: pkg.badge ? borderColor : '#e5e7eb',
        backgroundColor: bgColor,
      }}
    >
      {/* Header: Badge and Title */}
      <div className="pricing-card-header">
        <h3 className="pricing-card-title">{pkg.name}</h3>
        {pkg.badge && (
          <span className="pricing-card-badge" style={{ borderColor }}>
            {pkg.badge}
          </span>
        )}
      </div>

      {/* Description */}
      {pkg.description && (
        <p className="pricing-card-description">{pkg.description}</p>
      )}

      {/* Price Section */}
      <div className="pricing-card-price">
        <span className="price-currency">$</span>
        <span className="price-amount">{pkg.price.amount.toFixed(2)}</span>
        <span className="price-currency-label">USDT</span>
      </div>

      {/* Credits Section */}
      <div className="pricing-card-credits">
        <div className="credit-row">
          <span className="credit-label">Base Credits:</span>
          <span className="credit-value">
            {pkg.credits.amount.toLocaleString()}
          </span>
        </div>

        {pkg.credits.bonusAmount ? (
          <div className="credit-row bonus">
            <span className="credit-label">Bonus Credits:</span>
            <span className="credit-value">
              +{pkg.credits.bonusAmount.toLocaleString()}
            </span>
          </div>
        ) : null}

        <div className="credit-row total">
          <span className="credit-label">Total Credits:</span>
          <span className="credit-value">
            {totalCredits.toLocaleString()}
          </span>
        </div>
      </div>

      {/* Value Proposition */}
      <div className="pricing-card-value">
        <p className="value-text">
          <strong>{creditPerUsd}</strong> credits per USDT
        </p>
      </div>

      {/* CTA Button */}
      <button
        className={`pricing-card-button ${isDisabled ? 'disabled' : ''}`}
        onClick={handlePurchase}
        disabled={isDisabled}
        aria-label={`Purchase ${pkg.name}`}
      >
        {isDisabled ? 'Unavailable' : 'Purchase Now'}
      </button>

      {/* Styles */}
      <style>{`
        .pricing-card {
          border: 2px solid #e5e7eb;
          border-radius: 12px;
          padding: 24px;
          background-color: #ffffff;
          transition: all 0.3s ease;
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .pricing-card:hover:not(.disabled) {
          box-shadow: 0 10px 40px rgba(0, 0, 0, 0.1);
          transform: translateY(-4px);
        }

        .pricing-card-header {
          display: flex;
          justify-content: space-between;
          align-items: start;
          gap: 12px;
        }

        .pricing-card-title {
          font-size: 20px;
          font-weight: 700;
          color: #1f2937;
          margin: 0;
        }

        .pricing-card-badge {
          display: inline-block;
          padding: 4px 12px;
          background-color: #fef3c7;
          border: 2px solid;
          border-radius: 6px;
          font-size: 12px;
          font-weight: 600;
          color: #92400e;
          text-transform: uppercase;
          white-space: nowrap;
        }

        .pricing-card-description {
          font-size: 14px;
          color: #6b7280;
          margin: 0;
        }

        .pricing-card-price {
          display: flex;
          align-items: baseline;
          gap: 4px;
          padding: 16px 0;
          border-top: 1px solid #e5e7eb;
          border-bottom: 1px solid #e5e7eb;
        }

        .price-currency {
          font-size: 20px;
          font-weight: 600;
          color: #374151;
        }

        .price-amount {
          font-size: 40px;
          font-weight: 700;
          color: #1f2937;
        }

        .price-currency-label {
          font-size: 14px;
          color: #6b7280;
          margin-left: 4px;
        }

        .pricing-card-credits {
          display: flex;
          flex-direction: column;
          gap: 8px;
          padding: 12px 0;
        }

        .credit-row {
          display: flex;
          justify-content: space-between;
          font-size: 14px;
        }

        .credit-label {
          color: #6b7280;
          font-weight: 500;
        }

        .credit-value {
          color: #1f2937;
          font-weight: 600;
        }

        .credit-row.bonus .credit-value {
          color: #059669;
        }

        .credit-row.total {
          padding-top: 8px;
          border-top: 1px solid #e5e7eb;
        }

        .credit-row.total .credit-value {
          font-size: 16px;
          color: #1f2937;
        }

        .pricing-card-value {
          background-color: #f3f4f6;
          border-radius: 8px;
          padding: 12px;
          text-align: center;
        }

        .value-text {
          font-size: 13px;
          color: #374151;
          margin: 0;
        }

        .value-text strong {
          color: #059669;
          font-size: 15px;
        }

        .pricing-card-button {
          padding: 12px 20px;
          background-color: #3b82f6;
          color: white;
          border: none;
          border-radius: 8px;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
          width: 100%;
        }

        .pricing-card-button:hover:not(:disabled) {
          background-color: #2563eb;
          transform: scale(1.02);
        }

        .pricing-card-button:active:not(:disabled) {
          transform: scale(0.98);
        }

        .pricing-card-button:disabled,
        .pricing-card-button.disabled {
          background-color: #d1d5db;
          cursor: not-allowed;
          opacity: 0.6;
        }

        /* Responsive Design */
        @media (max-width: 640px) {
          .pricing-card {
            padding: 20px;
          }

          .price-amount {
            font-size: 32px;
          }
        }

        @media (max-width: 480px) {
          .pricing-card {
            padding: 16px;
            gap: 12px;
          }

          .pricing-card-title {
            font-size: 18px;
          }

          .price-amount {
            font-size: 28px;
          }

          .pricing-card-price {
            padding: 12px 0;
          }
        }

        /* Dark Mode Support */
        @media (prefers-color-scheme: dark) {
          .pricing-card {
            background-color: #1f2937;
            border-color: #374151;
          }

          .pricing-card-title {
            color: #f3f4f6;
          }

          .pricing-card-description {
            color: #9ca3af;
          }

          .pricing-card-price,
          .pricing-card-credits {
            border-color: #374151;
          }

          .price-currency,
          .price-amount {
            color: #f3f4f6;
          }

          .credit-label {
            color: #9ca3af;
          }

          .credit-value {
            color: #f3f4f6;
          }

          .pricing-card-value {
            background-color: #111827;
          }

          .value-text {
            color: #e5e7eb;
          }
        }
      `}</style>
    </div>
  )
}

export default PricingCard
