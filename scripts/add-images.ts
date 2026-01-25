import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  // Get the ESL book
  const book = await prisma.book.findFirst({
    where: { title: "The Elements of Statistical Learning" },
    include: { concepts: true },
  });

  if (!book) {
    console.log("ESL book not found");
    return;
  }

  // Define images for specific concepts
  // Using placeholder images - replace with actual extracted PDF figures
  const conceptImages: Record<string, { url: string; caption: string; afterParagraph: number }[]> = {
    "Linear Models and Least Squares": [
      {
        url: "https://placehold.co/600x400/e8e8e8/666?text=Figure+2.1",
        caption: "Figure 2.1: A classification example in two dimensions. Orange and blue points represent two classes.",
        afterParagraph: 1,
      },
    ],
    "K-Nearest Neighbors": [
      {
        url: "https://placehold.co/600x400/e8e8e8/666?text=Figure+2.2",
        caption: "Figure 2.2: The same classification example using 15-nearest-neighbor averaging.",
        afterParagraph: 1,
      },
    ],
    "From Least Squares to Nearest Neighbors": [
      {
        url: "https://placehold.co/600x400/e8e8e8/666?text=Figure+2.3",
        caption: "Figure 2.3: Misclassification curves for OLS and k-NN. Training sample of size 200.",
        afterParagraph: 2,
      },
    ],
    "Statistical Decision Theory": [
      {
        url: "https://placehold.co/600x400/e8e8e8/666?text=Figure+2.4",
        caption: "Figure 2.4: The regression function f(x) = E(Y|X = x) is the optimal predictor.",
        afterParagraph: 4,
      },
    ],
    "Local Methods in High Dimensions": [
      {
        url: "https://placehold.co/600x400/e8e8e8/666?text=Figure+2.6",
        caption: "Figure 2.6: The curse of dimensionality illustrated.",
        afterParagraph: 2,
      },
      {
        url: "https://placehold.co/600x400/e8e8e8/666?text=Figure+2.7",
        caption: "Figure 2.7: Median distance to nearest neighbor as dimension increases.",
        afterParagraph: 5,
      },
    ],
    "Model Selection and Bias-Variance Tradeoff": [
      {
        url: "https://placehold.co/600x400/e8e8e8/666?text=Figure+2.9",
        caption: "Figure 2.9: Test and training error as a function of model complexity.",
        afterParagraph: 3,
      },
      {
        url: "https://placehold.co/600x400/e8e8e8/666?text=Figure+2.11",
        caption: "Figure 2.11: Bias-variance tradeoff visualization.",
        afterParagraph: 6,
      },
    ],
  };

  for (const concept of book.concepts) {
    const images = conceptImages[concept.title];
    if (images) {
      await prisma.concept.update({
        where: { id: concept.id },
        data: { images: JSON.stringify(images) },
      });
      console.log(`Added ${images.length} image(s) to: ${concept.title}`);
    }
  }

  console.log("\nDone! Placeholder images added.");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
