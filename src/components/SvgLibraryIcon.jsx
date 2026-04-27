import { Icon } from "@iconify/react";

/**
 * SvgLibraryIcon
 * Renders an SVG from the Fluent Emoji Flat collection.
 */
export function SvgLibraryIcon({ name, size = 28, className = "" }) {
    if (!name) {
        return null;
    }

    return <Icon icon={`fluent-emoji-flat:${name}`} width={size} height={size} className={className} />;
}
