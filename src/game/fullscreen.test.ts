import test from 'node:test';
import assert from 'node:assert/strict';
import {
  enterDocumentFullscreen,
  exitDocumentFullscreen,
  FullscreenDocumentLike,
  FullscreenRequestOptionsLike,
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

test('enterDocumentFullscreen hides mobile navigation UI and falls back if options are rejected', async () => {
  const fakeEl = {} as Element;
  let receivedOptions: FullscreenRequestOptionsLike | undefined;
  const doc: FullscreenDocumentLike = {
    fullscreenEnabled: true,
    fullscreenElement: null,
    documentElement: {
      requestFullscreen: async (options?: FullscreenRequestOptionsLike) => {
        receivedOptions = options;
        doc.fullscreenElement = fakeEl;
      },
    },
  };

  assert.equal(await enterDocumentFullscreen(doc), true);
  assert.deepEqual(receivedOptions, { navigationUI: 'hide' });
  // Calling enter again while already fullscreen stays true without error.
  assert.equal(await enterDocumentFullscreen(doc), true);

  let bareCalls = 0;
  const legacyDoc: FullscreenDocumentLike = {
    fullscreenEnabled: true,
    fullscreenElement: null,
    documentElement: {
      requestFullscreen: async (options?: FullscreenRequestOptionsLike) => {
        if (options !== undefined) {
          throw new TypeError('Options not supported');
        }
        bareCalls++;
        legacyDoc.fullscreenElement = fakeEl;
      },
    },
  };
  assert.equal(await enterDocumentFullscreen(legacyDoc), true);
  assert.equal(bareCalls, 1);
});

test('toggleDocumentFullscreen and exitDocumentFullscreen handle standard, webkit and blocked states', async () => {
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
  assert.equal(await exitDocumentFullscreen(doc), false);
  const entered = await toggleDocumentFullscreen(doc);
  assert.equal(entered, true);
  assert.equal(isDocumentFullscreen(doc), true);

  const exited = await toggleDocumentFullscreen(doc);
  assert.equal(exited, false);
  assert.equal(isDocumentFullscreen(doc), false);

  const webkitDoc: FullscreenDocumentLike = {
    webkitFullscreenEnabled: true,
    webkitFullscreenElement: null,
    documentElement: {
      webkitRequestFullscreen: () => {
        webkitDoc.webkitFullscreenElement = fakeEl;
      },
    },
    webkitExitFullscreen: () => {
      webkitDoc.webkitFullscreenElement = null;
    },
  };
  assert.equal(await enterDocumentFullscreen(webkitDoc), true);
  assert.equal(await exitDocumentFullscreen(webkitDoc), false);

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
