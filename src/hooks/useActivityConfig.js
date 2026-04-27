import { useState } from "react";
import { DEFAULT_AXIS_ICON } from "../data/svgLibrary";

export const OPERATION_INFO = {
    suma: {
        label: "SUMA",
        symbol: "+",
        accent: "#e0457b",
    },
    resta: {
        label: "RESTA",
        symbol: "−",
        accent: "#8e24aa",
    },
    multiplicacion: {
        label: "MULTIPLICACIÓN",
        symbol: "×",
        accent: "#1565c0",
    },
    division: {
        label: "DIVISIONES",
        symbol: "÷",
        accent: "#00695c",
    },
};

const DEFAULT_ACTIVITY = {
    operation: "suma",
    numOperands: 2,
    operandValues: ["", "", "", ""],
    // "double" = one grid per operand | "single" = one larger shared grid
    gridLayout: "double",
    dotRows: 6,
    dotCols: 10,
    dotSize: 14,
    tableSize: 10,
    xAxisIcon: DEFAULT_AXIS_ICON,
    yAxisIcon: DEFAULT_AXIS_ICON,
    axisIconSize: 25,
    showAxisNumbers: true,
    showSheetBorder: true,
    sheetBorderColor: OPERATION_INFO.suma.accent,
};

let activityId = 1;

function createActivity(overrides = {}) {
    return {
        id: activityId++,
        ...DEFAULT_ACTIVITY,
        ...overrides,
    };
}

const DEFAULT_LAYOUT = "vertical"; // vertical, horizontal, grid

export function useActivityConfig() {
    const [activities, setActivities] = useState([createActivity()]);
    const [activeActivityIndex, setActiveActivityIndex] = useState(0);
    const [layout, setLayout] = useState(DEFAULT_LAYOUT);
    // Reorder activities manually inside the current sheet.
    const moveActivity = (from, to) => {
        setActivities((prev) => {
            if (from === to || from < 0 || to < 0 || from >= prev.length || to >= prev.length) return prev;
            const next = [...prev];
            const [item] = next.splice(from, 1);
            next.splice(to, 0, item);
            return next;
        });
        setActiveActivityIndex((current) => {
            if (current === from) return to;
            if (current === to) return from;
            return current;
        });
    };

    const config = activities[activeActivityIndex] ?? activities[0];

    const update = (key, value) => setActivities((prev) => prev.map((activity, index) => (index === activeActivityIndex ? { ...activity, [key]: value } : activity)));

    const updateOperation = (operation) => {
        const isAddSub = operation === "suma" || operation === "resta";

        setActivities((prev) =>
            prev.map((activity, index) => {
                if (index !== activeActivityIndex) {
                    return activity;
                }

                const previousAccent = OPERATION_INFO[activity.operation].accent;
                const nextAccent = OPERATION_INFO[operation].accent;

                return {
                    ...activity,
                    operation,
                    numOperands: isAddSub ? activity.numOperands : 2,
                    sheetBorderColor: activity.sheetBorderColor === previousAccent ? nextAccent : activity.sheetBorderColor,
                };
            }),
        );
    };

    const updateOperand = (index, value) =>
        setActivities((prev) =>
            prev.map((activity, activityIndex) => {
                if (activityIndex !== activeActivityIndex) {
                    return activity;
                }

                const nextOperands = [...activity.operandValues];
                nextOperands[index] = value;
                return { ...activity, operandValues: nextOperands };
            }),
        );

    const addActivity = () => {
        setActivities((prev) => {
            if (prev.length >= 4) {
                return prev;
            }

            const next = [...prev, createActivity()];
            setActiveActivityIndex(next.length - 1);
            return next;
        });
    };

    const removeActivity = (index) => {
        setActivities((prev) => {
            if (prev.length <= 1) {
                return prev;
            }

            const next = prev.filter((_, i) => i !== index);

            setActiveActivityIndex((current) => {
                if (current === index) {
                    return Math.max(0, index - 1);
                }
                if (current > index) {
                    return current - 1;
                }
                return current;
            });

            return next;
        });
    };

    const isAddSub = config.operation === "suma" || config.operation === "resta";
    const isMultDiv = !isAddSub;
    const activeOperandCount = isMultDiv ? 2 : config.numOperands;
    const getOperandCount = (activity) => {
        const addSub = activity.operation === "suma" || activity.operation === "resta";
        return addSub ? activity.numOperands : 2;
    };

    return {
        config,
        activities,
        activeActivityIndex,
        setActiveActivityIndex,
        update,
        updateOperation,
        updateOperand,
        addActivity,
        removeActivity,
        isAddSub,
        isMultDiv,
        activeOperandCount,
        getOperandCount,
        layout,
        setLayout,
        moveActivity,
    };
}
