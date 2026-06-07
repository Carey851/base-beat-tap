"use client";

import { Activity, Cable, Disc3, Music2, Plug, Radio, Unplug, Wallet, X, Zap } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import type { BaseError, Connector } from "wagmi";
import {
  useAccount,
  useConnect,
  useDisconnect,
  useReadContract,
  useReadContracts,
  useSwitchChain,
  useWaitForTransactionReceipt,
  useWriteContract,
} from "wagmi";
import { base } from "wagmi/chains";
import { BEATS, type BeatId, baseBeatTapAbi, baseBeatTapAddress, isContractConfigured } from "@/lib/contract";
import { DATA_SUFFIX } from "@/lib/wagmi";

function formatCount(value?: bigint | number) {
  if (value === undefined) return "--";
  return Number(value).toLocaleString("en-US");
}

function shortAddress(address?: string) {
  if (!address) return "No wallet";
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

function connectorRdns(connector: Connector) {
  const rdns = connector.rdns;
  return (Array.isArray(rdns) ? rdns.join(" ") : rdns ?? "") as string;
}

function connectorScore(connector: Connector, wallet: "base" | "metamask" | "okx" | "coinbase") {
  const id = connector.id.toLowerCase();
  const name = connector.name.toLowerCase();
  const rdns = connectorRdns(connector).toLowerCase();
  const haystack = `${id} ${name} ${rdns}`;

  if (wallet === "base") return id === "base-app" ? 100 : name.includes("base app") ? 90 : -1;
  if (wallet === "metamask") {
    if (haystack.includes("okx") || haystack.includes("okex")) return -1;
    if (rdns.includes("io.metamask")) return 100;
    if (name === "metamask" || id === "metamask") return 80;
    return haystack.includes("metamask") ? 60 : -1;
  }
  if (wallet === "okx") {
    if (rdns.includes("com.okex.wallet") || rdns.includes("com.okx.wallet")) return 100;
    if (id === "okx" || name.includes("okx")) return 80;
    return haystack.includes("okex") ? 60 : -1;
  }
  if (wallet === "coinbase") {
    if (connector.type === "coinbaseWallet") return 100;
    if (rdns.includes("com.coinbase.wallet")) return 90;
    return haystack.includes("coinbase") ? 70 : -1;
  }

  return -1;
}

function pickConnector(connectors: readonly Connector[], wallet: "base" | "metamask" | "okx" | "coinbase") {
  return connectors
    .map((connector) => ({ connector, score: connectorScore(connector, wallet) }))
    .filter((item) => item.score >= 0)
    .sort((a, b) => b.score - a.score)[0]?.connector;
}

function walletLabel(connector: Connector) {
  const score = {
    base: connectorScore(connector, "base"),
    metamask: connectorScore(connector, "metamask"),
    okx: connectorScore(connector, "okx"),
    coinbase: connectorScore(connector, "coinbase"),
  };

  if (score.base >= 0) return "Base App / Browser";
  if (score.metamask >= 0) return "MetaMask";
  if (score.okx >= 0) return "OKX Wallet";
  if (score.coinbase >= 0) return "Coinbase Wallet";

  return connector.name;
}

export default function Home() {
  const [selectedBeat, setSelectedBeat] = useState<BeatId>(0);
  const [walletMenuOpen, setWalletMenuOpen] = useState(false);
  const { address, isConnected, chainId } = useAccount();
  const { connectors, connect, isPending: isConnecting } = useConnect();
  const { disconnect } = useDisconnect();
  const { switchChain, isPending: isSwitchingChain } = useSwitchChain();
  const { data: hash, error, isPending: isWriting, writeContractAsync, reset } = useWriteContract();

  const wrongChain = isConnected && chainId !== base.id;

  const commonRead = {
    address: baseBeatTapAddress,
    abi: baseBeatTapAbi,
    chainId: base.id,
  } as const;

  const { data: latestBeatData, refetch: refetchLatestBeat } = useReadContract({
    ...commonRead,
    functionName: "latestBeat",
    args: address ? [address] : undefined,
    query: {
      enabled: isContractConfigured && Boolean(address),
    },
  });

  const { data: userBeatsData, refetch: refetchUserBeats } = useReadContract({
    ...commonRead,
    functionName: "userBeats",
    args: address ? [address] : undefined,
    query: {
      enabled: isContractConfigured && Boolean(address),
    },
  });

  const { data: totalBeatsData, refetch: refetchTotalBeats } = useReadContract({
    ...commonRead,
    functionName: "totalBeats",
    query: {
      enabled: isContractConfigured,
    },
  });

  const { data: beatMixData, refetch: refetchBeatMix } = useReadContracts({
    contracts: BEATS.map((beat) => ({
      ...commonRead,
      functionName: "beatCounts",
      args: [beat.id],
    })),
    query: {
      enabled: isContractConfigured,
    },
  });

  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({
    hash,
    chainId: base.id,
    query: {
      enabled: Boolean(hash),
    },
  });

  useEffect(() => {
    if (!isConfirmed) return;

    void refetchLatestBeat();
    void refetchUserBeats();
    void refetchTotalBeats();
    void refetchBeatMix();
  }, [isConfirmed, refetchBeatMix, refetchLatestBeat, refetchTotalBeats, refetchUserBeats]);

  const transactionStatus = error ? "Failed" : isWriting ? "Pending" : isConfirming ? "Confirming" : isConfirmed ? "Success" : hash ? "Submitted" : "Ready";

  const activeBeat = useMemo(() => {
    const beatId = Number(latestBeatData ?? selectedBeat) as BeatId;
    return BEATS.find((beat) => beat.id === beatId) ?? BEATS[0];
  }, [latestBeatData, selectedBeat]);

  async function handleDropBeat() {
    reset();
    await writeContractAsync({
      address: baseBeatTapAddress,
      abi: baseBeatTapAbi,
      functionName: "dropBeat",
      args: [selectedBeat],
      chainId: base.id,
      dataSuffix: DATA_SUFFIX,
    });
  }

  function handlePrimaryAction() {
    if (!isConnected) {
      setWalletMenuOpen(true);
      return;
    }

    if (wrongChain) {
      switchChain({ chainId: base.id });
      return;
    }

    if (!isContractConfigured) return;

    void handleDropBeat();
  }

  function handleConnect(connector: Connector) {
    connect({ connector, chainId: base.id });
    setWalletMenuOpen(false);
  }

  const busy = isWriting || isConfirming || isSwitchingChain;
  const canUsePrimaryAction = !busy && (!isConnected || wrongChain || isContractConfigured);
  const primaryActionLabel = !isConnected
    ? "Connect Wallet"
    : wrongChain
      ? isSwitchingChain
        ? "Switching"
        : "Switch to Base"
      : !isContractConfigured
        ? "Contract Not Set"
        : isWriting
          ? "Sending"
          : isConfirming
            ? "Confirming"
            : "Drop Beat";
  const walletOptions = [
    pickConnector(connectors, "base"),
    pickConnector(connectors, "metamask"),
    pickConnector(connectors, "okx"),
    pickConnector(connectors, "coinbase"),
  ].filter((connector): connector is Connector => Boolean(connector));

  return (
    <main className="min-h-screen px-3 py-4 text-white sm:px-5 sm:py-8">
      <section className="mx-auto flex w-full max-w-3xl flex-col gap-4 rounded-lg border border-console-line bg-console-panel/90 p-3 shadow-panel-glow sm:p-5">
        <header className="flex items-center justify-between gap-3 border-b border-console-line pb-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.22em] text-base-cyan">
              <Disc3 className="h-4 w-4" />
              Base Beat Tap
            </div>
            <h1 className="mt-1 text-2xl font-black uppercase leading-none text-white sm:text-4xl">Drop Beat</h1>
          </div>
          <div className="flex shrink-0 items-center gap-2 rounded-md border border-console-line bg-console-black px-3 py-2 font-mono text-xs">
            <span className={`h-2.5 w-2.5 rounded-full ${isConnected ? "bg-acid-lime shadow-lime-soft" : "bg-acid-magenta"}`} />
            {isConnected ? "LIVE" : "IDLE"}
          </div>
        </header>

        <div className="grid gap-3 md:grid-cols-[1fr_0.85fr]">
          <section className="rounded-md border border-console-line bg-console-black p-3">
            <div className="mb-3 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 font-mono text-xs uppercase text-slate-300">
                <Music2 className="h-4 w-4 text-acid-lime" />
                Beat Pads
              </div>
              <div className="font-mono text-xs text-slate-400">BPM 120</div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              {BEATS.map((beat) => {
                const selected = selectedBeat === beat.id;

                return (
                  <button
                    key={beat.id}
                    type="button"
                    onClick={() => setSelectedBeat(beat.id)}
                    className={`min-h-24 rounded-md border p-3 text-left transition active:scale-[0.98] ${
                      selected
                        ? "border-acid-lime bg-base-blue/35 text-white shadow-lime-soft"
                        : "border-console-line bg-console-rail text-slate-200 hover:border-base-cyan"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-xs font-bold" style={{ color: beat.color }}>
                        {beat.short}
                      </span>
                      <span className={`h-2.5 w-2.5 rounded-full ${selected ? "bg-acid-lime" : "bg-slate-600"}`} />
                    </div>
                    <div className="mt-4 text-xl font-black uppercase">{beat.name}</div>
                    <div className="mt-3 grid grid-cols-8 gap-1">
                      {beat.pattern.map((step, index) => (
                        <span
                          key={`${beat.name}-${index}`}
                          className={`h-5 rounded-sm border border-console-line ${step ? "bg-base-cyan" : "bg-slate-800"}`}
                        />
                      ))}
                    </div>
                  </button>
                );
              })}
            </div>

              <button
                type="button"
                onClick={handlePrimaryAction}
                disabled={!canUsePrimaryAction}
                className="mt-3 flex h-14 w-full items-center justify-center gap-2 rounded-md border border-acid-lime bg-acid-lime px-4 font-mono text-sm font-black uppercase text-console-black transition hover:bg-white disabled:cursor-not-allowed disabled:border-console-line disabled:bg-slate-700 disabled:text-slate-400"
              >
                <Zap className="h-5 w-5" />
              {primaryActionLabel}
              </button>
          </section>

          <aside className="grid gap-3">
            <section className="rounded-md border border-console-line bg-console-black p-3">
              <div className="mb-3 flex items-center gap-2 font-mono text-xs uppercase text-slate-300">
                <Cable className="h-4 w-4 text-base-cyan" />
                Wallet Status
              </div>
              <div className="relative flex items-center justify-between gap-2 rounded-md bg-console-rail p-3">
                <div className="min-w-0">
                  <div className="truncate font-mono text-sm text-white">{shortAddress(address)}</div>
                  <div className="mt-1 text-xs text-slate-400">{wrongChain ? "Switch to Base" : isConnected ? "Connected on Base" : "Choose a wallet"}</div>
                </div>
                {isConnected ? (
                  <button
                    type="button"
                    onClick={() => disconnect()}
                    className="grid h-10 w-10 place-items-center rounded-md border border-console-line bg-console-black text-slate-200"
                    aria-label="Disconnect wallet"
                  >
                    <Unplug className="h-5 w-5" />
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => setWalletMenuOpen((open) => !open)}
                    disabled={isConnecting}
                    className="grid h-10 w-10 place-items-center rounded-md border border-base-cyan bg-base-blue text-white disabled:bg-slate-700"
                    aria-label="Connect wallet"
                  >
                    <Plug className="h-5 w-5" />
                  </button>
                )}
                {walletMenuOpen && !isConnected && (
                  <div className="absolute right-0 top-14 z-20 w-full rounded-md border border-console-line bg-console-black p-2 shadow-panel-glow sm:w-72">
                    <div className="mb-2 flex items-center justify-between px-1 font-mono text-xs uppercase text-slate-300">
                      <span>Select Wallet</span>
                      <button
                        type="button"
                        onClick={() => setWalletMenuOpen(false)}
                        className="grid h-7 w-7 place-items-center rounded-md border border-console-line text-slate-300"
                        aria-label="Close wallet menu"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                    <div className="grid gap-2">
                      {walletOptions.map((connector) => (
                        <button
                          key={connector.uid}
                          type="button"
                          onClick={() => handleConnect(connector)}
                          disabled={isConnecting}
                          className="flex h-11 items-center justify-between rounded-md border border-console-line bg-console-rail px-3 font-mono text-xs font-bold uppercase text-white transition hover:border-base-cyan disabled:opacity-50"
                        >
                            <span>{walletLabel(connector)}</span>
                          <Wallet className="h-4 w-4 text-acid-lime" />
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </section>

            <section className="grid grid-cols-2 gap-2">
              <Metric label="My Beat" value={activeBeat.name} accent={activeBeat.color} />
              <Metric label="My Drops" value={formatCount(userBeatsData)} accent="#b7ff4a" />
              <Metric label="Total Beats" value={formatCount(totalBeatsData)} accent="#4cc9ff" />
              <Metric label="Last Transaction" value={transactionStatus} accent={isConfirmed ? "#b7ff4a" : error ? "#ff4dd8" : "#4cc9ff"} compact />
            </section>
          </aside>
        </div>

        <section className="rounded-md border border-console-line bg-console-black p-3">
          <div className="mb-3 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 font-mono text-xs uppercase text-slate-300">
              <Activity className="h-4 w-4 text-acid-magenta" />
              Beat Mix
            </div>
            <Radio className="h-4 w-4 text-acid-lime" />
          </div>
          <div className="grid gap-2">
            {BEATS.map((beat, index) => {
              const count = beatMixData?.[index]?.result ?? 0n;
              const total = totalBeatsData ?? 0n;
              const percent = total > 0n ? Math.round((Number(count) / Number(total)) * 100) : 0;

              return (
                <div key={beat.id} className="grid grid-cols-[4rem_1fr_3.5rem] items-center gap-2 font-mono text-xs">
                  <span className="font-bold uppercase" style={{ color: beat.color }}>
                    {beat.name}
                  </span>
                  <div className="h-7 overflow-hidden rounded-sm border border-console-line bg-console-rail">
                    <div
                      className="h-full min-w-1 transition-all"
                      style={{
                        width: `${percent}%`,
                        background: `linear-gradient(90deg, ${beat.color}, #0052ff)`,
                      }}
                    />
                  </div>
                  <span className="text-right text-slate-300">{formatCount(count)}</span>
                </div>
              );
            })}
          </div>
        </section>

        {(!isContractConfigured || error || wrongChain) && (
          <div className="rounded-md border border-acid-magenta/70 bg-acid-magenta/10 p-3 font-mono text-xs text-slate-100">
            {!isContractConfigured && "Set NEXT_PUBLIC_BASE_BEAT_TAP_ADDRESS to your deployed BaseBeatTap contract address."}
            {wrongChain && "Connected wallet is not on Base mainnet."}
            {error && (error as BaseError).shortMessage}
          </div>
        )}
        {hash && (
          <div className="rounded-md border border-console-line bg-console-black p-3 font-mono text-xs text-slate-300">
            Transaction hash: <span className="break-all text-base-cyan">{hash}</span>
          </div>
        )}
      </section>
    </main>
  );
}

function Metric({ label, value, accent, compact = false }: { label: string; value: string; accent: string; compact?: boolean }) {
  return (
    <div className="min-h-24 rounded-md border border-console-line bg-console-black p-3">
      <div className="font-mono text-[0.68rem] uppercase text-slate-400">{label}</div>
      <div className={`mt-3 break-words font-mono font-black uppercase leading-tight ${compact ? "text-sm" : "text-2xl"}`} style={{ color: accent }}>
        {value}
      </div>
    </div>
  );
}
