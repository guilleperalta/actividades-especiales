import { useState } from "react";
import { getSvgLibraryLabel, resolveAxisGraphic } from "../data/svgLibrary";
import { OPERATION_INFO } from "../hooks/useActivityConfig";
import { AxisGraphic } from "./AxisGraphic";
import { SvgPickerModal } from "./SvgPickerModal";

const OPERATION_ICONS = {
    suma: "+",
    resta: "−",
    multiplicacion: "×",
    division: "÷",
};

export function ControlPanel({ config, activities, activeActivityIndex, onSelectActivity, onAddActivity, onRemoveActivity, onMoveActivity, update, updateOperation, updateOperand, isAddSub, isMultDiv, activeOperandCount, onPrint, onExport, zoom, onZoomChange, onFitHeight, savedSvgItems, onSavedItemsChange }) {
    const [pickerTarget, setPickerTarget] = useState(null);

    const handleIconSelect = (iconReference) => {
        if (!pickerTarget) {
            return;
        }

        update(pickerTarget, iconReference);
        setPickerTarget(null);
    };

    const axisSelectors = [
        { key: "xAxisIcon", label: "Eje X (cabecera)" },
        { key: "yAxisIcon", label: "Eje Y (lateral)" },
    ];

    return (
        <>
            <aside className="control-panel-scroll no-print flex h-full min-w-0 w-full flex-col overflow-y-auto border-r border-slate-800 bg-slate-900 text-slate-100">
                <div className="border-b border-slate-800 bg-slate-950/70 px-6 py-5">
                    <h1 className="font-display text-[2.8rem] font-bold text-slate-50">Generador de actividades</h1>
                    <p className="mt-1 text-[1.15rem] uppercase tracking-[0.22em] text-slate-400">Educación especial</p>
                </div>

                <section className="border-b border-slate-800 px-6 py-4">
                    <p className="mb-4 text-[1.2rem] font-bold uppercase tracking-[0.2em] text-slate-500">Vista de hoja</p>
                    <div className="mb-3 flex items-center gap-3">
                        <button type="button" onClick={onFitHeight} className="flex-1 rounded-xl border border-slate-700 bg-slate-800 py-2.5 text-[1.4rem] font-bold text-slate-100 transition-colors hover:bg-slate-700">
                            Ajustar al alto
                        </button>
                        <button type="button" onClick={() => onZoomChange(Math.max(40, zoom - 5))} className="h-11 w-12 rounded-xl border border-slate-700 bg-slate-800 text-[1.8rem] font-bold text-slate-100 transition-colors hover:bg-slate-700">
                            −
                        </button>
                        <button type="button" onClick={() => onZoomChange(Math.min(180, zoom + 5))} className="h-11 w-12 rounded-xl border border-slate-700 bg-slate-800 text-[1.8rem] font-bold text-slate-100 transition-colors hover:bg-slate-700">
                            +
                        </button>
                    </div>
                    <div className="flex items-center gap-3">
                        <input type="range" min="40" max="180" step="5" value={zoom} onChange={(event) => onZoomChange(+event.target.value)} className="w-full accent-pink-500" />
                        <span className="w-14 text-right text-[1.4rem] font-bold text-slate-300">{zoom}%</span>
                    </div>
                </section>

                <section className="border-b border-slate-800 px-6 py-4">
                    <div className="mb-4 flex items-center justify-between">
                        <p className="text-[1.2rem] font-bold uppercase tracking-[0.2em] text-slate-500">Actividades</p>
                        <button type="button" onClick={onAddActivity} disabled={activities.length >= 4} className="rounded-lg border border-pink-500/40 bg-pink-500/10 px-3 py-2 text-[1.25rem] font-bold text-pink-300 transition-colors hover:bg-pink-500/20 disabled:cursor-not-allowed disabled:opacity-40">
                            + Agregar
                        </button>
                    </div>

                    <div className="mb-3 flex flex-col gap-3">
                        {activities.map((activity, index) => (
                            <div key={activity.id} className={`flex items-center rounded-xl border px-3 py-3 text-[1.32rem] font-bold transition-all ${activeActivityIndex === index ? "border-pink-400 bg-pink-500/10 text-pink-300" : "border-slate-700 bg-slate-800/60 text-slate-300 hover:bg-slate-800"}`}>
                                <button type="button" onClick={() => onSelectActivity(index)} className="flex-1 text-left">
                                    Actividad {index + 1} · {OPERATION_INFO[activity.operation].label}
                                </button>
                                <div className="ml-3 flex flex-col gap-1">
                                    <button type="button" onClick={() => onMoveActivity(index, index - 1)} disabled={index === 0} className="text-slate-500 transition-colors hover:text-pink-300 disabled:opacity-30" title="Subir">
                                        ▲
                                    </button>
                                    <button type="button" onClick={() => onMoveActivity(index, index + 1)} disabled={index === activities.length - 1} className="text-slate-500 transition-colors hover:text-pink-300 disabled:opacity-30" title="Bajar">
                                        ▼
                                    </button>
                                </div>
                                {activities.length > 1 && activeActivityIndex === index && (
                                    <button type="button" onClick={() => onRemoveActivity(index)} className="ml-3 flex h-11 w-11 items-center justify-center rounded-xl border border-red-500/30 bg-red-500/10 text-[1.8rem] text-red-300 transition-colors hover:bg-red-500/20 hover:text-red-200" title="Eliminar actividad" aria-label="Eliminar actividad">
                                        🗑️
                                    </button>
                                )}
                            </div>
                        ))}
                    </div>
                </section>

                <section className="border-b border-slate-800 px-6 py-4">
                    <p className="mb-4 text-[1.2rem] font-bold uppercase tracking-[0.2em] text-slate-500">Operación</p>
                    <div className="grid grid-cols-4 gap-2">
                        {Object.entries(OPERATION_INFO).map(([key, info]) => (
                            <button key={key} type="button" onClick={() => updateOperation(key)} className={`flex min-h-[7rem] flex-col items-center justify-center gap-1 rounded-xl border px-2 py-2 text-[1.12rem] font-bold transition-all ${config.operation === key ? "border-pink-400 bg-pink-500/10 text-pink-300" : "border-slate-700 bg-slate-800/60 text-slate-300 hover:bg-slate-800"}`}>
                                <span className="text-[2rem]">{OPERATION_ICONS[key]}</span>
                                <span className="text-center leading-tight">{info.label}</span>
                            </button>
                        ))}
                    </div>
                </section>

                {isAddSub && (
                    <section className="border-b border-slate-800 px-6 py-4">
                        <p className="mb-4 text-[1.2rem] font-bold uppercase tracking-[0.2em] text-slate-500">Cantidad de números</p>
                        <div className="flex gap-3">
                            {[2, 3, 4].map((count) => (
                                <button key={count} type="button" onClick={() => update("numOperands", count)} className={`flex-1 rounded-full border py-2.5 text-[1.25rem] font-bold transition-all ${config.numOperands === count ? "border-pink-400 bg-pink-500/10 text-pink-300" : "border-slate-700 bg-slate-800/60 text-slate-300 hover:bg-slate-800"}`}>
                                    {count} núm.
                                </button>
                            ))}
                        </div>
                    </section>
                )}

                <section className="border-b border-slate-800 px-6 py-4">
                    <p className="mb-4 text-[1.2rem] font-bold uppercase tracking-[0.2em] text-slate-500">Valores {isAddSub && <span className="normal-case tracking-normal text-slate-400">(opcional)</span>}</p>
                    <div className="grid grid-cols-2 gap-3">
                        {Array.from({ length: activeOperandCount }).map((_, index) => (
                            <div key={index} className="rounded-xl border border-slate-800 bg-slate-950/50 px-3 py-3">
                                <p className="mb-2 text-[1.2rem] text-slate-400">Número {index + 1}</p>
                                <input type="number" min="0" max="999" value={config.operandValues[index]} onChange={(event) => updateOperand(index, event.target.value)} placeholder="—" className="w-full rounded-xl border border-slate-700 bg-slate-800 px-3 py-2 text-center text-[1.45rem] font-bold text-slate-100 focus:border-pink-400 focus:outline-none" />
                            </div>
                        ))}
                    </div>
                </section>

                <section className="border-b border-slate-800 px-6 py-4">
                    <p className="mb-4 text-[1.2rem] font-bold uppercase tracking-[0.2em] text-slate-500">Borde de hoja</p>
                    <div className="grid grid-cols-[minmax(0,1fr)_9rem] gap-3">
                        <label className="flex items-center gap-3 rounded-xl border border-slate-700 bg-slate-800/60 px-4 py-3 text-[1.3rem] text-slate-200">
                            <input type="checkbox" checked={config.showSheetBorder} onChange={(event) => update("showSheetBorder", event.target.checked)} className="accent-pink-500" />
                            Mostrar borde
                        </label>
                        <label className="flex items-center justify-center rounded-xl border border-slate-700 bg-slate-800/60 px-2 py-2">
                            <input type="color" value={config.sheetBorderColor} onChange={(event) => update("sheetBorderColor", event.target.value)} className="h-11 w-full cursor-pointer rounded-lg border-0 bg-transparent" aria-label="Color del borde" />
                        </label>
                    </div>
                </section>

                {isAddSub && (
                    <>
                        <section className="border-b border-slate-800 px-6 py-4">
                            <p className="mb-4 text-[1.2rem] font-bold uppercase tracking-[0.2em] text-slate-500">Cuadrículas</p>
                            <div className="flex flex-col gap-3">
                                {[
                                    {
                                        value: "double",
                                        title: "Cuadro por número",
                                        description: "Un cuadro de puntos por cada número a operar",
                                    },
                                    {
                                        value: "single",
                                        title: "Cuadro único",
                                        description: "Un solo cuadro grande para contar todos los puntos",
                                    },
                                ].map((option) => (
                                    <label key={option.value} className={`cursor-pointer rounded-xl border p-3 transition-all ${config.gridLayout === option.value ? "border-pink-400 bg-pink-500/10" : "border-slate-700 bg-slate-800/60 hover:bg-slate-800"}`}>
                                        <span className="flex items-start gap-3">
                                            <input type="radio" name="gridLayout" checked={config.gridLayout === option.value} onChange={() => update("gridLayout", option.value)} className="mt-1 accent-pink-500" />
                                            <span>
                                                <span className="block text-[1.35rem] font-bold text-slate-100">{option.title}</span>
                                                <span className="mt-1 block text-[1.2rem] text-slate-400">{option.description}</span>
                                            </span>
                                        </span>
                                    </label>
                                ))}
                            </div>
                        </section>

                        <section className="border-b border-slate-800 px-6 py-4">
                            <p className="mb-4 text-[1.2rem] font-bold uppercase tracking-[0.2em] text-slate-500">Tamaño de cuadrícula</p>
                            {(() => {
                                const isDouble = config.gridLayout !== "single";
                                const sectionInner = 738;
                                const available = isDouble ? (sectionInner - 8) / 2 - 20 : sectionInner - 20;
                                const maxDotSize = Math.max(8, Math.floor((available - (config.dotCols - 1) * 4) / config.dotCols));
                                const fields = [
                                    { label: "Filas", key: "dotRows", min: 2, max: 15 },
                                    { label: "Columnas", key: "dotCols", min: 2, max: 20 },
                                    { label: "Tamaño de círculo", key: "dotSize", min: 8, max: maxDotSize },
                                ];
                                return (
                                    <div className="grid grid-cols-3 gap-3">
                                        {fields.map((field) => (
                                            <div key={field.key}>
                                                <p className="mb-1 text-[1.2rem] text-slate-400">{field.label}</p>
                                                <input
                                                    type="number"
                                                    min={field.min}
                                                    max={field.max}
                                                    value={config[field.key]}
                                                    onChange={(event) => {
                                                        const nextValue = +event.target.value || field.min;
                                                        const safeValue = Math.min(field.max, Math.max(field.min, nextValue));
                                                        update(field.key, safeValue);
                                                        if (field.key === "dotCols") {
                                                            const newMax = Math.max(8, Math.floor((available - (safeValue - 1) * 4) / safeValue));
                                                            if (config.dotSize > newMax) update("dotSize", newMax);
                                                        }
                                                    }}
                                                    className="w-full rounded-xl border border-slate-700 bg-slate-800 px-2 py-2 text-center text-[1.35rem] font-bold text-slate-100 focus:border-pink-400 focus:outline-none"
                                                />
                                            </div>
                                        ))}
                                    </div>
                                );
                            })()}
                        </section>
                    </>
                )}

                {isMultDiv && (
                    <section className="border-b border-slate-800 px-6 py-4">
                        <p className="mb-4 text-[1.2rem] font-bold uppercase tracking-[0.2em] text-slate-500">Tabla</p>

                        <div className="mb-3 grid grid-cols-3 gap-3">
                            {[
                                { label: "Tamaño", key: "tableSize", min: 2, max: 12 },
                                { label: "Tamaño de circulo", key: "dotSize", min: 8 },
                                { label: "Tamaño de imagen", key: "axisIconSize", min: 16, max: 64 },
                            ].map((field) => (
                                <div key={field.key}>
                                    <p className="mb-1 text-[1.2rem] text-slate-400">{field.label}</p>
                                    <input
                                        type="number"
                                        min={field.min}
                                        max={field.max}
                                        value={config[field.key]}
                                        onChange={(event) => {
                                            const nextValue = +event.target.value || field.min;
                                            const safeValue = field.max ? Math.min(field.max, nextValue) : nextValue;
                                            update(field.key, Math.max(field.min, safeValue));
                                        }}
                                        className="w-full rounded-xl border border-slate-700 bg-slate-800 px-3 py-2 text-center text-[1.4rem] font-bold text-slate-100 focus:border-pink-400 focus:outline-none"
                                    />
                                </div>
                            ))}
                        </div>

                        <label className="mb-3 flex items-center gap-3 text-[1.35rem] text-slate-300">
                            <input type="checkbox" checked={config.showAxisNumbers} onChange={(event) => update("showAxisNumbers", event.target.checked)} className="accent-pink-500" />
                            Mostrar números en los ejes
                        </label>

                        <div className="grid grid-cols-2 gap-3">
                            {axisSelectors.map((axis) => {
                                const resolvedIcon = resolveAxisGraphic(config[axis.key], savedSvgItems);
                                const label = getSvgLibraryLabel(config[axis.key], savedSvgItems);

                                return (
                                    <div key={axis.key} className="rounded-xl border border-slate-800 bg-slate-950/50 p-3">
                                        <p className="mb-2 text-[1.2rem] text-slate-400">{axis.label}</p>
                                        <button type="button" onClick={() => setPickerTarget(axis.key)} className="flex w-full items-center justify-between rounded-xl border border-slate-700 bg-slate-800 px-3 py-3 transition-colors hover:bg-slate-700">
                                            <span className="flex items-center gap-3">
                                                <AxisGraphic graphic={resolvedIcon} size={36} adaptiveBackdrop />
                                                <span className="text-left">
                                                    <span className="block text-[1.3rem] font-bold text-slate-100">{label}</span>
                                                    <span className="block text-[1.1rem] text-slate-400">Abrir biblioteca</span>
                                                </span>
                                            </span>
                                            <span className="text-[1.15rem] uppercase tracking-[0.16em] text-slate-400">Cambiar</span>
                                        </button>
                                    </div>
                                );
                            })}
                        </div>
                    </section>
                )}

                <div className="mt-auto flex flex-col gap-3 bg-slate-950/60 px-6 py-5">
                    <button type="button" onClick={onPrint} className="w-full rounded-xl bg-pink-500 py-3 text-[1.45rem] font-bold text-white transition-colors hover:bg-pink-600">
                        🖨️ Imprimir hoja A4
                    </button>
                    <button type="button" onClick={onExport} className="w-full rounded-xl border border-slate-700 bg-slate-800 py-3 text-[1.45rem] font-bold text-slate-100 transition-colors hover:bg-slate-700">
                        📥 Exportar como imagen
                    </button>
                </div>
            </aside>

            {pickerTarget && <SvgPickerModal title={pickerTarget === "xAxisIcon" ? "Elegir imagen para Eje X" : "Elegir imagen para Eje Y"} selectedIcon={config[pickerTarget]} savedItems={savedSvgItems} onSelect={handleIconSelect} onSavedItemsChange={onSavedItemsChange} onClose={() => setPickerTarget(null)} />}
        </>
    );
}
