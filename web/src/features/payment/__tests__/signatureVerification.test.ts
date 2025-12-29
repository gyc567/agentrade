/**
 * Signature Verification Unit Tests
 * Tests for HMAC-SHA256 signature utilities
 */

import { describe, it, expect } from 'vitest'
import {
  verifyHmacSignature,
  timingSafeEqual,
  createHmacSignature,
} from '../utils/signatureVerification'

describe('signatureVerification', () => {
  describe('timingSafeEqual', () => {
    it('returns true for identical strings', () => {
      expect(timingSafeEqual('abc', 'abc')).toBe(true)
      expect(timingSafeEqual('', '')).toBe(true)
      expect(timingSafeEqual('a'.repeat(100), 'a'.repeat(100))).toBe(true)
    })

    it('returns false for different strings', () => {
      expect(timingSafeEqual('abc', 'abd')).toBe(false)
      expect(timingSafeEqual('abc', 'ABC')).toBe(false)
      expect(timingSafeEqual('abc', 'abcd')).toBe(false)
    })

    it('returns false for different lengths', () => {
      expect(timingSafeEqual('abc', 'ab')).toBe(false)
      expect(timingSafeEqual('a', 'aa')).toBe(false)
    })
  })

  describe('createHmacSignature', () => {
    it('creates consistent signatures for same input', async () => {
      const payload = 'test payload'
      const secret = 'test-secret'

      const sig1 = await createHmacSignature(payload, secret)
      const sig2 = await createHmacSignature(payload, secret)

      expect(sig1).toBe(sig2)
    })

    it('creates different signatures for different payloads', async () => {
      const secret = 'test-secret'

      const sig1 = await createHmacSignature('payload1', secret)
      const sig2 = await createHmacSignature('payload2', secret)

      expect(sig1).not.toBe(sig2)
    })

    it('creates different signatures for different secrets', async () => {
      const payload = 'same payload'

      const sig1 = await createHmacSignature(payload, 'secret1')
      const sig2 = await createHmacSignature(payload, 'secret2')

      expect(sig1).not.toBe(sig2)
    })

    it('returns hex string of correct length', async () => {
      const sig = await createHmacSignature('test', 'secret')

      // SHA-256 produces 32 bytes = 64 hex characters
      expect(sig.length).toBe(64)
      expect(/^[0-9a-f]+$/.test(sig)).toBe(true)
    })
  })

  describe('verifyHmacSignature', () => {
    it('returns true for valid signature', async () => {
      const payload = 'test payload'
      const secret = 'test-secret'
      const signature = await createHmacSignature(payload, secret)

      const result = await verifyHmacSignature(signature, payload, secret)

      expect(result).toBe(true)
    })

    it('returns false for invalid signature', async () => {
      const payload = 'test payload'
      const secret = 'test-secret'
      const invalidSignature = 'invalid-signature-that-is-wrong'

      const result = await verifyHmacSignature(invalidSignature, payload, secret)

      expect(result).toBe(false)
    })

    it('returns false for tampered payload', async () => {
      const originalPayload = 'original payload'
      const tamperedPayload = 'tampered payload'
      const secret = 'test-secret'
      const signature = await createHmacSignature(originalPayload, secret)

      const result = await verifyHmacSignature(signature, tamperedPayload, secret)

      expect(result).toBe(false)
    })

    it('returns false for wrong secret', async () => {
      const payload = 'test payload'
      const signature = await createHmacSignature(payload, 'correct-secret')

      const result = await verifyHmacSignature(signature, payload, 'wrong-secret')

      expect(result).toBe(false)
    })

    it('returns false for empty signature', async () => {
      const result = await verifyHmacSignature('', 'payload', 'secret')
      expect(result).toBe(false)
    })

    it('returns false for empty payload', async () => {
      const result = await verifyHmacSignature('signature', '', 'secret')
      expect(result).toBe(false)
    })

    it('returns false for empty secret', async () => {
      const result = await verifyHmacSignature('signature', 'payload', '')
      expect(result).toBe(false)
    })

    it('handles JSON payloads correctly', async () => {
      const payload = JSON.stringify({ orderId: '123', amount: 100 })
      const secret = 'webhook-secret'
      const signature = await createHmacSignature(payload, secret)

      const result = await verifyHmacSignature(signature, payload, secret)

      expect(result).toBe(true)
    })
  })
})
