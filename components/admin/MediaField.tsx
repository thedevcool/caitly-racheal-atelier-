"use client";

import { useId, useRef, useState } from "react";
import { upload } from "@vercel/blob/client";
import { registerUpload } from "@/app/admin/actions/media";
import { checkFile, extFor, kindOf } from "@/lib/mediaRules";
import { useFieldError } from "./AdminForm";

export type MediaValue = { id: string; url: string; kind: "IMAGE" | "VIDEO"; alt: string } | null;

type Props = {
  label: string;
  /** Hidden input names: `${name}Id`, `${name}Alt`, and for video `${name}PosterId` */
  name: string;
  value: MediaValue;
  poster?: MediaValue;
  allowVideo?: boolean;
  storage: "blob" | "local";
  hint?: string;
};

type Uploaded = { id: string; url: string; kind: "IMAGE" | "VIDEO" };

/** Uploads one file and returns its Media row. Blob in production, local route in development. */
async function send(
  file: File,
  storage: "blob" | "local",
  onProgress: (p: number) => void,
): Promise<Uploaded> {
  if (storage === "blob") {
    const kind = kindOf(file.type);
    const name = `atelier/${crypto.randomUUID()}.${extFor[file.type] ?? "bin"}`;
    const blob = await upload(name, file, {
      access: "public",
      handleUploadUrl: "/api/admin/upload",
      clientPayload: kind ?? "image",
      contentType: file.type,
      multipart: file.size > 8 * 1024 * 1024,
      onUploadProgress: (e) => onProgress(e.percentage),
    });
    const r = await registerUpload(blob.url);
    if (!r.ok) throw new Error(r.error);
    return r;
  }
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    const form = new FormData();
    form.append("file", file);
    xhr.open("POST", "/api/admin/upload-local");
    xhr.upload.onprogress = (e) => e.lengthComputable && onProgress((e.loaded / e.total) * 100);
    xhr.onload = () => {
      const json = JSON.parse(xhr.responseText || "{}");
      if (xhr.status >= 200 && xhr.status < 300) resolve(json);
      else reject(new Error(json.error ?? "Upload failed. Please try again."));
    };
    xhr.onerror = () => reject(new Error("Upload failed. Check your connection and try again."));
    xhr.send(form);
  });
}

