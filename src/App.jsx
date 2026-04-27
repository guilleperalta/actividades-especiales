import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useActivityConfig } from "./hooks/useActivityConfig";
import { ControlPanel } from "./components/ControlPanel";
import { ActivitySheet } from "./components/ActivitySheet";

export default function App() {
    const sheetRef = useRef(null);
    const previewRef = useRef(null);
    const exportSheetRef = useRef(null);
    const [zoom, setZoom] = useState(70);
    const { activities, config, activeActivityIndex, setActiveActivityIndex, update, updateOperation, updateOperand, addActivity, removeActivity, isAddSub, isMultDiv, activeOperandCount, getOperandCount, layout, setLayout, moveActivity } = useActivityConfig();

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
                            min-height: 297mm;
                            background: #ffffff;
                            overflow: hidden;
                        }

                        body {
                            display: flex;
                            justify-content: center;
                            align-items: flex-start;
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

    const buildExportDocument = (embeddedFontCss = "") => {
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
                    <title>Exportación de actividades</title>
                    ${stylesheetMarkup}
                    <style>
                        ${embeddedFontCss}

                        html, body {
                            margin: 0;
                            padding: 0;
                            width: 210mm;
                            min-height: 297mm;
                            background: #ffffff;
                            overflow: hidden;
                        }

                        body {
                            display: flex;
                            justify-content: center;
                            align-items: flex-start;
                            background: #ffffff;
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
                            margin-bottom: 0 !important;
                        }
                    </style>
                </head>
                <body>
                    ${sheetMarkup}
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
        let exportFrame = null;
        try {
            if (document.fonts?.ready) {
                await document.fonts.ready;
            }
            const embeddedFontCss = await getEmbeddedFontCss();

            const waitForImages = async (rootElement) => {
                const images = Array.from(rootElement.querySelectorAll("img"));
                await Promise.all(
                    images.map((image) => {
                        if (image.complete) {
                            return Promise.resolve();
                        }

                        return new Promise((resolve) => {
                            image.onload = () => resolve();
                            image.onerror = () => resolve();
                        });
                    }),
                );
            };

            exportFrame = document.createElement("iframe");
            exportFrame.setAttribute("aria-hidden", "true");
            exportFrame.style.position = "fixed";
            exportFrame.style.left = "-100000px";
            exportFrame.style.top = "0";
            exportFrame.style.width = "794px";
            exportFrame.style.height = "1123px";
            exportFrame.style.border = "0";
            exportFrame.style.opacity = "0";
            exportFrame.style.pointerEvents = "none";
            document.body.appendChild(exportFrame);

            const frameDocument = exportFrame.contentDocument;
            if (!frameDocument) {
                throw new Error("No se pudo crear el documento de exportación.");
            }

            frameDocument.open();
            frameDocument.write(buildExportDocument(embeddedFontCss));
            frameDocument.close();

            await new Promise((resolve) => {
                exportFrame.onload = () => resolve();
                window.setTimeout(resolve, 300);
            });

            if (frameDocument.fonts?.ready) {
                await frameDocument.fonts.ready;
            }

            const frameSheetDocument = frameDocument.querySelector(".sheet-document");
            if (!frameSheetDocument) {
                throw new Error("No se encontró el documento para exportar.");
            }

            await waitForImages(frameDocument.body);

            const { default: html2canvas } = await import("html2canvas");
            const sheetRect = frameSheetDocument.getBoundingClientRect();
            const canvas = await html2canvas(frameSheetDocument, {
                scale: 3,
                useCORS: true,
                foreignObjectRendering: true,
                backgroundColor: "#ffffff",
                logging: false,
                width: Math.ceil(sheetRect.width),
                height: Math.ceil(sheetRect.height),
                windowWidth: Math.ceil(frameDocument.documentElement.scrollWidth),
                windowHeight: Math.ceil(frameDocument.documentElement.scrollHeight),
                onclone: (clonedDocument) => {
                    const clonedSheet = clonedDocument.querySelector(".sheet-a4");
                    if (clonedSheet) {
                        clonedSheet.style.boxShadow = "none";
                        clonedSheet.style.transform = "none";
                    }

                    clonedDocument.querySelectorAll(".dot").forEach((dot) => {
                        dot.style.backgroundColor = "#d0d0d0";
                        dot.style.borderColor = "#d0d0d0";
                    });
                },
            });
            document.body.removeChild(exportFrame);
            exportFrame = null;
            const a = document.createElement("a");
            a.download = `actividades-${activities.length}.png`;
            a.href = canvas.toDataURL("image/png");
            a.click();
        } catch {
            alert('No se pudo exportar. Usá "Imprimir" y guardá como PDF.');
        } finally {
            if (exportFrame?.parentNode) {
                exportFrame.parentNode.removeChild(exportFrame);
            }
        }
    };

    return (
        <div className="app-layout flex h-screen overflow-hidden bg-slate-950">
            <div className="flex-[0_0_33.333%] max-w-[33.333%] min-w-[320px] h-full">
                <ControlPanel activities={activities} config={config} activeActivityIndex={activeActivityIndex} onSelectActivity={setActiveActivityIndex} onAddActivity={addActivity} onRemoveActivity={removeActivity} onMoveActivity={moveActivity} layout={layout} onLayoutChange={setLayout} update={update} updateOperation={updateOperation} updateOperand={updateOperand} isAddSub={isAddSub} isMultDiv={isMultDiv} activeOperandCount={activeOperandCount} onPrint={handlePrint} onExport={handleExport} zoom={zoom} onZoomChange={setZoom} onFitHeight={fitToHeight} />
            </div>
            <main ref={previewRef} className="app-preview flex-1 overflow-auto flex items-center justify-center py-3 px-6 bg-[radial-gradient(circle_at_top,_rgba(236,72,153,0.16),_transparent_28%),linear-gradient(180deg,_#020617_0%,_#111827_100%)]">
                <div className="preview-stage flex items-center justify-center w-full min-h-full">
                    <div
                        className="preview-zoom-wrap"
                        style={{
                            zoom: `${zoom}%`,
                            display: "flex",
                            justifyContent: "center",
                            alignItems: "center",
                            width: "fit-content",
                        }}
                    >
                        <ActivitySheet ref={sheetRef} activities={activities} getOperandCount={getOperandCount} layout={layout} />
                    </div>
                </div>
            </main>

            {createPortal(
                <div className="export-sheet-host" aria-hidden="true">
                    <ActivitySheet ref={exportSheetRef} activities={activities} getOperandCount={getOperandCount} layout={layout} />
                </div>,
                document.body,
            )}
        </div>
    );
}
