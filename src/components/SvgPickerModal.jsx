import { useEffect, useMemo, useState } from "react";
import { createSavedIconReference, removeSavedSvgItem, resolveAxisGraphic, saveIconifyItem, searchSvgLibrary } from "../data/svgLibrary";
import { AxisGraphic } from "./AxisGraphic";

const ICONIFY_SEARCH_API_URL = "https://api.iconify.design/search";
const MAX_REMOTE_RESULTS = 40;

function buildRemoteQueries(searchValue) {
    const normalizedSearch = searchValue.trim().toLowerCase();
    const tokens = normalizedSearch.split(/\s+/).filter(Boolean);
    return Array.from(new Set([normalizedSearch, ...tokens])).filter(Boolean);
}

async function searchIconifyQueries(queries, signal) {
    const payloads = await Promise.all(
        queries.map(async (query) => {
            const params = new URLSearchParams({
                query,
                limit: "24",
            });
            const response = await fetch(`${ICONIFY_SEARCH_API_URL}?${params.toString()}`, {
                signal,
            });

            if (!response.ok) {
                throw new Error("No se pudo buscar en el repositorio de iconos.");
            }

            return response.json();
        }),
    );

    return payloads.flatMap((payload) => payload.icons ?? []).filter((iconName, index, allIcons) => allIcons.indexOf(iconName) === index);
}

function mapRemoteResults(iconNames) {
    return iconNames
        .slice(0, MAX_REMOTE_RESULTS)
        .map((iconName) => ({
            id: iconName,
            iconName,
            label: iconName.split(":")[1].replace(/[-_]+/g, " "),
        }));
}

function buildGoogleTranslateUrl(searchValue) {
    const normalizedSearch = searchValue.trim();

    if (!normalizedSearch) {
        return "https://translate.google.com/?sl=es&tl=en&op=translate";
    }

    const params = new URLSearchParams({
        sl: "es",
        tl: "en",
        text: normalizedSearch,
        op: "translate",
    });

    return `https://translate.google.com/?${params.toString()}`;
}

/**
 * SvgPickerModal
 * Allows instant selection from local items and remote search
 * limited to public icon repositories.
 */
