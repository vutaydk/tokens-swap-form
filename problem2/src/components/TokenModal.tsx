import { useState, useMemo, useCallback, useEffect, useRef } from "react";
import { Token } from "../types";
import TokenIcon from "./TokenIcon";

interface TokenModalProps {
  tokens: Token[];
  onClose: () => void;
  onSelect: (token: Token) => void;
  fromToken: Token | null;
  toToken: Token | null;
  activeSelector: "from" | "to" | null;
}

const formatPrice = (price: number): string =>
  `$${price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 6 })}`;

function TokenModal({
  tokens,
  onClose,
  onSelect,
  fromToken,
  toToken,
  activeSelector,
}: TokenModalProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const searchRef = useRef<HTMLInputElement>(null);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  // Focus search input on mount
  useEffect(() => {
    searchRef.current?.focus();
  }, []);

  const filteredTokens = useMemo(() => {
    if (!searchTerm.trim()) return tokens;
    const term = searchTerm.toLowerCase();
    return tokens.filter((t) => t.symbol.toLowerCase().includes(term));
  }, [tokens, searchTerm]);

  const handleOverlayClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (e.target === e.currentTarget) onClose();
    },
    [onClose],
  );

  // A token is disabled if it's already selected on the other side
  const isDisabled = useCallback(
    (token: Token): boolean => {
      if (activeSelector === "from") return toToken?.symbol === token.symbol;
      if (activeSelector === "to") return fromToken?.symbol === token.symbol;
      return false;
    },
    [activeSelector, fromToken, toToken],
  );

  return (
    <div
      className="modal-overlay"
      onClick={handleOverlayClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      <div className="modal-content">
        {/* Header */}
        <div className="flex justify-between items-center p-5 border-b border-[#293249]">
          <h3 id="modal-title" className="text-base font-medium text-white">
            Select a token
          </h3>
          <button
            className="modal-close-btn"
            onClick={onClose}
            aria-label="Close modal"
          >
            &times;
          </button>
        </div>

        {/* Search */}
        <div className="p-4 px-5">
          <input
            ref={searchRef}
            type="text"
            className="search-input"
            placeholder="Search name or paste address"
            autoComplete="off"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {/* Token list */}
        <div className="flex-1 overflow-y-auto px-2 pb-2 token-list">
          {filteredTokens.length === 0 ? (
            <div className="text-center py-5 text-sm text-secondary">
              No tokens found
            </div>
          ) : (
            filteredTokens.map((token) => {
              const disabled = isDisabled(token);
              return (
                <button
                  key={token.symbol}
                  type="button"
                  disabled={disabled}
                  className={`token-item w-full text-left ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
                  onClick={() => onSelect(token)}
                >
                  <TokenIcon symbol={token.symbol} size={36} />
                  <div className="flex flex-col">
                    <span className="text-base font-medium text-white">
                      {token.symbol}
                    </span>
                    <span className="text-xs text-secondary">
                      {token.symbol}
                    </span>
                  </div>
                  <div className="ml-auto text-right">
                    <span className="text-base text-white">
                      {formatPrice(token.price)}
                    </span>
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}

export default TokenModal;
