import type { Address } from "viem";
export { baseBeatTapAbi } from "./abi";

export const BEATS = [
  {
    id: 0,
    name: "Kick",
    short: "KIK",
    color: "#b7ff4a",
    pattern: [1, 0, 0, 0, 1, 0, 0, 0],
  },
  {
    id: 1,
    name: "Snare",
    short: "SNR",
    color: "#f8fafc",
    pattern: [0, 0, 1, 0, 0, 0, 1, 0],
  },
  {
    id: 2,
    name: "Clap",
    short: "CLP",
    color: "#ff4dd8",
    pattern: [0, 1, 0, 1, 0, 1, 0, 1],
  },
  {
    id: 3,
    name: "Bass",
    short: "BAS",
    color: "#4cc9ff",
    pattern: [1, 1, 0, 0, 1, 0, 1, 0],
  },
] as const;

export type BeatId = (typeof BEATS)[number]["id"];

export const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";
export const DEFAULT_BASE_BEAT_TAP_ADDRESS = "0xFC81e0Fe61BFc1dA55D2d7e3406fb0C34482f586";

export const baseBeatTapAddress = (process.env.NEXT_PUBLIC_BASE_BEAT_TAP_ADDRESS ?? DEFAULT_BASE_BEAT_TAP_ADDRESS) as Address;

export const isContractConfigured = baseBeatTapAddress !== ZERO_ADDRESS;