export function SvgPickerModal({ title, selectedIcon, savedItems, onSelect, onSavedItemsChange, onClose }) {
    const [searchTerm, setSearchTerm] = useState("");
    const [remoteResults, setRemoteResults] = useState([]);
    const [isSearchingRemote, setIsSearchingRemote] = useState(false);
    const [remoteError, setRemoteError] = useState("");
    const [pendingRemoteIcon, setPendingRemoteIcon] = useState(null);
    const [draftName, setDraftName] = useState("");

    useEffect(() => {
        if (pendingRemoteIcon) {
            setDraftName(pendingRemoteIcon.label);
        }
    }, [pendingRemoteIcon]);

    useEffect(() => {
        if (searchTerm.trim().length < 2) {
            setRemoteResults([]);
            setRemoteError("");
            setIsSearchingRemote(false);
            return undefined;
        }

        const controller = new AbortController();
        const timeoutId = window.setTimeout(async () => {
            setIsSearchingRemote(true);
            setRemoteError("");

            try {
                const remoteQueries = buildRemoteQueries(searchTerm);
                const remoteIcons = await searchIconifyQueries(remoteQueries, controller.signal);
                const nextResults = mapRemoteResults(remoteIcons);
                setRemoteResults(nextResults);

                if (nextResults.length === 0) {
                    setRemoteError("No encontré iconos útiles con ese término.");
                }
            } catch (error) {
                if (error.name !== "AbortError") {
                    setRemoteResults([]);
                    setRemoteError("No pude consultar el repositorio de iconos en este momento.");
                }
            } finally {
                setIsSearchingRemote(false);
            }
        }, 350);

        return () => {
            controller.abort();
            window.clearTimeout(timeoutId);
        };
    }, [searchTerm]);

    const filteredCatalog = useMemo(() => searchSvgLibrary(searchTerm), [searchTerm]);

    const groupedCatalog = useMemo(() => {
        return filteredCatalog.reduce((accumulator, item) => {
            if (!accumulator[item.category]) {
                accumulator[item.category] = [];
            }
            accumulator[item.category].push(item);
            return accumulator;
        }, {});
    }, [filteredCatalog]);
    const googleTranslateUrl = buildGoogleTranslateUrl(searchTerm);

    const selectedGraphic = resolveAxisGraphic(selectedIcon, savedItems);
    const pendingGraphic = pendingRemoteIcon ? { type: "iconify", value: pendingRemoteIcon.iconName } : selectedGraphic;

    const handleLocalSelect = (iconReference) => {
        onSelect(iconReference);
    };

    const handleRemoveSaved = (id) => {
        void (async () => {
            await removeSavedSvgItem(id);
            await onSavedItemsChange(null, id);
        })();
    };

    const handleSaveRemote = () => {
        void (async () => {
            if (!pendingRemoteIcon || !draftName.trim()) {
                return;
            }

            const savedItem = await saveIconifyItem({
                name: draftName.trim(),
                iconName: pendingRemoteIcon.iconName,
            });

            await onSavedItemsChange(savedItem);
            onSelect(createSavedIconReference(savedItem.id));
        })();
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/78 px-6 py-8 backdrop-blur-sm">
            <div className="flex max-h-[90vh] w-full max-w-7xl flex-col overflow-hidden rounded-[2rem] border border-slate-700 bg-slate-900 shadow-[0_30px_80px_rgba(15,23,42,0.55)]">
                <div className="flex items-center justify-between border-b border-slate-800 px-6 py-5">
                    <div>
                        <h2 className="text-[2.2rem] font-bold text-slate-50">{title}</h2>
                        <p className="mt-1 text-[1.3rem] text-slate-400">Elegí iconos vectoriales públicos y consistentes. La búsqueda remota combina varias colecciones open source dentro de Iconify.</p>
                    </div>
                    <button type="button" onClick={onClose} className="h-12 w-12 rounded-xl border border-slate-700 bg-slate-800 text-[1.8rem] text-slate-300 transition-colors hover:bg-slate-700 hover:text-white" aria-label="Cerrar selector de imágenes">
                        ×
                    </button>
                </div>

                <div className="grid min-h-0 flex-1 grid-cols-[minmax(0,1fr)_34rem] overflow-hidden">
                    <div className="flex min-h-0 flex-col border-r border-slate-800">
                        <div className="border-b border-slate-800 px-6 py-4">
                            <label className="block">
                                <span className="mb-2 block text-[1.25rem] font-bold uppercase tracking-[0.18em] text-slate-500">Buscar icono</span>
                                <input type="text" value={searchTerm} onChange={(event) => setSearchTerm(event.target.value)} placeholder="Ej.: manzana, nena, colectivo, perro..." className="w-full rounded-xl border border-slate-700 bg-slate-800 px-4 py-3 text-[1.45rem] text-slate-100 outline-none transition-colors placeholder:text-slate-500 focus:border-pink-400" />
                            </label>
                            <a href={googleTranslateUrl} target="_blank" rel="noreferrer" className="mt-3 inline-flex items-center rounded-xl border border-slate-700 bg-slate-800 px-4 py-2 text-[1.15rem] font-semibold text-slate-200 transition-colors hover:bg-slate-700 hover:text-white">
                                Ver traducción en Google Translate
                            </a>
                        </div>

                        <div className="svg-picker-scroll min-h-0 flex-1 overflow-y-auto px-6 py-5">
                            {searchTerm.trim().length >= 2 && (
                                <section className="mb-8">
                                    <div className="mb-3 flex items-center justify-between">
                                        <h3 className="text-[1.35rem] font-bold uppercase tracking-[0.18em] text-slate-500">Repositorio público</h3>
                                        {isSearchingRemote && <span className="text-[1.15rem] text-pink-300">Buscando...</span>}
                                    </div>
                                    {remoteError && <p className="mb-3 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-[1.2rem] text-amber-100">{remoteError}</p>}
                                    <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-4">
                                        {remoteResults.map((item) => (
                                            <button key={item.id} type="button" onClick={() => setPendingRemoteIcon(item)} className={`rounded-2xl border p-3 transition-colors ${pendingRemoteIcon?.id === item.id ? "border-cyan-400 bg-cyan-500/10" : "border-slate-700 bg-slate-800/80 hover:bg-slate-800"}`}>
                                                <div className="flex h-24 items-center justify-center">
                                                    <AxisGraphic graphic={{ type: "iconify", value: item.iconName }} size={64} />
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                </section>
                            )}

                            {savedItems.length > 0 && (
                                <section className="mb-8">
                                    <div className="mb-3 flex items-center justify-between">
                                        <h3 className="text-[1.35rem] font-bold uppercase tracking-[0.18em] text-slate-500">Mi biblioteca</h3>
                                        <span className="rounded-full border border-pink-500/30 bg-pink-500/10 px-3 py-1 text-[1.2rem] font-bold text-pink-200">{savedItems.length}</span>
                                    </div>
                                    <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-4">
                                        {savedItems.map((item) => {
                                            const itemReference = createSavedIconReference(item.id);
                                            const itemGraphic = resolveAxisGraphic(itemReference, savedItems);
                                            const isSelected = selectedIcon === itemReference;

                                            return (
                                                <div key={item.id} className={`rounded-2xl border p-3 transition-colors ${isSelected ? "border-pink-400 bg-pink-500/10" : "border-slate-700 bg-slate-800/80 hover:bg-slate-800"}`}>
                                                    <button type="button" onClick={() => handleLocalSelect(itemReference)} className="flex w-full items-center justify-center">
                                                        <div className="flex h-24 w-full items-center justify-center">
                                                            <AxisGraphic graphic={itemGraphic} size={64} />
                                                        </div>
                                                    </button>
                                                    <button type="button" onClick={() => handleRemoveSaved(item.id)} className="mt-3 w-full rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2 text-[1.15rem] font-bold text-red-200 transition-colors hover:bg-red-500/20">
                                                        Borrar
                                                    </button>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </section>
                            )}

                            <section className="mb-4">
                                <h3 className="mb-3 text-[1.35rem] font-bold uppercase tracking-[0.18em] text-slate-500">Colección rápida</h3>
                                {Object.entries(groupedCatalog).map(([category, items]) => (
                                    <section key={category} className="mb-7">
                                        <h4 className="mb-3 text-[1.2rem] font-bold uppercase tracking-[0.16em] text-slate-600">{category}</h4>
                                        <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-4">
                                            {items.map((item) => (
                                                <button key={item.value} type="button" onClick={() => handleLocalSelect(item.value)} className={`rounded-2xl border p-3 transition-colors ${selectedIcon === item.value ? "border-pink-400 bg-pink-500/10" : "border-slate-700 bg-slate-800/80 hover:bg-slate-800"}`}>
                                                    <div className="flex h-24 items-center justify-center">
                                                        <AxisGraphic graphic={{ type: "library", value: item.value }} size={66} />
                                                    </div>
                                                </button>
                                            ))}
                                        </div>
                                    </section>
                                ))}
                            </section>
                        </div>
                    </div>

                    <aside className="flex min-h-0 flex-col bg-slate-950/70">
                        <div className="border-b border-slate-800 px-6 py-5">
                            <h3 className="text-[1.35rem] font-bold uppercase tracking-[0.18em] text-slate-500">Guardar icono</h3>
                        </div>

                        <div className="flex flex-1 flex-col px-6 py-5">
                            <div className="flex flex-1 items-center justify-center rounded-[2rem] border border-slate-800 p-4">{pendingGraphic ? <AxisGraphic graphic={pendingGraphic} size={132} /> : <span className="text-center text-[1.4rem] text-slate-500">Elegí un icono del repositorio para guardarlo.</span>}</div>

                            <div className="mt-5 rounded-2xl border border-slate-800 bg-slate-900/80 p-4">
                                <label className="block">
                                    <span className="mb-2 block text-[1.2rem] font-bold uppercase tracking-[0.18em] text-slate-500">Nombre para guardar</span>
                                    <input type="text" value={draftName} onChange={(event) => setDraftName(event.target.value)} placeholder="Ej.: Nena con mochila" className="w-full rounded-xl border border-slate-700 bg-slate-800 px-4 py-3 text-[1.4rem] text-slate-100 outline-none transition-colors placeholder:text-slate-500 focus:border-pink-400" />
                                </label>
                                <button type="button" onClick={handleSaveRemote} disabled={!pendingRemoteIcon || !draftName.trim()} className="mt-4 w-full rounded-xl bg-pink-500 px-4 py-3 text-[1.35rem] font-bold text-white transition-colors hover:bg-pink-600 disabled:cursor-not-allowed disabled:opacity-40">
                                    Guardar en mi biblioteca y usar
                                </button>
                            </div>
                        </div>
                    </aside>
                </div>
            </div>
        </div>
    );
}
