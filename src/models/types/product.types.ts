export const ProductStatus = {
  AVAILABLE: "available",
  NOT_AVAILABLE: "not available",
} as const;

export type TProductStatus = typeof ProductStatus[keyof typeof ProductStatus];