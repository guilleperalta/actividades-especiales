export const SVG_LIBRARY_STORAGE_KEY = "activity-gen-saved-axis-images";
export const SAVED_ICON_PREFIX = "saved:";
const LIBRARY_ITEMS_API_URL = "/api/library/items";
const LIBRARY_ICONIFY_API_URL = "/api/library/iconify";
const LIBRARY_MIGRATE_API_URL = "/api/library/migrate";

export const SVG_LIBRARY_CATALOG = [
    { value: "child", label: "Niño", category: "Personas", keywords: ["nene", "chico", "persona", "infancia"] },
    { value: "girl", label: "Niña", category: "Personas", keywords: ["nena", "chica", "persona"] },
    { value: "boy", label: "Niño pequeño", category: "Personas", keywords: ["nenito", "varón", "nene"] },
    { value: "baby", label: "Bebé", category: "Personas", keywords: ["bebe", "chiquito", "guagua"] },
    { value: "woman", label: "Mujer", category: "Personas", keywords: ["mama", "mamá", "señora", "persona"] },
    { value: "man", label: "Hombre", category: "Personas", keywords: ["papá", "papa", "señor", "persona"] },
    { value: "teacher", label: "Maestra", category: "Personas", keywords: ["docente", "seño", "señorita", "escuela"] },
    { value: "student", label: "Estudiante", category: "Personas", keywords: ["alumno", "escuela", "clase"] },
    { value: "mate", label: "Mate", category: "Argentina", keywords: ["yerba", "bombilla", "argentino"] },
    { value: "soccer-ball", label: "Pelota", category: "Argentina", keywords: ["futbol", "fútbol", "balón", "deporte"] },
    { value: "bus", label: "Colectivo", category: "Argentina", keywords: ["bondi", "ómnibus", "omnibus", "micro"] },
    { value: "tractor", label: "Tractor", category: "Argentina", keywords: ["campo", "granja", "rural"] },
    { value: "automobile", label: "Auto", category: "Vehículos", keywords: ["coche", "carro"] },
    { value: "pickup-truck", label: "Camioneta", category: "Vehículos", keywords: ["camión", "camion", "utilitario"] },
    { value: "bicycle", label: "Bicicleta", category: "Vehículos", keywords: ["bici"] },
    { value: "bullet-train", label: "Tren", category: "Vehículos", keywords: ["ferrocarril"] },
    { value: "airplane", label: "Avión", category: "Vehículos", keywords: ["avion", "vuelo"] },
    { value: "red-apple", label: "Manzana", category: "Frutas", keywords: ["fruta", "roja"] },
    { value: "banana", label: "Banana", category: "Frutas", keywords: ["plátano", "platano", "fruta"] },
    { value: "grapes", label: "Uvas", category: "Frutas", keywords: ["uva", "fruta"] },
    { value: "pear", label: "Pera", category: "Frutas", keywords: ["fruta"] },
    { value: "strawberry", label: "Frutilla", category: "Frutas", keywords: ["fresa", "fruta"] },
    { value: "watermelon", label: "Sandía", category: "Frutas", keywords: ["sandia", "fruta"] },
    { value: "tangerine", label: "Mandarina", category: "Frutas", keywords: ["naranja", "cítrico", "citrico", "fruta"] },
    { value: "carrot", label: "Zanahoria", category: "Verduras", keywords: ["vegetal", "verdura"] },
    { value: "broccoli", label: "Brócoli", category: "Verduras", keywords: ["brocoli", "vegetal", "verdura"] },
    { value: "ear-of-corn", label: "Maíz", category: "Verduras", keywords: ["maiz", "choclo", "vegetal", "verdura"] },
    { value: "leafy-green", label: "Hoja verde", category: "Verduras", keywords: ["lechuga", "verdura", "vegetal"] },
    { value: "tomato", label: "Tomate", category: "Verduras", keywords: ["verdura", "vegetal"] },
    { value: "bell-pepper", label: "Morrón", category: "Verduras", keywords: ["morron", "pimiento", "verdura", "vegetal"] },
    { value: "potato", label: "Papa", category: "Verduras", keywords: ["patata", "verdura", "vegetal"] },
    { value: "dog-face", label: "Perro", category: "Animales", keywords: ["perrito", "animal", "mascota"] },
    { value: "cat-face", label: "Gato", category: "Animales", keywords: ["gatito", "animal", "mascota"] },
    { value: "rabbit-face", label: "Conejo", category: "Animales", keywords: ["conejito", "animal"] },
    { value: "bear", label: "Oso", category: "Animales", keywords: ["animal"] },
    { value: "bird", label: "Pájaro", category: "Animales", keywords: ["pajaro", "ave", "animal"] },
    { value: "cow-face", label: "Vaca", category: "Animales", keywords: ["animal", "granja"] },
    { value: "horse-face", label: "Caballo", category: "Animales", keywords: ["animal", "granja"] },
    { value: "backpack", label: "Mochila", category: "Objetos", keywords: ["escuela", "bolso"] },
    { value: "pencil", label: "Lápiz", category: "Objetos", keywords: ["lapiz", "escritura", "escuela"] },
    { value: "open-book", label: "Libro", category: "Objetos", keywords: ["cuento", "lectura", "escuela"] },
    { value: "balloon", label: "Globo", category: "Objetos", keywords: ["fiesta", "cumpleaños", "cumpleanos"] },
    { value: "kite", label: "Barrilete", category: "Objetos", keywords: ["cometa", "juego", "viento"] },
    { value: "puzzle-piece", label: "Rompecabezas", category: "Objetos", keywords: ["puzzle", "juego", "pieza"] },
    { value: "artist-palette", label: "Pintura", category: "Objetos", keywords: ["arte", "pintar", "colores"] },
];

