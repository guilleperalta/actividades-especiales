import { useEffect, useMemo, useState } from "react";
import {
    createSavedIconReference,
    getSvgLibraryLabel,
    removeSavedSvgItem,
    resolveAxisGraphic,
    saveRemoteSvgItem,
    searchSvgLibrary,
} from "../data/svgLibrary";
import { AxisGraphic } from "./AxisGraphic";

const OPENVERSE_API_URL = "https://api.openverse.org/v1/images/";

/**
 * SvgPickerModal
 * Lets the user select a local image instantly or import a new web image
 * into the personal library from an open-licensed source.
 */
export function SvgPickerModal({ title, selectedIcon, savedItems, onSelect, onSavedItemsChange, onClose }) {
    const [searchTerm, setSearchTerm] = useState("");
    const [remoteResults, setRemoteResults] = useState([]);
    const [isSearchingRemote, setIsSearchingRemote] = useState(false);
    const [remoteError, setRemoteError] = useState("");
    const [pendingRemoteItem, setPendingRemoteItem] = useState(null);
    const [draftName, setDraftName] = useState("");
    const [isImporting, setIsImporting] = useState(false);

    useEffect(() => {
        if (pendingRemoteItem) {
            setDraftName(pendingRemoteItem.title);
        }
    }, [pendingRemoteItem]);

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
                const params = new URLSearchParams({
                    q: searchTerm.trim(),
                    page_size: "20",
                    license_type: "commercial",
                    mature: "false",
                });
                const response = await fetch(`${OPENVERSE_API_URL}?${params.toString()}`, {
                    signal: controller.signal,
                });

                if (!response.ok) {
                    throw new Error("No se pudo buscar en la web.");
                }

                const payload = await response.json();
                const nextResults = (payload.results ?? [])
                    .filter((item) => {
                        const candidateUrl = `${item.url ?? ""} ${item.thumbnail ?? ""}`.toLowerCase();
                        return candidateUrl.includes(".svg") || candidateUrl.includes(".png");
                    })
                    .filter((item) => item.thumbnail || item.url)
                    .map((item) => ({
                        id: item.id,
                        title: item.title?.trim() || "Imagen sin título",
                        thumbnailUrl: item.thumbnail,
                        sourceUrl: item.url,
                        creator: item.creator,
                    }));

                setRemoteResults(nextResults);
                if (nextResults.length === 0) {
                    setRemoteError("No encontré resultados web para ese término.");
                }
            } catch (error) {
                if (error.name !== "AbortError") {
                    setRemoteResults([]);
                    setRemoteError("No pude consultar la web en este momento.");
                }
            } finally {
                setIsSearchingRemote(false);
            }
        }, 400);

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

    const selectedGraphic = resolveAxisGraphic(selectedIcon, savedItems);
    const pendingGraphic = pendingRemoteItem
        ? {
              type: "image",
              value: pendingRemoteItem.thumbnailUrl || pendingRemoteItem.sourceUrl,
          }
        : selectedGraphic;

    const handleLocalSelect = (iconReference) => {
        onSelect(iconReference);
    };

    const handleRemoveSaved = (id) => {
        removeSavedSvgItem(id);
        onSavedItemsChange();
    };

    const fetchAsDataUrl = async (url) => {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error("No se pudo descargar la imagen.");
        }

        const blob = await response.blob();
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve({ dataUrl: reader.result, mimeType: blob.type });
            reader.onerror = () => reject(new Error("No se pudo leer la imagen."));
            reader.readAsDataURL(blob);
        });
    };

    const handleImportRemote = async () => {
        if (!pendingRemoteItem || !draftName.trim()) {
            return;
        }

        setIsImporting(true);
        try {
            let importedAsset = null;

            try {
                importedAsset = await fetchAsDataUrl(pendingRemoteItem.sourceUrl);
            } catch {
                importedAsset = await fetchAsDataUrl(pendingRemoteItem.thumbnailUrl);
            }

            const savedItem = saveRemoteSvgItem({
                name: draftName.trim(),
                imageUrl: importedAsset.dataUrl,
                thumbnailUrl: importedAsset.dataUrl,
                sourceUrl: pendingRemoteItem.sourceUrl,
                mimeType: importedAsset.mimeType,
            });

            onSavedItemsChange();
            onSelect(createSavedIconReference(savedItem.id));
        } catch {
            setRemoteError("No pude importar esa imagen. Probá con otro resultado.");
        } finally {
            setIsImporting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/78 px-6 py-8 backdrop-blur-sm">
            <div className="flex max-h-[90vh] w-full max-w-7xl flex-col overflow-hidden rounded-[2rem] border border-slate-700 bg-slate-900 shadow-[0_30px_80px_rgba(15,23,42,0.55)]">
                <div className="flex items-center justify-between border-b border-slate-800 px-6 py-5">
                    <div>
                        <h2 className="text-[2.2rem] font-bold text-slate-50">{title}</h2>
                        <p className="mt-1 text-[1.3rem] text-slate-400">Podés elegir una imagen ya disponible o buscar una nueva en la web para importarla a tu biblioteca.</p>
                    </div>
                    <button type="button" onClick={onClose} className="h-12 w-12 rounded-xl border border-slate-700 bg-slate-800 text-[1.8rem] text-slate-300 transition-colors hover:bg-slate-700 hover:text-white" aria-label="Cerrar selector de imágenes">
                        ×
                    </button>
                </div>

                <div className="grid min-h-0 flex-1 grid-cols-[minmax(0,1fr)_34rem] overflow-hidden">
                    <div className="flex min-h-0 flex-col border-r border-slate-800">
                        <div className="border-b border-slate-800 px-6 py-4">
                            <label className="block">
                                <span className="mb-2 block text-[1.25rem] font-bold uppercase tracking-[0.18em] text-slate-500">Buscar imagen</span>
                                <input
                                    type="text"
                                    value={searchTerm}
                                    onChange={(event) => setSearchTerm(event.target.value)}
                                    placeholder="Ej.: manzana, nena, colectivo, perro..."
                                    className="w-full rounded-xl border border-slate-700 bg-slate-800 px-4 py-3 text-[1.45rem] text-slate-100 outline-none transition-colors placeholder:text-slate-500 focus:border-pink-400"
                                />
                            </label>
                        </div>

                        <div className="svg-picker-scroll min-h-0 flex-1 overflow-y-auto px-6 py-5">
                            {searchTerm.trim().length >= 2 && (
                                <section className="mb-8">
                                    <div className="mb-3 flex items-center justify-between">
                                        <h3 className="text-[1.35rem] font-bold uppercase tracking-[0.18em] text-slate-500">Resultados web</h3>
                                        {isSearchingRemote && <span className="text-[1.15rem] text-pink-300">Buscando...</span>}
                                    </div>
                                    {remoteError && <p className="mb-3 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-[1.2rem] text-amber-100">{remoteError}</p>}
                                    <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-4">
                                        {remoteResults.map((item) => (
                                            <button
                                                key={item.id}
                                                type="button"
                                                onClick={() => setPendingRemoteItem(item)}
                                                className={`rounded-2xl border p-3 text-center transition-colors ${pendingRemoteItem?.id === item.id ? "border-cyan-400 bg-cyan-500/10" : "border-slate-700 bg-slate-800/80 hover:bg-slate-800"}`}
                                            >
                                                <div className="mb-3 flex h-24 items-center justify-center rounded-2xl bg-white p-3">
                                                    <img src={item.thumbnailUrl || item.sourceUrl} alt="" className="max-h-full max-w-full object-contain" />
                                                </div>
                                                <p className="min-h-[3.2rem] text-[1.15rem] font-bold text-slate-100">{item.title}</p>
                                                {item.creator && <p className="mt-1 min-h-[2.8rem] text-[1rem] text-slate-500">{item.creator}</p>}
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
                                                    <button type="button" onClick={() => handleLocalSelect(itemReference)} className="flex w-full flex-col items-center gap-3 text-center">
                                                        <div className="flex h-24 w-full items-center justify-center rounded-2xl bg-slate-950/60">
                                                            <AxisGraphic graphic={itemGraphic} size={64} />
                                                        </div>
                                                        <div>
                                                            <p className="text-[1.25rem] font-bold text-slate-100">{item.name}</p>
                                                            <p className="text-[1.05rem] text-slate-500">Click para usar</p>
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
                                                <button
                                                    key={item.value}
                                                    type="button"
                                                    onClick={() => handleLocalSelect(item.value)}
                                                    className={`rounded-2xl border p-3 text-center transition-colors ${selectedIcon === item.value ? "border-pink-400 bg-pink-500/10" : "border-slate-700 bg-slate-800/80 hover:bg-slate-800"}`}
                                                >
                                                    <div className="mb-3 flex h-24 items-center justify-center rounded-2xl bg-slate-950/60">
                                                        <AxisGraphic graphic={{ type: "library", value: item.value }} size={66} />
                                                    </div>
                                                    <p className="text-[1.2rem] font-bold text-slate-100">{item.label}</p>
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
                            <h3 className="text-[1.35rem] font-bold uppercase tracking-[0.18em] text-slate-500">Importar desde web</h3>
                        </div>

                        <div className="flex flex-1 flex-col px-6 py-5">
                            <div className="flex flex-1 items-center justify-center rounded-[2rem] border border-slate-800 bg-slate-950/60 p-4">
                                {pendingGraphic ? <AxisGraphic graphic={pendingGraphic} size={132} /> : <span className="text-center text-[1.4rem] text-slate-500">Elegí un resultado web para importarlo a tu biblioteca.</span>}
                            </div>

                            <div className="mt-5 rounded-2xl border border-slate-800 bg-slate-900/80 p-4">
                                <label className="block">
                                    <span className="mb-2 block text-[1.2rem] font-bold uppercase tracking-[0.18em] text-slate-500">Nombre para guardar</span>
                                    <input
                                        type="text"
                                        value={draftName}
                                        onChange={(event) => setDraftName(event.target.value)}
                                        placeholder="Ej.: Nena con mochila"
                                        className="w-full rounded-xl border border-slate-700 bg-slate-800 px-4 py-3 text-[1.4rem] text-slate-100 outline-none transition-colors placeholder:text-slate-500 focus:border-pink-400"
                                    />
                                </label>
                                {pendingRemoteItem?.sourceUrl && <p className="mt-3 break-all text-[1.1rem] text-slate-500">{pendingRemoteItem.sourceUrl}</p>}
                                <button
                                    type="button"
                                    onClick={handleImportRemote}
                                    disabled={!pendingRemoteItem || !draftName.trim() || isImporting}
                                    className="mt-4 w-full rounded-xl bg-pink-500 px-4 py-3 text-[1.35rem] font-bold text-white transition-colors hover:bg-pink-600 disabled:cursor-not-allowed disabled:opacity-40"
                                >
                                    {isImporting ? "Importando..." : "Importar a mi biblioteca y usar"}
                                </button>
                            </div>

                            <div className="mt-5 rounded-2xl border border-slate-800 bg-slate-900/80 p-4">
                                <p className="text-[1.2rem] font-bold uppercase tracking-[0.18em] text-slate-500">Imagen actual</p>
                                <div className="mt-3 flex items-center gap-3">
                                    <AxisGraphic graphic={selectedGraphic} size={44} />
                                    <span className="text-[1.35rem] font-bold text-slate-100">{getSvgLibraryLabel(selectedIcon, savedItems)}</span>
                                </div>
                            </div>
                        </div>
                    </aside>
                </div>
            </div>
        </div>
    );
}
