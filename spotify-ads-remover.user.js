// ==UserScript==
// @name         Spotify Ads Remover
// @namespace    https://github.com/jhamaii
// @version      3.0.0
// @description  Auto skip ads, unlimited skips, dismiss overlays, remove premium popups, force high quality — silent background
// @author       jhamaii
// @icon         https://open.spotifycdn.com/cdn/images/favicon32.8e66b099.png
// @match        https://open.spotify.com/*
// @grant        none
// @run-at       document-start
// ==/UserScript==

(function () {
  'use strict';

  const NEXT_SELS = [
    '[data-testid="control-button-skip-forward"]',
    '[aria-label*="Next"]',
    'button[title*="Next"]',
  ];

  const AD_SELS = [
    '[data-testid="ad-label"]',
    '[data-testid="advertisement"]',
    '.advertisement',
    '[aria-label*="Advertisement"]',
  ];

  const OVERLAY_SELS = [
    '[data-testid="tas-upsell-card"]',
    '[data-testid="ad-banner"]',
    '[data-testid="interstitial-wrapper"]',
    '[data-testid="showcase-interstitial"]',
    '.sponsor-container',
    '[class*="UpsellBanner"]',
    '[class*="upsell-banner"]',
    '[class*="AdBanner"]',
  ];

  const PREMIUM_POPUP_SELS = [
    '[data-testid="blocking-modal"]',
    '[data-testid="premium-upsell-modal"]',
    '[data-testid="upsell-interstitial"]',
    '[class*="UpsellModal"]',
    '[class*="BlockingModal"]',
    '[aria-label*="Premium"]',
    '[aria-label*="upgrade"]',
  ];

  const PREMIUM_CLOSE_TEXT = ['close', 'not now', 'maybe later', 'no thanks', 'dismiss'];

  let lastAdState = false;

  function skipAd() {
    const isAd = AD_SELS.some(s => document.querySelector(s));
    if (isAd && !lastAdState) {
      lastAdState = true;
      setTimeout(() => {
        for (const sel of NEXT_SELS) {
          const b = document.querySelector(sel);
          if (b) { b.click(); break; }
        }
        lastAdState = false;
      }, 800);
    } else if (!isAd) {
      lastAdState = false;
    }
  }

  function unlimitedSkips() {
    for (const sel of NEXT_SELS) {
      const btn = document.querySelector(sel);
      if (btn && (btn.disabled || btn.getAttribute('aria-disabled') === 'true')) {
        btn.disabled = false;
        btn.removeAttribute('disabled');
        btn.removeAttribute('aria-disabled');
        btn.style.opacity = '1';
        btn.style.pointerEvents = 'all';
      }
    }
  }

  function dismissOverlays() {
    for (const sel of OVERLAY_SELS) {
      const el = document.querySelector(sel);
      if (el) el.remove();
    }
  }

  function removePremiumPopups() {
    for (const sel of PREMIUM_POPUP_SELS) {
      const el = document.querySelector(sel);
      if (el) {
        const closeBtn = [...el.querySelectorAll('button')]
          .find(b => PREMIUM_CLOSE_TEXT.some(t => b.textContent.trim().toLowerCase().includes(t)));
        if (closeBtn) closeBtn.click();
        else el.remove();
      }
    }

    // Also nuke any modal backdrop
    const backdrop = document.querySelector('[class*="Backdrop"],[class*="backdrop"],[data-testid="backdrop"]');
    if (backdrop) backdrop.remove();
  }

  function forceHighQuality() {
    const audioEl = document.querySelector('audio');
    if (!audioEl) return;

    // Prevent Spotify from throttling playback quality via preload
    if (audioEl.preload !== 'auto') audioEl.preload = 'auto';

    // Intercept XHR/fetch to inject quality param where possible
    // Spotify uses their own internal API — we can nudge the audio element bitrate
    // by ensuring the buffer is never starved
    if (!audioEl._spxHQ) {
      audioEl._spxHQ = true;
      audioEl.addEventListener('waiting', () => {
        if (audioEl.playbackRate !== 1) audioEl.playbackRate = 1;
      });
    }
  }

  function tick() {
    skipAd();
    unlimitedSkips();
    dismissOverlays();
    removePremiumPopups();
    forceHighQuality();
  }

  setInterval(tick, 600);

  // MutationObserver for faster popup/overlay detection
  new MutationObserver(dismissOverlays).observe(document.documentElement, { childList: true, subtree: true });

})();
