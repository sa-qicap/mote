import { PrismaClient } from "@prisma/client";
import * as fs from "fs";

const prisma = new PrismaClient();

const HTML_PATH = "/Users/user/Downloads/ESL.html";

// Book structure - using HTML section IDs for extraction (chapters 1-8 only)
const BOOK_STRUCTURE = {
  title: "The Elements of Statistical Learning",
  author: "Trevor Hastie, Robert Tibshirani, Jerome Friedman",
  chapters: [
    {
      number: 1,
      title: "Introduction",
      concepts: [
        {
          title: "Introduction to Statistical Learning",
          startId: "1-introduction",
          endId: "2-overview-of-supervised-learning",
        },
      ],
    },
    {
      number: 2,
      title: "Overview of Supervised Learning",
      concepts: [
        {
          title: "Introduction and Variable Types",
          startId: "2.1-introduction",
          endId: "2.3-two-simple-approaches-to-prediction%3A-least-squares-and-nearest-neighbors",
        },
        {
          title: "Linear Models and Least Squares",
          startId: "2.3-two-simple-approaches-to-prediction%3A-least-squares-and-nearest-neighbors",
          endId: "2.3.2-nearest-neighbor-methods",
        },
        {
          title: "Nearest Neighbor Methods",
          startId: "2.3.2-nearest-neighbor-methods",
          endId: "2.4-statistical-decision-theory",
        },
        {
          title: "Statistical Decision Theory",
          startId: "2.4-statistical-decision-theory",
          endId: "2.5-local-methods-in-high-dimensions",
        },
        {
          title: "Local Methods in High Dimensions",
          startId: "2.5-local-methods-in-high-dimensions",
          endId: "2.6-statistical-models%2C-supervised-learning-and-function-approximation",
        },
        {
          title: "Statistical Models and Supervised Learning",
          startId: "2.6-statistical-models%2C-supervised-learning-and-function-approximation",
          endId: "2.6.3-function-approximation",
        },
        {
          title: "Function Approximation and Structured Regression",
          startId: "2.6.3-function-approximation",
          endId: "2.8-classes-of-restricted-estimators",
        },
        {
          title: "Classes of Restricted Estimators",
          startId: "2.8-classes-of-restricted-estimators",
          endId: "2.9-model-selection-and-the-bias-variance-tradeoff",
        },
        {
          title: "Model Selection and Bias-Variance Tradeoff",
          startId: "2.9-model-selection-and-the-bias-variance-tradeoff",
          endId: "3-linear-methods-for-regression",
        },
      ],
    },
    {
      number: 3,
      title: "Linear Methods for Regression",
      concepts: [
        {
          title: "Linear Regression Fundamentals",
          startId: "3.1-introduction",
          endId: "3.2.1-example%3A-prostate-cancer",
        },
        {
          title: "Prostate Cancer Example and Gauss-Markov",
          startId: "3.2.1-example%3A-prostate-cancer",
          endId: "3.2.3-multiple-regression-from-simple-univariate-regression",
        },
        {
          title: "Multiple Regression and Multiple Outputs",
          startId: "3.2.3-multiple-regression-from-simple-univariate-regression",
          endId: "3.3-subset-selection",
        },
        {
          title: "Subset Selection Methods",
          startId: "3.3-subset-selection",
          endId: "3.4-shrinkage-methods",
        },
        {
          title: "Ridge Regression",
          startId: "3.4-shrinkage-methods",
          endId: "3.4.2-the-lasso",
        },
        {
          title: "The Lasso and Comparison",
          startId: "3.4.2-the-lasso",
          endId: "3.4.4-least-angle-regression",
        },
        {
          title: "Least Angle Regression",
          startId: "3.4.4-least-angle-regression",
          endId: "3.5-methods-using-derived-input-directions",
        },
        {
          title: "PCR and Partial Least Squares",
          startId: "3.5-methods-using-derived-input-directions",
          endId: "3.6-discussion%3A-a-comparison-of-the-selection-and-shrinkage-methods",
        },
        {
          title: "Comparison and Multiple Outcomes",
          startId: "3.6-discussion%3A-a-comparison-of-the-selection-and-shrinkage-methods",
          endId: "3.8-more-on-the-lasso-and-related-path-algorithms",
        },
        {
          title: "Advanced Lasso Topics",
          startId: "3.8-more-on-the-lasso-and-related-path-algorithms",
          endId: "4-linear-methods-for-classification",
        },
      ],
    },
    {
      number: 4,
      title: "Linear Methods for Classification",
      concepts: [
        {
          title: "Classification Introduction",
          startId: "4.1-introduction",
          endId: "4.2-linear-regression-of-an-indicator-matrix",
        },
        {
          title: "Linear Regression of Indicator Matrix",
          startId: "4.2-linear-regression-of-an-indicator-matrix",
          endId: "4.3-linear-discriminant-analysis",
        },
        {
          title: "Linear Discriminant Analysis",
          startId: "4.3-linear-discriminant-analysis",
          endId: "4.3.1-regularized-discriminant-analysis",
        },
        {
          title: "LDA Variations",
          startId: "4.3.1-regularized-discriminant-analysis",
          endId: "4.4-logistic-regression",
        },
        {
          title: "Logistic Regression Fundamentals",
          startId: "4.4-logistic-regression",
          endId: "4.4.2-example%3A-south-african-heart-disease",
        },
        {
          title: "Logistic Regression Advanced Topics",
          startId: "4.4.2-example%3A-south-african-heart-disease",
          endId: "4.5-separating-hyperplanes",
        },
        {
          title: "Separating Hyperplanes",
          startId: "4.5-separating-hyperplanes",
          endId: "5-basis-expansions-and-regularization",
        },
      ],
    },
    {
      number: 5,
      title: "Basis Expansions and Regularization",
      concepts: [
        {
          title: "Basis Expansions Introduction",
          startId: "5.1-introduction",
          endId: "5.2.1-natural-cubic-splines",
        },
        {
          title: "Natural Cubic Splines and Examples",
          startId: "5.2.1-natural-cubic-splines",
          endId: "5.3-filtering-and-feature-extraction",
        },
        {
          title: "Smoothing Splines",
          startId: "5.3-filtering-and-feature-extraction",
          endId: "5.4.1-degrees-of-freedom-and-smoother-matrices",
        },
        {
          title: "Degrees of Freedom and Smoothing",
          startId: "5.4.1-degrees-of-freedom-and-smoother-matrices",
          endId: "5.5.2-the-bias-variance-tradeoff",
        },
        {
          title: "Bias-Variance and Nonparametric Logistic",
          startId: "5.5.2-the-bias-variance-tradeoff",
          endId: "5.7-multidimensional-splines",
        },
        {
          title: "Multidimensional Splines",
          startId: "5.7-multidimensional-splines",
          endId: "5.8-regularization-and-reproducing-kernel-hilbert-spaces",
        },
        {
          title: "Reproducing Kernel Hilbert Spaces",
          startId: "5.8-regularization-and-reproducing-kernel-hilbert-spaces",
          endId: "5.9-wavelet-smoothing",
        },
        {
          title: "Wavelet Smoothing",
          startId: "5.9-wavelet-smoothing",
          endId: "6-kernel-smoothing-methods",
        },
      ],
    },
    {
      number: 6,
      title: "Kernel Smoothing Methods",
      concepts: [
        {
          title: "One-Dimensional Kernel Smoothers",
          startId: "6-kernel-smoothing-methods",
          endId: "6.2-selecting-the-width-of-the-kernel",
        },
        {
          title: "Kernel Width and Local Regression",
          startId: "6.2-selecting-the-width-of-the-kernel",
          endId: "6.4-structured-local-regression-models-in-%24%5Cmathbb%7Br%7D%5E%7Bp%7D%24",
        },
        {
          title: "Structured Local Regression and Local Likelihood",
          startId: "6.4-structured-local-regression-models-in-%24%5Cmathbb%7Br%7D%5E%7Bp%7D%24",
          endId: "6.6-kernel-density-estimation-and-classification",
        },
        {
          title: "Kernel Density Estimation and Classification",
          startId: "6.6-kernel-density-estimation-and-classification",
          endId: "6.7-radial-basis-functions-and-kernels",
        },
        {
          title: "Radial Basis Functions and Mixture Models",
          startId: "6.7-radial-basis-functions-and-kernels",
          endId: "7-model-assessment-and-selection",
        },
      ],
    },
    {
      number: 7,
      title: "Model Assessment and Selection",
      concepts: [
        {
          title: "Bias-Variance and Model Complexity",
          startId: "7.1-introduction",
          endId: "7.3-the-bias-variance-decomposition",
        },
        {
          title: "Bias-Variance Decomposition",
          startId: "7.3-the-bias-variance-decomposition",
          endId: "7.4-optimism-of-the-training-error-rate",
        },
        {
          title: "Optimism and In-Sample Prediction Error",
          startId: "7.4-optimism-of-the-training-error-rate",
          endId: "7.6-the-effective-number-of-parameters",
        },
        {
          title: "Effective Parameters and BIC",
          startId: "7.6-the-effective-number-of-parameters",
          endId: "7.8-minimum-description-length",
        },
        {
          title: "MDL and VC Dimension",
          startId: "7.8-minimum-description-length",
          endId: "7.10-cross-validation",
        },
        {
          title: "Cross-Validation",
          startId: "7.10-cross-validation",
          endId: "7.11-bootstrap-methods",
        },
        {
          title: "Bootstrap Methods",
          startId: "7.11-bootstrap-methods",
          endId: "8-model-inference-and-averaging",
        },
      ],
    },
    {
      number: 8,
      title: "Model Inference and Averaging",
      concepts: [
        {
          title: "Bootstrap and Maximum Likelihood",
          startId: "8.1-introduction",
          endId: "8.2.2-maximum-likelihood-inference",
        },
        {
          title: "Maximum Likelihood Inference",
          startId: "8.2.2-maximum-likelihood-inference",
          endId: "8.3-bayesian-methods",
        },
        {
          title: "Bayesian Methods",
          startId: "8.3-bayesian-methods",
          endId: "8.5-the-em-algorithm",
        },
        {
          title: "The EM Algorithm",
          startId: "8.5-the-em-algorithm",
          endId: "8.6-mcmc-for-sampling-from-the-posterior",
        },
        {
          title: "MCMC Methods",
          startId: "8.6-mcmc-for-sampling-from-the-posterior",
          endId: "8.7-bagging",
        },
        {
          title: "Bagging",
          startId: "8.7-bagging",
          endId: "8.8-model-averaging-and-stacking",
        },
        {
          title: "Model Averaging, Stacking, and Bumping",
          startId: "8.8-model-averaging-and-stacking",
          endId: "9",
        },
      ],
    },
  ],
};

