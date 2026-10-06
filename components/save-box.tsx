"use client";

import { useRef, useState, useSyncExternalStore } from "react";
import { Download, FolderOpen, Save, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getHouseSnapshot, getServerHouseSnapshot, setHouseSnapshot, subscribeHouse } from "@/lib/house-store";
import {
  getSaveSnapshot,
  getServerSaveSnapshot,
  parseSheetText,
  serializeSheet,
  setSaveSnapshot,
  sheetFilename,
  subscribeSaves,
  upsertSave,
} from "@/lib/saves";
import { getServerTripSnapshot, getTripSnapshot, setTripSnapshot, subscribeTrip } from "@/lib/storage";

function downloadSheet(name: string, body: string) {
  const blob = new Blob([body], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = sheetFilename(name);
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

export function SaveBox() {
  const trip = useSyncExternalStore(subscribeTrip, getTripSnapshot, getServerTripSnapshot);
  const house = useSyncExternalStore(subscribeHouse, getHouseSnapshot, getServerHouseSnapshot);
  const saves = useSyncExternalStore(subscribeSaves, getSaveSnapshot, getServerSaveSnapshot);
  const [draftName, setDraftName] = useState("");
  const [selected, setSelected] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  function resolvedName(): string {
    const typed = draftName.trim();
    if (typed) return typed.slice(0, 60);
    return house.name.trim().slice(0, 60);
  }

  function store(name: string) {
    const existing = saves.find((entry) => entry.name === name);
    const sheet = {
      id: existing?.id ?? crypto.randomUUID(),
      name,
      savedAt: new Date().toISOString(),
      trip,
      house,
    };
    setSaveSnapshot(upsertSave(saves, sheet));
    setSelected(sheet.id);
    setDraftName(name);
    return sheet;
  }

  function onSave() {
    const name = resolvedName();
    if (!name) {
      setError("Name this sheet first.");
      setNotice("");
      return;
    }
    store(name);
    setError("");
    setNotice(`Saved “${name}” in this browser.`);
  }

  function onDownload() {
    const name = resolvedName();
    if (!name) {
      setError("Name this sheet first.");
      setNotice("");
      return;
    }
    const sheet = store(name);
    downloadSheet(name, serializeSheet(sheet));
    setError("");
    setNotice(`Downloaded ${sheetFilename(name)}. Drop that file in Dropbox, Drive, or a folder.`);
  }

  function onOpen(id: string) {
    setSelected(id);
    if (!id) return;
    const sheet = saves.find((entry) => entry.id === id);
    if (!sheet) return;
    setTripSnapshot(sheet.trip);
    setHouseSnapshot(sheet.house);
    setDraftName(sheet.name);
    setError("");
    setNotice(`Opened “${sheet.name}”.`);
  }

  function onDelete() {
    const sheet = saves.find((entry) => entry.id === selected);
    if (!sheet) return;
    setSaveSnapshot(saves.filter((entry) => entry.id !== sheet.id));
    setSelected("");
    setError("");
    setNotice(`Removed “${sheet.name}” from this browser.`);
  }

  async function onFile(file: File) {
    let text = "";
    try {
      text = await file.text();
    } catch {
      setError("That file could not be read.");
      setNotice("");
      return;
    }
    const parsed = parseSheetText(text);
    if (!parsed) {
      setError("That file is not a quartermaster sheet.");
      setNotice("");
      return;
    }
    setTripSnapshot(parsed.trip);
    setHouseSnapshot(parsed.house);
    setSaveSnapshot(upsertSave(getSaveSnapshot(), parsed));
    setSelected(parsed.id);
    setDraftName(parsed.name);
    setError("");
    setNotice(`Loaded “${parsed.name}” from ${file.name}.`);
  }

  return (
    <section className="no-print mb-6 rounded-xl bg-card px-4 py-4 ring-1 ring-foreground/10" aria-label="Saved sheets">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="max-w-xl">
          <h2 className="font-heading text-lg font-semibold tracking-tight">Save box</h2>
          <p className="mt-1 text-sm leading-6 text-muted-foreground">
            A named sheet keeps this restaurant and the supply list in this browser. Download the file and drop it in
            Dropbox, Drive, or any folder you can open later.
          </p>
        </div>
        <div className="grid w-full gap-3 sm:grid-cols-[minmax(0,14rem)_minmax(0,1fr)] lg:max-w-xl">
          <div className="space-y-2">
            <Label htmlFor="saved-sheets">Saved in this browser</Label>
            <select
              id="saved-sheets"
              data-testid="saved-sheets"
              className="h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
              value={saves.some((entry) => entry.id === selected) ? selected : ""}
              onChange={(event) => onOpen(event.target.value)}
            >
              <option value="">{saves.length === 0 ? "No named sheets yet" : "Open a saved sheet"}</option>
              {saves.map((entry) => (
                <option key={entry.id} value={entry.id}>
                  {entry.name}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="sheet-name">Sheet name</Label>
            <Input
              id="sheet-name"
              data-testid="sheet-name"
              value={draftName}
              placeholder={house.name || "Name this sheet"}
              maxLength={60}
              onChange={(event) => setDraftName(event.target.value)}
            />
          </div>
        </div>
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        <Button type="button" onClick={onSave}>
          <Save />
          Save
        </Button>
        <Button type="button" variant="outline" onClick={onDownload}>
          <Download />
          Download
        </Button>
        <Button type="button" variant="outline" onClick={() => fileRef.current?.click()}>
          <FolderOpen />
          Load file
        </Button>
        <Button type="button" variant="ghost" disabled={!selected} onClick={onDelete}>
          <Trash2 />
          Remove
        </Button>
        <input
          ref={fileRef}
          data-testid="sheet-file"
          className="sr-only"
          type="file"
          accept="application/json,.json"
          onChange={(event) => {
            const file = event.target.files?.[0];
            event.target.value = "";
            if (file) void onFile(file);
          }}
        />
      </div>
      {error && (
        <p role="alert" data-testid="save-error" className="mt-3 text-sm text-destructive">
          {error}
        </p>
      )}
      {notice && !error && (
        <p data-testid="save-notice" className="mt-3 text-sm text-muted-foreground">
          {notice}
        </p>
      )}
    </section>
  );
}
