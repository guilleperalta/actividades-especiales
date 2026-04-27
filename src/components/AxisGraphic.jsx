import { Icon } from "@iconify/react";
import { SvgLibraryIcon } from "./SvgLibraryIcon";

function normalizeInlineSvgMarkup(markup) {
    if (!markup) {
        return "";
    }

    return markup
        .replace(/<svg\b([^>]*)>/i, (match, attributes) => {
            let nextAttributes = attributes
                .replace(/\swidth="[^"]*"/i, "")
                .replace(/\sheight="[^"]*"/i, "")
                .replace(/\sstyle="[^"]*"/i, "")
                .trim();

            nextAttributes = nextAttributes ? ` ${nextAttributes}` : "";

            return `<svg${nextAttributes} width="100%" height="100%" preserveAspectRatio="xMidYMid meet" style="display:block;">`;
        });
}

/**
 * AxisGraphic
 * Renders either a built-in SVG icon or an imported image asset.
 */
export function AxisGraphic({ graphic, size = 28, className = "", adaptiveBackdrop = false }) {
    if (!graphic) {
        return null;
    }

    const contentStyle = { width: size, height: size };

    const renderGraphic = () => {
        if (graphic.type === "inline-svg") {
            return (
                <span
                    className={className}
                    style={{ ...contentStyle, display: "inline-flex", alignItems: "center", justifyContent: "center" }}
                    dangerouslySetInnerHTML={{ __html: normalizeInlineSvgMarkup(graphic.markup) }}
                />
            );
        }

        if (graphic.type === "image") {
            return <img src={graphic.value} alt="" className={className} style={{ ...contentStyle, objectFit: "contain" }} />;
        }

        if (graphic.type === "iconify") {
            return <Icon icon={graphic.value} width={size} height={size} className={className} />;
        }

        return <SvgLibraryIcon name={graphic.value} size={size} className={className} />;
    };

    if (adaptiveBackdrop) {
        return (
            <span
                className="inline-flex items-center justify-center rounded-[1.8rem] p-3"
                style={{
                    background: "linear-gradient(180deg, rgba(71, 85, 105, 0.26) 0%, rgba(51, 65, 85, 0.18) 100%)",
                }}
            >
                {renderGraphic()}
            </span>
        );
    }

    return renderGraphic();
}
