export interface FullscreenElementLike {
  requestFullscreen?: () => Promise<void> | void;
  webkitRequestFullscreen?: () => Promise<void> | void;
}

export interface FullscreenDocumentLike {
  fullscreenEnabled?: boolean;
  webkitFullscreenEnabled?: boolean;
  fullscreenElement?: Element | null;
  webkitFullscreenElement?: Element | null;
  documentElement?: FullscreenElementLike | null;
  exitFullscreen?: () => Promise<void> | void;
  webkitExitFullscreen?: () => Promise<void> | void;
}

export function isDocumentFullscreen(
  doc: FullscreenDocumentLike | null | undefined = typeof document !== 'undefined'
    ? (document as unknown as FullscreenDocumentLike)
    : null
): boolean {
  if (!doc) return false;
  return Boolean(doc.fullscreenElement || doc.webkitFullscreenElement);
}

export function isFullscreenSupported(
  doc: FullscreenDocumentLike | null | undefined = typeof document !== 'undefined'
    ? (document as unknown as FullscreenDocumentLike)
    : null
): boolean {
  if (!doc) return false;
  const el = doc.documentElement;
  if (!el) return false;
  const hasRequest =
    typeof el.requestFullscreen === 'function' ||
    typeof el.webkitRequestFullscreen === 'function';
  if (!hasRequest) return false;
  if (doc.fullscreenEnabled === false || doc.webkitFullscreenEnabled === false) {
    return false;
  }
  return true;
}

export async function toggleDocumentFullscreen(
  doc: FullscreenDocumentLike | null | undefined = typeof document !== 'undefined'
    ? (document as unknown as FullscreenDocumentLike)
    : null
): Promise<boolean> {
  if (!doc) return false;

  try {
    if (isDocumentFullscreen(doc)) {
      if (typeof doc.exitFullscreen === 'function') {
        await doc.exitFullscreen();
      } else if (typeof doc.webkitExitFullscreen === 'function') {
        await doc.webkitExitFullscreen();
      }
      return isDocumentFullscreen(doc);
    }

    const el = doc.documentElement;
    if (!el) return false;
    if (typeof el.requestFullscreen === 'function') {
      await el.requestFullscreen();
    } else if (typeof el.webkitRequestFullscreen === 'function') {
      await el.webkitRequestFullscreen();
    }
    return isDocumentFullscreen(doc);
  } catch {
    return isDocumentFullscreen(doc);
  }
}
