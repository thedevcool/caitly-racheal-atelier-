/** Shown only in draft mode, so Caitly knows she's looking at unsaved changes. */
export function PreviewBar({ path = "/" }: { path?: string }) {
  return (
    <div className="preview-bar" role="status">
      <span>Previewing unsaved changes</span>
      <a href={`/api/preview/exit?to=${encodeURIComponent(path)}`}>Exit preview</a>
    </div>
  );
}
