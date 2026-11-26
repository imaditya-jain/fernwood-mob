import { Ionicons } from "@expo/vector-icons";
import { View } from "react-native";

import { Text } from "@/components/Text";
import type { OrderSummary } from "@/lib/orders";
import { colors } from "@/theme/tokens";

const PAID = new Set(["PAID", "PARTIALLY_PAID", "PARTIALLY_REFUNDED", "REFUNDED"]);
const SHIPPED = new Set(["FULFILLED", "PARTIALLY_FULFILLED"]);

/** Placed, Paid, Shipped, worked out from the order's own statuses (same rule as the website). */
export function OrderProgress({ order }: { order: Pick<OrderSummary, "financialStatus" | "fulfillmentStatus" | "cancelled"> }) {
  if (order.cancelled) {
    return (
      <View style={{ backgroundColor: "rgba(179,38,30,0.1)", borderRadius: 14, padding: 14 }}>
        <Text variant="body" style={{ color: colors.danger }}>
          This order was cancelled.
        </Text>
      </View>
    );
  }
  const steps = [
    { label: "Placed", done: true },
    { label: "Paid", done: PAID.has(order.financialStatus) },
    { label: "Shipped", done: SHIPPED.has(order.fulfillmentStatus) },
  ];
  const current = steps.findIndex((step) => !step.done);
  return (
    <View accessibilityRole="progressbar" accessibilityLabel="Order progress" style={{ flexDirection: "row" }}>
      {steps.map((step, index) => (
        <View key={step.label} style={{ flex: 1, alignItems: "center" }}>
          <View style={{ flexDirection: "row", alignItems: "center", width: "100%" }}>
            <View style={{ flex: 1, height: 3, borderRadius: 2, opacity: index === 0 ? 0 : 1, backgroundColor: step.done ? colors.forest : colors.border }} />
            <View
              style={{
                width: 32,
                height: 32,
                borderRadius: 16,
                marginHorizontal: 4,
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: step.done ? colors.forest : index === current ? colors.clay : colors.sand,
              }}
            >
              {step.done ? <Ionicons name="checkmark" size={18} color={colors.cream} /> : <Text variant="small" style={{ color: index === current ? colors.cream : colors.muted }}>{index + 1}</Text>}
            </View>
            <View style={{ flex: 1, height: 3, borderRadius: 2, opacity: index === steps.length - 1 ? 0 : 1, backgroundColor: steps[index + 1]?.done ? colors.forest : colors.border }} />
          </View>
          <Text variant="small" style={{ marginTop: 6, color: step.done ? colors.forest : colors.muted }}>
            {step.label}
          </Text>
        </View>
      ))}
    </View>
  );
}
