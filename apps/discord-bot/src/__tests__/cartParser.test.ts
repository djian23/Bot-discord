import { parseCartFromEmbed } from "../services/cartParser";

function makeMessage(embed: object): any {
  return { embeds: [embed], webhookId: "123" };
}

describe("parseCartFromEmbed", () => {
  it("returns null when no embeds", () => {
    expect(parseCartFromEmbed({ embeds: [] } as any)).toBeNull();
  });

  it("parses title from embed", () => {
    const msg = makeMessage({ title: "Nike Air Max", fields: [] });
    const result = parseCartFromEmbed(msg);
    expect(result?.title).toBe("Nike Air Max");
  });

  it("defaults title to Cart when missing", () => {
    const msg = makeMessage({ fields: [] });
    const result = parseCartFromEmbed(msg);
    expect(result?.title).toBe("Cart");
  });

  it("parses price field", () => {
    const msg = makeMessage({
      title: "Test",
      fields: [{ name: "Prix", value: "**150.00€**" }],
    });
    expect(parseCartFromEmbed(msg)?.price).toBe(150);
  });

  it("parses site field", () => {
    const msg = makeMessage({
      title: "Test",
      fields: [{ name: "Site", value: "`ticketmaster.fr`" }],
    });
    expect(parseCartFromEmbed(msg)?.site).toBe("ticketmaster.fr");
  });

  it("parses checkout link from field", () => {
    const msg = makeMessage({
      title: "Test",
      fields: [{ name: "Checkout", value: "https://checkout.example.com/abc123" }],
    });
    expect(parseCartFromEmbed(msg)?.checkoutLink).toBe("https://checkout.example.com/abc123");
  });

  it("parses checkout link from description fallback", () => {
    const msg = makeMessage({
      title: "Test",
      description: "Checkout here: https://checkout.example.com/xyz",
      fields: [],
    });
    expect(parseCartFromEmbed(msg)?.checkoutLink).toBe("https://checkout.example.com/xyz");
  });

  it("parses expiration in minutes", () => {
    const before = Date.now();
    const msg = makeMessage({
      title: "Test",
      fields: [{ name: "Expire", value: "30min" }],
    });
    const result = parseCartFromEmbed(msg);
    const after = Date.now();
    expect(result?.expirationAt).toBeDefined();
    const exp = result!.expirationAt!.getTime();
    expect(exp).toBeGreaterThanOrEqual(before + 30 * 60 * 1000 - 100);
    expect(exp).toBeLessThanOrEqual(after + 30 * 60 * 1000 + 100);
  });

  it("parses expiration in hours", () => {
    const before = Date.now();
    const msg = makeMessage({
      title: "Test",
      fields: [{ name: "Expiration", value: "2h" }],
    });
    const result = parseCartFromEmbed(msg);
    const after = Date.now();
    const exp = result!.expirationAt!.getTime();
    expect(exp).toBeGreaterThanOrEqual(before + 2 * 60 * 60 * 1000 - 100);
    expect(exp).toBeLessThanOrEqual(after + 2 * 60 * 60 * 1000 + 100);
  });

  it("parses quantity field", () => {
    const msg = makeMessage({
      title: "Test",
      fields: [{ name: "Qty", value: "2" }],
    });
    expect(parseCartFromEmbed(msg)?.quantity).toBe(2);
  });

  it("uses embed image over thumbnail", () => {
    const msg = makeMessage({
      title: "Test",
      fields: [],
      image: { url: "https://img.example.com/big.jpg" },
      thumbnail: { url: "https://img.example.com/thumb.jpg" },
    });
    expect(parseCartFromEmbed(msg)?.image).toBe("https://img.example.com/big.jpg");
  });

  it("falls back to thumbnail when no image", () => {
    const msg = makeMessage({
      title: "Test",
      fields: [],
      thumbnail: { url: "https://img.example.com/thumb.jpg" },
    });
    expect(parseCartFromEmbed(msg)?.image).toBe("https://img.example.com/thumb.jpg");
  });
});
