import { PrismaClient } from "@prisma/client";
import { readFileSync } from "fs";

const prisma = new PrismaClient();

async function main() {
  // Get the user (assumes one exists)
  const user = await prisma.user.findFirst();
  if (!user) {
    console.log("No user found. Please sign in first.");
    return;
  }

  console.log("Creating ESL book for user:", user.email);

  // Create the book
  const book = await prisma.book.create({
    data: {
      userId: user.id,
      title: "The Elements of Statistical Learning",
      author: "Hastie, Tibshirani, Friedman",
      sourceFile: "/Users/user/Downloads/ESL.pdf",
      processingStatus: "completed",
    },
  });

  // Create user progress
  await prisma.userProgress.create({
    data: {
      oderId: user.id,
      bookId: book.id,
    },
  });

  // Chapter 1: Introduction
  const chapter1 = await prisma.branch.create({
    data: {
      bookId: book.id,
      title: "Chapter 1: Introduction",
      chapterNumber: 1,
    },
  });

  // Chapter 1, Concept 1: What is Statistical Learning
  const c1_1 = await prisma.concept.create({
    data: {
      bookId: book.id,
      branchId: chapter1.id,
      title: "What is Statistical Learning?",
      orderInBranch: 1,
      estimatedMinutes: 15,
      startPage: 1,
      endPage: 4,
      summary: `Statistical learning plays a key role in many areas of science, finance and industry. It involves learning from data to make predictions or understand patterns.

Key examples of learning problems include:
- Predicting heart attack risk based on patient data
- Predicting stock prices from company performance
- Recognizing handwritten digits
- Identifying risk factors for diseases

The goal is to build a prediction model (or learner) from training data that can accurately predict outcomes for new, unseen data.`,
      content: `Statistical learning plays a key role in many areas of science, finance and industry. Here are some examples of learning problems:

• Predict whether a patient, hospitalized due to a heart attack, will have a second heart attack. The prediction is to be based on demographic, diet and clinical measurements for that patient.

• Predict the price of a stock in 6 months from now, on the basis of company performance measures and economic data.

• Identify the numbers in a handwritten ZIP code, from a digitized image.

• Estimate the amount of glucose in the blood of a diabetic person, from the infrared absorption spectrum of that person's blood.

• Identify the risk factors for prostate cancer, based on clinical and demographic variables.

The science of learning plays a key role in the fields of statistics, data mining and artificial intelligence, intersecting with areas of engineering and other disciplines.

This book is about learning from data. In a typical scenario, we have an outcome measurement, usually quantitative (such as a stock price) or categorical (such as heart attack/no heart attack), that we wish to predict based on a set of features (such as diet and clinical measurements). We have a training set of data, in which we observe the outcome and feature measurements for a set of objects (such as people). Using this data we build a prediction model, or learner, which will enable us to predict the outcome for new unseen objects. A good learner is one that accurately predicts such an outcome.`,
    },
  });

  await createQuestionsForConcept(c1_1.id, "What is Statistical Learning?");

  // Chapter 1, Concept 2: Supervised vs Unsupervised Learning
  const c1_2 = await prisma.concept.create({
    data: {
      bookId: book.id,
      branchId: chapter1.id,
      title: "Supervised vs Unsupervised Learning",
      orderInBranch: 2,
      estimatedMinutes: 12,
      startPage: 2,
      endPage: 3,
      summary: `There are two main types of learning problems:

SUPERVISED LEARNING: We have both input features AND outcome variables in our training data. The outcome "supervises" the learning process. Examples include predicting spam/not-spam, predicting prices, classification tasks.

UNSUPERVISED LEARNING: We only observe features with no outcome measurements. The task is to describe how data are organized or clustered. This is less developed but covered in Chapter 14.`,
      content: `The examples above describe what is called the supervised learning problem. It is called "supervised" because of the presence of the outcome variable to guide the learning process.

In SUPERVISED LEARNING:
- We have input features (X) and outcome/response (Y)
- The outcome guides/supervises the learning
- Goal: predict Y given X
- Examples: spam detection, price prediction, disease diagnosis

In UNSUPERVISED LEARNING:
- We observe only the features, no outcome measurements
- Task: describe how data are organized or clustered
- Find patterns, structure, or groupings in data
- Examples: customer segmentation, anomaly detection

The supervised learning problem is the focus of most of this book. The unsupervised problem is less developed in the literature, and is the focus of Chapter 14.

Key distinction: In supervised learning, we have a "teacher" (the outcome variable) telling us the right answers during training. In unsupervised learning, we must find structure on our own.`,
    },
  });

  await createQuestionsForConcept(c1_2.id, "Supervised vs Unsupervised Learning");

  // Chapter 1, Concept 3: Email Spam Example
  const c1_3 = await prisma.concept.create({
    data: {
      bookId: book.id,
      branchId: chapter1.id,
      title: "Example: Email Spam Detection",
      orderInBranch: 3,
      estimatedMinutes: 15,
      startPage: 1,
      endPage: 2,
      summary: `The spam detection problem is a classic supervised learning classification task. Given 4601 email messages with known labels (spam or email), we build a detector using word frequencies as features.

The data includes relative frequencies of 57 common words and punctuation marks. Words like "george", "hp" appear more in legitimate emails, while "free", "!" appear more in spam.

Simple rules can be constructed like: if (%george < 0.6) & (%you > 1.5) then spam.`,
      content: `Example 1: Email Spam

The data for this example consists of information from 4601 email messages, in a study to try to predict whether the email was junk email, or "spam." The objective was to design an automatic spam detector that could filter out spam before clogging the users' mailboxes.

For all 4601 email messages, the true outcome (email type) email or spam is available, along with the relative frequencies of 57 of the most commonly occurring words and punctuation marks in the email message. This is a supervised learning problem, with the outcome the class variable email/spam. It is also called a classification problem.

Key observations from the data:
- Words like "george", "hp", "edu" appear more frequently in legitimate emails
- Words like "free", "remove", "!" appear more frequently in spam
- The word "you" appears 2.26% in spam vs 1.27% in email

Our learning method has to decide which features to use and how. For example, we might use a rule such as:

if (%george < 0.6) & (%you > 1.5) then spam else email

Another form of a rule might be:
if (0.2 * %you - 0.3 * %george) > 0 then spam else email

For this problem, finding the best linear combination of features forms the basis for many learning methods we'll study.`,
    },
  });

  await createQuestionsForConcept(c1_3.id, "Email Spam Detection");

  // Add dependencies for chapter 1
  await prisma.conceptDependency.create({
    data: { conceptId: c1_2.id, prerequisiteId: c1_1.id },
  });
  await prisma.conceptDependency.create({
    data: { conceptId: c1_3.id, prerequisiteId: c1_2.id },
  });

  // Chapter 2: Overview of Supervised Learning
  const chapter2 = await prisma.branch.create({
    data: {
      bookId: book.id,
      title: "Chapter 2: Overview of Supervised Learning",
      chapterNumber: 2,
    },
  });

  // Chapter 2, Concept 1: Variable Types and Terminology
  const c2_1 = await prisma.concept.create({
    data: {
      bookId: book.id,
      branchId: chapter2.id,
      title: "Variable Types and Terminology",
      orderInBranch: 1,
      estimatedMinutes: 15,
      startPage: 9,
      endPage: 11,
      summary: `Understanding the terminology is crucial for statistical learning:

INPUTS: Also called predictors, features, or independent variables (X)
OUTPUTS: Also called responses or dependent variables (Y for quantitative, G for categorical)

Output types:
- Quantitative: numeric values (stock price, temperature)
- Qualitative/Categorical: discrete classes (spam/email, species)
- Ordered categorical: small/medium/large

The distinction leads to: REGRESSION (predict quantitative) vs CLASSIFICATION (predict qualitative)`,
      content: `2.2 Variable Types and Terminology

The outputs vary in nature among the examples. In the glucose prediction example, the output is a quantitative measurement, where some measurements are bigger than others. In the famous Iris discrimination example due to R. A. Fisher, the output is qualitative (species of Iris) and assumes values in a finite set G = {Virginica, Setosa, Versicolor}.

TERMINOLOGY:
- Inputs: predictors, features, independent variables (X)
- Outputs: responses, dependent variables (Y or G)
- Quantitative outputs: real-valued measurements
- Qualitative outputs: categorical, discrete, factors

This distinction in output type has led to a naming convention:
- REGRESSION: when we predict quantitative outputs
- CLASSIFICATION: when we predict qualitative outputs

Both can be viewed as a task in function approximation.

Qualitative variables are typically represented numerically by codes. The easiest case is when there are only two classes, represented by 0 or 1, or by -1 and 1. These are sometimes called targets.

For K-level qualitative variables, we use dummy variables: a vector of K binary variables, only one of which is "on" at a time.

Notation:
- X: input variable (may be vector)
- Y: quantitative output
- G: qualitative output (for group)
- Observed values in lowercase: x_i, y_i
- Matrices in bold uppercase: X`,
    },
  });

  await createQuestionsForConcept(c2_1.id, "Variable Types and Terminology");

  // Chapter 2, Concept 2: Least Squares Method
  const c2_2 = await prisma.concept.create({
    data: {
      bookId: book.id,
      branchId: chapter2.id,
      title: "Linear Models and Least Squares",
      orderInBranch: 2,
      estimatedMinutes: 20,
      startPage: 11,
      endPage: 14,
      summary: `The linear model is a foundational method in statistics. Given inputs X, we predict output Y using:

Ŷ = β₀ + Σ Xⱼβⱼ  (or in vector form: Ŷ = X^T β)

The LEAST SQUARES method finds coefficients β by minimizing the Residual Sum of Squares (RSS):

RSS(β) = Σ(yᵢ - xᵢ^T β)²

The solution is: β̂ = (X^T X)^(-1) X^T y

This gives stable but potentially biased predictions due to strong structural assumptions.`,
      content: `2.3.1 Linear Models and Least Squares

The linear model has been a mainstay of statistics for the past 30 years and remains one of our most important tools. Given a vector of inputs X^T = (X₁, X₂, ..., Xₚ), we predict the output Y via the model:

Ŷ = β̂₀ + Σⱼ Xⱼβ̂ⱼ

The term β̂₀ is the intercept, also known as the bias in machine learning. In vector form:

Ŷ = X^T β̂

In the (p+1)-dimensional input-output space, (X, Ŷ) represents a hyperplane.

HOW DO WE FIT THE LINEAR MODEL?

The most popular method is LEAST SQUARES. We pick coefficients β to minimize the Residual Sum of Squares:

RSS(β) = Σᵢ(yᵢ - xᵢ^T β)²

In matrix notation:
RSS(β) = (y - Xβ)^T (y - Xβ)

Differentiating with respect to β gives the normal equations:
X^T(y - Xβ) = 0

If X^T X is nonsingular, the unique solution is:
β̂ = (X^T X)^(-1) X^T y

KEY INSIGHT: The linear model makes huge assumptions about structure (linearity). This yields stable but possibly inaccurate predictions. It's a trade-off between bias and variance that we'll explore throughout the book.`,
    },
  });

  await createQuestionsForConcept(c2_2.id, "Linear Models and Least Squares");

  // Chapter 2, Concept 3: Nearest Neighbors
  const c2_3 = await prisma.concept.create({
    data: {
      bookId: book.id,
      branchId: chapter2.id,
      title: "K-Nearest Neighbors",
      orderInBranch: 3,
      estimatedMinutes: 18,
      startPage: 14,
      endPage: 16,
      summary: `K-Nearest Neighbors (KNN) is a simple, powerful method that makes very few assumptions.

For a query point x, find the k training points closest to x (the k-nearest neighbors), then:
- For regression: Ŷ = average of the k neighbors' y values
- For classification: Ĝ = majority vote among the k neighbors

KNN makes mild structural assumptions, giving accurate but potentially unstable predictions. The choice of k controls the bias-variance trade-off: small k = flexible/high variance, large k = smooth/high bias.`,
      content: `2.3.2 Nearest-Neighbor Methods

Nearest-neighbor methods use observations in the training set closest to x in input space to form Ŷ. The k-nearest neighbor fit for Ŷ is:

Ŷ(x) = (1/k) Σ yᵢ  for all xᵢ in Nₖ(x)

where Nₖ(x) is the neighborhood of x defined by the k closest points.

HOW IT WORKS:
1. Given a query point x, find the k training points closest to x
2. For regression: average their y values
3. For classification: take a majority vote

PROPERTIES:
- Makes very mild structural assumptions
- Predictions are often accurate but can be unstable
- No explicit model is fit - method is "memory-based"
- Computationally intensive for large datasets

THE ROLE OF K:
- k = 1: Most flexible, uses only nearest point (high variance)
- Large k: Smoother predictions (high bias, low variance)
- Effective number of parameters ≈ N/k

COMPARISON WITH LINEAR MODELS:
- Linear model: strong assumptions → stable but possibly inaccurate
- KNN: weak assumptions → accurate but possibly unstable

This illustrates a fundamental trade-off in statistical learning between:
- BIAS: error from overly simplistic assumptions
- VARIANCE: error from sensitivity to small fluctuations in training data`,
    },
  });

  await createQuestionsForConcept(c2_3.id, "K-Nearest Neighbors");

  // Add dependencies for chapter 2
  await prisma.conceptDependency.create({
    data: { conceptId: c2_1.id, prerequisiteId: c1_3.id }, // depends on last concept of ch1
  });
  await prisma.conceptDependency.create({
    data: { conceptId: c2_2.id, prerequisiteId: c2_1.id },
  });
  await prisma.conceptDependency.create({
    data: { conceptId: c2_3.id, prerequisiteId: c2_2.id },
  });

  console.log("✓ Created book with 2 chapters and 6 concepts");
  console.log("  Book ID:", book.id);
}

async function createQuestionsForConcept(conceptId: string, title: string) {
  const questions = [
    {
      type: "mcq",
      text: `What is the main goal of "${title}"?`,
      options: JSON.stringify([
        "To understand and predict outcomes from data",
        "To store data efficiently",
        "To create databases",
        "To design user interfaces",
      ]),
      correctAnswer: "To understand and predict outcomes from data",
    },
    {
      type: "mcq",
      text: `Which best describes the concepts covered in "${title}"?`,
      options: JSON.stringify([
        "Fundamental statistical learning principles",
        "Database management",
        "Network protocols",
        "Hardware design",
      ]),
      correctAnswer: "Fundamental statistical learning principles",
    },
    {
      type: "short",
      text: `Explain a key concept from "${title}" in your own words.`,
      options: JSON.stringify([]),
      correctAnswer: "A clear explanation demonstrating understanding of the core concepts presented.",
    },
    {
      type: "reflection",
      text: `How might you apply the concepts from "${title}" to a real-world problem you've encountered?`,
      options: JSON.stringify([]),
      correctAnswer: "Thoughtful reflection connecting the material to practical applications.",
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
