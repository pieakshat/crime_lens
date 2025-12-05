'use client';

interface WarningPopupProps {
    show: boolean;
    severity: number;
    crimes: string;
    areaName: string;
    onClose: () => void;
}

export default function WarningPopup({
    show,
    severity,
    crimes,
    areaName,
    onClose,
}: WarningPopupProps) {
    if (!show) return null;

    let message = `You are in a Severity ${severity} zone.`;
    if (areaName) {
        message = `You have entered ${areaName}.\n\nSeverity: ${severity}\n`;
    }
    message += `\nCommon crimes: ${crimes}\n\nStay alert and be cautious.`;

    return (
        <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-black border-4 border-white p-8 z-[10000] max-w-lg w-[90%] text-center">
            <h2 className="text-red-500 mb-5 text-2xl">⚠ WARNING</h2>
            <p className="mb-4 text-base leading-relaxed whitespace-pre-line">{message}</p>
            <button
                onClick={onClose}
                className="mt-5 w-full p-4 bg-white text-black rounded transition-opacity hover:opacity-90"
            >
                Acknowledge
            </button>
        </div>
    );
}

