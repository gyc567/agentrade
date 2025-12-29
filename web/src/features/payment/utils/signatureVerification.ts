/**
 * Signature Verification Utilities
 * HMAC-SHA256 signature verification for Crossmint webhooks
 *
 * KISS: Simple, focused utility for signature verification
 * Security: Uses Web Crypto API for secure HMAC operations
 */

/**
 * Verifies HMAC-SHA256 signature using Web Crypto API
 * Browser-compatible implementation
 *
 * @param signature - The signature to verify (hex string)
 * @param payload - The payload that was signed
 * @param secret - The secret key used for signing
 * @returns Promise<boolean> - True if signature is valid
 */
export async function verifyHmacSignature(
  signature: string,
  payload: string,
  secret: string
): Promise<boolean> {
  if (!signature || !payload || !secret) {
    return false
  }

  try {
    // Import the secret key
    const encoder = new TextEncoder()
    const keyData = encoder.encode(secret)
    const key = await crypto.subtle.importKey(
      'raw',
      keyData,
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    )

    // Sign the payload
    const payloadData = encoder.encode(payload)
    const signatureBuffer = await crypto.subtle.sign('HMAC', key, payloadData)

    // Convert to hex string
    const expectedSignature = Array.from(new Uint8Array(signatureBuffer))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('')

    // Timing-safe comparison
    return timingSafeEqual(signature, expectedSignature)
  } catch {
    return false
  }
}

/**
 * Timing-safe string comparison to prevent timing attacks
 * Compares strings in constant time regardless of where they differ
 *
 * @param a - First string
 * @param b - Second string
 * @returns boolean - True if strings are equal
 */
export function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) {
    return false
  }

  let result = 0
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i)
  }

  return result === 0
}

/**
 * Creates an HMAC-SHA256 signature
 * Useful for testing and for cases where we need to sign data
 *
 * @param payload - The payload to sign
 * @param secret - The secret key
 * @returns Promise<string> - The signature as hex string
 */
export async function createHmacSignature(
  payload: string,
  secret: string
): Promise<string> {
  const encoder = new TextEncoder()
  const keyData = encoder.encode(secret)
  const key = await crypto.subtle.importKey(
    'raw',
    keyData,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  )

  const payloadData = encoder.encode(payload)
  const signatureBuffer = await crypto.subtle.sign('HMAC', key, payloadData)

  return Array.from(new Uint8Array(signatureBuffer))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('')
}
