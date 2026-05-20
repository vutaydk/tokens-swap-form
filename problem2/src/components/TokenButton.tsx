import { Token } from "../types";
import TokenIcon from "./TokenIcon";

interface TokenButtonProps {
  token: Token | null;
  onOpen: () => void;
}

const TokenButton = ({ token, onOpen }: TokenButtonProps) => (
  <button
    type="button"
    className="token-selector"
    onClick={onOpen}
    aria-label={
      token ? `Change token, currently ${token.symbol}` : "Select token"
    }
  >
    {token && <TokenIcon symbol={token.symbol} size={24} />}
    <span>{token ? token.symbol : "Select"}</span>
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      aria-hidden="true"
    >
      <polyline points="6 9 12 15 18 9" />
    </svg>
  </button>
);

export default TokenButton;
