import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { fetchSavedSvgItems, migrateLegacySavedSvgItems } from "./data/svgLibrary";
import { useActivityConfig } from "./hooks/useActivityConfig";
import { ControlPanel } from "./components/ControlPanel";
import { ActivitySheet } from "./components/ActivitySheet";

export default function App() {
    const sheetRef = useRef(null);
    const previewRef = useRef(null);
    const exportSheetRef = useRef(null);
    const [zoom, setZoom] = useState(70);
    const [savedSvgItems, setSavedSvgItems] = useState([]);
    const { activities, config, activeActivityIndex, setActiveActivityIndex, update, updateOperation, updateOperand, addActivity, removeActivity, isAddSub, isMultDiv, activeOperandCount, getOperandCount, moveActivity } = useActivityConfig();

    const PREVIEW_VERTICAL_PADDING = 20;

    const fitToHeight = () => {
        if (!previewRef.current) return;
        const availableHeight = previewRef.current.clientHeight - PREVIEW_VERTICAL_PADDING * 2 - 6;
        const currentScale = Math.max(0.4, zoom / 100);
        const measuredSheetHeight = sheetRef.current?.getBoundingClientRect().height ?? 0;
        const baseSheetHeight = measuredSheetHeight > 0 ? measuredSheetHeight / currentScale : 1122;
        const fitZoom = Math.max(40, Math.min(180, Math.floor((availableHeight / baseSheetHeight) * 100)));
        setZoom(fitZoom);
    };

    useEffect(() => {
        fitToHeight();
        window.addEventListener("resize", fitToHeight);
        return () => window.removeEventListener("resize", fitToHeight);
    }, []);

    useEffect(() => {
        let isMounted = true;

        const loadSavedItems = async () => {
            try {
                const serverItems = await fetchSavedSvgItems();
                const nextItems = serverItems.length > 0 ? serverItems : await migrateLegacySavedSvgItems();

                if (isMounted) {
                    setSavedSvgItems(nextItems);
                }
            } catch {
                if (isMounted) {
                    setSavedSvgItems([]);
                }
            }
        };

        void loadSavedItems();

        return () => {
            isMounted = false;
        };
    }, []);

    const refreshSavedSvgItems = async (nextItem = null, removedItemId = "") => {
        if (nextItem) {
            setSavedSvgItems((currentItems) => {
                const filteredItems = currentItems.filter((item) => item.id !== nextItem.id);
                return [nextItem, ...filteredItems];
            });
            return [nextItem, ...savedSvgItems.filter((item) => item.id !== nextItem.id)];
        }

        if (removedItemId) {
            setSavedSvgItems((currentItems) => currentItems.filter((item) => item.id !== removedItemId));
        }

        try {
            const nextItems = await fetchSavedSvgItems();
            setSavedSvgItems(nextItems);
            return nextItems;
        } catch {
            setSavedSvgItems([]);
            return [];
        }
    };

    const getEmbeddedFontCss = async () => {
        const fontLinks = Array.from(document.querySelectorAll('link[rel="stylesheet"]')).filter((node) => node.href.includes("fonts.googleapis.com"));
        const cssChunks = await Promise.all(
            fontLinks.map(async (node) => {
                try {
                    const response = await fetch(node.href);
                    return response.ok ? await response.text() : "";
                } catch {
                    return "";
                }
            }),
        );

        return cssChunks.filter(Boolean).join("\n");
    };

    const buildPrintDocument = (embeddedFontCss = "") => {
        const stylesheetMarkup = Array.from(document.querySelectorAll('style, link[rel="stylesheet"], link[rel="preconnect"]'))
            .map((node) => node.outerHTML)
            .join("");
        const sheetMarkup = exportSheetRef.current?.outerHTML ?? "";

        return `
            <!doctype html>
            <html lang="es">
                <head>
                    <meta charset="utf-8" />
                    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
                    <title>Impresión de actividades</title>
                    ${stylesheetMarkup}
                    <style>
                        ${embeddedFontCss}

                        html, body {
                            margin: 0;
                            padding: 0;
                            width: 210mm;
                            background: #ffffff;
                            overflow: visible;
                        }

                        body {
                            display: flex;
                            justify-content: center;
                            align-items: flex-start;
                        }

                        /* Override the app's @media print that sets overflow:hidden */
                        @media print {
                            html, body {
                                overflow: visible !important;
                                height: auto !important;
                                min-height: 0 !important;
                            }

                            .app-layout, .app-preview {
                                overflow: visible !important;
                                height: auto !important;
                            }
                        }

                        .sheet-preview-shell {
                            padding: 0 !important;
                            margin: 0 !important;
                        }

                        .sheet-document {
                            display: flex;
                            flex-direction: column;
                            align-items: center;
                            gap: 0 !important;
                        }

                        .sheet-a4 {
                            width: 210mm !important;
                            min-height: 297mm !important;
                            border-radius: 0 !important;
                            box-shadow: none !important;
                            overflow: hidden !important;
                            page-break-after: always;
                            break-after: page;
                        }

                        .sheet-a4:last-child {
                            page-break-after: auto;
                            break-after: auto;
                        }

                        @page {
                            size: A4 portrait;
                            margin: 0;
                        }
                    </style>
                </head>
                <body>
                    ${sheetMarkup}
                </body>
            </html>
        `;
    };

    const buildSinglePageDocument = (embeddedFontCss = "", pageOuterHTML = "") => {
        const stylesheetMarkup = Array.from(document.querySelectorAll('style, link[rel="stylesheet"], link[rel="preconnect"]'))
            .map((node) => node.outerHTML)
            .join("");

        return `
            <!doctype html>
            <html lang="es">
                <head>
                    <meta charset="utf-8" />
                    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
                    <title>Página</title>
                    ${stylesheetMarkup}
                    <style>
                        ${embeddedFontCss}
                        /* Must be last so it overrides anything in the copied sheets */
                        html {
                            font-size: 62.5% !important;
                        }
                        html, body {
                            margin: 0 !important; padding: 0 !important;
                            width: 794px !important; height: 1123px !important;
                            background: #ffffff !important; overflow: hidden !important;
                        }
                        body {
                            display: flex !important;
                            justify-content: center !important;
                            align-items: flex-start !important;
                        }
                        .sheet-a4 {
                            width: 794px !important;
                            min-height: 1123px !important;
                            height: 1123px !important;
                            border-radius: 0 !important;
                            box-shadow: none !important;
                            overflow: hidden !important;
                        }
                    </style>
                </head>
                <body>
                    <div style="padding:0;margin:0;width:794px;">
                        ${pageOuterHTML}
                    </div>
                </body>
            </html>
        `;
    };

    const handlePrint = async () => {
        if (!exportSheetRef.current) return;
        const embeddedFontCss = await getEmbeddedFontCss();

        const printWindow = window.open("", "_blank", "width=1200,height=900");
        if (!printWindow) {
            alert("El navegador bloqueó la ventana de impresión.");
            return;
        }

        printWindow.document.open();
        printWindow.document.write(buildPrintDocument(embeddedFontCss));
        printWindow.document.close();

        let hasPrinted = false;
        const triggerPrint = async () => {
            if (hasPrinted) {
                return;
            }
            hasPrinted = true;

            if (printWindow.document.fonts?.ready) {
                await printWindow.document.fonts.ready;
            }

            printWindow.focus();
            window.setTimeout(() => {
                printWindow.print();
                window.setTimeout(() => {
                    printWindow.close();
                }, 250);
            }, 180);
        };

        printWindow.onload = () => {
            void triggerPrint();
        };
        window.setTimeout(() => {
            void triggerPrint();
        }, 350);
    };

    const handleExport = async () => {
        if (!exportSheetRef.current) return;

        const sourcePages = Array.from(exportSheetRef.current.querySelectorAll(".sheet-a4"));
        if (sourcePages.length === 0) return;

        let currentFrame = null;
        try {
            if (document.fonts?.ready) await document.fonts.ready;
            const embeddedFontCss = await getEmbeddedFontCss();
            const { default: html2canvas } = await import("html2canvas");

            for (let i = 0; i < sourcePages.length; i++) {
                currentFrame = document.createElement("iframe");
                currentFrame.setAttribute("aria-hidden", "true");
                currentFrame.style.cssText = "position:fixed;left:-200000px;top:0;width:794px;height:1123px;border:0;opacity:0;pointer-events:none;";
                document.body.appendChild(currentFrame);

                const frameDoc = currentFrame.contentDocument;
                if (!frameDoc) throw new Error("No se pudo crear el iframe de exportación.");

                frameDoc.open();
                frameDoc.write(buildSinglePageDocument(embeddedFontCss, sourcePages[i].outerHTML));
                frameDoc.close();

                await new Promise((resolve) => {
                    currentFrame.onload = () => resolve();
                    window.setTimeout(resolve, 400);
                });

                if (frameDoc.fonts?.ready) await frameDoc.fonts.ready;

                await Promise.all(
                    Array.from(frameDoc.querySelectorAll("img")).map((img) =>
                        img.complete
                            ? Promise.resolve()
                            : new Promise((res) => {
                                  img.onload = res;
                                  img.onerror = res;
                              }),
                    ),
                );

                const pageEl = frameDoc.querySelector(".sheet-a4");
                if (!pageEl) {
                    document.body.removeChild(currentFrame);
                    currentFrame = null;
                    continue;
                }

                const canvas = await html2canvas(pageEl, {
                    scale: 3,
                    useCORS: true,
                    backgroundColor: "#ffffff",
                    logging: false,
                    width: 794,
                    height: 1123,
                    windowWidth: 794,
                    windowHeight: 1123,
                    onclone: (clonedDoc) => {
                        clonedDoc.documentElement.style.fontSize = "62.5%";
                        clonedDoc.querySelectorAll(".dot").forEach((dot) => {
                            dot.style.backgroundColor = "#d0d0d0";
                            dot.style.borderColor = "#d0d0d0";
                        });
                        clonedDoc.querySelectorAll("[data-export-title='true']").forEach((title) => {
                            title.style.margin = "0";
                            title.style.lineHeight = "1";
                            title.style.position = "absolute";
                            title.style.left = "50%";
                            title.style.top = "50%";
                            title.style.width = "100%";
                            title.style.textAlign = "center";
                            title.style.transform = "translate(-50%, -58%)";
                            title.style.transformOrigin = "center center";
                        });
                        clonedDoc.querySelectorAll("[data-export-title-wrap='true']").forEach((wrapper) => {
                            wrapper.style.display = "flex";
                            wrapper.style.alignItems = "center";
                            wrapper.style.justifyContent = "center";
                            wrapper.style.position = "relative";
                        });
                        clonedDoc.querySelectorAll("[data-export-symbol='true']").forEach((symbol) => {
                            symbol.style.margin = "0";
                            symbol.style.lineHeight = "1";
                            symbol.style.position = "absolute";
                            symbol.style.left = "50%";
                            symbol.style.top = "50%";
                            symbol.style.transform = "translate(-50%, -56%)";
                            symbol.style.transformOrigin = "center center";
                        });
                        clonedDoc.querySelectorAll("[data-export-symbol-wrap='true']").forEach((wrapper) => {
                            wrapper.style.display = "inline-flex";
                            wrapper.style.alignItems = "center";
                            wrapper.style.justifyContent = "center";
                            wrapper.style.position = "relative";
                            wrapper.style.minWidth = "1em";
                            wrapper.style.minHeight = "1em";
                        });
                    },
                });

                document.body.removeChild(currentFrame);
                currentFrame = null;

                const suffix = sourcePages.length > 1 ? `-pag${i + 1}-de-${sourcePages.length}` : "";
                const a = document.createElement("a");
                a.download = `actividades${suffix}.png`;
                a.href = canvas.toDataURL("image/png");
                a.click();

                if (i < sourcePages.length - 1) {
                    await new Promise((resolve) => window.setTimeout(resolve, 350));
                }
            }
        } catch {
            alert('No se pudo exportar. Usá "Imprimir" y guardá como PDF.');
        } finally {
            if (currentFrame?.parentNode) currentFrame.parentNode.removeChild(currentFrame);
        }
    };

    return (
        <div className="app-layout flex h-screen overflow-hidden bg-slate-950">
            <div className="flex-[0_0_33.333%] max-w-[33.333%] min-w-[320px] h-full">
                <ControlPanel activities={activities} config={config} activeActivityIndex={activeActivityIndex} onSelectActivity={setActiveActivityIndex} onAddActivity={addActivity} onRemoveActivity={removeActivity} onMoveActivity={moveActivity} update={update} updateOperation={updateOperation} updateOperand={updateOperand} isAddSub={isAddSub} isMultDiv={isMultDiv} activeOperandCount={activeOperandCount} onPrint={handlePrint} onExport={handleExport} zoom={zoom} onZoomChange={setZoom} onFitHeight={fitToHeight} savedSvgItems={savedSvgItems} onSavedItemsChange={refreshSavedSvgItems} />
            </div>
            <main ref={previewRef} className="app-preview flex-1 overflow-auto flex items-start justify-center py-3 px-6 bg-[radial-gradient(circle_at_top,_rgba(236,72,153,0.16),_transparent_28%),linear-gradient(180deg,_#020617_0%,_#111827_100%)]">
                <div className="preview-stage flex items-start justify-center w-full py-4">
                    <div
                        className="preview-zoom-wrap"
                        style={{
                            zoom: `${zoom}%`,
                            display: "flex",
                            justifyContent: "center",
                            alignItems: "flex-start",
                            width: "fit-content",
                        }}
                    >
                        <ActivitySheet ref={sheetRef} activities={activities} getOperandCount={getOperandCount} savedSvgItems={savedSvgItems} />
                    </div>
                </div>
            </main>

            {createPortal(
                <div className="export-sheet-host" aria-hidden="true">
                    <ActivitySheet ref={exportSheetRef} activities={activities} getOperandCount={getOperandCount} savedSvgItems={savedSvgItems} />
                </div>,
                document.body,
            )}
        </div>
    );
}
