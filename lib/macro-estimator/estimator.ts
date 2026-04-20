import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic();

export interface FoodItem {
  name: string;
  grams: number;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

export interface MacroEstimate {
  mealName: string;
  foods: FoodItem[];
  totalCalories: number;
  totalProteinG: number;
  totalCarbsG: number;
  totalFatG: number;
  confidence: "high" | "medium" | "low";
  notes?: string;
}

const SYSTEM_PROMPT = `You are a sports nutrition expert. Estimate macros from meal descriptions.

Respond with ONLY valid JSON matching this exact structure (no markdown, no explanation):
{
  "mealName": "short meal name",
  "foods": [
    { "name": "food item", "grams": 150, "calories": 248, "protein": 46, "carbs": 0, "fat": 5 }
  ],
  "totalCalories": 559,
  "totalProteinG": 56,
  "totalCarbsG": 67,
  "totalFatG": 7,
  "confidence": "high",
  "notes": "optional caveats"
}

Rules:
- Use standard portions when unspecified (chicken breast = 150g cooked)
- All weights are as-eaten (cooked weight unless stated raw)
- Reference values per 100g cooked:
  Chicken breast: 165 kcal P31 C0 F3.6
  White rice cooked: 130 kcal P2.7 C28 F0.3
  Salmon: 208 kcal P20 C0 F13
  Eggs (1 large=50g): 143 kcal P13 C1 F10
  Greek yogurt 2%: 73 kcal P10 C4 F2
  Oats dry: 389 kcal P17 C66 F7
  Whey protein 30g scoop: 120 kcal P24 C3 F2
  Banana medium 120g: 89 kcal P1 C23 F0.3
  Sweet potato cooked: 86 kcal P2 C20 F0.1
  Broccoli: 34 kcal P2.8 C7 F0.4
  Ground beef 85% cooked: 215 kcal P26 C0 F12
  Avocado: 160 kcal P2 C9 F15
  Nopales cooked: 22 kcal P1.5 C4 F0.3
  Tortilla corn 1 piece 30g: 60 kcal P1.5 C13 F0.7
  Bread 1 slice 30g: 80 kcal P3 C15 F1
  Peanut butter: 588 kcal P25 C20 F50
- confidence: "high" if all items/portions clear, "medium" if estimated, "low" if vague
- Round all numbers to integers`;

export async function estimateMacros(description: string): Promise<MacroEstimate> {
  const message = await client.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 1024,
    system: SYSTEM_PROMPT,
    messages: [
      {
        role: "user",
        content: `Estimate macros for: ${description}`,
      },
    ],
  });

  const text = message.content[0].type === "text" ? message.content[0].text : "";

  // Strip markdown code fences if present
  const cleaned = text.replace(/^```(?:json)?\n?/m, "").replace(/\n?```$/m, "").trim();

  const parsed = JSON.parse(cleaned) as MacroEstimate;

  // Ensure confidence is valid
  if (!["high", "medium", "low"].includes(parsed.confidence)) {
    parsed.confidence = "medium";
  }

  return parsed;
}
