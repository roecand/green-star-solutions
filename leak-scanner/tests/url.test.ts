import { describe, expect, it } from "vitest";
import { isPrivateIp, normalizeUrl, UnsafeUrlError } from "@/lib/scanner/url";

describe("normalizeUrl", () => {
  it("adds https to bare domains", () => {
    expect(normalizeUrl("example.com")).toBe("https://example.com/");
  });

  it("preserves paths and existing scheme", () => {
    expect(normalizeUrl("http://example.com/services")).toBe(
      "http://example.com/services"
    );
  });

  it("strips hash fragments", () => {
    expect(normalizeUrl("https://example.com/#top")).toBe("https://example.com/");
  });

  it("rejects non-http protocols", () => {
    expect(() => normalizeUrl("ftp://example.com")).toThrow(UnsafeUrlError);
    expect(() => normalizeUrl("file:///etc/passwd")).toThrow(UnsafeUrlError);
  });

  it("rejects URLs with credentials", () => {
    expect(() => normalizeUrl("https://user:pass@example.com")).toThrow(UnsafeUrlError);
  });

  it("rejects hostnames without a dot", () => {
    expect(() => normalizeUrl("localhost")).toThrow(UnsafeUrlError);
    expect(() => normalizeUrl("intranet")).toThrow(UnsafeUrlError);
  });

  it("rejects empty and garbage input", () => {
    expect(() => normalizeUrl("")).toThrow(UnsafeUrlError);
    expect(() => normalizeUrl("not a url at all")).toThrow(UnsafeUrlError);
  });
});

describe("isPrivateIp (SSRF guard)", () => {
  it("blocks loopback and private IPv4 ranges", () => {
    for (const ip of [
      "127.0.0.1",
      "10.0.0.5",
      "172.16.0.1",
      "172.31.255.255",
      "192.168.1.1",
      "169.254.169.254", // cloud metadata
      "0.0.0.0",
      "100.64.0.1",
    ]) {
      expect(isPrivateIp(ip), ip).toBe(true);
    }
  });

  it("allows public IPv4", () => {
    for (const ip of ["8.8.8.8", "1.1.1.1", "142.250.72.14", "172.15.0.1", "172.32.0.1"]) {
      expect(isPrivateIp(ip), ip).toBe(false);
    }
  });

  it("blocks IPv6 loopback, link-local, unique-local, and mapped-private", () => {
    for (const ip of ["::1", "fe80::1", "fc00::1", "fd12::1", "::ffff:192.168.0.1"]) {
      expect(isPrivateIp(ip), ip).toBe(true);
    }
  });

  it("allows public IPv6", () => {
    expect(isPrivateIp("2607:f8b0:4005:80b::200e")).toBe(false);
  });
});
