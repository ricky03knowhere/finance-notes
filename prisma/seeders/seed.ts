import { PrismaClient, CategoryType } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  await prisma.category.createMany({
    data: [
      // ======================
      // INCOME
      // ======================

      {
        userId: "cmr4rmyye0000v5gs4hunsx0a",
        name: "Salary",
        type: CategoryType.INCOME,
        icon: "💼",
        color: "#22C55E",
      },
      {
        userId: "cmr4rmyye0000v5gs4hunsx0a",
        name: "Bonus",
        type: CategoryType.INCOME,
        icon: "🎁",
        color: "#10B981",
      },
      {
        userId: "cmr4rmyye0000v5gs4hunsx0a",
        name: "Freelance",
        type: CategoryType.INCOME,
        icon: "💸",
        color: "#0EA5E9",
      },
      {
        userId: "cmr4rmyye0000v5gs4hunsx0a",
        name: "Business",
        type: CategoryType.INCOME,
        icon: "🏪",
        color: "#6366F1",
      },
      {
        userId: "cmr4rmyye0000v5gs4hunsx0a",
        name: "Investment",
        type: CategoryType.INCOME,
        icon: "📈",
        color: "#F59E0B",
      },
      {
        userId: "cmr4rmyye0000v5gs4hunsx0a",
        name: "Interest",
        type: CategoryType.INCOME,
        icon: "🏦",
        color: "#84CC16",
      },
      {
        userId: "cmr4rmyye0000v5gs4hunsx0a",
        name: "Cashback",
        type: CategoryType.INCOME,
        icon: "💰",
        color: "#06B6D4",
      },
      {
        userId: "cmr4rmyye0000v5gs4hunsx0a",
        name: "Gift",
        type: CategoryType.INCOME,
        icon: "🎉",
        color: "#A855F7",
      },
      {
        userId: "cmr4rmyye0000v5gs4hunsx0a",
        name: "Refund",
        type: CategoryType.INCOME,
        icon: "↩️",
        color: "#14B8A6",
      },
      {
        userId: "cmr4rmyye0000v5gs4hunsx0a",
        name: "Other Income",
        type: CategoryType.INCOME,
        icon: "➕",
        color: "#16A34A",
      },

      // ======================
      // EXPENSE
      // ======================

      {
        userId: "cmr4rmyye0000v5gs4hunsx0a",
        name: "Food & Drink",
        type: CategoryType.EXPENSE,
        icon: "🍔",
        color: "#EF4444",
      },
      {
        userId: "cmr4rmyye0000v5gs4hunsx0a",
        name: "Groceries",
        type: CategoryType.EXPENSE,
        icon: "🛒",
        color: "#F97316",
      },
      {
        userId: "cmr4rmyye0000v5gs4hunsx0a",
        name: "Transportation",
        type: CategoryType.EXPENSE,
        icon: "🚗",
        color: "#3B82F6",
      },
      {
        userId: "cmr4rmyye0000v5gs4hunsx0a",
        name: "Fuel",
        type: CategoryType.EXPENSE,
        icon: "⛽",
        color: "#2563EB",
      },
      {
        userId: "cmr4rmyye0000v5gs4hunsx0a",
        name: "Shopping",
        type: CategoryType.EXPENSE,
        icon: "🛍️",
        color: "#EC4899",
      },
      {
        userId: "cmr4rmyye0000v5gs4hunsx0a",
        name: "Home",
        type: CategoryType.EXPENSE,
        icon: "🏠",
        color: "#6366F1",
      },
      {
        userId: "cmr4rmyye0000v5gs4hunsx0a",
        name: "Electricity",
        type: CategoryType.EXPENSE,
        icon: "⚡",
        color: "#EAB308",
      },
      {
        userId: "cmr4rmyye0000v5gs4hunsx0a",
        name: "Internet",
        type: CategoryType.EXPENSE,
        icon: "📶",
        color: "#0EA5E9",
      },
      {
        userId: "cmr4rmyye0000v5gs4hunsx0a",
        name: "Healthcare",
        type: CategoryType.EXPENSE,
        icon: "🏥",
        color: "#DC2626",
      },
      {
        userId: "cmr4rmyye0000v5gs4hunsx0a",
        name: "Electronic",
        type: CategoryType.EXPENSE,
        icon: "💻",
        color: "#06B6D4",
      },
      {
        userId: "cmr4rmyye0000v5gs4hunsx0a",
        name: "Education",
        type: CategoryType.EXPENSE,
        icon: "📚",
        color: "#7C3AED",
      },
      {
        userId: "cmr4rmyye0000v5gs4hunsx0a",
        name: "Entertainment",
        type: CategoryType.EXPENSE,
        icon: "🎬",
        color: "#DB2777",
      },
      {
        userId: "cmr4rmyye0000v5gs4hunsx0a",
        name: "Travel",
        type: CategoryType.EXPENSE,
        icon: "✈️",
        color: "#06B6D4",
      },
      {
        userId: "cmr4rmyye0000v5gs4hunsx0a",
        name: "Subscription",
        type: CategoryType.EXPENSE,
        icon: "📺",
        color: "#8B5CF6",
      },
      {
        userId: "cmr4rmyye0000v5gs4hunsx0a",
        name: "Other Expense",
        type: CategoryType.EXPENSE,
        icon: "➖",
        color: "#94A3B8",
      },
    ],
    skipDuplicates: true,
  });

  console.log("✅ Default categories seeded successfully.");
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });