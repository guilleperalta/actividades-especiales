import fs from "node:fs/promises";
import path from "node:path";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

const LIBRARY_FOLDER_NAME = "saved-axis-images";
const LIBRARY_PUBLIC_DIR = path.resolve(process.cwd(), "public", LIBRARY_FOLDER_NAME);
const LIBRARY_INDEX_FILE = path.resolve(LIBRARY_PUBLIC_DIR, "index.json");
const ICONIFY_ICON_API_URL = "https://api.iconify.design";
const MY_MEMORY_TRANSLATE_API_URL = "https://api.mymemory.translated.net/get";

function sanitizeFileNameSegment(value) {
    return value
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "")
        .slice(0, 60) || "icon";
}

async function ensureLibraryStorage() {
    await fs.mkdir(LIBRARY_PUBLIC_DIR, { recursive: true });

    try {
        await fs.access(LIBRARY_INDEX_FILE);
    } catch {
        await fs.writeFile(LIBRARY_INDEX_FILE, "[]\n", "utf8");
    }
}

async function readLibraryItems() {
    await ensureLibraryStorage();

    try {
        const raw = await fs.readFile(LIBRARY_INDEX_FILE, "utf8");
        const parsed = JSON.parse(raw);
        return Array.isArray(parsed) ? parsed : [];
    } catch {
        return [];
    }
}

async function writeLibraryItems(items) {
    await ensureLibraryStorage();
    await fs.writeFile(LIBRARY_INDEX_FILE, `${JSON.stringify(items, null, 2)}\n`, "utf8");
}

function getPublicFileUrl(fileName) {
    return `/${LIBRARY_FOLDER_NAME}/${fileName}`;
}

async function fetchIconifySvg(iconName) {
    const response = await fetch(`${ICONIFY_ICON_API_URL}/${encodeURIComponent(iconName)}.svg`);

    if (!response.ok) {
        throw new Error("Could not download the selected icon.");
    }

    return response.text();
}

async function translateTextToEnglish(text) {
    const params = new URLSearchParams({
        q: text.trim(),
        langpair: "es|en",
    });
    const response = await fetch(`${MY_MEMORY_TRANSLATE_API_URL}?${params.toString()}`);

    if (!response.ok) {
        throw new Error("Could not translate the search text.");
    }

    const payload = await response.json();
    const translatedText = typeof payload?.responseData?.translatedText === "string" ? payload.responseData.translatedText.trim() : "";
    const alternativeTranslations = Array.isArray(payload?.matches)
        ? payload.matches
              .map((match) => (typeof match?.translation === "string" ? match.translation.trim() : ""))
              .filter(Boolean)
        : [];

    return Array.from(new Set([translatedText, ...alternativeTranslations])).filter(Boolean);
}

async function buildLocalFileItem({ name, svgContent, iconName = "" }) {
    await ensureLibraryStorage();

    const baseName = sanitizeFileNameSegment(name);
    const uniqueId = typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}`;
    const fileName = `${baseName}-${uniqueId}.svg`;
    const filePath = path.resolve(LIBRARY_PUBLIC_DIR, fileName);

    await fs.writeFile(filePath, svgContent, "utf8");
    const inlineSvgDataUrl = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svgContent)}`;

    return {
        id: uniqueId,
        name: name.trim(),
        sourceType: "local-file",
        imageUrl: getPublicFileUrl(fileName),
        thumbnailUrl: getPublicFileUrl(fileName),
        inlineSvgDataUrl,
        inlineSvgMarkup: svgContent,
        mimeType: "image/svg+xml",
        iconName,
        fileName,
    };
}

async function saveIconifyItemToLibrary({ name, iconName }) {
    const svgContent = await fetchIconifySvg(iconName);
    const nextItem = await buildLocalFileItem({ name, svgContent, iconName });
    const nextItems = [nextItem, ...(await readLibraryItems())];
    await writeLibraryItems(nextItems);
    return nextItem;
}

async function migrateLegacyItem(item) {
    if (!item?.name) {
        return null;
    }

    if (item.sourceType === "iconify" && item.iconName) {
        return saveIconifyItemToLibrary({ name: item.name, iconName: item.iconName });
    }

    if (item.sourceType === "remote" && item.imageUrl) {
        return {
            id: item.id || (typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}`),
            name: item.name.trim(),
            sourceType: "remote",
            imageUrl: item.imageUrl,
            thumbnailUrl: item.thumbnailUrl || item.imageUrl,
            sourceUrl: item.sourceUrl || "",
            mimeType: item.mimeType || "",
        };
    }

    if (item.iconValue) {
        return {
            id: item.id || (typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}`),
            name: item.name.trim(),
            sourceType: "library",
            iconValue: item.iconValue,
        };
    }

    return null;
}

