import { forwardRef } from "react";
import { OPERATION_INFO } from "../hooks/useActivityConfig";
import { DotGrid } from "./DotGrid";

const PAGE_CAPACITY = 100;
const LIGHT_ACTIVITY_PAGE_CAPACITY = 120;

function isAddSubActivity(activity) {
    return activity.operation === "suma" || activity.operation === "resta";
}

function getActivityWeight(activity, operandCount) {
    const isAddSub = isAddSubActivity(activity);

    if (!isAddSub) {
        const tableWeight = 44 + activity.tableSize * 2.2;
        const dotWeight = activity.dotSize * 0.8;
        return Math.min(74, tableWeight + dotWeight);
    }

    const gridModeWeight = activity.gridLayout === "single" ? 18 : 24;
    const operandWeight = operandCount * 3;
    const densityWeight = (activity.dotRows * activity.dotCols) / 9;
    const dotWeight = activity.dotSize * 0.28;
    return Math.min(42, gridModeWeight + operandWeight + densityWeight + dotWeight);
}

function buildVerticalPages(activities, getOperandCount) {
    const pages = [];
    let currentPage = [];
    let currentWeight = 0;

    activities.forEach((activity) => {
        const operandCount = getOperandCount(activity);
        const weight = getActivityWeight(activity, operandCount);
        const currentPageOnlyAddSub = currentPage.every((entry) => isAddSubActivity(entry.activity));
        const nextPageOnlyAddSub = isAddSubActivity(activity) && currentPageOnlyAddSub;
        const pageCapacity = nextPageOnlyAddSub ? LIGHT_ACTIVITY_PAGE_CAPACITY : PAGE_CAPACITY;

        if (currentPage.length > 0 && currentWeight + weight > pageCapacity) {
            pages.push(currentPage);
            currentPage = [];
            currentWeight = 0;
        }

        currentPage.push({
            activity,
            weight,
            operandCount,
        });
        currentWeight += weight;
    });

    if (currentPage.length > 0) {
        pages.push(currentPage);
    }

    return pages;
}

/**
 * ActivitySheet
 * Printable A4 sheet exposed with forwardRef so App
 * can export it with html2canvas.
 */
