import React, { useRef } from "react";
import { Download, Upload } from "lucide-react";

export default function BackupBar({ todayKey, getBackupText, onRestoreText }) {
  const fileRef = useRef(null);

  const download = () => {
    const blob = new Blob([getBackupText()], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `streak-backup-${todayKey}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const onFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async () => {
      try {
        await onRestoreText(String(reader.result));
      } catch {
        alert("That file couldn't be read as a backup.");
      }
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  return (
    <div className="flex gap-2">
      <button onClick={download} className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-white border border-stone-200 px-4 py-2.5 text-sm font-medium text-stone-600 hover:bg-stone-50">
        <Download size={16} /> Backup
      </button>
      <button onClick={() => fileRef.current?.click()} className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-white border border-stone-200 px-4 py-2.5 text-sm font-medium text-stone-600 hover:bg-stone-50">
        <Upload size={16} /> Restore
      </button>
      <input ref={fileRef} type="file" accept="application/json" onChange={onFile} className="hidden" />
    </div>
  );
}
