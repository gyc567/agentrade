/**
 * PaymentApiService Tests - Crossmint Order Creation
 * Tests for the new createCrossmintOrder method
 *
 * Coverage Target: 100%
 */

import { describe, it, expect, vi, beforeEach } from "vitest"
import { DefaultPaymentApiService } from "../PaymentApiService"
import type { CrossmintOrderResponse } from "../../../types/payment"

describe("PaymentApiService - createCrossmintOrder", () => {
  let service: DefaultPaymentApiService
  let mockFetch: ReturnType<typeof vi.fn>

  beforeEach(() => {
    // Setup
    mockFetch = vi.fn()
    global.fetch = mockFetch
    service = new DefaultPaymentApiService(() => "test-token")
  })

  describe("Success Cases", () => {
    it("should create order successfully with starter package", async () => {
      // Arrange
      const mockResponse: CrossmintOrderResponse = {
        success: true,
        orderId: "order_abc123",
        clientSecret: "secret_xyz789",
        amount: 10.0,
        currency: "USDT",
        credits: 500,
      }

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      })

      // Act
      const result = await service.createCrossmintOrder("starter")

      // Assert
      expect(result).toEqual(mockResponse)
      expect(mockFetch).toHaveBeenCalledWith(
        "/api/payments/crossmint/create-order",
        expect.objectContaining({
          method: "POST",
          headers: expect.objectContaining({
            "Content-Type": "application/json",
            Authorization: "Bearer test-token",
          }),
          body: JSON.stringify({ packageId: "starter" }),
        })
      )
    })

    it("should create order successfully with pro package", async () => {
      // Arrange
      const mockResponse: CrossmintOrderResponse = {
        success: true,
        orderId: "order_pro_123",
        clientSecret: "secret_pro_789",
        amount: 50.0,
        currency: "USDT",
        credits: 3300,
      }

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      })

      // Act
      const result = await service.createCrossmintOrder("pro")

      // Assert
      expect(result.orderId).toBe("order_pro_123")
      expect(result.credits).toBe(3300)
    })

    it("should create order successfully with vip package", async () => {
      // Arrange
      const mockResponse: CrossmintOrderResponse = {
        success: true,
        orderId: "order_vip_123",
        clientSecret: "secret_vip_789",
        amount: 100.0,
        currency: "USDT",
        credits: 9600,
      }

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      })

      // Act
      const result = await service.createCrossmintOrder("vip")

      // Assert
      expect(result.orderId).toBe("order_vip_123")
      expect(result.credits).toBe(9600)
    })
  })

  describe("Error Cases", () => {
    it("should throw error when packageId is empty", async () => {
      // Act & Assert
      await expect(
        service.createCrossmintOrder("" as any)
      ).rejects.toThrow("Package ID is required")

      // Should not call fetch
      expect(mockFetch).not.toHaveBeenCalled()
    })

    it("should throw error when API returns 400", async () => {
      // Arrange
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: async () => ({
          error: "Invalid package ID",
          code: "INVALID_PACKAGE",
        }),
      })

      // Act & Assert
      await expect(
        service.createCrossmintOrder("invalid" as any)
      ).rejects.toThrow("Invalid package ID")
    })

    it("should throw error when API returns 401", async () => {
      // Arrange
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: async () => ({
          error: "Authentication required",
          code: "UNAUTHORIZED",
        }),
      })

      // Act & Assert
      await expect(
        service.createCrossmintOrder("starter")
      ).rejects.toThrow("Authentication required")
    })

    it("should throw error when API returns 500", async () => {
      // Arrange
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: async () => ({
          error: "Crossmint API error",
          code: "CROSSMINT_ERROR",
        }),
      })

      // Act & Assert
      await expect(
        service.createCrossmintOrder("starter")
      ).rejects.toThrow("Crossmint API error")
    })

    it("should handle malformed JSON response", async () => {
      // Arrange
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: async () => {
          throw new Error("Invalid JSON")
        },
      })

      // Act & Assert
      await expect(
        service.createCrossmintOrder("starter")
      ).rejects.toThrow("Backend returned 500")
    })

    it("should throw error when response.success is false", async () => {
      // Arrange
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: false,
          error: "Order creation failed",
        }),
      })

      // Act & Assert
      await expect(
        service.createCrossmintOrder("starter")
      ).rejects.toThrow("Order creation failed")
    })

    it("should handle network errors", async () => {
      // Arrange
      mockFetch.mockRejectedValueOnce(new Error("Network error"))

      // Act & Assert
      await expect(
        service.createCrossmintOrder("starter")
      ).rejects.toThrow("Network error")
    })
  })

  describe("Authorization", () => {
    it("should include auth token in request", async () => {
      // Arrange
      const serviceWithToken = new DefaultPaymentApiService(() => "my-secret-token")
      global.fetch = mockFetch

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          orderId: "test",
          clientSecret: "test",
          amount: 10,
          currency: "USDT",
          credits: 500,
        }),
      })

      // Act
      await serviceWithToken.createCrossmintOrder("starter")

      // Assert
      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: "Bearer my-secret-token",
          }),
        })
      )
    })

    it("should handle missing auth token", async () => {
      // Arrange
      const serviceWithoutToken = new DefaultPaymentApiService()
      global.fetch = mockFetch

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          orderId: "test",
          clientSecret: "test",
          amount: 10,
          currency: "USDT",
          credits: 500,
        }),
      })

      // Act
      await serviceWithoutToken.createCrossmintOrder("starter")

      // Assert
      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: "Bearer ",
          }),
        })
      )
    })
  })

  describe("Request Body", () => {
    it("should send correct package ID in request body", async () => {
      // Arrange
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          orderId: "test",
          clientSecret: "test",
          amount: 10,
          currency: "USDT",
          credits: 500,
        }),
      })

      // Act
      await service.createCrossmintOrder("pro")

      // Assert
      const callArgs = mockFetch.mock.calls[0]
      const body = JSON.parse(callArgs[1].body)
      expect(body).toEqual({ packageId: "pro" })
    })
  })

  describe("Error Logging", () => {
    it("should log errors to console", async () => {
      // Arrange
      const consoleError = vi.spyOn(console, "error").mockImplementation(() => {})

      mockFetch.mockRejectedValueOnce(new Error("Test error"))

      // Act
      try {
        await service.createCrossmintOrder("starter")
      } catch (e) {
        // Expected
      }

      // Assert
      expect(consoleError).toHaveBeenCalledWith(
        "[CreateCrossmintOrder Error]",
        "Test error"
      )

      consoleError.mockRestore()
    })
  })
})
