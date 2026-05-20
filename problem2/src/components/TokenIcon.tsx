import { type SyntheticEvent } from "react";
import { ICON_BASE_URL } from "../utils/constants";

interface TokenIconProps {
  symbol: string;
  size?: number;
}

const FALLBACK_ICON = (letter: string) =>
  `data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' width='36' height='36'>` +
  `<rect width='36' height='36' rx='18' fill='%23293249'/>` +
  `<text x='18' y='24' text-anchor='middle' fill='white' font-size='14'>${letter}</text></svg>`;

const handleImageError = (
  e: SyntheticEvent<HTMLImageElement>,
  symbol: string,
) => {
  e.currentTarget.src = FALLBACK_ICON(symbol.charAt(0));
};

const TokenIcon = ({ symbol, size = 24 }: TokenIconProps) => (
  <img
    src={`${ICON_BASE_URL}${symbol}.svg`}
    alt={symbol}
    width={size}
    height={size}
    className="rounded-full"
    onError={(e) => handleImageError(e, symbol)}
  />
);

export default TokenIcon;