export const DEFAULT_AXIS_ICON = SVG_LIBRARY_CATALOG[0].value;

export function createSavedIconReference(id) {
    return `${SAVED_ICON_PREFIX}${id}`;
}

export function isSavedIconReference(value) {
    return typeof value === "string" && value.startsWith(SAVED_ICON_PREFIX);
}

export function getSavedIconId(value) {
    return isSavedIconReference(value) ? value.slice(SAVED_ICON_PREFIX.length) : null;
}

export function loadSavedSvgItems() {
    if (typeof window === "undefined") {
        return [];
    }

    try {
        const raw = window.localStorage.getItem(SVG_LIBRARY_STORAGE_KEY);
        const parsed = raw ? JSON.parse(raw) : [];
        return Array.isArray(parsed) ? parsed : [];
    } catch {
        return [];
    }
}

export function persistSavedSvgItems(items) {
    if (typeof window === "undefined") {
        return;
    }

    window.localStorage.setItem(SVG_LIBRARY_STORAGE_KEY, JSON.stringify(items));
}

export async function fetchSavedSvgItems() {
    const response = await fetch(LIBRARY_ITEMS_API_URL);

    if (!response.ok) {
        throw new Error("Could not load the saved image library.");
    }

    const payload = await response.json();
    return Array.isArray(payload) ? payload : [];
}

export async function migrateLegacySavedSvgItems() {
    const legacyItems = loadSavedSvgItems();

    if (legacyItems.length === 0) {
        return fetchSavedSvgItems();
    }

    const response = await fetch(LIBRARY_MIGRATE_API_URL, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({ items: legacyItems }),
    });

    if (!response.ok) {
        throw new Error("Could not migrate the saved image library.");
    }

    const payload = await response.json();
    return Array.isArray(payload) ? payload : [];
}

export function saveSvgItem(name, iconValue) {
    const trimmedName = name.trim();
    const nextItem = {
        id: typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}`,
        name: trimmedName,
        iconValue,
    };
    const nextItems = [nextItem, ...loadSavedSvgItems()];
    persistSavedSvgItems(nextItems);
    return nextItem;
}

export function saveRemoteSvgItem({ name, imageUrl, thumbnailUrl = "", sourceUrl = "", mimeType = "" }) {
    const trimmedName = name.trim();
    const nextItem = {
        id: typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}`,
        name: trimmedName,
        sourceType: "remote",
        imageUrl,
        thumbnailUrl,
        sourceUrl,
        mimeType,
    };
    const nextItems = [nextItem, ...loadSavedSvgItems()];
    persistSavedSvgItems(nextItems);
    return nextItem;
}

