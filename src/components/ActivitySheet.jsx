import { forwardRef, useLayoutEffect, useMemo, useRef, useState } from "react";
import { OPERATION_INFO } from "../hooks/useActivityConfig";
import { DotGrid } from "./DotGrid";

const A4_CONTENT_HEIGHT_PX = 1078;
const GAP_PX = 13;
const REM_IN_PX = 10;
const DOT_GAP_PX = 4;
const SECTION_VERTICAL_PADDING_PX = 32;
const SECTION_BORDER_PX = 8;
const HEADER_BLOCK_HEIGHT_PX = 86;
const EQUATION_BLOCK_HEIGHT_PX = 132;
const GRID_TOP_PADDING_PX = 30;
const GRID_ITEM_VERTICAL_PADDING_PX = 38;
const GRID_ROW_GAP_PX = 12;
const TABLE_WRAPPER_VERTICAL_PADDING_PX = 30;
const TABLE_BASE_HEIGHT_PX = 20;
const GRID_ITEM_HORIZONTAL_PADDING_PX = 38;

function isAddSubActivity(activity) {
    return activity.operation === "suma" || activity.operation === "resta";
}

function getDotGridHeightPx(rows, dotSize) {
    return rows * dotSize + Math.max(0, rows - 1) * DOT_GAP_PX + GRID_ITEM_VERTICAL_PADDING_PX;
}

function getDotGridWidthPx(cols, dotSize) {
    return cols * dotSize + Math.max(0, cols - 1) * DOT_GAP_PX + GRID_ITEM_HORIZONTAL_PADDING_PX;
}

function getTableHeightPx(activity) {
    const safeSize = Math.max(2, Math.min(12, activity.tableSize));
    const dotRem = Math.max(1, activity.dotSize / REM_IN_PX);
    const cellSizePx = Math.max(4.6, dotRem + 2.2) * REM_IN_PX;
    const headerCellSizePx = Math.max(cellSizePx, activity.axisIconSize + 21);

    return TABLE_WRAPPER_VERTICAL_PADDING_PX + TABLE_BASE_HEIGHT_PX + headerCellSizePx + safeSize * cellSizePx;
}

function getActivityHeightPx(activity) {
    const isAddSub = isAddSubActivity(activity);

    if (!isAddSub) {
        return SECTION_VERTICAL_PADDING_PX + SECTION_BORDER_PX + HEADER_BLOCK_HEIGHT_PX + EQUATION_BLOCK_HEIGHT_PX + GRID_TOP_PADDING_PX + getTableHeightPx(activity);
    }

    const operandCount = activity.numOperands;
    const gridHeightPx = getDotGridHeightPx(activity.dotRows, activity.dotSize);
    const totalGridHeightPx =
        activity.gridLayout === "single"
            ? gridHeightPx
            : Math.ceil(operandCount / 2) * gridHeightPx + Math.max(0, Math.ceil(operandCount / 2) - 1) * GRID_ROW_GAP_PX;

    return SECTION_VERTICAL_PADDING_PX + SECTION_BORDER_PX + HEADER_BLOCK_HEIGHT_PX + EQUATION_BLOCK_HEIGHT_PX + GRID_TOP_PADDING_PX + totalGridHeightPx;
}

function buildVerticalPages(activities, getOperandCount) {
    const pages = [];
    let currentPage = [];
    let currentHeightPx = 0;

    activities.forEach((activity) => {
        const operandCount = getOperandCount(activity);
        const heightPx = getActivityHeightPx(activity);
        const gapPx = currentPage.length > 0 ? GAP_PX : 0;

        if (currentPage.length > 0 && currentHeightPx + gapPx + heightPx > A4_CONTENT_HEIGHT_PX) {
            pages.push(currentPage);
            currentPage = [];
            currentHeightPx = 0;
        }

        currentPage.push({ activity, operandCount });
        currentHeightPx += (currentPage.length === 1 ? 0 : GAP_PX) + heightPx;
    });

    if (currentPage.length > 0) {
        pages.push(currentPage);
    }

    return pages;
}

function buildPagesFromHeights(activities, getOperandCount, measuredHeights) {
    const pages = [];
    let currentPage = [];
    let currentHeightPx = 0;

    activities.forEach((activity, index) => {
        const operandCount = getOperandCount(activity);
        const heightPx = measuredHeights[index] ?? getActivityHeightPx(activity);
        const gapPx = currentPage.length > 0 ? GAP_PX : 0;

        if (currentPage.length > 0 && currentHeightPx + gapPx + heightPx > A4_CONTENT_HEIGHT_PX) {
            pages.push(currentPage);
            currentPage = [];
            currentHeightPx = 0;
        }

        currentPage.push({ activity, operandCount });
        currentHeightPx += (currentPage.length === 1 ? 0 : GAP_PX) + heightPx;
    });

    if (currentPage.length > 0) {
        pages.push(currentPage);
    }

    return pages;
}

function getPageSignature(pages) {
    return pages.map((page) => page.map(({ activity }) => activity.id).join(",")).join("|");
}

