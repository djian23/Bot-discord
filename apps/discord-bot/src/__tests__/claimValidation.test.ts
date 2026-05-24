// Unit tests for claim validation logic (pure functions, no DB/Discord dependency)

describe("Claim validation logic", () => {
  describe("Daily limit check", () => {
    it("blocks when todayClaims >= maxClaimsPerDay", () => {
      const blocked = (todayClaims: number, max: number) => todayClaims >= max;
      expect(blocked(5, 5)).toBe(true);
      expect(blocked(6, 5)).toBe(true);
      expect(blocked(4, 5)).toBe(false);
      expect(blocked(0, 1)).toBe(false);
    });
  });

  describe("Cooldown check", () => {
    it("blocks within cooldown window", () => {
      const isInCooldown = (lastClaimMs: number, cooldownSeconds: number): boolean => {
        const elapsed = (Date.now() - lastClaimMs) / 1000;
        return elapsed < cooldownSeconds;
      };

      const justNow = Date.now() - 5000; // 5s ago
      expect(isInCooldown(justNow, 30)).toBe(true);
      expect(isInCooldown(justNow, 3)).toBe(false);
    });

    it("skips cooldown when cooldownSeconds is 0", () => {
      const shouldCheckCooldown = (cooldownSeconds: number, lastClaimAt: Date | null) =>
        cooldownSeconds > 0 && lastClaimAt !== null;

      expect(shouldCheckCooldown(0, new Date())).toBe(false);
      expect(shouldCheckCooldown(30, null)).toBe(false);
      expect(shouldCheckCooldown(30, new Date())).toBe(true);
    });
  });

  describe("Cooldown remaining time", () => {
    it("calculates remaining seconds correctly", () => {
      const remaining = (lastClaimMs: number, cooldownSeconds: number): number => {
        const elapsed = (Date.now() - lastClaimMs) / 1000;
        return Math.ceil(cooldownSeconds - elapsed);
      };

      const tenSecondsAgo = Date.now() - 10000;
      expect(remaining(tenSecondsAgo, 30)).toBeCloseTo(20, 0);
    });
  });

  describe("Cart status check", () => {
    it("only allows claiming AVAILABLE carts", () => {
      const canClaim = (status: string) => status === "AVAILABLE";
      expect(canClaim("AVAILABLE")).toBe(true);
      expect(canClaim("CLAIMED")).toBe(false);
      expect(canClaim("PAID")).toBe(false);
      expect(canClaim("EXPIRED")).toBe(false);
      expect(canClaim("CANCELLED")).toBe(false);
    });
  });

  describe("Status emoji mapping", () => {
    const statusEmoji: Record<string, string> = {
      PENDING: "⏳",
      PAID: "✅",
      CANCELLED: "❌",
      REFUNDED: "↩️",
    };

    it("maps all known statuses to emojis", () => {
      expect(statusEmoji["PENDING"]).toBe("⏳");
      expect(statusEmoji["PAID"]).toBe("✅");
      expect(statusEmoji["CANCELLED"]).toBe("❌");
      expect(statusEmoji["REFUNDED"]).toBe("↩️");
    });

    it("returns fallback for unknown status", () => {
      const emoji = statusEmoji["UNKNOWN"] ?? "•";
      expect(emoji).toBe("•");
    });
  });
});