export async function saveIconifyItem({ name, iconName }) {
    const response = await fetch(LIBRARY_ICONIFY_API_URL, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            name: name.trim(),
            iconName,
        }),
    });

    if (!response.ok) {
        throw new Error("Could not save the selected icon.");
    }

    return response.json();
}

export async function waitForSavedImageAvailability(imageUrl, timeoutMs = 4000) {
    const startedAt = Date.now();

    while (Date.now() - startedAt < timeoutMs) {
        try {
            const probeUrl = `${imageUrl}${imageUrl.includes("?") ? "&" : "?"}t=${Date.now()}`;
            const response = await fetch(probeUrl, {
                cache: "no-store",
            });

            if (response.ok) {
                return true;
            }
        } catch {
            // Keep polling until timeout.
        }

        await new Promise((resolve) => window.setTimeout(resolve, 160));
    }

    return false;
}

export async function removeSavedSvgItem(id) {
    const response = await fetch(`${LIBRARY_ITEMS_API_URL}/${encodeURIComponent(id)}`, {
        method: "DELETE",
    });

    if (!response.ok) {
        throw new Error("Could not remove the saved image.");
    }
}

export function resolveSvgLibraryValue(iconReference, savedItems = loadSavedSvgItems()) {
    if (!isSavedIconReference(iconReference)) {
        return iconReference;
    }

    const savedId = getSavedIconId(iconReference);
    return savedItems.find((item) => item.id === savedId)?.iconValue ?? DEFAULT_AXIS_ICON;
}

export function getSvgLibraryLabel(iconReference, savedItems = loadSavedSvgItems()) {
    if (isSavedIconReference(iconReference)) {
        const savedId = getSavedIconId(iconReference);
        return savedItems.find((item) => item.id === savedId)?.name ?? "Imagen guardada";
    }

    return SVG_LIBRARY_CATALOG.find((icon) => icon.value === iconReference)?.label ?? "Imagen";
}

export function resolveAxisGraphic(iconReference, savedItems = loadSavedSvgItems()) {
    if (isSavedIconReference(iconReference)) {
        const savedId = getSavedIconId(iconReference);
        const savedItem = savedItems.find((item) => item.id === savedId);

        if (!savedItem) {
            return {
                type: "library",
                value: DEFAULT_AXIS_ICON,
            };
        }

        if (savedItem.sourceType === "local-file" && savedItem.imageUrl) {
            const immediateImageUrl = savedItem.inlineSvgDataUrl || `${savedItem.imageUrl}?v=${savedItem.id}`;
            const immediateThumbnailUrl = savedItem.inlineSvgDataUrl || `${savedItem.thumbnailUrl || savedItem.imageUrl}?v=${savedItem.id}`;
            return {
                type: savedItem.inlineSvgMarkup ? "inline-svg" : "image",
                value: immediateImageUrl,
                thumbnailUrl: immediateThumbnailUrl,
                markup: savedItem.inlineSvgMarkup || "",
            };
        }

        if (savedItem.sourceType === "remote" && savedItem.imageUrl) {
            return {
                type: "image",
                value: savedItem.imageUrl,
                thumbnailUrl: savedItem.thumbnailUrl || savedItem.imageUrl,
            };
        }

        if (savedItem.sourceType === "iconify" && savedItem.iconName) {
            return {
                type: "iconify",
                value: savedItem.iconName,
            };
        }

        return {
            type: "library",
            value: savedItem.iconValue ?? DEFAULT_AXIS_ICON,
        };
    }

    return {
        type: "library",
        value: iconReference || DEFAULT_AXIS_ICON,
    };
}

export function searchSvgLibrary(searchTerm) {
    const normalizedSearch = searchTerm.trim().toLowerCase();
    if (!normalizedSearch) {
        return SVG_LIBRARY_CATALOG;
    }

    return SVG_LIBRARY_CATALOG.filter((item) => {
        const haystack = [item.label, item.category, item.value, ...(item.keywords ?? [])].join(" ").toLowerCase();
        return haystack.includes(normalizedSearch);
    });
}
