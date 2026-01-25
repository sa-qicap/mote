import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  // Get the ESL book
  const book = await prisma.book.findFirst({
    where: { title: "The Elements of Statistical Learning" },
    include: { branches: true },
  });

  if (!book) {
    console.log("ESL book not found");
    return;
  }

  // Get Chapter 2 branch
  const chapter2 = book.branches.find((b) => b.chapterNumber === 2);
  if (!chapter2) {
    console.log("Chapter 2 not found");
    return;
  }

  console.log("Adding more concepts to Chapter 2...");

  // Add new concepts starting from order 4 (we already have 3)
  const newConcepts = [
    {
      title: "From Least Squares to Nearest Neighbors",
      orderInBranch: 4,
      startPage: 16,
      endPage: 22,
      estimatedMinutes: 20,
      summary: `The linear decision boundary from least squares is very smooth and stable to fit. It has low variance but potentially high bias if the true boundary is not linear.

The k-nearest-neighbor decision boundary is highly irregular, adapting to local patterns. The k=1 boundary is infinitely flexible with zero training error but high variance.

As k increases, the boundary becomes smoother. There's a fundamental trade-off: model complexity vs stability.`,
      content: `The linear decision boundary from least squares is very smooth, and apparently stable to fit. It does appear to rely heavily on the assumption that a linear decision boundary is appropriate.

The k-nearest-neighbor procedures do not appear to rely on any stringent assumptions about the underlying data, and can adapt to any situation. However, any particular subregion of the decision boundary depends on a handful of input points and their particular positions, and is thus wiggly and unstable.

Each method has its own situations for which it works best; in particular linear regression is more appropriate for Scenario 1, while nearest neighbors are more suitable for Scenario 2.

The time has come to expose the oracle! The data in fact were simulated from a model somewhere between the two, but closer to Scenario 2.

What we see is that for the linear model, the boundary is linear and stable, and all test points have their probabilities estimated at essentially 0 or 1. k-nearest-neighbors captures the true probabilities at the optimal k, but can be erratic at k=1.`,
    },
    {
      title: "Statistical Decision Theory",
      orderInBranch: 5,
      startPage: 22,
      endPage: 25,
      estimatedMinutes: 18,
      summary: `Statistical decision theory provides the formal framework for developing prediction models. We seek a function f(X) to predict Y given X.

The expected prediction error (EPE) for squared error loss is:
EPE(f) = E[(Y - f(X))²]

The optimal solution is the conditional expectation:
f(x) = E[Y|X=x]

This is the regression function - the best prediction of Y at any point X=x.`,
      content: `We first consider the case of a quantitative output, and place ourselves in the world of random variables and probability spaces. Let X ∈ ℝᵖ denote a real valued random input vector, and Y ∈ ℝ a real valued random output variable, with joint distribution Pr(X, Y).

We seek a function f(X) for predicting Y given values of the input X. This theory requires a loss function L(Y, f(X)) for penalizing errors in prediction, and by far the most common and convenient is squared error loss: L(Y, f(X)) = (Y − f(X))².

This leads us to a criterion for choosing f:
EPE(f) = E(Y − f(X))² = ∫[y − f(x)]² Pr(dx, dy)

By conditioning on X, we can write EPE as:
EPE(f) = Eₓ Eᵧ|ₓ([Y − f(X)]² | X)

We see that it suffices to minimize EPE pointwise:
f(x) = argminc Eᵧ|ₓ([Y − c]² | X = x)

The solution is f(x) = E(Y|X = x), the conditional expectation, also known as the regression function.

Thus the best prediction of Y at any point X = x is the conditional mean, when best is measured by average squared error.`,
    },
    {
      title: "Local Methods in High Dimensions",
      orderInBranch: 6,
      startPage: 25,
      endPage: 29,
      estimatedMinutes: 20,
      summary: `The curse of dimensionality makes local methods like k-NN struggle in high dimensions.

Key insights:
- In high dimensions, all sample points are close to the edge of the sample
- The volume of a neighborhood needed to capture a fixed fraction of data grows exponentially
- Sampling density decreases exponentially with dimension

For k-NN to work well in high dimensions, you need exponentially more training data.`,
      content: `We have examined two learning techniques for prediction so far: the stable but biased linear model and the less stable but apparently less biased class of k-nearest-neighbor estimates.

It would seem that with a reasonably large set of training data, we could always approximate the theoretically optimal conditional expectation by k-nearest-neighbor averaging, since we should be able to find a fairly large neighborhood of observations close to any x and average them.

This approach and our intuition breaks down in high dimensions, and the phenomenon is commonly referred to as the curse of dimensionality.

There are many manifestations of this problem, and we will examine a few here:

Consider the nearest-neighbor procedure for inputs uniformly distributed in a p-dimensional unit hypercube. Suppose we send out a hypercubical neighborhood about a target point to capture a fraction r of the observations. Since this corresponds to a fraction r of the unit volume, the expected edge length will be e(r) = r^(1/p).

In ten dimensions e(0.01) = 0.63 and e(0.1) = 0.80, while the entire range for each input is only 1.0. So to capture 1% or 10% of the data to form a local average, we must cover 63% or 80% of the range of each input variable.

Another manifestation of the curse is that all sample points are close to an edge of the sample. Consider N data points uniformly distributed in a p-dimensional unit ball centered at the origin.`,
    },
    {
      title: "Statistical Models and Supervised Learning",
      orderInBranch: 7,
      startPage: 29,
      endPage: 32,
      estimatedMinutes: 15,
      summary: `The goal of supervised learning is to find a useful approximation f̂(x) to the function f(x) that underlies the relationship between inputs and outputs.

Two main approaches:
1. Function approximation: Treat the problem as finding a function in a high-dimensional space
2. Statistical model: Assume Y = f(X) + ε where ε is random error

Additive error models: Y = f(X) + ε are most common, with ε independent of X.`,
      content: `Our goal is to find a useful approximation f̂(x) to the function f(x) that underlies the predictive relationship between the inputs and outputs.

In the theoretical setting of the previous section, we saw that squared error loss lead us to the regression function f(x) = E(Y|X = x) for a quantitative response.

The class of nearest-neighbor methods can be viewed as direct estimates of this conditional expectation, but we have seen that they can fail in at least two ways:
• if the dimension of the input space is high, the nearest neighbors need not be close to the target point, and can result in large errors;
• if special structure is known to exist, this can be used to reduce both the bias and the variance of the estimates.

We anticipate using other classes of models for f(x), in many cases specifically designed to overcome the dimensionality problems.

For the most part we will be dealing with simple modifications of the additive error model:
Y = f(X) + ε

where the error ε has E(ε) = 0 and is independent of X.

For a linear model f(x) = xᵀβ, with additive error and Gaussian errors ε ~ N(0, σ²), least squares is the maximum likelihood estimate of β.`,
    },
    {
      title: "Structured Regression Models",
      orderInBranch: 8,
      startPage: 32,
      endPage: 35,
      estimatedMinutes: 15,
      summary: `To avoid the curse of dimensionality, we impose structure on the regression function f.

Common structural assumptions include:
- Additivity: f(X) = Σ fⱼ(Xⱼ)
- Linear models: f(X) = Xᵀβ
- Low-dimensional interactions
- Smoothness constraints

These assumptions reduce the effective dimension of the problem.`,
      content: `We have seen that both the nearest-neighbor and linear-model methods can be viewed as estimates of the regression function E(Y|X = x).

In the former case, the assumption seems to be that the regression function is well approximated by a locally constant function; in the latter case, that the regression function is globally linear.

Any method that attempts to produce locally varying functions in small isotropic neighborhoods will run into problems in high dimensions—again the curse of dimensionality.

And conversely, all methods that overcome the dimensionality problems have an associated—and often implicit or adaptive—metric for measuring neighborhoods, which basically does not allow the neighborhood to be simultaneously small in all directions.

For example, these structural assumptions take the form of:
• Additive models: f(X) = Σⱼ₌₁ᵖ fⱼ(Xⱼ)
• Low-order interaction models
• Completely specified parametric models like linear regression

Any of these assumptions, if true, can reduce the estimation bias.`,
    },
    {
      title: "Classes of Restricted Estimators",
      orderInBranch: 9,
      startPage: 35,
      endPage: 38,
      estimatedMinutes: 18,
      summary: `Three broad classes of approaches for restricting estimators:

1. ROUGHNESS PENALTY: RSS(f) + λJ(f) where J penalizes roughness
   - Cubic smoothing splines use J(f) = ∫[f''(x)]²dx

2. KERNEL METHODS: Local averaging with weights
   - Kλ(x₀, x) = D(|x - x₀|/λ)
   - Nadaraya-Watson weighted average

3. BASIS FUNCTIONS: f(x) = Σ βₘhₘ(x)
   - Polynomial, spline, wavelet bases`,
      content: `The variety of nonparametric regression techniques or learning methods fall into a number of different classes depending on the nature of the restrictions imposed.

These classes are not distinct, and indeed some methods fall in several classes.

ROUGHNESS PENALTY AND BAYESIAN METHODS: Here the class of functions is controlled by explicitly penalizing RSS(f) with a roughness penalty:
PRSS(f; λ) = RSS(f) + λJ(f)

The user-selected functional J(f) will be large for functions f that vary too rapidly over small regions of input space. For example, the popular cubic smoothing spline for one-dimensional inputs is the solution to the penalized least-squares criterion:
PRSS(f; λ) = Σᵢ₌₁ᴺ (yᵢ − f(xᵢ))² + λ ∫[f''(x)]²dx

KERNEL METHODS AND LOCAL REGRESSION: These methods can be thought of as explicitly providing estimates of the regression function or conditional expectation by specifying the nature of the local neighborhood, and of the class of regular functions fitted locally.

BASIS FUNCTIONS AND DICTIONARY METHODS: This class of methods includes the familiar linear and polynomial expansions, but more importantly a wide variety of more flexible models. The model for f is a linear expansion:
f(x) = Σₘ₌₁ᴹ βₘhₘ(x)

where each of the hₘ is a function of the input x, and the term linear refers to the action of the parameters β.`,
    },
    {
      title: "Model Selection and Bias-Variance Tradeoff",
      orderInBranch: 10,
      startPage: 38,
      endPage: 42,
      estimatedMinutes: 20,
      summary: `All models have tuning parameters that control complexity. Model selection involves finding the right complexity level.

THE BIAS-VARIANCE DECOMPOSITION:
Err(x₀) = Bias²(f̂(x₀)) + Var(f̂(x₀)) + σ²

- Bias: error from wrong assumptions (underfitting)
- Variance: error from sensitivity to training data (overfitting)
- Irreducible error: σ²

As model complexity increases: bias decreases, variance increases.`,
      content: `All the models described above and many others discussed in later chapters have a smoothing or complexity parameter that has to be determined:
• the multiplier of the penalty term;
• the width of the kernel;
• or the number of basis functions.

In the case of the smoothing spline, the parameter λ controls the smoothness. Very large λ forces f to be linear, while very small λ allows f to interpolate the data.

The k-nearest-neighbor regression fit f̂ₖ(x) nicely illustrates the competing forces that operate in determining the optimal smoothing parameter. For simplicity we use squared-error loss:
Err(x₀) = E[(Y − f̂ₖ(x₀))²|X = x₀]

This expression can be decomposed as:
Err(x₀) = σ² + [f(x₀) − (1/k)Σᵢ₌₁ᵏf(x₍ᵢ₎)]² + (σ²/k)

The three terms in this expression are the irreducible error σ², the bias², and the variance.

The first term σ² is irreducible — it is the variance of the new test target.

Model complexity is directly tied to model variance. Typically as model complexity is increased, variance tends to increase and squared bias tends to decrease. The opposite behavior occurs as model complexity is decreased.

For k-nearest neighbors: as k increases, bias increases and variance decreases.`,
    },
  ];

  for (const concept of newConcepts) {
    const created = await prisma.concept.create({
      data: {
        bookId: book.id,
        branchId: chapter2.id,
        title: concept.title,
        orderInBranch: concept.orderInBranch,
        startPage: concept.startPage,
        endPage: concept.endPage,
        estimatedMinutes: concept.estimatedMinutes,
        summary: concept.summary,
        content: concept.content,
      },
    });

    // Create questions for each concept
    await createQuestionsForConcept(created.id, concept.title);
    console.log(`  Created: ${concept.title} (pp. ${concept.startPage}-${concept.endPage})`);
  }

  console.log("\n✓ Added 7 new concepts to Chapter 2");
}