export function MediaField({ label, name, value, poster: initialPoster, allowVideo, storage, hint }: Props) {
  const id = useId();
  const [media, setMedia] = useState(value);
  const [poster, setPoster] = useState(initialPoster ?? null);
  const [progress, setProgress] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [drag, setDrag] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const posterRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const altError = useFieldError(`${name}Alt`);
  const posterError = useFieldError(`${name}PosterId`);

  async function take(file: File | undefined, asPoster = false) {
    if (!file) return;
    const problem = checkFile(file, allowVideo && !asPoster ? true : false);
    if (problem) return setError(problem);
    setError(null);
    setProgress(0);
    try {
      const m = await send(file, storage, setProgress);
      if (asPoster) setPoster({ ...m, alt: "" });
      else {
        // A new file needs its own description; the old alt text described the old image
        setMedia({ ...m, alt: "" });
        if (m.kind === "IMAGE") setPoster(null);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Upload failed. Please try again.");
    } finally {
      setProgress(null);
    }
  }

  /** Poster from the paused video's current frame */
  async function useFrame() {
    const v = videoRef.current;
    if (!v || !v.videoWidth) return setError("Play the video to the frame you want, then try again.");
    const c = document.createElement("canvas");
    c.width = v.videoWidth;
    c.height = v.videoHeight;
    c.getContext("2d")!.drawImage(v, 0, 0);
    const blob = await new Promise<Blob | null>((r) => c.toBlob(r, "image/jpeg", 0.88));
    if (blob) await take(new File([blob], "poster.jpg", { type: "image/jpeg" }), true);
  }

  return (
    <div className={altError || error ? "a-field a-media has-error" : "a-field a-media"}>
      <span className="a-label" id={`${id}-label`}>
        {label}
      </span>
      <input type="hidden" name={`${name}Id`} value={media?.id ?? ""} />
      {allowVideo && <input type="hidden" name={`${name}PosterId`} value={poster?.id ?? ""} />}

      <div
        className={drag ? "a-drop is-over" : "a-drop"}
        onDragOver={(e) => {
          e.preventDefault();
          setDrag(true);
        }}
        onDragLeave={() => setDrag(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDrag(false);
          take(e.dataTransfer.files[0]);
        }}
      >
        {media ? (
          media.kind === "VIDEO" ? (
            <video
              ref={videoRef}
              src={media.url}
              poster={poster?.url}
              controls
              playsInline
              crossOrigin="anonymous"
            />
          ) : (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={media.url} alt="" />
          )
        ) : (
          <p className="a-drop-empty">Drop a file here, or choose one</p>
        )}
        {progress !== null && (
          <div
            className="a-progress"
            role="progressbar"
            aria-valuenow={Math.round(progress)}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-labelledby={`${id}-label`}
          >
            <span style={{ transform: `scaleX(${progress / 100})` }} />
          </div>
        )}
      </div>

      <div className="a-media-actions">
        <button
          type="button"
          className="a-btn ghost"
          onClick={() => fileRef.current?.click()}
          disabled={progress !== null}
        >
          {media ? "Replace" : "Choose file"}
        </button>
        <input
          ref={fileRef}
          type="file"
          hidden
          accept={
            allowVideo
              ? "image/jpeg,image/png,image/webp,image/avif,video/mp4,video/webm"
              : "image/jpeg,image/png,image/webp,image/avif"
          }
          onChange={(e) => {
            take(e.target.files?.[0]);
            e.target.value = "";
          }}
          aria-labelledby={`${id}-label`}
        />
      </div>
      <p className="a-hint">
        {hint ??
          (allowVideo
            ? "JPG, PNG, WebP or AVIF up to 10 MB; MP4 or WebM up to 80 MB."
            : "JPG, PNG, WebP or AVIF, up to 10 MB.")}
      </p>
      {error && (
        <p className="a-error" role="alert">
          {error}
        </p>
      )}

      {media && (
        <div className="a-field">
          <label htmlFor={`${id}-alt`}>Describe it for people who can’t see it (alt text)</label>
          <input
            id={`${id}-alt`}
            name={`${name}Alt`}
            defaultValue={media.alt}
            key={media.id}
            required
            maxLength={300}
            aria-invalid={!!altError || undefined}
            aria-describedby={altError ? `${id}-alt-error` : undefined}
            placeholder="e.g. Rose-gold serum bottle on wet silk"
          />
          {altError && (
            <p className="a-error" id={`${id}-alt-error`}>
              {altError}
            </p>
          )}
        </div>
      )}

      {media?.kind === "VIDEO" && (
        <div className={posterError ? "a-poster has-error" : "a-poster"}>
          <span className="a-label">Poster (the still shown before it plays)</span>
          {poster ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={poster.url} alt="" />
          ) : (
            <p className="a-hint">Videos need a poster.</p>
          )}
          <div className="a-media-actions">
            <button type="button" className="a-btn ghost" onClick={useFrame} disabled={progress !== null}>
              Use the current frame
            </button>
            <button
              type="button"
              className="a-btn ghost"
              onClick={() => posterRef.current?.click()}
              disabled={progress !== null}
            >
              Upload a poster
            </button>
            <input
              ref={posterRef}
              type="file"
              hidden
              accept="image/jpeg,image/png,image/webp,image/avif"
              onChange={(e) => {
                take(e.target.files?.[0], true);
                e.target.value = "";
              }}
            />
          </div>
          {posterError && <p className="a-error">{posterError}</p>}
        </div>
      )}
    </div>
  );
}
