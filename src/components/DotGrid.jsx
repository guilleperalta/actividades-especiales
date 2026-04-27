import { resolveAxisGraphic } from "../data/svgLibrary";
import { AxisGraphic } from "./AxisGraphic";

/**
 * DotGrid
 *
 * type="count" -> simple counting grid
 * type="table" -> multiplication and division table with visual axes
 */
export function DotGrid({
    rows = 6,
    cols = 10,
    type = "count",
    dotSize = 14,
    itemType = "dots",
    tableSize = 10,
    xAxisIcon = "child",
    yAxisIcon = "child",
    axisIconSize = 25,
    showAxisNumbers = true,
    savedSvgItems = [],
    fillSpace = false,
    expandContainer = false,
}) {
    if (type === "table") {
        return (
            <TableGrid
                size={tableSize}
                dotSize={dotSize}
                itemType={itemType}
                xAxisIcon={xAxisIcon}
                yAxisIcon={yAxisIcon}
                axisIconSize={axisIconSize}
                showAxisNumbers={showAxisNumbers}
                savedSvgItems={savedSvgItems}
                fillSpace={fillSpace}
            />
        );
    }

    const safeRows = Math.max(1, rows);
    const safeCols = Math.max(1, cols);
    const dotRem = dotSize / 10;
    const containerClassName = fillSpace ? "flex-1 h-full min-h-0" : "w-fit max-w-full mx-auto";
    const wrapperClassName = fillSpace ? "flex h-full items-center justify-center" : "block";
    const gridStyle = fillSpace
        ? {
              display: "grid",
              gridTemplateColumns: `repeat(${safeCols}, minmax(0, 1fr))`,
              gridTemplateRows: `repeat(${safeRows}, minmax(0, 1fr))`,
              gap: "0.8rem",
              width: "100%",
              maxWidth: "100%",
              aspectRatio: `${safeCols} / ${safeRows}`,
          }
        : {
              display: "grid",
              gridTemplateColumns: `repeat(${safeCols}, ${dotRem}rem)`,
              gridAutoRows: `${dotRem}rem`,
              gap: "0.4rem",
              width: "max-content",
              margin: "0 auto",
          };

    return (
        <div className={`${containerClassName} overflow-hidden rounded-[1.8rem] border-[0.3rem] border-gray-300 bg-gray-50 p-4`}>
            <div className={wrapperClassName}>
                <div className="mx-auto" style={gridStyle}>
                    {Array.from({ length: safeRows * safeCols }).map((_, index) => (
                        <CellItem key={index} itemType={itemType} index={index} size={dotRem} fillCell={fillSpace} />
                    ))}
                </div>
            </div>
        </div>
    );
}

function TableGrid({ size, dotSize, itemType, xAxisIcon, yAxisIcon, axisIconSize, showAxisNumbers, savedSvgItems, fillSpace }) {
    const safeSize = Math.max(2, Math.min(12, size));
    const dotRem = Math.max(1, dotSize / 10);
    const cellSizeRem = Math.max(4.6, dotRem + 2.2);
    const headerCellSizeRem = Math.max(cellSizeRem, axisIconSize / 10 + 2.1);
    const tableClassName = fillSpace ? "h-full w-full" : "w-full";
    const resolvedXAxisIcon = resolveAxisGraphic(xAxisIcon, savedSvgItems);
    const resolvedYAxisIcon = resolveAxisGraphic(yAxisIcon, savedSvgItems);

    const renderAxisCell = (graphic, index) => {
        const axisNumber = index + 1;

        return (
            <span className="flex items-center justify-center gap-1.5 px-1 leading-none">
                {showAxisNumbers && <span className="text-[1.3rem] font-bold text-slate-600">{axisNumber}</span>}
                <AxisGraphic graphic={graphic} size={axisIconSize} />
            </span>
        );
    };

    return (
        <div className="table-grid-scroll h-full overflow-auto rounded-[1.8rem] border-[0.3rem] border-gray-300 bg-gray-50 p-3">
            <table className={`border-collapse ${tableClassName}`} style={{ tableLayout: "fixed" }}>
                <thead>
                    <tr>
                        <th className="border border-gray-300 bg-gray-200" style={{ width: `${cellSizeRem}rem`, height: `${headerCellSizeRem}rem` }} />
                        {Array.from({ length: safeSize }, (_, index) => (
                            <th key={index} className="border border-gray-300 bg-gray-100 text-center" style={{ width: `${cellSizeRem}rem`, height: `${headerCellSizeRem}rem` }}>
                                {renderAxisCell(resolvedXAxisIcon, index)}
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {Array.from({ length: safeSize }, (_, rowIndex) => (
                        <tr key={rowIndex}>
                            <td className="border border-gray-300 bg-gray-100 text-center" style={{ width: `${cellSizeRem}rem`, height: `${cellSizeRem}rem` }}>
                                {renderAxisCell(resolvedYAxisIcon, rowIndex)}
                            </td>
                            {Array.from({ length: safeSize }, (_, columnIndex) => (
                                <td key={columnIndex} className="border border-gray-200 bg-white p-0.5 text-center" style={{ width: `${cellSizeRem}rem`, height: `${cellSizeRem}rem` }}>
                                    <CellItem itemType={itemType} index={rowIndex * safeSize + columnIndex} size={dotRem} />
                                </td>
                            ))}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}

function CellItem({ itemType, index, size, fillCell = false }) {
    if (fillCell) {
        const token = itemType === "dots" ? null : getToken(itemType, index);
        const fontRem = Math.max(1.2, size * 0.95);

        return (
            <span className="flex h-full w-full items-center justify-center" style={{ fontSize: `${fontRem}rem`, lineHeight: 1 }}>
                {itemType === "dots" ? <span className="dot" style={{ width: "78%", height: "78%" }} /> : token}
            </span>
        );
    }

    if (itemType === "dots") {
        return <span className="dot mx-auto" style={{ width: `${size}rem`, height: `${size}rem` }} />;
    }

    const token = getToken(itemType, index);
    const fontRem = Math.max(1, size * 0.75);

    return (
        <span className="mx-auto flex items-center justify-center" style={{ width: `${size}rem`, height: `${size}rem`, fontSize: `${fontRem}rem`, lineHeight: 1 }}>
            {token}
        </span>
    );
}

function getToken(itemType, index) {
    switch (itemType) {
        case "numbers":
            return String((index % 9) + 1);
        default:
            return "•";
    }
}
