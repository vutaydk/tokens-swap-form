import { useState, useEffect, useCallback, useMemo } from "react";
import { ICON_BASE_URL, EXCHANGE_RATE_MAX_AGE } from "../utils/constants";
import { Token } from "../types";
import TokenButton from "./TokenButton";

interface SwapFormProps {
  fromToken: Token | null;
  toToken: Token | null;
  onOpenModal: (side: "from" | "to") => void;
  onSwapTokens: () => void;
  isLoading: boolean;
  error: string | null;
  fetchPrices: () => Promise<void>;
  lastUpdated: Date | null;
}

const trimDecimals = (val: number, digits = 6): string =>
  val.toFixed(digits).replace(/\.?0+$/, "");

const formatUsd = (val: number): string =>
  `$${val.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

function SwapForm({
  fromToken,
  toToken,
  onOpenModal,
  onSwapTokens,
  isLoading,
  error,
  fetchPrices,
  lastUpdated,
}: SwapFormProps) {
  const [inputAmount, setInputAmount] = useState("");
  const [outputAmount, setOutputAmount] = useState("");
  const [fromAmountUsd, setFromAmountUsd] = useState("$0.00");
  const [toAmountUsd, setToAmountUsd] = useState("$0.00");
  const [validationError, setValidationError] = useState<string | null>(null);

  const calculate = useCallback(
    async (source: "from" | "to", valStr: string, signal?: AbortSignal) => {
      if (signal?.aborted) return;

      setValidationError(null);
      if (!fromToken || !toToken) return;
      if (fromToken.symbol === toToken.symbol) {
        setValidationError("Cannot swap the same token");
        return;
      }

      const val = parseFloat(valStr);
      if (!valStr || isNaN(val)) {
        source === "from" ? setOutputAmount("") : setInputAmount("");
        setFromAmountUsd("$0.00");
        setToAmountUsd("$0.00");
        return;
      }
      if (val <= 0) {
        setValidationError("Amount must be greater than zero");
        return;
      }

      const now = new Date();
      if (
        !lastUpdated ||
        now.getTime() - lastUpdated.getTime() >= EXCHANGE_RATE_MAX_AGE
      ) {
        await fetchPrices();
      }

      const fromPrice = fromToken.price;
      const toPrice = toToken.price;

      if (source === "from") {
        const usdValue = val * fromPrice;
        setOutputAmount(trimDecimals(usdValue / toPrice));
        setFromAmountUsd(formatUsd(usdValue));
        setToAmountUsd(formatUsd(usdValue));
      } else {
        const usdValue = val * toPrice;
        setInputAmount(trimDecimals(usdValue / fromPrice));
        setToAmountUsd(formatUsd(usdValue));
        setFromAmountUsd(formatUsd(usdValue));
      }
    },
    [fromToken, toToken, lastUpdated, fetchPrices],
  );

  useEffect(() => {
    if (!inputAmount) return;
    const controller = new AbortController();
    calculate("from", inputAmount, controller.signal).catch(console.error);
    return () => controller.abort();
  }, [fromToken, toToken]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setInputAmount(val);
    calculate("from", val).catch(console.error);
  };

  const handleOutputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setOutputAmount(val);
    calculate("to", val).catch(console.error);
  };

  const rateInfo = useMemo(() => {
    if (!fromToken || !toToken) return "";
    return `1 ${fromToken.symbol} = ${trimDecimals(fromToken.price / toToken.price)} ${toToken.symbol}`;
  }, [fromToken, toToken]);

  const handleOpenFromModal = useCallback(
    () => onOpenModal("from"),
    [onOpenModal],
  );
  const handleOpenToModal = useCallback(() => onOpenModal("to"), [onOpenModal]);

  return (
    <form id="swap-form" className="flex flex-col" noValidate>
      <div className="input-group">
        <label htmlFor="input-amount" className="input-label">
          From
        </label>
        <div className="flex justify-between items-center gap-3">
          <input
            type="number"
            id="input-amount"
            className="input-amount"
            placeholder="0"
            step="any"
            min="0"
            autoComplete="off"
            value={inputAmount}
            onChange={handleInputChange}
          />
          <TokenButton token={fromToken} onOpen={handleOpenFromModal} />
        </div>
        <div className="text-xs text-primary mt-2">{fromAmountUsd}</div>
      </div>

      <div className="flex justify-center -my-3.5 z-10">
        <button type="button" className="swap-arrow-btn" onClick={onSwapTokens}>
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <line x1="12" y1="5" x2="12" y2="19" />
            <polyline points="19 12 12 19 5 12" />
          </svg>
        </button>
      </div>

      <div className="input-group">
        <label htmlFor="output-amount" className="input-label">
          To
        </label>
        <div className="flex justify-between items-center gap-3">
          <input
            type="number"
            id="output-amount"
            className="input-amount"
            placeholder="0"
            step="any"
            min="0"
            autoComplete="off"
            value={outputAmount}
            onChange={handleOutputChange}
          />
          <TokenButton token={toToken} onOpen={handleOpenToModal} />
        </div>
        <div className="text-xs text-primary mt-2">{toAmountUsd}</div>
      </div>

      <div className="text-sm text-primary pt-3 px-4 flex justify-between items-center min-h-[32px]">
        {rateInfo}
      </div>

      <div className="text-error text-sm pt-2 px-4 text-center min-h-[28px]">
        {error || validationError}
      </div>

      <div className="py-4 flex justify-center items-center w-full h-full min-h-[56px]">
        {isLoading && <span className="loader" />}
      </div>
    </form>
  );
}

export default SwapForm;
