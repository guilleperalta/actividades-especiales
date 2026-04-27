import { Icon } from "@iconify/react";
import { SvgLibraryIcon } from "./SvgLibraryIcon";

/**
 * AxisGraphic
 * Renders either a built-in SVG icon or an imported image asset.
 */
export function AxisGraphic({ graphic, size = 28, className = "" }) {
    if (!graphic) {
        return null;
    }

    if (graphic.type === "image") {
        return <img src={graphic.value} alt="" className={className} style={{ width: size, height: size, objectFit: "contain" }} />;
    }

    if (graphic.type === "iconify") {
        return <Icon icon={graphic.value} width={size} height={size} className={className} />;
    }

    return <SvgLibraryIcon name={graphic.value} size={size} className={className} />;
}