export const ActivitySheet = forwardRef(function ActivitySheet({ activities, getOperandCount, layout = "vertical" }, ref) {
    const pages = layout === "vertical" ? buildVerticalPages(activities, getOperandCount) : [activities.map((activity) => ({ activity, weight: 1, operandCount: getOperandCount(activity) }))];

    return (
        <div ref={ref} className="sheet-document flex flex-col items-center gap-6">
            {pages.map((pageActivities, pageIndex) => {
                let gridClass = "grid-cols-1";
                let sectionClass = "";
                let pageGridStyle = { minHeight: "0" };

                if (layout === "vertical") {
                    gridClass = "grid-cols-1";
                    pageGridStyle = {
                        minHeight: "0",
                        gridTemplateRows: pageActivities.map((entry) => `${entry.weight}fr`).join(" "),
                    };
                    sectionClass = "min-h-0";
                } else if (layout === "horizontal") {
                    gridClass = `grid-cols-${pageActivities.length}`;
                    sectionClass = "w-full";
                } else if (layout === "grid") {
                    if (pageActivities.length === 2) {
                        gridClass = "grid-cols-2 grid-rows-1";
                    } else if (pageActivities.length === 3) {
                        gridClass = "grid-cols-2 grid-rows-2";
                        sectionClass = "first:col-span-2 first:row-span-1";
                    } else if (pageActivities.length === 4) {
                        gridClass = "grid-cols-2 grid-rows-2";
                    } else {
                        gridClass = "grid-cols-1";
                    }
                }

                return (
                    <div key={`page-${pageIndex}`} className="sheet-preview-shell flex justify-center py-0 px-0">
                        <div className="sheet-a4 shadow-xl bg-white flex flex-col gap-0 rounded-2xl border-0 w-[210mm] min-h-[297mm] p-[1.4rem_1.6rem]" style={{ boxSizing: "border-box" }}>
                            <div className={`h-full grid gap-5 ${gridClass}`} style={pageGridStyle}>
                                {pageActivities.map(({ activity, operandCount }, idx) => {
                        const info = OPERATION_INFO[activity.operation];
                        const isAddSub = activity.operation === "suma" || activity.operation === "resta";
                        const isMultDiv = !isAddSub;
                        const activeOperandCount = operandCount;
                        const activitiesOnPage = pageActivities.length;
                        const allActivitiesAreAddSub = pageActivities.every((entry) => isAddSubActivity(entry.activity));
                        const isVeryCompactSheet = activitiesOnPage >= 3;
                        const isCompactSheet = activitiesOnPage >= 2;
                        const contentScale = activitiesOnPage === 1 ? 1 : activitiesOnPage === 2 ? (allActivitiesAreAddSub ? 0.94 : 0.78) : activitiesOnPage === 3 ? 0.66 : 0.58;
                        const titleSizeClass = isVeryCompactSheet ? "text-[2rem]" : isCompactSheet ? "text-[2.8rem]" : "text-[4rem]";
                        const titleWrapClass = isVeryCompactSheet ? "min-w-[13rem] px-[1.8rem] py-[0.6rem]" : isCompactSheet ? "min-w-[15rem] px-[2.1rem] py-[0.7rem]" : "min-w-[20rem] px-[3.2rem] py-[1rem]";
                        const boxSize = isVeryCompactSheet ? "w-[4.6rem] h-[4.6rem] text-[2rem]" : isCompactSheet ? "w-[6rem] h-[6rem] text-[2.6rem]" : activeOperandCount > 2 ? "w-[6.6rem] h-[6.6rem] text-[3rem]" : "w-[8.8rem] h-[8.8rem] text-[3.8rem]";
                        const symSize = isVeryCompactSheet ? "text-[2.4rem]" : isCompactSheet ? "text-[3rem]" : activeOperandCount > 2 ? "text-[3.2rem]" : "text-[4.2rem]";
                        const equationGapClass = isVeryCompactSheet ? "gap-2" : isCompactSheet ? (allActivitiesAreAddSub ? "gap-4" : "gap-3") : "gap-4";
                        const sectionPaddingClass = isVeryCompactSheet ? "p-[1rem]" : isCompactSheet ? (allActivitiesAreAddSub ? "p-[1.4rem]" : "p-[1.2rem]") : "p-[1.6rem]";
                        const headerMarginClass = isVeryCompactSheet ? "mb-2" : allActivitiesAreAddSub && activitiesOnPage === 2 ? "mb-5" : "mb-4";
                        const equationPaddingClass = isVeryCompactSheet ? "py-1" : allActivitiesAreAddSub && activitiesOnPage === 2 ? "py-3" : isCompactSheet ? "py-2" : "py-3";
                        const gridTopPaddingClass = isVeryCompactSheet ? "pt-2" : allActivitiesAreAddSub && activitiesOnPage === 2 ? "pt-4" : "pt-3";
                        const gridWrapClass = activeOperandCount === 4 ? "grid grid-cols-2 gap-3 justify-items-center items-start w-full" : "grid grid-cols-2 gap-3 justify-items-center items-start w-full";
                        const effectiveDotSize = Math.max(8, Math.round(activity.dotSize * contentScale));
                        const effectiveAxisIconSize = Math.max(16, Math.round(activity.axisIconSize * contentScale));
                        const effectiveTableSize = isVeryCompactSheet ? Math.min(activity.tableSize, 8) : isCompactSheet ? Math.min(activity.tableSize, 9) : activity.tableSize;

                        return (
                            <section
                                key={activity.id}
                                className={`rounded-2xl flex flex-col justify-start items-stretch ${sectionPaddingClass} ${sectionClass}`}
                                style={{
                                    borderWidth: activity.showSheetBorder ? "0.4rem" : "0",
                                    borderStyle: "solid",
                                    borderColor: activity.sheetBorderColor || info.accent,
                                    backgroundColor: "#ffffff",
                                }}
                            >
                                <div className={`flex justify-center ${headerMarginClass}`}>
                                    <div className={`border-[0.3rem] border-gray-800 rounded-[1.6rem] text-center ${titleWrapClass}`}>
                                        <p className={`font-display ${titleSizeClass} font-black tracking-wide leading-none text-gray-900`}>
                                            {info.label}
                                        </p>
                                    </div>
                                </div>

                                <div className={`flex items-center justify-center ${equationGapClass} flex-wrap ${equationPaddingClass}`}>
                                    {Array.from({ length: activeOperandCount }).map((_, i) => (
                                        <span key={`${activity.id}-${i}`} className={`flex items-center ${equationGapClass}`}>
                                            {i > 0 && <span className={`${symSize} font-bold text-gray-800`}>{info.symbol}</span>}
                                            <span className={`${boxSize} border-[0.5rem] border-gray-800 rounded-[1.6rem] bg-white font-bold text-gray-900 flex items-center justify-center shadow-sm`}>{activity.operandValues[i] || ""}</span>
                                        </span>
                                    ))}
                                    <span className={`${symSize} font-bold text-gray-800`}>=</span>
                                    <span className={`${boxSize} border-[0.5rem] border-gray-800 rounded-[1.6rem] bg-white shadow-sm`} />
                                </div>

                                <div className={`flex-1 min-h-0 ${gridTopPaddingClass} flex flex-col`}>
                                    {isAddSub && activity.gridLayout === "double" && (
                                        <div className={gridWrapClass}>
                                            {Array.from({ length: activeOperandCount }).map((_, i) => (
                                                <DotGrid key={`${activity.id}-grid-${i}`} rows={activity.dotRows} cols={activity.dotCols} dotSize={effectiveDotSize} />
                                            ))}
                                        </div>
                                    )}

                                    {isAddSub && activity.gridLayout === "single" && (
                                        <div className="flex justify-center w-full">
                                            <DotGrid rows={activity.dotRows} cols={activity.dotCols} dotSize={effectiveDotSize} />
                                        </div>
                                    )}

                                    {isMultDiv && <DotGrid type="table" tableSize={effectiveTableSize} dotSize={effectiveDotSize} xAxisIcon={activity.xAxisIcon} yAxisIcon={activity.yAxisIcon} axisIconSize={effectiveAxisIconSize} showAxisNumbers={activity.showAxisNumbers} fillSpace />}
                                </div>
                            </section>
                                );
                            })}
                            </div>
                        </div>
                    </div>
                );
            })}
        </div>
    );
});
