import { Attribution } from "ox/erc8021";
import { injected } from "@wagmi/core";
import type { coinbaseWallet as typedCoinbaseWallet } from "@wagmi/connectors";
// Narrow runtime import avoids pulling unused WalletConnect and MetaMask SDK modules from the connector barrel.
// @ts-expect-error The package does not publish a subpath export for this implementation file.
import { coinbaseWallet as runtimeCoinbaseWallet } from "../node_modules/@wagmi/connectors/dist/esm/coinbaseWallet.js";
import { createConfig, http } from "wagmi";
import { base } from "wagmi/chains";
import type { EIP1193Provider } from "viem";

const coinbaseWallet = runtimeCoinbaseWallet as typeof typedCoinbaseWallet;
const walletProvider = (provider: (window: unknown) => InjectedProvider | undefined) => provider as never;

type InjectedProvider = EIP1193Provider & {
  providers?: InjectedProvider[];
  ethereum?: InjectedProvider;
  _metamask?: unknown;
  isApexWallet?: boolean;
  isAvalanche?: boolean;
  isBitKeep?: boolean;
  isBlockWallet?: boolean;
  isBraveWallet?: boolean;
  isCoinbaseWallet?: boolean;
  isKuCoinWallet?: boolean;
  isMathWallet?: boolean;
  isMetaMask?: boolean;
  isOneInchAndroidWallet?: boolean;
  isOneInchIOSWallet?: boolean;
  isOkxWallet?: boolean;
  isOKExWallet?: boolean;
  isOpera?: boolean;
  isPhantom?: boolean;
  isRabby?: boolean;
  isTokenPocket?: boolean;
  isTokenary?: boolean;
  isUniswapWallet?: boolean;
  isZerion?: boolean;
};

type WalletWindow = Window & {
  ethereum?: InjectedProvider;
  okxwallet?: InjectedProvider;
};

function asWalletWindow(window: unknown) {
  return window as WalletWindow | undefined;
}

function injectedProviders(walletWindow: WalletWindow | undefined) {
  const ethereum = walletWindow?.ethereum;
  return (ethereum?.providers ?? [ethereum]).filter(Boolean) as InjectedProvider[];
}

function findOkxProvider(window: unknown) {
  const walletWindow = asWalletWindow(window);
  const okxwallet = walletWindow?.okxwallet;

  if (okxwallet?.isOkxWallet) return okxwallet.ethereum ?? okxwallet;

  return injectedProviders(walletWindow).find((provider) => Boolean(provider.isOkxWallet || provider.isOKExWallet));
}

function findMetaMaskProvider(window: unknown) {
  const walletWindow = asWalletWindow(window);
  const okxProvider = findOkxProvider(window);
  const fakeMetaMaskFlags: (keyof InjectedProvider)[] = [
    "isApexWallet",
    "isAvalanche",
    "isBitKeep",
    "isBlockWallet",
    "isBraveWallet",
    "isCoinbaseWallet",
    "isKuCoinWallet",
    "isMathWallet",
    "isOneInchAndroidWallet",
    "isOneInchIOSWallet",
    "isOkxWallet",
    "isOKExWallet",
    "isOpera",
    "isPhantom",
    "isRabby",
    "isTokenPocket",
    "isTokenary",
    "isUniswapWallet",
    "isZerion",
  ];

  return injectedProviders(walletWindow).find((provider) => {
    if (!provider.isMetaMask) return false;
    if (provider === okxProvider || provider === walletWindow?.okxwallet) return false;

    return !fakeMetaMaskFlags.some((flag) => Boolean(provider[flag]));
  });
}

export const BUILDER_CODE = process.env.NEXT_PUBLIC_BASE_BUILDER_CODE ?? "";

export const DATA_SUFFIX = (BUILDER_CODE
  ? Attribution.toDataSuffix({
      codes: [BUILDER_CODE],
    })
  : "0x") as `0x${string}`;

export const wagmiConfig = createConfig({
  chains: [base],
  connectors: [
    injected({
      shimDisconnect: true,
      target: {
        id: "base-app",
        name: "Base App / Browser",
        provider: walletProvider((window) => asWalletWindow(window)?.ethereum),
      },
    }),
    injected({
      shimDisconnect: true,
      target: {
        id: "metamask",
        name: "MetaMask",
        provider: walletProvider(findMetaMaskProvider),
      },
    }),
    injected({
      shimDisconnect: true,
      target: {
        id: "okx",
        name: "OKX Wallet",
        provider: walletProvider(findOkxProvider),
      },
    }),
    coinbaseWallet({
      appName: "Base Beat Tap",
      preference: "all",
      version: "4",
    }),
  ],
  transports: {
    [base.id]: http(process.env.NEXT_PUBLIC_BASE_RPC_URL),
  },
  ssr: true,
  multiInjectedProviderDiscovery: true,
  dataSuffix: DATA_SUFFIX,
});
