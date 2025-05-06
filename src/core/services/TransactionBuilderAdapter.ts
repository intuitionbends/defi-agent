import winston from "winston";
import { YieldSuggestionIntent } from "../../models/yield_suggestion_intent";

export class TransactionBuilderAdapter {
  private logger: winston.Logger;

  constructor(logger: winston.Logger) {
    this.logger = logger;
  }

  async buildTxData(yieldIntent: YieldSuggestionIntent): Promise<string> {
    return "abc";

    // TODO: replace with actual tx builder
    // const transactionData = await txBuilder.buildStakeTransaction({
    //   tokens: [yieldIntent.suggestion!.symbol],
    //   amounts: [yieldIntent.assetAmount],
    //   protocol: yieldIntent.suggestion!.project,
    //   userAddress: yieldIntent.walletAddress,
    // });

    // return transactionData;
  }
}
