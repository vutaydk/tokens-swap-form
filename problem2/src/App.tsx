import { useState, useEffect, useCallback } from "react";
import { EXCHANGE_RATE_API_URL } from "./utils/constants";
import SwapForm from "./components/SwapForm";
import TokenModal from "./components/TokenModal";
import { Token } from "./types";

function App() {
  const [tokens, setTokens] = useState<Token[]>([]);
  const [fromToken, setFromToken] = useState<Token | null>(null);
  const [toToken, setToToken] = useState<Token | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeSelector, setActiveSelector] = useState<"from" | "to" | null>(
    null,
  );

  const fetchPrices = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch(EXCHANGE_RATE_API_URL);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data = await response.json();

      const tokenMap = new Map<string, Token>();
      data.forEach((item: Token) => {
        if (item.price && item.currency) {
          tokenMap.set(item.currency, {
            symbol: item.currency,
            price: item.price,
            date: item.date,
          });
        }
      });

      const tokenList = Array.from(tokenMap.values()).sort((a, b) =>
        a.symbol.localeCompare(b.symbol),
      );

      setTokens(tokenList);

      if (tokenList.length >= 2) {
        setLastUpdated(new Date());
        setFromToken((prev) => {
          if (!prev)
            return tokenList.find((t) => t.symbol === "ETH") || tokenList[0];
          return tokenList.find((t) => t.symbol === prev.symbol) || prev;
        });
        setToToken((prev) => {
          if (!prev)
            return tokenList.find((t) => t.symbol === "USDC") || tokenList[1];
          return tokenList.find((t) => t.symbol === prev.symbol) || prev;
        });
      }
      return tokenList;
    } catch (err) {
      setError("Failed to load token prices. Please refresh.");
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPrices();
  }, [fetchPrices]);

  const openModal = (side: "from" | "to") => {
    setActiveSelector(side);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setActiveSelector(null);
  };

  const handleSelectToken = (token: Token) => {
    if (activeSelector === "from") setFromToken(token);
    else setToToken(token);
    closeModal();
  };

  const handleSwapTokens = () => {
    setFromToken((prev) => {
      setToToken(prev);
      return toToken;
    });
  };

  return (
    <div className="w-full max-w-[480px] p-4">
      <div className="swap-card">
        <div className="flex justify-between items-center px-4 py-3 mb-2">
          <h2 className="text-base font-medium text-white">Swap</h2>
        </div>
        <SwapForm
          fromToken={fromToken}
          toToken={toToken}
          onOpenModal={openModal}
          onSwapTokens={handleSwapTokens}
          isLoading={isLoading}
          error={error}
          fetchPrices={fetchPrices}
          lastUpdated={lastUpdated}
        />
      </div>

      {isModalOpen && (
        <TokenModal
          tokens={tokens}
          onClose={closeModal}
          onSelect={handleSelectToken}
          fromToken={fromToken}
          toToken={toToken}
          activeSelector={activeSelector}
        />
      )}
    </div>
  );
}

export default App;
