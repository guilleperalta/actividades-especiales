import { forwardRef } from "react";
import { OPERATION_INFO } from "../hooks/useActivityConfig";
import { DotGrid } from "./DotGrid";

/**
 * ActivitySheet
 * Printable A4 sheet exposed with forwardRef so App
 * can export it with html2canvas.
 */
export const ActivitySheet = forwardRef(function ActivitySheet({ activities, getOperandCount, layout = "vertical" }, ref) {
    // Available layouts: vertical, horizontal, grid.
    let gridClass = "grid-cols-1";
    let sectionClass = "";
    if (layout === "vertical") {
        gridClass = `grid-rows-${activities.length}`;
        sectionClass = `h-[calc(${100 / activities.length}% - 1.2rem)]`;
    } else if (layout === "horizontal") {
        gridClass = `grid-cols-${activities.length}`;
        sectionClass = `w-full`;
    } else if (layout === "grid") {
        if (activities.length === 2) {
            gridClass = "grid-cols-2 grid-rows-1";
            sectionClass = "";
        } else if (activities.length === 3) {
            gridClass = "grid-cols-2 grid-rows-2";
            sectionClass = "first:col-span-2 first:row-span-1";
        } else if (activities.length === 4) {
            gridClass = "grid-cols-2 grid-rows-2";
            sectionClass = "";
        } else {
            gridClass = "grid-cols-1";
        }
    }

    return (
        <div className="sheet-preview-shell flex justify-center py-0 px-0">
            <div ref={ref} className="sheet-a4 shadow-xl bg-white flex flex-col gap-0 rounded-2xl border-0 w-[210mm] min-h-[297mm] p-[1.4rem_1.6rem]" style={{ boxSizing: "border-box" }}>
                <div className={`h-full grid gap-5 ${gridClass}`} style={{ minHeight: "0" }}>
                    {activities.map((activity, idx) => {
                        const info = OPERATION_INFO[activity.operation];
                        const isAddSub = activity.operation === "suma" || activity.operation === "resta";
                        const isMultDiv = !isAddSub;
                        const activeOperandCount = getOperandCount(activity);
                        const isCompactSheet = activities.length > 2;
                        const titleSizeClass = isCompactSheet ? "text-[2.4rem]" : "text-[4rem]";
                        const titleWrapClass = isCompactSheet ? "min-w-[16rem] px-[2.4rem] py-[0.8rem]" : "min-w-[20rem] px-[3.2rem] py-[1rem]";
                        const boxSize = isCompactSheet ? "w-[5.4rem] h-[5.4rem] text-[2.4rem]" : activeOperandCount > 2 ? "w-[6.6rem] h-[6.6rem] text-[3rem]" : "w-[8.8rem] h-[8.8rem] text-[3.8rem]";
                        const symSize = isCompactSheet ? "text-[3rem]" : activeOperandCount > 2 ? "text-[3.2rem]" : "text-[4.2rem]";
                        const equationGapClass = isCompactSheet ? "gap-3" : "gap-4";
                        const gridWrapClass = activeOperandCount === 4 ? "grid grid-cols-2 gap-4 items-stretch w-full" : "grid grid-cols-2 gap-4 items-stretch w-full";

                        return (
                            <section
                                key={activity.id}
                                className={`rounded-2xl p-[1.6rem] flex flex-col justify-start items-stretch ${sectionClass}`}
                                style={{
                                    borderWidth: activity.showSheetBorder ? "0.4rem" : "0",
                                    borderStyle: "solid",
                                    borderColor: activity.sheetBorderColor || info.accent,
                                    backgroundColor: "#ffffff",
                                }}
                            >
                                <div className="flex justify-center mb-4">
                                    <div className={`border-[0.3rem] border-gray-800 rounded-[1.6rem] text-center ${titleWrapClass}`}>
                                        <p className={`${titleSizeClass} font-black tracking-wide leading-none text-gray-900`} style={{ fontFamily: "'Fredoka One', cursive" }}>
                                            {info.label}
                                        </p>
                                    </div>
                                </div>

                                <div className={`flex items-center justify-center ${equationGapClass} flex-wrap py-3`}>
                                    {Array.from({ length: activeOperandCount }).map((_, i) => (
                                        <span key={`${activity.id}-${i}`} className={`flex items-center ${equationGapClass}`}>
                                            {i > 0 && <span className={`${symSize} font-bold text-gray-800`}>{info.symbol}</span>}
                                            <span className={`${boxSize} border-[0.5rem] border-gray-800 rounded-[1.6rem] bg-white font-bold text-gray-900 flex items-center justify-center shadow-sm`}>{activity.operandValues[i] || ""}</span>
                                        </span>
                                    ))}
                                    <span className={`${symSize} font-bold text-gray-800`}>=</span>
                                    <span className={`${boxSize} border-[0.5rem] border-gray-800 rounded-[1.6rem] bg-white shadow-sm`} />
                                </div>

                                <div className="flex-1 min-h-0 pt-3 flex flex-col">
                                    {isAddSub && activity.gridLayout === "double" && (
                                        <div className={gridWrapClass}>
                                            {Array.from({ length: activeOperandCount }).map((_, i) => (
                                                <DotGrid key={`${activity.id}-grid-${i}`} rows={activity.dotRows} cols={activity.dotCols} dotSize={activity.dotSize} expandContainer />
                                            ))}
                                        </div>
                                    )}

                                    {isAddSub && activity.gridLayout === "single" && (
                                        <div className="flex justify-stretch w-full">
                                            <DotGrid rows={activity.dotRows} cols={activity.dotCols} dotSize={activity.dotSize} expandContainer />
                                        </div>
                                    )}

                                    {isMultDiv && <DotGrid type="table" tableSize={activity.tableSize} dotSize={activity.dotSize} xAxisIcon={activity.xAxisIcon} yAxisIcon={activity.yAxisIcon} axisIconSize={activity.axisIconSize} showAxisNumbers={activity.showAxisNumbers} fillSpace />}
                                </div>
                            </section>
                        );
                    })}
                </div>
            </div>
        </div>
    );
});
