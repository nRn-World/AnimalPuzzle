import test from 'node:test';
import assert from 'node:assert/strict';
import {
  FullscreenDocumentLike,
  isDocumentFullscreen,
  isFullscreenSupported,
  toggleDocumentFullscreen,
} from './fullscreen';

test('isFullscreenSupported detects standard and webkit fullscreen support cleanly', () => {
  assert.equal(isFullscreenSupported(null), false);
  assert.equal(isFullscreenSupported({ documentElement: {} }), false);
  assert.equal(
    isFullscreenSupported({
      fullscreenEnabled: false,
      documentElement: { requestFullscreen: async () => {} },
    }),
    false
  );
  assert.equal(
    isFullscreenSupported({
      fullscreenEnabled: true,
      documentElement: { requestFullscreen: async () => {} },
    }),
    true
  );
  assert.equal(
    isFullscreenSupported({
      documentElement: { webkitRequestFullscreen: () => {} },
    }),
    true
  );
});

test('toggleDocumentFullscreen enters and exits fullscreen and swallows blocked errors gracefully', async () => {
  const fakeEl = {} as Element;
  const doc: FullscreenDocumentLike = {
    fullscreenEnabled: true,
    fullscreenElement: null,
    documentElement: {
      requestFullscreen: async () => {
        doc.fullscreenElement = fakeEl;
      },
    },
    exitFullscreen: async () => {
      doc.fullscreenElement = null;
    },
  };

  assert.equal(isDocumentFullscreen(doc), false);
  const entered = await toggleDocumentFullscreen(doc);
  assert.equal(entered, true);
  assert.equal(isDocumentFullscreen(doc), true);

  const exited = await toggleDocumentFullscreen(doc);
  assert.equal(exited, false);
  assert.equal(isDocumentFullscreen(doc), false);

  const blockedDoc: FullscreenDocumentLike = {
    fullscreenEnabled: true,
    fullscreenElement: null,
    documentElement: {
      requestFullscreen: async () => {
        throw new Error('Permissions-Policy blocked');
      },
    },
  };
  const blockedResult = await toggleDocumentFullscreen(blockedDoc);
  assert.equal(blockedResult, false);
});
