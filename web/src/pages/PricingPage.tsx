/**
 * Pricing Page
 *
 * Displays all available credit packages for purchase
 * Integrates with PaymentModal for checkout
 */

import React, { useState, useMemo } from 'react'
import PricingCard from '@/features/payment/components/PricingCard'
import usePricingData from '@/features/payment/hooks/usePricingData'
import PaymentModal from '@/features/payment/components/PaymentModal'
import { getPricingContent } from '@/features/payment/constants/pricing-content'
import type { PaymentPackage } from '@/features/payment/types/payment'

interface PricingPageProps {
  lang?: 'en' | 'zh'
}

const PricingPage: React.FC<PricingPageProps> = ({ lang = 'en' }) => {
  const { packages, loading, error, refetch } = usePricingData()
  const [selectedPackage, setSelectedPackage] = useState<PaymentPackage | null>(
    null
  )
  const [showPaymentModal, setShowPaymentModal] = useState(false)

  const content = useMemo(() => getPricingContent(lang), [lang])

  const handlePurchase = (packageId: string) => {
    const pkg = packages.find((p) => p.id === packageId)
    if (pkg) {
      setSelectedPackage(pkg)
      setShowPaymentModal(true)
    }
  }

  const handleCloseModal = () => {
    setShowPaymentModal(false)
    setSelectedPackage(null)
  }

  return (
    <div className="pricing-page">
      {/* Header */}
      <section className="pricing-header">
        <div className="pricing-header-content">
          <h1 className="pricing-title">
            {lang === 'zh' ? '积分套餐' : 'Credit Packages'}
          </h1>
          <p className="pricing-subtitle">
            {lang === 'zh'
              ? '选择最适合您的套餐，开始交易'
              : 'Choose the perfect plan for your trading needs'}
          </p>
        </div>
      </section>

      {/* Pricing Cards Grid */}
      <section className="pricing-cards-section">
        {error && !packages.length ? (
          <div className="pricing-error">
            <p>
              {lang === 'zh'
                ? '加载套餐失败。正在使用默认套餐...'
                : 'Failed to load packages. Using default packages...'}
            </p>
            <button
              className="pricing-retry-button"
              onClick={() => refetch()}
            >
              {lang === 'zh' ? '重试' : 'Retry'}
            </button>
          </div>
        ) : null}

        {loading && !packages.length ? (
          <div className="pricing-skeleton">
            {[1, 2, 3].map((i) => (
              <div key={i} className="skeleton-card" />
            ))}
          </div>
        ) : (
          <div className="pricing-grid">
            {packages.map((pkg) => (
              <PricingCard
                key={pkg.id}
                package={pkg}
                onPurchase={handlePurchase}
                isDisabled={pkg.isActive === false}
              />
            ))}
          </div>
        )}
      </section>

      {/* Features */}
      <section className="pricing-features-section">
        <div className="features-container">
          <h2 className="features-title">
            {lang === 'zh'
              ? '所有套餐都包含以下功能'
              : 'All packages include'}
          </h2>
          <div className="features-grid">
            {content.features.map((feature, idx) => (
              <div key={idx} className="feature-item">
                <span className="feature-icon">✓</span>
                <span className="feature-text">{feature}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="pricing-faq-section">
        <div className="faq-container">
          <h2 className="faq-title">
            {lang === 'zh' ? '常见问题' : 'Frequently Asked Questions'}
          </h2>
          <div className="faq-list">
            {content.faq.map((item, idx) => (
              <details key={idx} className="faq-item">
                <summary className="faq-question">
                  {item.question}
                </summary>
                <p className="faq-answer">{item.answer}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* Payment Modal */}
      {showPaymentModal && selectedPackage && (
        <PaymentModal
          package={selectedPackage}
          onClose={handleCloseModal}
        />
      )}

      {/* Styles */}
      <style>{`
        .pricing-page {
          min-height: 100vh;
          background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
          padding: 40px 20px;
        }

        .pricing-header {
          text-align: center;
          margin-bottom: 60px;
        }

        .pricing-header-content {
          max-width: 800px;
          margin: 0 auto;
        }

        .pricing-title {
          font-size: 48px;
          font-weight: 700;
          color: #1f2937;
          margin: 0 0 16px 0;
        }

        .pricing-subtitle {
          font-size: 18px;
          color: #6b7280;
          margin: 0;
        }

        .pricing-cards-section {
          max-width: 1200px;
          margin: 0 auto 80px;
        }

        .pricing-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
          gap: 24px;
        }

        .pricing-error {
          background-color: #fee2e2;
          border: 1px solid #fca5a5;
          border-radius: 8px;
          padding: 20px;
          text-align: center;
          margin-bottom: 24px;
        }

        .pricing-error p {
          color: #b91c1c;
          margin: 0 0 12px 0;
        }

        .pricing-retry-button {
          padding: 8px 16px;
          background-color: #dc2626;
          color: white;
          border: none;
          border-radius: 6px;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          transition: background-color 0.2s;
        }

        .pricing-retry-button:hover {
          background-color: #b91c1c;
        }

        .pricing-skeleton {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
          gap: 24px;
        }

        .skeleton-card {
          background: linear-gradient(
            90deg,
            #f0f0f0 25%,
            #e0e0e0 50%,
            #f0f0f0 75%
          );
          background-size: 200% 100%;
          animation: loading 1.5s infinite;
          height: 400px;
          border-radius: 12px;
        }

        @keyframes loading {
          0% {
            background-position: 200% 0;
          }
          100% {
            background-position: -200% 0;
          }
        }

        .pricing-features-section {
          background-color: white;
          padding: 60px 20px;
          margin-bottom: 60px;
        }

        .features-container {
          max-width: 1000px;
          margin: 0 auto;
        }

        .features-title {
          font-size: 28px;
          font-weight: 700;
          text-align: center;
          color: #1f2937;
          margin: 0 0 40px 0;
        }

        .features-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 24px;
        }

        .feature-item {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px;
        }

        .feature-icon {
          font-size: 20px;
          color: #059669;
          font-weight: 700;
          flex-shrink: 0;
        }

        .feature-text {
          font-size: 14px;
          color: #374151;
        }

        .pricing-faq-section {
          max-width: 800px;
          margin: 0 auto;
        }

        .faq-container {
          background-color: white;
          border-radius: 12px;
          padding: 40px;
        }

        .faq-title {
          font-size: 28px;
          font-weight: 700;
          color: #1f2937;
          margin: 0 0 32px 0;
          text-align: center;
        }

        .faq-list {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .faq-item {
          border: 1px solid #e5e7eb;
          border-radius: 8px;
          overflow: hidden;
        }

        .faq-question {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 16px;
          background-color: #f9fafb;
          cursor: pointer;
          font-weight: 600;
          color: #1f2937;
          user-select: none;
          transition: background-color 0.2s;
        }

        .faq-question:hover {
          background-color: #f3f4f6;
        }

        .faq-item[open] .faq-question {
          background-color: #eff6ff;
          border-bottom: 1px solid #e5e7eb;
        }

        .faq-answer {
          padding: 16px;
          color: #6b7280;
          line-height: 1.6;
          margin: 0;
        }

        /* Responsive Design */
        @media (max-width: 768px) {
          .pricing-page {
            padding: 24px 16px;
          }

          .pricing-title {
            font-size: 32px;
          }

          .pricing-subtitle {
            font-size: 16px;
          }

          .pricing-grid {
            gap: 16px;
          }

          .features-title,
          .faq-title {
            font-size: 22px;
          }

          .faq-container {
            padding: 24px;
          }
        }

        @media (max-width: 480px) {
          .pricing-page {
            padding: 16px 12px;
          }

          .pricing-title {
            font-size: 24px;
          }

          .pricing-grid {
            grid-template-columns: 1fr;
          }

          .features-grid {
            grid-template-columns: 1fr;
            gap: 16px;
          }
        }

        /* Dark Mode */
        @media (prefers-color-scheme: dark) {
          .pricing-page {
            background: linear-gradient(
              135deg,
              #1f2937 0%,
              #111827 100%
            );
          }

          .pricing-title,
          .features-title,
          .faq-title {
            color: #f3f4f6;
          }

          .pricing-subtitle {
            color: #d1d5db;
          }

          .pricing-features-section {
            background-color: #111827;
          }

          .features-text {
            color: #e5e7eb;
          }

          .faq-container {
            background-color: #111827;
          }

          .faq-question {
            background-color: #1f2937;
            color: #f3f4f6;
          }

          .faq-question:hover {
            background-color: #374151;
          }

          .faq-item[open] .faq-question {
            background-color: #1e3a8a;
          }

          .faq-answer {
            color: #d1d5db;
          }
        }
      `}</style>
    </div>
  )
}

export default PricingPage
