type Blockchain = 'Osmosis' | 'Ethereum' | 'Arbitrum' | 'Zilliqa' | 'Neo';

interface WalletBalance {
  currency: string;
  amount: number;
  blockchain: Blockchain;
}

interface FormattedWalletBalance extends WalletBalance {
  formatted: string;
  usdValue: number;
}

const BLOCKCHAIN_PRIORITY: Record<Blockchain, number> = {
  Osmosis:  100,
  Ethereum:  50,
  Arbitrum:  30,
  Zilliqa:   20,
  Neo:       20,
}

const getPriority = (blockchain: Blockchain): number =>
  BLOCKCHAIN_PRIORITY[blockchain] ?? -99


// Assuming `BoxProps`, `useWalletBalances`, and `usePrices` are defined elsewhere in the codebase
const WalletPage: React.FC<BoxProps> = ({ ...rest }) => {
  const balances = useWalletBalances()
  const prices   = usePrices()

  const formattedBalances = useMemo((): FormattedWalletBalance[] => {
    return balances
      .map(balance => ({ balance, priority: getPriority(balance.blockchain) }))
      .filter(({ priority, balance }) => priority > -99 && balance.amount > 0)
      .sort((a, b) => b.priority - a.priority || 0)
      .map(({ balance }) => ({
        ...balance,
        formatted: balance.amount.toFixed(2),
        usdValue:  (prices[balance.currency] ?? 0) * balance.amount,            // moved here — prices dep is now accurate
      }))
  }, [balances, prices])

  return (
    <div {...rest}>
      {formattedBalances.map(balance => (
        <WalletRow
          className={classes.row}
          key={balance.currency}
          amount={balance.amount}
          usdValue={balance.usdValue}
          formattedAmount={balance.formatted}
        />
      ))}
    </div>
  )
}