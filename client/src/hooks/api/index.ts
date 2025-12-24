/**
 * API Hooks Exports
 * 
 * Usage:
 * import { useStock, useDefaultStocks, useAuth } from '@/hooks/api'
 */

// Unified Chart (Stocks & Crypto)
export {
  useChart,
  chartKeys,
} from './use-chart';

// Stocks
export {
  useStock,
  useStocks,
  useDefaultStocks,
  useStockHistory,
  useStockDetails,
  useStockSearch,
  usePrefetchStock,
  useInvalidateStocks,
  stocksKeys,
} from './use-stocks';

// Crypto
export {
  useCrypto,
  useCryptos,
  useDefaultCryptos,
  useCryptoSearch,
  useInvalidateCrypto,
  cryptoKeys,
} from './use-crypto';

// Currencies
export {
  useExchangeRates,
  useDefaultRates,
  useCurrencyPairs,
  useConvertCurrency,
  useCachedConversion,
  useInvalidateCurrencies,
  currenciesKeys,
} from './use-currencies';

// Auth
export {
  useCurrentUser,
  useSignup,
  useLogin,
  useLogout,
  useCheckSession,
  useAuth,
  authKeys,
} from './use-auth';

// Preferences
export {
  usePreferences,
  useUpdatePreferences,
  useResetPreferences,
  useUpdateStockWatchlist,
  useUpdateCryptoWatchlist,
  useAddToStockWatchlist,
  useAddToCryptoWatchlist,
  preferencesKeys,
} from './use-preferences';

// News
export { useNews, useLoadMoreNews } from './use-news';

// Portfolio
export {
  usePortfolio,
  useAddPortfolioEntry,
  useUpdatePortfolioEntry,
  useDeletePortfolioEntry,
  useInvalidatePortfolio,
  portfolioKeys,
} from './use-portfolio';

