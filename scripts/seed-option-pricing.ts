import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const user = await prisma.user.findFirst();
  if (!user) {
    console.log("No user found. Please sign in first.");
    return;
  }

  console.log("Creating Option Volatility and Pricing book for user:", user.email);

  // PDF has 475 pages, book index starts at page 463
  // Front matter is ~12 pages, so PDF page = book page + 12
  const PAGE_OFFSET = 12;

  const book = await prisma.book.create({
    data: {
      userId: user.id,
      title: "Option Volatility and Pricing",
      author: "Sheldon Natenberg",
      sourceFile: "OptionPricing.pdf",
      pageOffset: PAGE_OFFSET,
      processingStatus: "completed",
    },
  });

  await prisma.userProgress.create({
    data: {
      oderId: user.id,
      bookId: book.id,
    },
  });

  // ============ CHAPTER 1: The Language of Options ============
  const ch1 = await prisma.branch.create({
    data: { bookId: book.id, title: "Chapter 1: The Language of Options", chapterNumber: 1 },
  });

  const c1_1 = await prisma.concept.create({
    data: {
      bookId: book.id,
      branchId: ch1.id,
      title: "Contract Specifications",
      orderInBranch: 1,
      estimatedMinutes: 12,
      startPage: 1,
      endPage: 4,
      summary: `Options are of two types: A CALL option is the right to buy or take a long position in a given asset at a fixed price on or before a specified date. A PUT option is the right to sell or take a short position.

Key terms:
- UNDERLYING: The asset to be bought or sold
- EXERCISE/STRIKE PRICE: The price at which delivery occurs
- EXPIRATION DATE: The date after which the option cannot be exercised

Unlike futures where both parties have obligations, in options all rights lie with the buyer and all obligations with the seller.`,
      content: `Options are of two types. A call option is the right to buy or take a long position in a given asset (typically a security, commodity, index, or futures contract) at a fixed price on or before a specified date. A put option is the right to sell or take a short position in a given asset.

Note the difference between an option and a futures contract. A futures contract requires delivery at a fixed price. The buyer and seller of a futures contract both have obligations which they must meet. The seller must make delivery and the buyer must take delivery of the asset. The buyer of an option, however, has a choice. He can choose to take delivery (a call) or make delivery (a put). If the buyer of an option chooses to either make or take delivery, the seller of the option is obligated to take the other side. In option trading all rights lie with the buyer and all obligations with the seller.

The asset to be bought or sold under the terms of the option is the underlying asset or, more simply, the underlying. The exercise price, or strike price, is the price at which the underlying will be delivered should the holder of an option choose to exercise his right to buy or sell. The date after which the option may no longer be exercised is the expiration date.`,
    },
  });

  const c1_2 = await prisma.concept.create({
    data: {
      bookId: book.id,
      branchId: ch1.id,
      title: "Exercise and Assignment",
      orderInBranch: 2,
      estimatedMinutes: 15,
      startPage: 4,
      endPage: 8,
      summary: `When an option holder exercises, the seller is ASSIGNED and must fulfill the contract terms.

AMERICAN OPTIONS: Can be exercised any time before expiration
EUROPEAN OPTIONS: Can only be exercised at expiration

Option value components:
- INTRINSIC VALUE: Amount credited if exercised now (never negative)
- TIME VALUE: Premium above intrinsic value

IN-THE-MONEY: Has positive intrinsic value
OUT-OF-THE-MONEY: No intrinsic value
AT-THE-MONEY: Exercise price equals underlying price`,
      content: `A trader who owns a call or a put option has the right to exercise that option prior to its expiration date, thereby converting the option into a long underlying position, in the case of a call, or a short underlying position, in the case of a put.

An option is either American, whereby the holder can exercise the option at any time prior to expiration, or European, whereby the holder can exercise the option only on expiration day. The great majority of exchange traded options throughout the world are American options.

An option's premium can be separated into two components: intrinsic value and time value. An option's intrinsic value is the amount which would be credited to the option holder's account if he were to exercise the option and close out the position against the underlying contract at the current market price.

A call will only have intrinsic value if its exercise price is less than the current market price of the underlying contract. A put will only have intrinsic value if its exercise price is greater than the current market price.

Any option which has a positive intrinsic value is said to be in-the-money. An option which has no intrinsic value is said to be out-of-the-money. An option whose exercise price is identical to the current price of the underlying is said to be at-the-money.`,
    },
  });

  const c1_3 = await prisma.concept.create({
    data: {
      bookId: book.id,
      branchId: ch1.id,
      title: "Market Integrity and Margin",
      orderInBranch: 3,
      estimatedMinutes: 10,
      startPage: 8,
      endPage: 10,
      summary: `The exchange guarantees contract performance through a hierarchy:
1. Individual trader
2. Clearing firm
3. Clearing house

MARGIN: Good-faith deposit required to ensure traders can fulfill obligations.
- Option buyers pay full premium upfront (no additional margin)
- Option sellers must post margin for potential future obligations

Margin requirements vary based on position risk and may be reduced for hedged positions.`,
      content: `An important consideration for every market participant is the integrity of the market. No trader will want to trade in a market where there is a chance that the opposing trader will default on a contract.

Each options exchange has established a progression of responsibility for the fulfillment of the terms of an option. The primary responsibility falls to the individual trader. If the seller of an option is assigned, he must be prepared to take the required position at the specified exercise price.

If an individual trader is unable to fulfill the terms of the contract, the responsibility falls to the trader's clearing firm. If the clearing firm cannot fulfill the terms, the final responsibility rests with the clearing house.

When a trader makes an opening trade on an exchange, the exchange may require the trader to deposit with the clearing house some amount of margin, or good faith capital. Such deposits ensure that if the market moves adversely, the trader will still be able to fulfill any future financial obligations.`,
    },
  });

  const c1_4 = await prisma.concept.create({
    data: {
      bookId: book.id,
      branchId: ch1.id,
      title: "Settlement Procedures",
      orderInBranch: 4,
      estimatedMinutes: 10,
      startPage: 10,
      endPage: 12,
      summary: `Two settlement methods:

STOCK-TYPE SETTLEMENT:
- Full payment required upfront
- Profits/losses unrealized until position closed
- Used for all US exchange-traded options

FUTURES-TYPE SETTLEMENT:
- No initial payment, only margin deposit
- Profits/losses realized daily (mark-to-market)
- Used for futures contracts

Important: US futures options use stock-type settlement while the underlying futures use futures-type settlement - this can create unexpected cash flow issues for hedgers.`,
      content: `Settlement procedures may vary from one exchange to another. Two methods are commonly used: stock-type settlement and futures-type settlement.

Stock-type settlement requires full and immediate payment, and profits or losses are unrealized until the position is liquidated. If a trader buys 100 shares of a $50 stock, the buyer pays the full $5,000. Profits are only realized upon sale.

Futures-type settlement requires no initial cash payment from buyer to seller. Only a margin deposit is required. All profits or losses are immediately realized through daily mark-to-market, even if the position is not liquidated.

Currently all exchange-traded options in the United States are settled like stock. Options must be paid for immediately and in full, and profits or losses are unrealized until the position is liquidated.

However, on U.S. futures options markets, the underlying contract is settled one way (futures-type) while the options are settled differently (stock-type). This can cause problems when a trader has hedged positions - even if option profits exactly offset futures losses, the option profits are paper profits while futures losses require immediate cash outlay.`,
    },
  });

  // ============ CHAPTER 2: Elementary Strategies ============
  const ch2 = await prisma.branch.create({
    data: { bookId: book.id, title: "Chapter 2: Elementary Strategies", chapterNumber: 2 },
  });

  const c2_1 = await prisma.concept.create({
    data: {
      bookId: book.id,
      branchId: ch2.id,
      title: "Simple Buy and Sell Strategies",
      orderInBranch: 1,
      estimatedMinutes: 15,
      startPage: 13,
      endPage: 16,
      summary: `Basic approach: Guess where underlying will be at expiration.

At expiration, options are worth either:
- Zero (if at or out-of-the-money)
- Intrinsic value (if in-the-money)

Profitable trades:
- Buy an option for less than its expiration value
- Sell an option for more than its expiration value

Example: If underlying at 99 rises to 108 by expiration:
- 100 call bought at 2.70 → worth 8.00 → profit 5.30
- 110 call sold at 0.45 → worthless → profit 0.45`,
      content: `The trader who enters an option market for the first time may find himself subjected to a form of "contract shock." Unlike a trader in equities or futures, whose choices are limited to a small number of instruments, an option trader must often deal with a bewildering assortment of contracts.

How might a beginning trader assess an option's value? One simple method depends on guessing where the underlying contract will be at expiration. If an option position is held to expiration, the option will be worth either zero, if it is at- or out-of-the-money, or intrinsic value (parity), if it is in-the-money.

The purchase of an option will be profitable if its trade price is less than its value at expiration. The sale of an option will be profitable if its trade price is greater than its value at expiration.`,
    },
  });

  const c2_2 = await prisma.concept.create({
    data: {
      bookId: book.id,
      branchId: ch2.id,
      title: "Risk/Reward Characteristics",
      orderInBranch: 2,
      estimatedMinutes: 15,
      startPage: 16,
      endPage: 19,
      summary: `Option positions have distinctive payoff shapes:

LONG CALL: Limited downside (premium paid), unlimited upside
LONG PUT: Limited upside risk (premium paid), large downside profit potential

SHORT CALL: Limited profit (premium), unlimited upside risk
SHORT PUT: Limited profit (premium), large downside risk

Key insight: Buyers have limited risk, unlimited reward. Sellers have limited reward, unlimited risk.

BUT: Risk/reward characteristics alone don't determine trade quality. Probability of outcomes matters equally - a small probability of unlimited loss may be acceptable.`,
      content: `The profit and loss graph of a long call position at expiration will always have the same general shape. The position will always have limited downside risk and unlimited upside profit potential.

Figures illustrate two of the most important characteristics of options: buyers of options have limited risk and potentially unlimited reward; sellers of options have limited reward and potentially unlimited risk.

At this point, new traders tend to have a common reaction. Why would anyone ever want to do anything other than buy options? After all, a buyer of options has limited risk and unlimited profit potential, while a seller of options has limited profit potential and unlimited risk.

Option traders learn that the limited or unlimited risk/reward characteristics of a trade are not the only considerations. At least as important is the probability of that unlimited profit or loss. The reward is still limited and the risk unlimited. Yet most traders would probably make the trade if the probability of loss is sufficiently small.

In addition to the potential risk and reward associated with any trade, a trader must also consider the likelihood of the various outcomes.`,
    },
  });

  const c2_3 = await prisma.concept.create({
    data: {
      bookId: book.id,
      branchId: ch2.id,
      title: "Combination Strategies",
      orderInBranch: 3,
      estimatedMinutes: 20,
      startPage: 19,
      endPage: 33,
      summary: `Combining options creates unique payoff profiles:

LONG STRADDLE (buy call + put, same strike):
- Max loss: total premium paid (if underlying at strike)
- Profits from large moves in either direction
- Use when expecting high volatility

SHORT STRADDLE (sell call + put):
- Max profit: total premium (if underlying at strike)
- Unlimited risk in both directions
- Use when expecting low volatility

STRANGLE: Like straddle but with different strikes
- Wider profitable range, lower cost

VERTICAL SPREADS: Buy and sell same type at different strikes
- Limited risk AND limited reward
- Bull spread: buy lower strike, sell higher
- Bear spread: buy higher strike, sell lower`,
      content: `When considering an option trade we need not restrict ourselves to the purchase or sale of individual options. We can also combine option positions to form new positions with their own unique characteristics.

A long straddle (buying both a call and put at the same strike) has maximum loss if both options expire worthless, which happens only if the underlying is exactly at the strike at expiration. The potential profit is unlimited in either direction.

Such a position might be sensible if we thought a large move in the underlying contract would take place in the near future, but were uncertain as to the direction.

A strangle uses different strike prices for the call and put, providing a wider profit range at lower cost but requiring a larger move to profit.

If we purchase and sell equal numbers of options of the same type, we can create positions which have both limited risk and limited reward. For example, buying a 90 call and selling a 100 call creates a bull spread. Maximum loss is the net premium paid; maximum profit is the difference in strikes minus premium.

Option traders are constantly required to make tradeoffs between risk and reward. If a potential reward is big enough, it may be worth taking a big risk. But if the potential reward is small, the accompanying risk should also be small.`,
    },
  });

  // ============ CHAPTER 3: Introduction to Theoretical Pricing Models ============
  const ch3 = await prisma.branch.create({
    data: { bookId: book.id, title: "Chapter 3: Introduction to Theoretical Pricing Models", chapterNumber: 3 },
  });

  const c3_1 = await prisma.concept.create({
    data: {
      bookId: book.id,
      branchId: ch3.id,
      title: "Expected Return and Theoretical Value",
      orderInBranch: 1,
      estimatedMinutes: 15,
      startPage: 35,
      endPage: 40,
      summary: `EXPECTED RETURN: Sum of (probability × outcome) for all possibilities

Example: Fair coin flip, win $1 on heads, lose $1 on tails
Expected return = (0.5 × $1) + (0.5 × -$1) = $0

THEORETICAL VALUE: The "fair" price where expected return = 0

For options:
- If you can buy below theoretical value → positive expected return
- If you can sell above theoretical value → positive expected return

The challenge: Determining correct probabilities for future price movements. This is where volatility estimation becomes critical.`,
      content: `Before going on to a discussion of how options are evaluated, it should first be pointed out that most people share a common characteristic: they are risk averse. If there is risk associated with an investment, most people will require a higher rate of return to compensate for this risk.

The expected return from an investment is the sum of each possible return multiplied by its probability. If we flip a fair coin and win $1 on heads and lose $1 on tails, the expected return is zero.

The theoretical value of an option is the price at which both the buyer and seller have a zero expected return over many transactions. It represents the "fair" price given the probabilities of various outcomes.

If we can purchase an option for less than its theoretical value, we have a positive expected return. If we can sell an option for more than its theoretical value, we also have a positive expected return.

The key challenge in option pricing is determining the correct probabilities for future price movements of the underlying. This is where the concept of volatility becomes essential.`,
    },
  });

  const c3_2 = await prisma.concept.create({
    data: {
      bookId: book.id,
      branchId: ch3.id,
      title: "A Simple Pricing Approach",
      orderInBranch: 2,
      estimatedMinutes: 20,
      startPage: 40,
      endPage: 46,
      summary: `Simple option pricing using discrete probability:

1. Assign probabilities to possible underlying prices at expiration
2. Calculate option value at each price (intrinsic value or zero)
3. Multiply each value by its probability
4. Sum the probability-weighted values
5. Discount to present value

Example: Stock at 100, can go to 120 (40% prob) or 80 (60% prob)
- 100 call worth: 0.4 × 20 + 0.6 × 0 = 8.00

Key insight: This approach requires knowing the probability distribution of future prices - which is determined by volatility.`,
      content: `Let's look at a simple approach to option evaluation. Suppose a stock is trading at 100 and we want to evaluate a 100 call. Assume the stock can only finish at one of five prices at expiration, each with an assigned probability.

For each possible stock price, we calculate what the call would be worth (its intrinsic value). We then multiply each value by its probability and sum the results.

This gives us the expected value of the option at expiration. To get today's value, we discount by the risk-free interest rate.

Of course, real-world pricing is more complex. Instead of five possible outcomes, there are theoretically an infinite number of possible prices. The probability distribution is continuous, not discrete.

The Black-Scholes model and other pricing models essentially perform this same calculation, but with a continuous probability distribution derived from the assumed volatility of the underlying.`,
    },
  });

  const c3_3 = await prisma.concept.create({
    data: {
      bookId: book.id,
      branchId: ch3.id,
      title: "Inputs to Pricing Models",
      orderInBranch: 3,
      estimatedMinutes: 15,
      startPage: 46,
      endPage: 50,
      summary: `Six inputs determine an option's theoretical value:

1. EXERCISE PRICE - Fixed by contract
2. TIME TO EXPIRATION - Known, decreases daily
3. UNDERLYING PRICE - Observable in market
4. INTEREST RATES - Generally known, relatively stable
5. DIVIDENDS (stocks) - Usually predictable

6. VOLATILITY - THE CRITICAL UNKNOWN
   - Must be estimated/forecast
   - Different traders may use different estimates
   - This is where skill and edge come from

The first five inputs are known or easily determined. Volatility is the key variable that separates successful option traders from unsuccessful ones.`,
      content: `A theoretical pricing model requires several inputs:

EXERCISE PRICE: Fixed as part of the contract and doesn't change.

TIME TO EXPIRATION: Known and decreases each day. Time affects option value because more time means more opportunity for the underlying to move.

UNDERLYING PRICE: Observable in the marketplace. As the underlying moves, option values change.

INTEREST RATES: These affect the carrying cost of the underlying. Higher rates increase call values and decrease put values. Generally, interest rate effects are small compared to other factors.

DIVIDENDS: For stock options, expected dividends reduce the forward price of the stock. Dividends decrease call values and increase put values.

VOLATILITY: This is the one input that must be estimated. Volatility measures the speed and magnitude of price changes in the underlying. Higher volatility increases both call and put values because there is greater chance of the option expiring in-the-money.

While the first five inputs are known or easily observed, volatility must be estimated. This makes volatility the key focus for option traders.`,
    },
  });

  // ============ CHAPTER 4: Volatility ============
  const ch4 = await prisma.branch.create({
    data: { bookId: book.id, title: "Chapter 4: Volatility", chapterNumber: 4 },
  });

  const c4_1 = await prisma.concept.create({
    data: {
      bookId: book.id,
      branchId: ch4.id,
      title: "Random Walks and Normal Distributions",
      orderInBranch: 1,
      estimatedMinutes: 18,
      startPage: 51,
      endPage: 56,
      summary: `Most pricing models assume prices follow a RANDOM WALK:
- Each price change is independent of previous changes
- Direction is unpredictable; size follows a probability distribution

The NORMAL (GAUSSIAN) DISTRIBUTION is assumed for returns:
- Bell-shaped, symmetric around the mean
- 68% within ±1 standard deviation
- 95% within ±2 standard deviations
- 99.7% within ±3 standard deviations

STANDARD DEVIATION measures the spread/dispersion of returns - this is volatility.

Higher standard deviation = more dispersion = higher volatility = higher option values`,
      content: `Most theoretical pricing models assume that prices follow a random walk. This means each price change is independent of previous changes - the market has no memory. While prices may appear to trend over time, the random walk hypothesis says this is simply the result of random movements.

If price changes are random and independent, what distribution do they follow? Most models assume a normal or Gaussian distribution, the familiar bell-shaped curve.

Key properties of normal distributions:
- The distribution is symmetric around the mean
- Approximately 68% of all outcomes fall within one standard deviation of the mean
- Approximately 95% fall within two standard deviations
- Approximately 99.7% fall within three standard deviations

The standard deviation measures the dispersion or spread of the distribution. A higher standard deviation means outcomes are more spread out - there is more variability.

For option pricing, the standard deviation of price returns is what we call volatility.`,
    },
  });

  const c4_2 = await prisma.concept.create({
    data: {
      bookId: book.id,
      branchId: ch4.id,
      title: "Mean and Standard Deviation",
      orderInBranch: 2,
      estimatedMinutes: 15,
      startPage: 56,
      endPage: 60,
      summary: `MEAN: The average or expected value of a distribution
- For option pricing, the mean is typically the forward price

STANDARD DEVIATION (σ): Measures dispersion around the mean
- Calculated as: √(Σ(xᵢ - mean)² / n)
- In option pricing = annualized volatility

The normal distribution is fully described by just two parameters:
1. Mean (μ) - the center
2. Standard deviation (σ) - the spread

Any normal distribution can be converted to a STANDARD NORMAL (mean=0, σ=1) using:
z = (x - μ) / σ`,
      content: `The mean of a distribution is the average or expected value. For a set of observations, it's simply the sum of all values divided by the number of observations.

The standard deviation measures how spread out the observations are around the mean. A small standard deviation means observations are clustered closely around the mean. A large standard deviation means they are more dispersed.

The formula for standard deviation:
1. Calculate the mean
2. Find the difference between each observation and the mean
3. Square each difference
4. Sum the squared differences
5. Divide by the number of observations
6. Take the square root

The beauty of the normal distribution is that it is completely described by just two parameters: the mean and the standard deviation. Once we know these two values, we can calculate the probability of any outcome.

Any normal distribution can be transformed into a standard normal distribution (mean = 0, standard deviation = 1) using the formula: z = (x - mean) / standard deviation.`,
    },
  });

  const c4_3 = await prisma.concept.create({
    data: {
      bookId: book.id,
      branchId: ch4.id,
      title: "Volatility as Standard Deviation",
      orderInBranch: 3,
      estimatedMinutes: 15,
      startPage: 60,
      endPage: 68,
      summary: `Volatility is expressed as ANNUALIZED STANDARD DEVIATION of returns.

20% annual volatility means:
- 68% probability price stays within ±20% over one year
- Daily volatility = 20% / √252 ≈ 1.26%

TIME SCALING (using square root of time):
- Daily to Annual: multiply by √252
- Annual to Daily: divide by √252
- Weekly to Annual: multiply by √52

Why square root? Variance (σ²) is additive over time, so standard deviation scales with √time.

LOGNORMAL DISTRIBUTION: Prices (not returns) are lognormally distributed, ensuring prices can't go negative.`,
      content: `In option pricing, volatility is expressed as the annualized standard deviation of returns. If we say a stock has 25% volatility, we mean the standard deviation of annual returns is 25%.

This means there is approximately a 68% probability that the stock will be within ±25% of its starting price one year from now. There is about a 95% probability it will be within ±50% (two standard deviations).

To convert between time periods, we use the square root of time:
- Daily volatility = Annual volatility / √252 (trading days per year)
- Weekly volatility = Annual volatility / √52

For a stock with 25% annual volatility:
- Daily volatility ≈ 25% / 15.87 ≈ 1.58%
- Weekly volatility ≈ 25% / 7.21 ≈ 3.47%

This square root relationship comes from the properties of normally distributed random variables. If daily returns are independent and normally distributed, variance is additive, so standard deviation grows with the square root of time.

For stock prices, we assume that price returns (percent changes) are normally distributed. This leads to a lognormal distribution of prices, which has the important property that prices can never go below zero.`,
    },
  });

  const c4_4 = await prisma.concept.create({
    data: {
      bookId: book.id,
      branchId: ch4.id,
      title: "Types of Volatility",
      orderInBranch: 4,
      estimatedMinutes: 15,
      startPage: 69,
      endPage: 80,
      summary: `Three critical types of volatility:

1. HISTORICAL (REALIZED) VOLATILITY
   - Calculated from past price data
   - Backward-looking
   - May not predict future volatility

2. FORECAST VOLATILITY
   - Trader's estimate of future volatility
   - What volatility will actually occur
   - The "correct" input for pricing models

3. IMPLIED VOLATILITY
   - Backed out from current option prices
   - Forward-looking market expectation
   - The market's consensus forecast

TRADING DECISION:
- If implied > your forecast: options overpriced, consider selling
- If implied < your forecast: options underpriced, consider buying`,
      content: `There are several types of volatility a trader must understand:

HISTORICAL VOLATILITY is calculated from past price data. It measures what volatility actually was over some past period. While historical volatility can inform our expectations, it is backward-looking and may not accurately predict future volatility.

FORECAST VOLATILITY (or future volatility) is the volatility that will actually occur over the life of the option. This is what we ideally want to input into our pricing model. Of course, we can never know future volatility with certainty - we can only estimate it.

IMPLIED VOLATILITY is the volatility that, when input into a pricing model, yields the option's current market price. It represents the market's consensus forecast of future volatility. Implied volatility is particularly useful because it allows us to compare option prices across different strikes and expirations.

The relationship between these volatilities is key to option trading:
- If implied volatility > your forecast volatility: options appear overpriced
- If implied volatility < your forecast volatility: options appear underpriced

Most option trading decisions revolve around comparing implied volatility to expected future volatility. Traders who can forecast volatility better than the market consensus have a significant edge.`,
    },
  });

  // ============ CHAPTER 5: Using an Option's Theoretical Value ============
  const ch5 = await prisma.branch.create({
    data: { bookId: book.id, title: "Chapter 5: Using an Option's Theoretical Value", chapterNumber: 5 },
  });

  const c5_1 = await prisma.concept.create({
    data: {
      bookId: book.id,
      branchId: ch5.id,
      title: "Delta Hedging and Capturing Theoretical Edge",
      orderInBranch: 1,
      estimatedMinutes: 25,
      startPage: 81,
      endPage: 94,
      summary: `When you find a mispriced option, DELTA HEDGING captures the edge:

1. Buy underpriced options (or sell overpriced ones)
2. Hedge with underlying to neutralize directional risk
3. Dynamically adjust hedge as delta changes
4. Profit = the mispricing, regardless of direction

Example: Buy 10 calls with delta 0.50 (underpriced by $0.50)
- Total delta = +500
- Sell 5 units of underlying (delta = -500)
- Net delta = 0 (delta neutral)

KEY INSIGHT: Delta hedging transforms a directional bet into a volatility bet.
- Long options profit if realized vol > implied vol
- Short options profit if realized vol < implied vol

The theoretical profit equals the mispricing, but is realized gradually through hedge adjustments.`,
      content: `Once we identify a theoretically mispriced option, we need a method to capture that edge while protecting ourselves from directional risk.

The solution is DELTA HEDGING. Delta tells us how much an option's value changes for a small change in the underlying price. By taking an offsetting position in the underlying, we can neutralize this directional exposure.

Example: Suppose a call option has a delta of 0.50 and appears underpriced by $0.50.
- We buy 10 calls (total delta = +500)
- We sell 5 units of underlying (total delta = -500)
- Net delta = 0 (we are delta neutral)

As the underlying moves, we must adjust our hedge to maintain neutrality. This is called dynamic hedging or continuous rebalancing.

If our volatility forecast is correct, the cumulative profit from these adjustments will equal the theoretical mispricing, regardless of whether the underlying goes up or down.

The key insight: By delta hedging, we transform a directional position into a volatility position. We profit if actual volatility exceeds implied volatility (for long options) or if actual volatility is less than implied (for short options).

This process can be costly in terms of transaction costs from frequent rebalancing. Traders must balance the theoretical profit against these practical costs.`,
    },
  });

  // ============ CHAPTER 6: Option Values and Changing Market Conditions ============
  const ch6 = await prisma.branch.create({
    data: { bookId: book.id, title: "Chapter 6: Option Values and Changing Market Conditions", chapterNumber: 6 },
  });

  const c6_1 = await prisma.concept.create({
    data: {
      bookId: book.id,
      branchId: ch6.id,
      title: "The Delta",
      orderInBranch: 1,
      estimatedMinutes: 15,
      startPage: 95,
      endPage: 103,
      summary: `DELTA (Δ): Rate of change of option value vs underlying price

CALL DELTAS: Range from 0 to 1.00
- ATM call ≈ 0.50
- Deep ITM → approaches 1.00
- Deep OTM → approaches 0

PUT DELTAS: Range from -1.00 to 0
- ATM put ≈ -0.50
- Deep ITM → approaches -1.00
- Deep OTM → approaches 0

THREE INTERPRETATIONS:
1. HEDGE RATIO: 0.50 delta = hedge with 50 shares per contract
2. PROBABILITY PROXY: 0.30 delta ≈ 30% chance of expiring ITM
3. EQUIVALENT EXPOSURE: 0.50 delta acts like 50 shares`,
      content: `Delta is the first and most important of the option "Greeks." It measures how much an option's theoretical value changes for a one-point change in the underlying price.

For calls:
- Delta ranges from 0 (far OTM) to 1.00 (deep ITM)
- At-the-money calls have delta around 0.50
- As a call goes deeper in-the-money, delta approaches 1.00

For puts:
- Delta ranges from 0 (far OTM) to -1.00 (deep ITM)
- At-the-money puts have delta around -0.50
- As a put goes deeper in-the-money, delta approaches -1.00

Delta has three useful interpretations:

1. HEDGE RATIO: A call with delta 0.50 requires selling 50 shares (per 100-share contract) to achieve delta neutrality.

2. PROBABILITY PROXY: Delta approximates the probability of expiring in-the-money. A 0.30 delta call has roughly a 30% chance of expiring ITM.

3. EQUIVALENT POSITION: Delta tells us the equivalent underlying exposure. A call with 0.50 delta behaves like owning 50 shares for small price changes.`,
    },
  });

  const c6_2 = await prisma.concept.create({
    data: {
      bookId: book.id,
      branchId: ch6.id,
      title: "The Gamma",
      orderInBranch: 2,
      estimatedMinutes: 15,
      startPage: 103,
      endPage: 111,
      summary: `GAMMA (Γ): Rate of change of delta vs underlying price

Key properties:
- Always POSITIVE for long options (calls and puts)
- HIGHEST for ATM options
- INCREASES as expiration approaches (for ATM)
- Decreases for ITM and OTM options

GAMMA RISK:
- LONG OPTIONS = POSITIVE GAMMA
  When underlying moves in your favor, delta increases (accelerates gains)
  When it moves against you, delta decreases (cushions losses)

- SHORT OPTIONS = NEGATIVE GAMMA
  Delta moves against you in both directions
  "Picking up pennies in front of a steamroller"

High gamma = unstable delta = frequent hedge adjustments needed`,
      content: `Gamma measures how fast delta changes as the underlying price moves. Mathematically, gamma is the second derivative of option value with respect to underlying price.

KEY CHARACTERISTICS:
- Gamma is always positive for long options (both calls and puts)
- Gamma is highest for at-the-money options
- Gamma increases dramatically as expiration approaches for ATM options
- Deep ITM and OTM options have low gamma

WHY GAMMA MATTERS:
Gamma tells us how stable our delta hedge is. High gamma means delta changes quickly, requiring frequent rebalancing. Low gamma means delta is more stable.

POSITION GAMMA:
- LONG OPTIONS = POSITIVE GAMMA: When underlying rises, long call delta increases (good). When underlying falls, delta decreases (cushions losses). Gamma works in your favor.

- SHORT OPTIONS = NEGATIVE GAMMA: When underlying moves against you, your delta exposure worsens. Gamma works against you.

Gamma is often called "curvature" because it measures the curvature of the option's price curve relative to the underlying. A position with high positive gamma accelerates gains and decelerates losses. A position with negative gamma does the opposite - it's like "picking up pennies in front of a steamroller."`,
    },
  });

  const c6_3 = await prisma.concept.create({
    data: {
      bookId: book.id,
      branchId: ch6.id,
      title: "Theta, Vega, and Rho",
      orderInBranch: 3,
      estimatedMinutes: 18,
      startPage: 111,
      endPage: 125,
      summary: `THETA (Θ) - Time Decay:
- Daily loss in option value due to time passing
- Long options: negative theta (lose value daily)
- Highest for ATM options near expiration
- GAMMA-THETA TRADEOFF: You can't have positive gamma without paying theta

VEGA (ν) - Volatility Sensitivity:
- Change in value per 1% change in implied volatility
- Long options: positive vega (benefit from vol increase)
- ATM options have highest vega
- Critical for volatility trading strategies

RHO (ρ) - Interest Rate Sensitivity:
- Usually the least important Greek
- Calls: positive rho (benefit from rate increases)
- Puts: negative rho
- More significant for longer-dated options`,
      content: `THETA measures the rate at which an option loses value as time passes, assuming all else remains constant. This is often called time decay.

- Long options have negative theta (lose value each day)
- Short options have positive theta (collect decay)
- Theta is highest for ATM options near expiration
- There is a fundamental tradeoff: gamma and theta are opposite sides of the same coin. You cannot have positive gamma without paying for it through negative theta.

VEGA measures sensitivity to changes in implied volatility. A vega of 0.15 means the option value changes by $0.15 for each 1% change in volatility.

- Long options have positive vega (benefit from volatility increase)
- Short options have negative vega
- ATM options have the highest vega
- Vega decreases as expiration approaches

RHO measures sensitivity to interest rate changes. It is typically the least important Greek because interest rates are relatively stable.

- Calls have positive rho (benefit from rate increases)
- Puts have negative rho
- Longer-dated options are more sensitive to rates

The Greeks work together to describe an option's complete risk profile. Understanding how they interact is essential for managing option positions effectively.`,
    },
  });

  // Create concept dependencies (sequential learning path)
  const concepts = [c1_1, c1_2, c1_3, c1_4, c2_1, c2_2, c2_3, c3_1, c3_2, c3_3, c4_1, c4_2, c4_3, c4_4, c5_1, c6_1, c6_2, c6_3];
  for (let i = 1; i < concepts.length; i++) {
    await prisma.conceptDependency.create({
      data: { conceptId: concepts[i].id, prerequisiteId: concepts[i - 1].id },
    });
  }

  // Create questions for each concept
  for (const concept of concepts) {
    await createQuestionsForConcept(concept.id, concept.title);
  }

  console.log("✓ Created Option Volatility and Pricing book");
  console.log("  - 6 chapters, 18 concepts");
  console.log("  - Page offset:", PAGE_OFFSET);
  console.log("  - Book ID:", book.id);
}

async function createQuestionsForConcept(conceptId: string, title: string) {
  await prisma.question.create({
    data: {
      conceptId,
      type: "reflection",
      text: `Summarize the key concepts from "${title}" in your own words.`,
      options: "[]",
      correctAnswer: "A clear explanation demonstrating understanding of the core concepts.",
    },
  });
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