async function createQuestionsForConcept(conceptId: string, title: string) {
  const questions = [
    {
      type: "mcq",
      text: `What is a key concept from "${title}"?`,
      options: JSON.stringify([
        "Understanding the fundamental principles",
        "Memorizing formulas",
        "Avoiding all mathematical notation",
        "Using only linear models",
      ]),
      correctAnswer: "Understanding the fundamental principles",
    },
    {
      type: "mcq",
      text: `How does "${title}" relate to machine learning?`,
      options: JSON.stringify([
        "It provides theoretical foundations for learning algorithms",
        "It is unrelated to machine learning",
        "It only applies to neural networks",
        "It is purely abstract mathematics",
      ]),
      correctAnswer: "It provides theoretical foundations for learning algorithms",
    },
    {
      type: "short",
      text: `Explain a key insight from "${title}" in your own words.`,
      options: JSON.stringify([]),
      correctAnswer: "A clear explanation demonstrating understanding of the core concepts.",
    },
    {
      type: "reflection",
      text: `How might the concepts from "${title}" apply to a real-world problem?`,
      options: JSON.stringify([]),
      correctAnswer: "Thoughtful reflection connecting theory to practice.",
    },
  ];

  for (const q of questions) {
    await prisma.question.create({
      data: {
        conceptId,
        ...q,
      },
    });
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
