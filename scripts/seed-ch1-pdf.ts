import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Chapter 1 concepts based on the PDF page structure
const concepts = [
  {
    title: "Probability Spaces and Basic Examples",
    orderInBranch: 1,
    startPage: 1,
    endPage: 4,
    estimatedMinutes: 17,
    summary: `This concept introduces the foundational mathematical framework of probability theory through the notion of a probability space, which consists of three essential components: a sample space $\\Omega$ representing all possible outcomes of an experiment, a collection of events (subsets of $\\Omega$) to which we can assign probabilities, and a probability function $P$ that maps events to numbers between 0 and 1. The framework is illustrated through concrete examples including coin flips, dice rolls, and card draws, demonstrating how real-world random phenomena can be precisely modeled. The concept establishes key axioms that any probability function must satisfy: non-negativity ($P(A) \\geq 0$), normalization ($P(\\Omega) = 1$), and countable additivity for disjoint events. These seemingly simple axioms form the bedrock upon which all of probability theory is built, enabling rigorous reasoning about uncertainty and random processes.`,
    content: "",
  },
  {
    title: "Random Sampling - Ordered Methods",
    orderInBranch: 2,
    startPage: 4,
    endPage: 8,
    estimatedMinutes: 17,
    summary: `This section develops the combinatorial foundations essential for computing probabilities in discrete sample spaces, focusing on ordered sampling methods where the arrangement of selected items matters. The fundamental counting principles of permutations and arrangements are introduced, starting with the multiplication rule for sequential choices. When sampling with replacement from $n$ objects, taking $k$ samples yields $n^k$ possible ordered sequences. Without replacement, the number of ordered arrangements becomes $n!/(n-k)! = n \\cdot (n-1) \\cdots (n-k+1)$, known as the falling factorial or $k$-permutation. These counting techniques are applied to classic probability problems including the birthday problem, where the surprisingly high probability of shared birthdays in a group emerges from the exponential growth of pairwise comparisons. The distinction between sampling with and without replacement profoundly affects probability calculations and models fundamentally different real-world scenarios.`,
    content: "",
  },
  {
    title: "Random Sampling - Unordered and Applications",
    orderInBranch: 3,
    startPage: 8,
    endPage: 11,
    estimatedMinutes: 15,
    summary: `This section extends sampling theory to unordered selection, where only the composition of a sample matters, not the arrangement. The binomial coefficient $\\binom{n}{k} = n!/(k!(n-k)!)$ counts the number of ways to choose $k$ items from $n$ distinct objects when order is irrelevant. This formula arises by dividing the ordered count $n!/(n-k)!$ by $k!$ to account for the redundant orderings of the same subset. Applications include computing probabilities in card games (poker hands, bridge deals), lottery odds, and committee selection problems. The concept of combinations is connected to the binomial theorem, explaining why these numbers appear as coefficients in $(1+x)^n$. The section also addresses sampling with replacement when order doesn't matter, leading to the "stars and bars" formula $\\binom{n+k-1}{k}$ for distributing identical items into distinct categories.`,
    content: "",
  },
  {
    title: "Infinitely Many Outcomes",
    orderInBranch: 4,
    startPage: 11,
    endPage: 14,
    estimatedMinutes: 15,
    summary: `This section extends probability theory beyond finite sample spaces to handle infinite outcomes, introducing both countably and uncountably infinite sample spaces. For countably infinite spaces (like the natural numbers), probabilities can be assigned to individual outcomes as long as they sum to 1, exemplified by geometric distributions modeling waiting times. The concept of continuous probability spaces is introduced where the sample space is an interval or region of real numbers, and probabilities are computed via integration rather than summation. The probability density function (pdf) $f(x)$ specifies probabilities through $P(a \\leq X \\leq b) = \\int_a^b f(x)dx$, with the uniform distribution on $[0,1]$ serving as the canonical example. Individual points have probability zero in continuous spaces, a counterintuitive but necessary consequence of having uncountably many outcomes. These foundations enable modeling of physical measurements, time durations, and other inherently continuous phenomena.`,
    content: "",
  },
  {
    title: "Probability Rules - Decomposition and Complements",
    orderInBranch: 5,
    startPage: 14,
    endPage: 18,
    estimatedMinutes: 18,
    summary: `This section develops essential rules for computing probabilities of complex events from simpler ones, forming the practical toolkit for probability calculations. The complement rule $P(A^c) = 1 - P(A)$ often simplifies calculations by computing the probability of the opposite event. For unions of events, the general addition rule states $P(A \\cup B) = P(A) + P(B) - P(A \\cap B)$, subtracting the intersection to avoid double-counting. Two events are mutually exclusive (disjoint) when $A \\cap B = \\emptyset$, simplifying the union formula to $P(A \\cup B) = P(A) + P(B)$. The section introduces partitions of the sample space and the law of total probability: if $B_1, B_2, \\ldots$ partition $\\Omega$, then $P(A) = \\sum_i P(A \\cap B_i)$. This decomposition strategy is powerful for breaking complex probability calculations into manageable conditional pieces, and connects directly to Bayes' theorem and conditional probability developed later.`,
    content: "",
  },
  {
    title: "Inclusion-Exclusion",
    orderInBranch: 6,
    startPage: 18,
    endPage: 21,
    estimatedMinutes: 17,
    summary: `The inclusion-exclusion principle generalizes the addition rule to handle unions of multiple events, providing a systematic formula for $P(A_1 \\cup A_2 \\cup \\cdots \\cup A_n)$. The principle alternates between adding and subtracting intersection terms: add individual probabilities, subtract pairwise intersections, add triple intersections, and so on. For three events: $P(A \\cup B \\cup C) = P(A) + P(B) + P(C) - P(A \\cap B) - P(A \\cap C) - P(B \\cap C) + P(A \\cap B \\cap C)$. The general formula involves $2^n - 1$ terms but often simplifies when events have special structure or symmetry. Classic applications include counting derangements (permutations with no fixed points), the matching problem, and computing probabilities involving "at least one" of several events. The principle connects to the Bonferroni inequalities, which provide useful upper and lower bounds by truncating the alternating sum, valuable when computing all intersection terms is impractical.`,
    content: "",
  },
  {
    title: "Random Variables",
    orderInBranch: 7,
    startPage: 21,
    endPage: 26,
    estimatedMinutes: 22,
    summary: `A random variable is a function that assigns a numerical value to each outcome in a sample space, transforming abstract outcomes into quantities we can analyze mathematically. Formally, $X: \\Omega \\rightarrow \\mathbb{R}$ maps outcomes to real numbers, enabling questions like "what is the expected value?" and "how variable are the outcomes?" Discrete random variables take countably many values with a probability mass function (pmf) $p(x) = P(X = x)$, while continuous random variables have a probability density function. The cumulative distribution function (cdf) $F(x) = P(X \\leq x)$ provides a unified description for both types, being a right-continuous, non-decreasing function from 0 to 1. Key examples include Bernoulli (success/failure), binomial (number of successes in n trials), geometric (trials until first success), and Poisson (rare events) distributions. Random variables are the bridge between probability spaces and statistical analysis, enabling computation of expectations, variances, and characterization of real-world data distributions.`,
    content: "",
  },
  {
    title: "Finer Points (Advanced)",
    orderInBranch: 8,
    startPage: 26,
    endPage: 29,
    estimatedMinutes: 15,
    summary: `This section addresses subtle mathematical foundations that ensure probability theory is logically consistent and applicable to complex situations. The concept of a $\\sigma$-algebra (sigma-field) is introduced as the collection of events to which probabilities can be assigned, satisfying closure under complements and countable unions. Not all subsets need be events; in continuous spaces, the Borel $\\sigma$-algebra generated by intervals is the standard choice, excluding pathological non-measurable sets. The section discusses why countable additivity is crucial for limit theorems and why finite additivity alone is insufficient for a rich theory. Measurability conditions for random variables ensure that events like $\\{X \\leq x\\}$ are always in the $\\sigma$-algebra. These technical foundations, while often glossed over in applied work, guarantee that probability calculations are well-defined and that powerful convergence theorems hold. Understanding these foundations helps recognize when intuitive probability arguments require careful justification.`,
    content: "",
  },
];