// Escape special regex characters
function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

// Extract content between two section IDs from HTML
// Handles both h2 (chapters) and h3 (sections) tags
function extractHtmlContent(html: string, startId: string, endId: string): string {
  const escapedStartId = escapeRegex(startId);

  // Try h2 first, then h3
  let startPattern = new RegExp(`<h2[^>]*id="${escapedStartId}"[^>]*>`, "i");
  let startMatch = html.match(startPattern);

  if (!startMatch) {
    startPattern = new RegExp(`<h3[^>]*id="${escapedStartId}"[^>]*>`, "i");
    startMatch = html.match(startPattern);
  }

  if (!startMatch) {
    console.log(`  Warning: Start ID not found: "${startId}"`);
    return "";
  }

  const startIdx = html.indexOf(startMatch[0]);

  // Find the end section by ID (try both h2 and h3)
  const escapedEndId = escapeRegex(endId);
  let endPattern = new RegExp(`<h2[^>]*id="${escapedEndId}"`, "i");
  let endMatch = html.substring(startIdx + 100).match(endPattern);

  if (!endMatch) {
    endPattern = new RegExp(`<h3[^>]*id="${escapedEndId}"`, "i");
    endMatch = html.substring(startIdx + 100).match(endPattern);
  }

  let endIdx: number;
  if (!endMatch) {
    console.log(`  Warning: End ID not found: "${endId}", searching for fallback`);
    // Try to find chapter 9 marker or bibliographic notes
    const fallbackPatterns = [
      /id="9"[^>]*>/,
      /id="additive-models/,
      /id="bibliographic-notes-8"/,
    ];
    for (const pattern of fallbackPatterns) {
      const fallbackMatch = html.substring(startIdx + 100).match(pattern);
      if (fallbackMatch) {
        endIdx = html.indexOf(fallbackMatch[0], startIdx + 100);
        break;
      }
    }
    if (!endIdx) {
      endIdx = html.length;
    }
  } else {
    endIdx = html.indexOf(endMatch[0], startIdx + 100);
  }

  // Extract the content
  let content = html.substring(startIdx, endIdx);

  // Clean up the content - remove data attributes but keep structure
  content = content.replace(/\s+data_line_start="[^"]*"/g, "");
  content = content.replace(/\s+data_line_end="[^"]*"/g, "");
  content = content.replace(/\s+data_line="[^"]*"/g, "");
  content = content.replace(/\s+count_line="[^"]*"/g, "");

  return content;
}

