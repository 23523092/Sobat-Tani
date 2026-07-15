import { describe, expect, it } from "vitest";
import { isValidJenisPupuk, parsePositiveKg, summarizeStok, validatePenebusan } from "@/lib/stock";

describe("parsePositiveKg", () => {
  it("mengembalikan bilangan bulat positif dari input kg", () => {
    expect(parsePositiveKg("125")).toBe(125);
  });

  it("menolak kosong, nol, negatif, pecahan, dan teks", () => {
    for (const value of ["", "0", "-5", "1.5", "abc"]) {
      expect(parsePositiveKg(value)).toBeNull();
    }
  });
});

describe("summarizeStok", () => {
  it("menghitung stok masuk, keluar, tersedia, dan persentase penyerapan", () => {
    expect(summarizeStok(1000, 250, 400, 850)).toEqual({
      stokAwalKg: 1000,
      masukKg: 250,
      keluarKg: 400,
      tersediaKg: 850,
      persentaseTerserap: 32,
    });
  });
});

describe("isValidJenisPupuk", () => {
  it("hanya menerima jenis pupuk yang terdaftar", () => {
    expect(isValidJenisPupuk("Urea")).toBe(true);
    expect(isValidJenisPupuk("NPK")).toBe(true);
    expect(isValidJenisPupuk("Organik")).toBe(true);
    expect(isValidJenisPupuk("Palsu")).toBe(false);
  });
});

describe("validatePenebusan", () => {
  it("menolak jumlah yang melebihi sisa kuota petani", () => {
    expect(validatePenebusan(101, 100, 500)).toBe("Melebihi sisa kuota petani: 100 kg.");
  });

  it("menolak jumlah yang melebihi stok KPL", () => {
    expect(validatePenebusan(101, 500, 100)).toBe("Stok KPL tidak cukup. Sisa stok: 100 kg.");
  });
});
