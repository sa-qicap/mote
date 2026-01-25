import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const sampleMDXContent = `
## Introduction to Statistical Learning

Statistical learning refers to a vast set of tools for **understanding data**. These tools can be classified as *supervised* or *unsupervised*.

### The Supervised Learning Problem

In supervised learning, we have a set of inputs $X$ and outputs $Y$, and the goal is to find a function $f$ such that:

$$Y = f(X) + \\epsilon$$

where $\\epsilon$ represents the irreducible error with $E[\\epsilon] = 0$.

<Callout type="tip">
The function f represents the systematic information that X provides about Y.
</Callout>

### Why Estimate f?

There are two main reasons to estimate $f$: **prediction** and **inference**.

#### Prediction

When we're interested in prediction, we treat $\\hat{f}$ as a black box. The accuracy depends on two quantities:

1. **Reducible error**: Can be reduced by using better statistical techniques
2. **Irreducible error**: Cannot be reduced no matter how well we estimate $f$

The expected value of the squared error is:

$$E[(Y - \\hat{Y})^2] = E[f(X) + \\epsilon - \\hat{f}(X)]^2 = \\underbrace{[f(X) - \\hat{f}(X)]^2}_{\\text{Reducible}} + \\underbrace{\\text{Var}(\\epsilon)}_{\\text{Irreducible}}$$

#### Inference

When inference is the goal, we want to understand the relationship between $X$ and $Y$. We ask questions like:

- Which predictors are associated with the response?
- What is the relationship between the response and each predictor?
- Can the relationship be summarized using a linear equation, or is it more complex?

<Callout type="info">
Linear models allow for relatively simple and interpretable inference, but may not yield as accurate predictions as some other approaches.
</Callout>

### The Bias-Variance Trade-off

The expected test MSE can be decomposed into three quantities:

$$E[(y_0 - \\hat{f}(x_0))^2] = \\text{Var}(\\hat{f}(x_0)) + [\\text{Bias}(\\hat{f}(x_0))]^2 + \\text{Var}(\\epsilon)$$

This is known as the **bias-variance trade-off**:

| Model Flexibility | Bias | Variance |
|------------------|------|----------|
| Low (e.g., linear regression) | High | Low |
| High (e.g., splines) | Low | High |

The challenge is to find a method that achieves both low variance *and* low bias.

### Key Formulas Summary

- Mean Squared Error: $MSE = \\frac{1}{n}\\sum_{i=1}^{n}(y_i - \\hat{f}(x_i))^2$
- Bias: $\\text{Bias}(\\hat{f}(x_0)) = E[\\hat{f}(x_0)] - f(x_0)$
- Variance: $\\text{Var}(\\hat{f}(x_0)) = E[(\\hat{f}(x_0) - E[\\hat{f}(x_0)])^2]$
`;

async function main() {
  // Find first concept
  const concept = await prisma.concept.findFirst({
    orderBy: { createdAt: "asc" },
  });

  if (!concept) {
    console.log("No concepts found. Please create a book first.");
    return;
  }

  // Update the concept with MDX content
  await prisma.concept.update({
    where: { id: concept.id },
    data: { content: sampleMDXContent },
  });

  console.log(`Updated concept "${concept.title}" with sample MDX content.`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