function readJsonBody(req) {
    return new Promise((resolve, reject) => {
        let rawBody = "";

        req.on("data", (chunk) => {
            rawBody += chunk;
        });

        req.on("end", () => {
            try {
                resolve(rawBody ? JSON.parse(rawBody) : {});
            } catch (error) {
                reject(error);
            }
        });

        req.on("error", reject);
    });
}

function createLibraryApiPlugin() {
    const requestHandler = async (req, res) => {
        const requestUrl = req.url ? new URL(req.url, "http://localhost") : null;

        if (!requestUrl || !requestUrl.pathname.startsWith("/api/")) {
            return false;
        }

        try {
            if (req.method === "GET" && requestUrl.pathname === "/api/translate/es-en") {
                const text = requestUrl.searchParams.get("text")?.trim() ?? "";

                if (!text) {
                    res.statusCode = 400;
                    res.setHeader("Content-Type", "application/json; charset=utf-8");
                    res.end(JSON.stringify({ message: "Text is required." }));
                    return true;
                }

                const translations = await translateTextToEnglish(text);
                res.setHeader("Content-Type", "application/json; charset=utf-8");
                res.end(JSON.stringify({ translations }));
                return true;
            }

            if (req.method === "GET" && requestUrl.pathname === "/api/library/items") {
                const items = await readLibraryItems();
                res.setHeader("Content-Type", "application/json; charset=utf-8");
                res.end(JSON.stringify(items));
                return true;
            }

            if (req.method === "POST" && requestUrl.pathname === "/api/library/iconify") {
                const body = await readJsonBody(req);
                const name = typeof body?.name === "string" ? body.name.trim() : "";
                const iconName = typeof body?.iconName === "string" ? body.iconName.trim() : "";

                if (!name || !iconName) {
                    res.statusCode = 400;
                    res.setHeader("Content-Type", "application/json; charset=utf-8");
                    res.end(JSON.stringify({ message: "Name and iconName are required." }));
                    return true;
                }

                const nextItem = await saveIconifyItemToLibrary({ name, iconName });
                res.setHeader("Content-Type", "application/json; charset=utf-8");
                res.end(JSON.stringify(nextItem));
                return true;
            }

            if (req.method === "POST" && requestUrl.pathname === "/api/library/migrate") {
                const body = await readJsonBody(req);
                const legacyItems = Array.isArray(body?.items) ? body.items : [];
                const currentItems = await readLibraryItems();

                if (currentItems.length > 0 || legacyItems.length === 0) {
                    res.setHeader("Content-Type", "application/json; charset=utf-8");
                    res.end(JSON.stringify(currentItems));
                    return true;
                }

                const migratedItems = [];
                for (const legacyItem of legacyItems) {
                    const nextItem = await migrateLegacyItem(legacyItem);
                    if (nextItem) {
                        migratedItems.push(nextItem);
                    }
                }

                await writeLibraryItems(migratedItems);
                res.setHeader("Content-Type", "application/json; charset=utf-8");
                res.end(JSON.stringify(migratedItems));
                return true;
            }

            if (req.method === "DELETE" && requestUrl.pathname.startsWith("/api/library/items/")) {
                const itemId = requestUrl.pathname.split("/").pop();
                const currentItems = await readLibraryItems();
                const itemToRemove = currentItems.find((item) => item.id === itemId);
                const nextItems = currentItems.filter((item) => item.id !== itemId);

                if (itemToRemove?.fileName) {
                    const filePath = path.resolve(LIBRARY_PUBLIC_DIR, itemToRemove.fileName);
                    await fs.rm(filePath, { force: true });
                }

                await writeLibraryItems(nextItems);
                res.statusCode = 204;
                res.end();
                return true;
            }

            res.statusCode = 404;
            res.end();
            return true;
        } catch (error) {
            res.statusCode = 500;
            res.setHeader("Content-Type", "application/json; charset=utf-8");
            res.end(JSON.stringify({ message: error instanceof Error ? error.message : "Unknown server error." }));
            return true;
        }
    };

    return {
        name: "library-api",
        configureServer(server) {
            server.middlewares.use((req, res, next) => {
                void requestHandler(req, res).then((handled) => {
                    if (!handled) {
                        next();
                    }
                });
            });
        },
        configurePreviewServer(server) {
            server.middlewares.use((req, res, next) => {
                void requestHandler(req, res).then((handled) => {
                    if (!handled) {
                        next();
                    }
                });
            });
        },
    };
}

export default defineConfig({
    plugins: [react(), createLibraryApiPlugin()],
});