async function main() {
  // Get the user (assumes one exists) or create a demo user
  let user = await prisma.user.findFirst();
  if (!user) {
    user = await prisma.user.create({
      data: {
        email: "demo@example.com",
        name: "Demo User",
      },
    });
    console.log("Created demo user:", user.email);
  }

  console.log("Creating Probability book for user:", user.email);

  // Create the book
  const book = await prisma.book.create({
    data: {
      userId: user.id,
      title: "Probability: Theory and Examples",
      author: "Rick Durrett",
      sourceFile: "/books/ch1.pdf",
      pageOffset: 0,
      processingStatus: "completed",
      isPublic: true,
    },
  });

  // Create user progress
  await prisma.userProgress.create({
    data: {
      oderId: user.id,
      bookId: book.id,
    },
  });

  // Create Chapter 1
  const chapter1 = await prisma.branch.create({
    data: {
      bookId: book.id,
      title: "Chapter 1: Measure Theory",
      chapterNumber: 1,
    },
  });

  // Create concepts
  let prevConceptId: string | null = null;

  for (const conceptData of concepts) {
    const concept = await prisma.concept.create({
      data: {
        bookId: book.id,
        branchId: chapter1.id,
        title: conceptData.title,
        orderInBranch: conceptData.orderInBranch,
        estimatedMinutes: conceptData.estimatedMinutes,
        startPage: conceptData.startPage,
        endPage: conceptData.endPage,
        summary: conceptData.summary,
        content: conceptData.content,
      },
    });

    // Create dependency on previous concept
    if (prevConceptId) {
      await prisma.conceptDependency.create({
        data: {
          conceptId: concept.id,
          prerequisiteId: prevConceptId,
        },
      });
    }

    prevConceptId = concept.id;
    console.log(`  Created concept: ${conceptData.title}`);
  }

  console.log("\n✓ Created book with Chapter 1 and 8 concepts");
  console.log("  Book ID:", book.id);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