export const ActivitySheet = forwardRef(function ActivitySheet({ activities, getOperandCount }, ref) {
    const fallbackPages = useMemo(() => buildVerticalPages(activities, getOperandCount), [activities, getOperandCount]);
    const [pages, setPages] = useState(fallbackPages);
    const rootRef = useRef(null);

    useLayoutEffect(() => {
        setPages(fallbackPages);
    }, [fallbackPages]);

    useLayoutEffect(() => {
        const rootElement = rootRef.current;
        if (!rootElement) {
            return;
        }

        const sectionElements = Array.from(rootElement.querySelectorAll("[data-activity-section='true']"));
        if (sectionElements.length !== activities.length) {
            return;
        }

        const measuredHeights = sectionElements.map((element) => Math.ceil(element.getBoundingClientRect().height));
        const measuredPages = buildPagesFromHeights(activities, getOperandCount, measuredHeights);

        if (getPageSignature(measuredPages) !== getPageSignature(pages)) {
            setPages(measuredPages);
        }
    }, [activities, getOperandCount, pages]);

    const setCombinedRef = (node) => {
        rootRef.current = node;

        if (typeof ref === "function") {
            ref(node);
            return;
        }

        if (ref) {
            ref.current = node;
        }
    };

    return (
        <div ref={setCombinedRef} className="sheet-document flex flex-col items-center gap-6">
            {pages.map((pageActivities, pageIndex) => {
                return (
                    <div key={`page-${pageIndex}`} className="sheet-preview-shell flex justify-center py-0 px-0">
                        <div className="sheet-a4 shadow-xl bg-white flex flex-col gap-0 rounded-2xl border-0 w-[210mm] min-h-[297mm] p-[1.4rem_1.6rem]" style={{ boxSizing: "border-box" }}>
                            <div className="grid grid-cols-1 gap-5">
                                {pageActivities.map(({ activity, operandCount }) => {
                        const info = OPERATION_INFO[activity.operation];
                        const isAddSub = activity.operation === "suma" || activity.operation === "resta";
                        const isMultDiv = !isAddSub;
                        const activeOperandCount = operandCount;
                        const titleSizeClass = "text-[4rem]";
                        const titleWrapClass = "min-w-[20rem] px-[3.2rem] py-[1rem]";
                        const boxSize = activeOperandCount > 2 ? "w-[6.6rem] h-[6.6rem] text-[3rem]" : "w-[8.8rem] h-[8.8rem] text-[3.8rem]";
                        const symSize = activeOperandCount > 2 ? "text-[3.2rem]" : "text-[4.2rem]";
                        const equationGapClass = "gap-4";
                        const sectionPaddingClass = "p-[1.6rem]";
                        const headerMarginClass = "mb-4";
                        const equationPaddingClass = "py-3";
                        const gridTopPaddingClass = "pt-3";
                        const gridWrapClass = "grid gap-3 justify-center items-start w-full";
                        const gridMinWidthPx = getDotGridWidthPx(activity.dotCols, activity.dotSize);
                        const gridWrapStyle = {
                            gridTemplateColumns: `repeat(auto-fit, minmax(${gridMinWidthPx}px, max-content))`,
                        };
                        const effectiveDotSize = activity.dotSize;
                        const effectiveAxisIconSize = activity.axisIconSize;
                        const effectiveTableSize = activity.tableSize;

                        return (
                            <section
                                key={activity.id}
                                data-activity-section="true"
                                className={`rounded-2xl flex flex-col justify-start items-stretch ${sectionPaddingClass}`}
                                style={{
                                    borderWidth: activity.showSheetBorder ? "0.4rem" : "0",
                                    borderStyle: "solid",
                                    borderColor: activity.sheetBorderColor || info.accent,
                                    backgroundColor: "#ffffff",
                                }}
                            >
                                <div className={`flex justify-center ${headerMarginClass}`}>
                                    <div data-export-title-wrap="true" className={`flex items-center justify-center border-[0.3rem] border-gray-800 rounded-[1.6rem] text-center ${titleWrapClass}`}>
                                        <p data-export-title="true" className={`flex items-center justify-center font-display ${titleSizeClass} font-black tracking-wide leading-none text-gray-900`}>
                                            {info.label}
                                        </p>
                                    </div>
                                </div>

                                <div className={`flex items-center justify-center ${equationGapClass} flex-wrap ${equationPaddingClass}`}>
                                    {Array.from({ length: activeOperandCount }).map((_, i) => (
                                        <span key={`${activity.id}-${i}`} className={`flex items-center ${equationGapClass}`}>
                                            {i > 0 && <span data-export-symbol-wrap="true" className="inline-flex items-center justify-center"><span data-export-symbol="true" className={`inline-flex items-center justify-center leading-none ${symSize} font-bold text-gray-800`}>{info.symbol}</span></span>}
                                            <span className={`${boxSize} border-[0.5rem] border-gray-800 rounded-[1.6rem] bg-white font-bold text-gray-900 flex items-center justify-center shadow-sm`}>{activity.operandValues[i] || ""}</span>
                                        </span>
                                    ))}
                                    <span data-export-symbol-wrap="true" className="inline-flex items-center justify-center"><span data-export-symbol="true" className={`inline-flex items-center justify-center leading-none ${symSize} font-bold text-gray-800`}>=</span></span>
                                    <span className={`${boxSize} border-[0.5rem] border-gray-800 rounded-[1.6rem] bg-white shadow-sm`} />
                                </div>

                                <div className={`${gridTopPaddingClass} flex flex-col`}>
                                    {isAddSub && activity.gridLayout === "double" && (
                                        <div className={gridWrapClass} style={gridWrapStyle}>
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
