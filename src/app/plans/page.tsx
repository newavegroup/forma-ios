"use client";

import { useState, useEffect, useCallback } from "react";
import { getNutritionPlans, deletePlan } from "@/app/actions/plans";
import Link from "next/link";
import type { MealObject } from "@/db/schema";
import { AppShell } from "@/components/app-shell";

type Plan = Awaited<ReturnType<typeof getNutritionPlans>>[number];

const DEMO_USER_ID = "demo-user";

function PlanCard({ plan, onDelete }: { plan: Plan; onDelete: (id: string) => void }) {
  const [expanded, setExpanded] = useState(false);
  const meals = plan.meals as MealObject[];

  return (
    <div
      className="rounded-xl overflow-hidden"
      style={{
        backgroundColor: "var(--surface)",
        border: "1px solid var(--outline-variant)",
      }}
    >
      <div className="p-5 space-y-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3
                className="font-semibold"
                style={{ fontFamily: "var(--font-display)", color: "var(--foreground)" }}
              >
                {plan.title}
              </h3>
              {plan.aiGenerated && (
                <span
                  className="px-2 py-0.5 rounded text-xs font-medium"
                  style={{
                    backgroundColor: "var(--primary-container)",
                    color: "var(--primary)",
                  }}
                >
                  AI
                </span>
              )}
            </div>
            <p className="text-xs mt-1" style={{ color: "var(--secondary)" }}>
              {new Date(plan.createdAt).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric",
              })}
              {" · "}
              {meals.length} meals
            </p>
          </div>
          <button
            onClick={() => onDelete(plan.id)}
            className="p-1.5 rounded-md transition-opacity hover:opacity-70 shrink-0"
            style={{ color: "var(--danger)" }}
          >
            <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
              <path d="M5.5 5.5A.5.5 0 0 1 6 6v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5m2.5 0a.5.5 0 0 1 .5.5v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5m3 .5a.5.5 0 0 0-1 0v6a.5.5 0 0 0 1 0z"/>
              <path d="M14.5 3a1 1 0 0 1-1 1H13v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V4h-.5a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1H6a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1h3.5a1 1 0 0 1 1 1zM4.118 4 4 4.059V13a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V4.059L11.882 4zM2.5 3h11V2h-11z"/>
            </svg>
          </button>
        </div>

        {/* Macro grid */}
        <div className="grid grid-cols-4 gap-3">
          {[
            { label: "Calories", value: plan.calories, unit: "kcal", color: "var(--foreground)" },
            { label: "Protein", value: plan.proteinG, unit: "g", color: "var(--primary)" },
            { label: "Carbs", value: plan.carbsG, unit: "g", color: "var(--accent)" },
            { label: "Fat", value: plan.fatG, unit: "g", color: "#e3b341" },
          ].map(({ label, value, unit, color }) => (
            <div
              key={label}
              className="rounded-lg px-3 py-2.5 text-center"
              style={{ backgroundColor: "var(--surface-high)" }}
            >
              <p className="text-xs" style={{ color: "var(--secondary)" }}>{label}</p>
              <p
                className="text-base font-bold mt-0.5"
                style={{ fontFamily: "var(--font-display)", color }}
              >
                {value}
                <span className="text-xs font-normal ml-0.5" style={{ color: "var(--secondary)" }}>
                  {unit}
                </span>
              </p>
            </div>
          ))}
        </div>

        <button
          onClick={() => setExpanded(!expanded)}
          className="w-full text-xs font-medium text-center py-1.5 rounded-md transition-colors"
          style={{
            color: "var(--secondary)",
            backgroundColor: "var(--surface-high)",
          }}
        >
          {expanded ? "Hide meals" : `Show ${meals.length} meals`}
        </button>
      </div>

      {/* Expanded meals */}
      {expanded && (
        <div
          className="border-t divide-y"
          style={{ borderColor: "var(--outline-variant)" }}
        >
          {meals.map((meal, i) => (
            <div key={i} className="p-4 space-y-2">
              <div className="flex items-center justify-between">
                <div>
                  <p
                    className="text-sm font-semibold"
                    style={{ fontFamily: "var(--font-display)", color: "var(--foreground)" }}
                  >
                    {meal.name}
                  </p>
                  {meal.time && (
                    <p className="text-xs mt-0.5" style={{ color: "var(--secondary)" }}>
                      {meal.time}
                    </p>
                  )}
                </div>
                <div className="text-right text-xs" style={{ color: "var(--secondary)" }}>
                  <p>{meal.calories} kcal</p>
                  <p>P:{meal.proteinG}g C:{meal.carbsG}g F:{meal.fatG}g</p>
                </div>
              </div>

              {meal.foods && meal.foods.length > 0 && (
                <div className="space-y-1">
                  {meal.foods.map((food, j) => (
                    <div key={j} className="flex justify-between items-center text-xs px-2 py-1 rounded" style={{ backgroundColor: "var(--surface-high)" }}>
                      <span style={{ color: "var(--foreground)" }}>{food.name}</span>
                      <span style={{ color: "var(--secondary)" }}>{food.amount} · {food.calories} kcal</span>
                    </div>
                  ))}
                </div>
              )}

              {meal.notes && (
                <p className="text-xs italic" style={{ color: "var(--secondary)" }}>
                  {meal.notes}
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function PlansPage() {
  const [plans, setPlans] = useState<Plan[]>([]);

  const loadPlans = useCallback(async () => {
    const data = await getNutritionPlans(DEMO_USER_ID);
    setPlans(data);
  }, []);

  useEffect(() => {
    loadPlans();
  }, [loadPlans]);

  async function handleDelete(id: string) {
    await deletePlan(id);
    loadPlans();
  }

  return (
    <AppShell>
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1
              className="text-2xl font-bold tracking-tight"
              style={{ fontFamily: "var(--font-display)", color: "var(--foreground)" }}
            >
              Nutrition Plans
            </h1>
            <p className="mt-0.5 text-sm" style={{ color: "var(--secondary)" }}>
              Your personalized meal plans
            </p>
          </div>
          <Link
            href="/plans/new"
            className="px-4 py-2 rounded-lg text-sm font-semibold transition-opacity hover:opacity-80 flex items-center gap-2"
            style={{
              backgroundColor: "var(--accent)",
              color: "var(--background)",
              fontFamily: "var(--font-body)",
            }}
          >
            <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
              <path d="M8 0a8 8 0 1 1 0 16A8 8 0 0 1 8 0zm.93 6.588-2.29.287-.082.38.45.083c.294.07.352.176.288.469l-.738 3.468c-.194.897.105 1.319.808 1.319.545 0 1.178-.252 1.465-.598l.088-.416c-.2.176-.492.246-.686.246-.275 0-.375-.193-.304-.533zM8 5.5a1 1 0 1 0 0-2 1 1 0 0 0 0 2z"/>
            </svg>
            Generate AI Plan
          </Link>
        </div>

        {plans.length === 0 ? (
          <div
            className="rounded-xl p-16 text-center"
            style={{ backgroundColor: "var(--surface)" }}
          >
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-4"
              style={{ backgroundColor: "var(--surface-high)" }}
            >
              <svg width="20" height="20" viewBox="0 0 16 16" fill="var(--secondary)">
                <path d="M5 10.5a.5.5 0 0 1 .5-.5h2a.5.5 0 0 1 0 1h-2a.5.5 0 0 1-.5-.5zm0-2a.5.5 0 0 1 .5-.5h5a.5.5 0 0 1 0 1h-5a.5.5 0 0 1-.5-.5zm0-2a.5.5 0 0 1 .5-.5h5a.5.5 0 0 1 0 1h-5a.5.5 0 0 1-.5-.5zm0-2a.5.5 0 0 1 .5-.5h5a.5.5 0 0 1 0 1h-5a.5.5 0 0 1-.5-.5z"/>
                <path d="M3 0h10a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V2a2 2 0 0 1 2-2zm0 1a1 1 0 0 0-1 1v12a1 1 0 0 0 1 1h10a1 1 0 0 0 1-1V2a1 1 0 0 0-1-1H3z"/>
              </svg>
            </div>
            <p
              className="font-semibold"
              style={{ fontFamily: "var(--font-display)", color: "var(--foreground)" }}
            >
              No nutrition plans yet
            </p>
            <p className="mt-1 text-sm" style={{ color: "var(--secondary)" }}>
              Generate an AI-powered plan tailored to your sport and goals.
            </p>
            <Link
              href="/plans/new"
              className="mt-4 inline-block px-5 py-2.5 rounded-lg text-sm font-semibold"
              style={{ backgroundColor: "var(--accent)", color: "var(--background)" }}
            >
              Generate my first plan
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {plans.map((plan) => (
              <PlanCard key={plan.id} plan={plan} onDelete={handleDelete} />
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
}
