/**
 * Payment Validator 单元测试
 * 测试：类型安全、验证逻辑、边界情况
 */

import { describe, it, expect } from 'vitest'
import {
  validatePackageId,
  validatePrice,
  validateCreditsAmount,
  getPackage,
  validateOrder,
  validatePackageForPayment
} from '../services/paymentValidator'

describe('paymentValidator', () => {
  describe('validatePackageId', () => {
    it('接受有效的包 ID (字母数字、下划线、破折号)', () => {
      expect(validatePackageId('starter')).toBe(true)
      expect(validatePackageId('pro')).toBe(true)
      expect(validatePackageId('vip')).toBe(true)
      expect(validatePackageId('package-name')).toBe(true)
      expect(validatePackageId('package_name')).toBe(true)
      expect(validatePackageId('Package123')).toBe(true)
    })

    it('拒绝无效的包 ID', () => {
      expect(validatePackageId('')).toBe(false) // 空字符串
      expect(validatePackageId('a'.repeat(51))).toBe(false) // 太长
      expect(validatePackageId('invalid@id')).toBe(false) // 特殊字符
      expect(validatePackageId('invalid id')).toBe(false) // 空格
    })

    it('拒绝非字符串输入', () => {
      expect(validatePackageId(123)).toBe(false)
      expect(validatePackageId(null)).toBe(false)
      expect(validatePackageId(undefined)).toBe(false)
      expect(validatePackageId({})).toBe(false)
      expect(validatePackageId([])).toBe(false)
    })
  })

  describe('validatePrice', () => {
    it('接受有效的价格', () => {
      expect(validatePrice(10)).toBe(true)
      expect(validatePrice(50)).toBe(true)
      expect(validatePrice(100)).toBe(true)
      expect(validatePrice(0.01)).toBe(true)
      expect(validatePrice(9999.99)).toBe(true)
    })

    it('拒绝无效的价格', () => {
      expect(validatePrice(0)).toBe(false) // 零
      expect(validatePrice(-10)).toBe(false) // 负数
      expect(validatePrice(10001)).toBe(false) // 超出范围
      expect(validatePrice(Infinity)).toBe(false) // 无穷大
      expect(validatePrice(NaN)).toBe(false) // NaN
    })

    it('拒绝非数字输入', () => {
      expect(validatePrice('10')).toBe(false)
      expect(validatePrice(null)).toBe(false)
      expect(validatePrice(undefined)).toBe(false)
    })
  })

  describe('validateCreditsAmount', () => {
    it('接受有效的积分数量', () => {
      expect(validateCreditsAmount(100)).toBe(true)
      expect(validateCreditsAmount(1000)).toBe(true)
      expect(validateCreditsAmount(1000000)).toBe(true)
    })

    it('拒绝无效的积分数量', () => {
      expect(validateCreditsAmount(0)).toBe(false) // 零
      expect(validateCreditsAmount(-100)).toBe(false) // 负数
      expect(validateCreditsAmount(1000001)).toBe(false) // 超出范围
      expect(validateCreditsAmount(100.5)).toBe(false) // 小数
    })

    it('拒绝非数字输入', () => {
      expect(validateCreditsAmount('1000')).toBe(false)
      expect(validateCreditsAmount(null)).toBe(false)
      expect(validateCreditsAmount(undefined)).toBe(false)
    })
  })

  describe('getPackage [M3 类型安全修复验证]', () => {
    it('返回已知的包', () => {
      const pkg = getPackage('starter')
      expect(pkg).not.toBeNull()
      expect(pkg?.id).toBe('starter')
      expect(pkg?.name).toBe('初级套餐')
    })

    it('对于未知的包 ID 返回 null', () => {
      // [M3] 修复验证：返回 null 而不是 undefined
      const pkg = getPackage('unknown-package')
      expect(pkg).toBeNull()
    })

    it('对于无效的包 ID 返回 null', () => {
      expect(getPackage('')).toBeNull()
      expect(getPackage('invalid@id')).toBeNull()
      expect(getPackage(123)).toBeNull()
      expect(getPackage(null)).toBeNull()
      expect(getPackage(undefined)).toBeNull()
    })

    it('包对象包含所有必需的属性', () => {
      const pkg = getPackage('starter')
      expect(pkg).toHaveProperty('id')
      expect(pkg).toHaveProperty('name')
      expect(pkg).toHaveProperty('description')
      expect(pkg).toHaveProperty('price')
      expect(pkg).toHaveProperty('credits')
    })
  })

  describe('validateOrder', () => {
    const validOrder = {
      id: 'order-123',
      userId: 'user-456',
      packageId: 'starter',
      payment: { amount: 10 },
      credits: { totalCredits: 500 },
      status: 'pending'
    }

    it('接受有效的订单', () => {
      const result = validateOrder(validOrder)
      expect(result.valid).toBe(true)
      expect(result.errors).toBeUndefined()
    })

    it('拒绝缺少必需字段的订单', () => {
      const invalidOrder = { ...validOrder, id: undefined }
      const result = validateOrder(invalidOrder)
      expect(result.valid).toBe(false)
      expect(result.errors).toBeDefined()
      expect(result.errors?.length).toBeGreaterThan(0)
    })

    it('拒绝无效的包 ID 格式', () => {
      // validateOrder 验证格式而不是包是否存在（动态包支持）
      const invalidOrder = { ...validOrder, packageId: 'invalid@id' }
      const result = validateOrder(invalidOrder)
      expect(result.valid).toBe(false)
      expect(result.errors).toBeDefined()
    })

    it('拒绝非对象输入', () => {
      expect(validateOrder(null).valid).toBe(false)
      expect(validateOrder(undefined).valid).toBe(false)
      expect(validateOrder('not an object').valid).toBe(false)
      expect(validateOrder(123).valid).toBe(false)
    })
  })

  describe('validatePackageForPayment', () => {
    it('验证有效的包支付', () => {
      const result = validatePackageForPayment('starter')
      expect(result.valid).toBe(true)
      if (result.valid) {
        expect(result.package.id).toBe('starter')
        expect(result.package.price.amount).toBe(10)
      }
    })

    it('拒绝无效的包 ID', () => {
      const result = validatePackageForPayment('invalid-package')
      expect(result.valid).toBe(false)
      if (!result.valid) {
        expect(result.error).toBeDefined()
      }
    })

    it('拒绝非字符串输入', () => {
      expect(validatePackageForPayment(123).valid).toBe(false)
      expect(validatePackageForPayment(null).valid).toBe(false)
      expect(validatePackageForPayment(undefined).valid).toBe(false)
    })

    it('返回完整的包信息用于有效的包', () => {
      const result = validatePackageForPayment('pro')
      expect(result.valid).toBe(true)
      if (result.valid) {
        expect(result.package.name).toBe('专业套餐')
        expect(result.package.credits.amount).toBe(3000)
        expect(result.package.credits.bonusAmount).toBe(300)
      }
    })
  })

  describe('类型安全边界情况', () => {
    it('处理 undefined vs null vs 空对象', () => {
      expect(getPackage(undefined)).toBeNull()
      expect(getPackage(null)).toBeNull()
      expect(getPackage({})).toBeNull()
    })

    it('确保类型守卫有效', () => {
      const id: unknown = 'starter'
      if (validatePackageId(id)) {
        // 如果我们到这里，id 的类型被收窄为 string
        expect(typeof id === 'string').toBe(true)
      }
    })
  })
})
