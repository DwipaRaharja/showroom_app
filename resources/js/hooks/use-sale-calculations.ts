export function useSaleCalculations({
    dealPrice,
    downPayment,
    tradeInPrice,
    leasingBonus,
    totalCapital,
}: {
    dealPrice: string;
    downPayment: string;
    tradeInPrice: string;
    leasingBonus: string;
    totalCapital: number;
}) {
    const numDealPrice = Number(dealPrice) || 0;
    const numDownPayment = Number(downPayment) || 0;
    const numFinanceAmount = Math.max(0, numDealPrice - numDownPayment);
    const numTradeInPrice = Number(tradeInPrice) || 0;
    const numLeasingBonus = Number(leasingBonus) || 0;

    const estimatedProfit = numDealPrice + numLeasingBonus - totalCapital;
    const numRemainingTempo = Math.max(0, numDealPrice - numDownPayment);
    const numRemainingTradeIn = Math.max(
        0,
        numDealPrice - numTradeInPrice - numDownPayment,
    );

    return {
        numDealPrice,
        numDownPayment,
        numFinanceAmount,
        numTradeInPrice,
        numLeasingBonus,
        estimatedProfit,
        numRemainingTempo,
        numRemainingTradeIn,
    };
}
