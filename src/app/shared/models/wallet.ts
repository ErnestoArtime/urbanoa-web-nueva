export interface Wallet {
  balance: number;
  mainCard: {
    brand: string;
    last4: string;
    expiryDate: string;
    cardholderName: string;
  };
}