function calculateEstimatedMinutes(content: string): number {
  const wordCount = content.split(/\s+/).filter((w) => w.length > 0).length;
  const formulaCount = (content.match(/mjx-container/g) || []).length;
  const baseTime = wordCount / 200;
  const formulaTime = formulaCount * 0.025;
  return Math.round(baseTime + formulaTime + 5);
}

async function main() {
  console.log("=".repeat(70));
  console.log("MOTE BOOK INGESTION: The Elements of Statistical Learning");
  console.log("=".repeat(70));

  const html = fs.readFileSync(HTML_PATH, "utf-8");
  console.log(`\nLoaded HTML file: ${html.length} characters\n`);

  // Find or create default user
  let user = await prisma.user.findFirst();
  if (!user) {
    user = await prisma.user.create({
      data: {
        email: "test@example.com",
      },
    });
    console.log("Created default user\n");
  }

  // Find or create book
  let book = await prisma.book.findFirst({
    where: { title: BOOK_STRUCTURE.title, userId: user.id },
  });

  if (book) {
    // Clear existing data
    await prisma.concept.deleteMany({ where: { bookId: book.id } });
    await prisma.branch.deleteMany({ where: { bookId: book.id } });
    console.log("Cleared existing concepts and branches\n");
  } else {
    book = await prisma.book.create({
      data: {
        title: BOOK_STRUCTURE.title,
        author: BOOK_STRUCTURE.author,
        sourceFile: HTML_PATH,
        userId: user.id,
      },
    });
    console.log("Created new book\n");
  }

  let totalConcepts = 0;
  let totalMinutes = 0;

  for (const chapter of BOOK_STRUCTURE.chapters) {
    console.log(`\nChapter ${chapter.number}: ${chapter.title}`);
    console.log("-".repeat(50));

    const branch = await prisma.branch.create({
      data: {
        bookId: book.id,
        title: `Chapter ${chapter.number}: ${chapter.title}`,
        chapterNumber: chapter.number,
      },
    });

    for (let i = 0; i < chapter.concepts.length; i++) {
      const conceptDef = chapter.concepts[i];
      const content = extractHtmlContent(html, conceptDef.startId, conceptDef.endId);

      // Calculate stats from the extracted HTML
      const textContent = content.replace(/<[^>]*>/g, " "); // Strip HTML for word count
      const wordCount = textContent.split(/\s+/).filter((w) => w.length > 0).length;
      const estimatedMinutes = calculateEstimatedMinutes(textContent);
      const imageCount = (content.match(/<img/g) || []).length;
      const tableCount = (content.match(/<table/g) || []).length;

      await prisma.concept.create({
        data: {
          bookId: book.id,
          branchId: branch.id,
          title: conceptDef.title,
          content,
          summary: "", // To be generated later
          orderInBranch: i,
          estimatedMinutes,
        },
      });

      const status =
        estimatedMinutes < 10 ? " [SHORT]" : estimatedMinutes > 25 ? " [LONG]" : "";
      const extras = [
        imageCount > 0 ? `${imageCount} img` : "",
        tableCount > 0 ? `${tableCount} tbl` : "",
      ].filter(Boolean).join(", ");
      console.log(
        `  ${i + 1}. ${conceptDef.title}: ~${estimatedMinutes} min, ${wordCount} words${extras ? ` (${extras})` : ""}${status}`
      );
      totalConcepts++;
      totalMinutes += estimatedMinutes;
    }
  }

  console.log("\n" + "=".repeat(70));
  console.log(`COMPLETE: ${totalConcepts} concepts across ${BOOK_STRUCTURE.chapters.length} chapters`);
  console.log(`Total estimated time: ${totalMinutes} minutes (~${Math.round(totalMinutes / 60)} hours)`);
  console.log(`Average per concept: ${Math.round(totalMinutes / totalConcepts)} minutes`);
  console.log("=".repeat(70));
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
