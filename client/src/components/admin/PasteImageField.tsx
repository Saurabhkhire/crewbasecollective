import { useCallback, useRef, useState } from "react";
import { FolderSync, Upload } from "lucide-react";
import {
  fileFromClipboardItem,
  listFolderImages,
  resolveNamedImage,
  uploadCompanyLogo,
  uploadImage,
  uploadImages,
  type ImageNaming,
} from "@/lib/upload";

type PasteImageFieldProps = {
  label?: string;
  imageUrl?: string | null;
  onImageUrl: (url: string) => void;
  folder: string;
  naming: ImageNaming;
  /** Primary file stem for named uploads / sync (e.g. cover, company name) */
  fileName?: string;
  /** Extra folders to check on sync (e.g. legacy covers/) */
  syncFolders?: string[];
  /** Extra file stems to check on sync */
  syncNames?: string[];
  multiple?: boolean;
  /** Gallery URLs already on the event — sync skips these */
  existingUrls?: string[];
  onMultipleUrls?: (urls: string[]) => void | Promise<void>;
  /** Event gallery: renumber folder to 1, 2, 3… and sync JSON */
  onGallerySync?: () => void | Promise<void>;
  disabled?: boolean;
  previewClassName?: string;
  /** Shown in help text for single-image sync (e.g. "cover") */
  syncLabel?: string;
};

export function PasteImageField({
  label,
  imageUrl,
  onImageUrl,
  folder,
  naming,
  fileName = "",
  syncFolders = [],
  syncNames = [],
  multiple = false,
  existingUrls = [],
  onMultipleUrls,
  onGallerySync,
  disabled = false,
  previewClassName = "h-20 w-32 rounded-lg border border-zinc-700 object-contain bg-zinc-950",
  syncLabel,
}: PasteImageFieldProps) {
  const zoneRef = useRef<HTMLDivElement>(null);
  const [busy, setBusy] = useState(false);
  const [hint, setHint] = useState("");

  const run = useCallback(async (task: () => Promise<void>) => {
    setBusy(true);
    setHint("");
    try {
      await task();
    } catch (err) {
      setHint(err instanceof Error ? err.message : "Image action failed");
    } finally {
      setBusy(false);
    }
  }, []);

  const uploadFiles = useCallback(
    async (files: File[]) => {
      if (!files.length) return;
      await run(async () => {
        if (multiple && onMultipleUrls) {
          const urls = await uploadImages(files, folder, {
            naming,
            name: fileName || undefined,
          });
          await onMultipleUrls(urls);
          setHint(`Added ${urls.length} image${urls.length === 1 ? "" : "s"}.`);
          return;
        }
        const file = files[0];
        const url =
          folder === "companies" && fileName
            ? await uploadCompanyLogo(file, fileName)
            : await uploadImage(file, folder, { naming, name: fileName || undefined });
        onImageUrl(url);
        setHint("Image saved.");
      });
    },
    [fileName, folder, multiple, naming, onImageUrl, onMultipleUrls, run]
  );

  const onPaste = useCallback(
    (e: React.ClipboardEvent) => {
      if (disabled || busy) return;
      const files: File[] = [];
      for (const item of Array.from(e.clipboardData.items)) {
        const file = fileFromClipboardItem(item);
        if (file) files.push(file);
      }
      if (!files.length) return;
      e.preventDefault();
      void uploadFiles(files);
    },
    [busy, disabled, uploadFiles]
  );

  const syncFromFolder = useCallback(() => {
    void run(async () => {
      if (multiple && onGallerySync) {
        await onGallerySync();
        setHint("Renumbered images to 1, 2, 3… in the event folder and updated the gallery.");
        return;
      }

      if (multiple && onMultipleUrls) {
        const urls = await listFolderImages(folder);
        const existing = new Set(existingUrls);
        const missing = urls.filter((url) => !existing.has(url));
        if (!missing.length) {
          setHint(
            urls.length
              ? "All images in the event folder are already in the gallery."
              : `No images found in data/images/${folder}.`
          );
          return;
        }
        await onMultipleUrls(missing);
        setHint(`Added ${missing.length} image${missing.length === 1 ? "" : "s"} from the event folder.`);
        return;
      }

      if (!fileName?.trim() && !syncNames.some((n) => n.trim())) {
        setHint("Enter a name first so we can find the matching file.");
        return;
      }
      const primaryName = fileName?.trim() || syncNames.find((n) => n.trim()) || "";
      const url = await resolveNamedImage(folder, primaryName, {
        folders: syncFolders,
        names: syncNames,
      });
      if (!url) {
        const stems = [primaryName, ...syncNames.filter((n) => n.trim() && n !== primaryName)];
        const folders = [folder, ...syncFolders.filter((f) => f && f !== folder)];
        setHint(
          `No matching file (${stems.join(", ")}) in ${folders.map((f) => `data/images/${f}`).join(", ")}.`
        );
        return;
      }
      onImageUrl(url);
      setHint("Synced from images folder.");
    });
  }, [existingUrls, fileName, folder, multiple, onGallerySync, onImageUrl, onMultipleUrls, run, syncFolders, syncNames]);

  const syncButtonLabel = "Sync folder";
  const syncHint = syncLabel || fileName || "image";

  return (
    <div className={label ? "space-y-3" : ""}>
      {label ? <div className="text-sm font-medium text-zinc-300">{label}</div> : null}
      <div
        ref={zoneRef}
        tabIndex={0}
        onPaste={onPaste}
        className="rounded-lg border border-dashed border-zinc-700 bg-zinc-900/40 p-4 outline-none focus:border-brand-400"
      >
        <p className="text-sm text-zinc-400">
          {multiple
            ? `Paste images (Ctrl+V) or upload — saved to data/images/${folder} as 1, 2, 3… Sync folder renames existing files to 1, 2, 3… and updates the gallery.`
            : `Paste an image (Ctrl+V), upload, or click Sync folder to use ${syncHint} from data/images/${folder}${syncFolders.length ? ` (also checks ${syncFolders.map((f) => `data/images/${f}`).join(", ")})` : ""}.`}
        </p>
        <div className="mt-3 flex flex-wrap items-center gap-3">
          {!multiple && imageUrl ? (
            <img src={imageUrl} alt="" className={previewClassName} />
          ) : null}
          <label className="btn-secondary inline-flex cursor-pointer">
            <Upload className="mr-1 h-4 w-4" />
            {busy ? "Working…" : multiple ? "Upload images" : "Upload image"}
            <input
              type="file"
              accept="image/*"
              multiple={multiple}
              className="hidden"
              disabled={disabled || busy}
              onChange={(e) => {
                const files = Array.from(e.target.files || []);
                void uploadFiles(files);
                e.target.value = "";
              }}
            />
          </label>
          <button
            type="button"
            className="btn-secondary inline-flex"
            disabled={disabled || busy}
            onClick={syncFromFolder}
          >
            <FolderSync className="mr-1 h-4 w-4" />
            {syncButtonLabel}
          </button>
          {!multiple && imageUrl ? (
            <button
              type="button"
              className="text-sm text-red-400 hover:underline"
              disabled={disabled || busy}
              onClick={() => onImageUrl("")}
            >
              Remove
            </button>
          ) : null}
        </div>
        {hint ? <p className="mt-2 text-sm text-zinc-400">{hint}</p> : null}
      </div>
    </div>
  );
}
