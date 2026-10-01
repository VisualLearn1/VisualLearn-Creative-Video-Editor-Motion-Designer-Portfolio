/**
 * ============================================================================
 * VISUALLEARN - CREATIVE VIDEO EDITOR PORTFOLIO SCRIPTS
 * ============================================================================
 * 
 * ARCHITECTURE & MASTER TABLE OF CONTENTS:
 * 
 *  1. [TASK 1] BROWSER RELOAD & REFRESH CONTROLLER
 *     • Forces page to always open from the Home page at (0, 0).
 *     • Handles manual scroll restoration, beforeunload, and pageshow events.
 * 
 *  2. ULTRA-SMOOTH CANVAS SCROLL ANIMATION (300 FRAMES)
 *     • Canvas scaling with device pixel ratio.
 *     • High-performance priority-tier image frame preloading.
 *     • Physics interpolation (lerp) loop for fluid motion.
 * 
 *  3. NAVIGATION, SCROLL SPY & MOBILE MENU
 *     • Smooth anchor link navigation.
 *     • Active link highlight calculation on scroll.
 *     • Mobile hamburger menu and drawer toggling.
 * 
 *  4. CONTACT SECTION & INTERACTIVE FORM
 *     • Custom dropdown selection handler.
 *     • Form submission simulation and validation feedback.
 * 
 *  5. COVER FLOW SHOWCASE MANAGERS (5 FULLY ISOLATED MODALS):
 *     -------------------------------------------------------------------------
 *     • Modal 1 (prefix: cf-)    -> Motion Graphics Showcase (setupCoverFlowPlayer)
 *     • Modal 2 (prefix: ht-)    -> Talking Head Masterclass (setupHeadTalkingPlayer)
 *     • Modal 3 (prefix: phonk-) -> Phonk Edits & Speed Ramps (setupPhonkCoverFlowPlayer)
 *     • Modal 4 (prefix: re-)    -> Real Estate Walkthroughs (setupRealEstatePlayer)
 *     • Modal 5 (prefix: ce-)    -> Cinematic Edits (setupCinematicPlayer)
 *     -------------------------------------------------------------------------
 *     HOW TO UPDATE TRACKS / VIDEOS NEXT TIME:
 *     In each setup function, locate the `const TRACKS = [...]` array at the top.
 *     Simply change `title`, `artist`, `image`, `url`, and the card's `<video src="">`!
 * 
 *  6. CINEMA FULLSCREEN VIDEO PLAYER (#cf-cinema-modal)
 *     • Universal fullscreen theatre playback with scrubbing, sound, and play/pause.
 * 
 *  7. APPLICATION BOOTSTRAP & INITIALIZATION (init)
 * ============================================================================
 */

// ============================================================================
// 1. BROWSER RELOAD / REFRESH CONTROLLER: Always open from the Home page (0, 0)
// ============================================================================
if (typeof window !== 'undefined' && window.history && 'scrollRestoration' in window.history) {
  window.history.scrollRestoration = 'manual';
}

window.addEventListener('beforeunload', () => {
  window.scrollTo(0, 0);
});

window.addEventListener('pageshow', () => {
  window.scrollTo(0, 0);
  if (window.location && window.location.hash && window.history && window.history.replaceState) {
    window.history.replaceState(null, document.title, window.location.pathname);
  }
});

// ============================================================================
// 2. ULTRA-SMOOTH CANVAS SCROLL ANIMATION (300 FRAMES)
// ============================================================================
const TOTAL_FRAMES = 300;
const canvas = document.getElementById('scroll-canvas');
const ctx = canvas.getContext('2d', { alpha: false });

const images = new Array(TOTAL_FRAMES);
const loaded = new Array(TOTAL_FRAMES).fill(false);

let currentProgress = 0;
let targetProgress = 0;
let lastRenderedIndex = -1;

// Return formatted image frame path organized for GitHub upload limit (max 100 files per folder)
function getFramePath(index) {
  const frameNumber = index + 1;
  const num = String(frameNumber).padStart(3, '0');
  let folder = 'frames-1';
  if (frameNumber > 200) {
    folder = 'frames-3';
  } else if (frameNumber > 100) {
    folder = 'frames-2';
  }
  return `images/${folder}/ezgif-frame-${num}.jpg`;
}

// Draw image covering the entire canvas while maintaining aspect ratio
function drawCover(img) {
  if (!img || !img.complete || !img.naturalWidth) return;

  const cw = canvas.width;
  const ch = canvas.height;
  const iw = img.naturalWidth;
  const ih = img.naturalHeight;

  // Cover calculation: center and scale image to fill viewport
  const scale = Math.max(cw / iw, ch / ih);
  const dw = Math.round(iw * scale);
  const dh = Math.round(ih * scale);
  const dx = Math.round((cw - dw) / 2);
  const dy = Math.round((ch - dh) / 2);

  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(img, dx, dy, dw, dh);
}

// Retrieve the best loaded frame near the requested index
function getFrame(index) {
  const idx = Math.max(0, Math.min(TOTAL_FRAMES - 1, index));
  if (loaded[idx] && images[idx]) return images[idx];

  // Outward search for nearest loaded frame to guarantee zero flicker
  for (let offset = 1; offset < TOTAL_FRAMES; offset++) {
    const prev = idx - offset;
    if (prev >= 0 && loaded[prev] && images[prev]) return images[prev];
    const next = idx + offset;
    if (next < TOTAL_FRAMES && loaded[next] && images[next]) return images[next];
  }
  return images[0] || null;
}

// Render frame at index
function renderFrame(index) {
  if (index === lastRenderedIndex) return;
  const img = getFrame(index);
  if (img) {
    drawCover(img);
    lastRenderedIndex = index;
  }
}

// Resize canvas to match display size & device pixel ratio
function resizeCanvas() {
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  canvas.width = Math.round(window.innerWidth * dpr);
  canvas.height = Math.round(window.innerHeight * dpr);
  lastRenderedIndex = -1; // Force repaint
  const frame = Math.round(currentProgress * (TOTAL_FRAMES - 1));
  renderFrame(frame);
}

window.addEventListener('resize', resizeCanvas);

// Calculate maximum scroll distance
function getMaxScroll() {
  const docHeight = document.documentElement ? document.documentElement.scrollHeight : (document.body ? document.body.scrollHeight : 1000);
  return Math.max(1, docHeight - window.innerHeight);
}

// Update target frame and UI based on current scroll position
function updateScrollProgress() {
  const scrollTop = window.scrollY || window.pageYOffset || (document.documentElement ? document.documentElement.scrollTop : 0) || 0;
  const maxScroll = getMaxScroll();
  targetProgress = Math.max(0, Math.min(1, scrollTop / maxScroll));

  // Update reading progress bar
  const progressBar = document.getElementById('scroll-progress-bar');
  if (progressBar) {
    progressBar.style.width = (targetProgress * 100).toFixed(2) + '%';
  }

  // Update Active Navigation Item
  updateActiveNavLink(scrollTop);
}

window.addEventListener('scroll', updateScrollProgress, { passive: true });

// Determine which section is currently in view and update nav links
function updateActiveNavLink(scrollTop) {
  const sections = ['hero', 'about', 'projects', 'contact'];
  const offset = 220; // Trigger threshold
  let currentSection = 'hero';

  for (let i = sections.length - 1; i >= 0; i--) {
    const el = document.getElementById(sections[i]);
    if (el) {
      const top = el.offsetTop - offset;
      if (scrollTop >= top) {
        currentSection = sections[i];
        break;
      }
    }
  }

  // Update desktop nav links
  document.querySelectorAll('.nav-link').forEach((link) => {
    const href = link.getAttribute('href');
    const isMatch = href === `#${currentSection}` || (currentSection === 'hero' && (href === '#Vlearn' || href === '#hero'));
    if (isMatch) {
      link.classList.add('active');
    } else {
      link.classList.remove('active');
    }
  });

  // Update mobile nav links
  document.querySelectorAll('.mobile-nav-link').forEach((link) => {
    const href = link.getAttribute('href');
    const isMatch = href === `#${currentSection}` || (currentSection === 'hero' && (href === '#Vlearn' || href === '#hero'));
    if (isMatch) {
      link.classList.add('active');
    } else {
      link.classList.remove('active');
    }
  });
}

// Main Animation Loop with physics dampening (Lerp)
function animate() {
  const diff = targetProgress - currentProgress;
  if (Math.abs(diff) > 0.0001) {
    currentProgress += diff * 0.12;
  } else {
    currentProgress = targetProgress;
  }

  const frameToRender = Math.round(currentProgress * (TOTAL_FRAMES - 1));
  renderFrame(frameToRender);

  requestAnimationFrame(animate);
}

// Preload image frames progressively with priority tiering
function preloadImages() {
  function loadSingleFrame(i, onComplete) {
    if (images[i] && loaded[i]) {
      if (onComplete) onComplete();
      return;
    }
    const img = new Image();
    img.src = getFramePath(i);
    images[i] = img;

    const onLoaded = () => {
      loaded[i] = true;
      if (i === 0 && lastRenderedIndex === -1) {
        renderFrame(0);
      }
      if (Math.round(currentProgress * (TOTAL_FRAMES - 1)) === i) {
        renderFrame(i);
      }
      if (onComplete) onComplete();
    };

    if (img.complete && img.naturalWidth > 0) {
      onLoaded();
    } else {
      img.onload = onLoaded;
      img.onerror = () => {
        // Fallback: If not found in subfolder, automatically try flat images/ folder
        const num = String(i + 1).padStart(3, '0');
        const fallbackSrc = `images/ezgif-frame-${num}.jpg`;
        if (img.src !== fallbackSrc && !img.dataset.fallbackTried) {
          img.dataset.fallbackTried = 'true';
          img.src = fallbackSrc;
        } else {
          if (onComplete) onComplete();
        }
      };
    }
  }

  // Tier 1: Priority initial frames (0 to 12) for immediate crisp view
  for (let i = 0; i <= 12; i++) {
    loadSingleFrame(i);
  }

  // Tier 2: Key intervals across the timeline (every 4th frame)
  setTimeout(() => {
    for (let i = 13; i < TOTAL_FRAMES; i += 4) {
      loadSingleFrame(i);
    }
  }, 100);

  // Tier 3: Load remaining frames in progressive batches
  setTimeout(() => {
    let index = 0;
    function loadBatch() {
      let count = 0;
      while (index < TOTAL_FRAMES && count < 8) {
        if (!loaded[index]) {
          loadSingleFrame(index);
          count++;
        }
        index++;
      }
      if (index < TOTAL_FRAMES) {
        setTimeout(loadBatch, 30);
      }
    }
    loadBatch();
  }, 300);
}

// ============================================================================
// 3. NAVIGATION, SCROLL SPY & MOBILE MENU
// ============================================================================
// Setup smooth scrolling for anchor links
function setupSmoothNavigation() {
  document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
    anchor.addEventListener('click', function (e) {
      const targetId = this.getAttribute('href');
      if (targetId === '#') return;

      const targetEl = document.querySelector(targetId);
      if (!targetEl) return;

      e.preventDefault();

      // Close mobile drawer if open
      closeMobileMenu();

      const navbar = document.getElementById('navbar');
      const navHeight = navbar ? navbar.offsetHeight : 70;
      const targetPosition = targetEl.getBoundingClientRect().top + window.pageYOffset - navHeight;

      window.scrollTo({
        top: Math.max(0, targetPosition),
        behavior: 'smooth',
      });

      // If user clicked any 'Get in touch' CTA, focus the first input after scrolling
      if (targetId === '#contact') {
        setTimeout(() => {
          const nameInput = document.getElementById('client-name');
          if (nameInput) nameInput.focus();
        }, 600);
      }
    });
  });
}

// Setup Mobile Navigation Drawer
function setupMobileMenu() {
  const toggleBtn = document.getElementById('mobile-toggle');
  const drawer = document.getElementById('mobile-nav-drawer');
  if (!toggleBtn || !drawer) return;

  toggleBtn.addEventListener('click', () => {
    const isOpen = drawer.classList.toggle('is-open');
    toggleBtn.classList.toggle('is-active', isOpen);
    toggleBtn.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
  });

  // Close when clicking outside
  document.addEventListener('click', (e) => {
    if (drawer.classList.contains('is-open') && !drawer.contains(e.target) && !toggleBtn.contains(e.target)) {
      closeMobileMenu();
    }
  });
}

function closeMobileMenu() {
  const toggleBtn = document.getElementById('mobile-toggle');
  const drawer = document.getElementById('mobile-nav-drawer');
  if (drawer && drawer.classList.contains('is-open')) {
    drawer.classList.remove('is-open');
    if (toggleBtn) {
      toggleBtn.classList.remove('is-active');
      toggleBtn.setAttribute('aria-expanded', 'false');
    }
  }
}

// ============================================================================
// 4. CONTACT SECTION & INTERACTIVE BOOKING FORM
// ============================================================================
function setupContactSection() {
  // 1. Service Pills Toggle (Allow multiple selection)
  const servicePills = document.querySelectorAll('#service-pills .choice-pill');
  const hiddenServices = document.getElementById('hidden-services');
  const hiddenBudget = document.getElementById('hidden-budget');

  function updateHiddenFields() {
    if (hiddenServices) {
      const selectedServices = Array.from(document.querySelectorAll('#service-pills .choice-pill.active')).map(
        (p) => p.dataset.value
      );
      hiddenServices.value = selectedServices.join(', ');
    }
    if (hiddenBudget) {
      const selectedBudget = document.querySelector('#budget-pills .budget-pill.active')?.dataset.value || 'Not specified';
      hiddenBudget.value = selectedBudget;
    }
  }

  servicePills.forEach((pill) => {
    pill.addEventListener('click', () => {
      pill.classList.toggle('active');
      updateHiddenFields();
    });
  });

  // 2. Budget Pills (Single selection)
  const budgetPills = document.querySelectorAll('#budget-pills .budget-pill');
  budgetPills.forEach((pill) => {
    pill.addEventListener('click', () => {
      budgetPills.forEach((p) => p.classList.remove('active'));
      pill.classList.add('active');
      updateHiddenFields();
    });
  });

  // 3. Email Copy to Clipboard
  const copyBtn = document.getElementById('btn-copy-email');
  const tooltip = document.getElementById('copy-tooltip');
  if (copyBtn && tooltip) {
    copyBtn.addEventListener('click', async () => {
      const emailText = document.getElementById('contact-email')?.innerText?.trim() || 'techxplr10@gmail.com';
      try {
        await navigator.clipboard.writeText(emailText);
        tooltip.textContent = 'Copied!';
        copyBtn.classList.add('copied');
      } catch (err) {
        // Fallback
        const temp = document.createElement('textarea');
        temp.value = emailText;
        document.body.appendChild(temp);
        temp.select();
        document.execCommand('copy');
        document.body.removeChild(temp);
        tooltip.textContent = 'Copied!';
        copyBtn.classList.add('copied');
      }

      setTimeout(() => {
        tooltip.textContent = 'Copy';
        copyBtn.classList.remove('copied');
      }, 2000);
    });
  }

  // 4. Form Validation & Submission
  const form = document.getElementById('project-inquiry-form');
  const successView = document.getElementById('inquiry-success-view');
  const submitBtn = document.getElementById('btn-submit-inquiry');
  const sendAnotherBtn = document.getElementById('btn-send-another');
  const nameInput = document.getElementById('client-name');
  const emailInput = document.getElementById('client-email');
  const detailsInput = document.getElementById('project-details');

  if (form && successView) {
    // Clear error on input
    [nameInput, emailInput, detailsInput].forEach((input) => {
      if (input) {
        input.addEventListener('input', () => {
          input.closest('.form-group')?.classList.remove('has-error');
        });
      }
    });

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      let hasError = false;

      // Validate Name
      if (!nameInput.value.trim()) {
        nameInput.closest('.form-group')?.classList.add('has-error');
        hasError = true;
      }

      // Validate Email
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(emailInput.value.trim())) {
        emailInput.closest('.form-group')?.classList.add('has-error');
        hasError = true;
      }

      // Validate Details
      if (!detailsInput.value.trim()) {
        detailsInput.closest('.form-group')?.classList.add('has-error');
        hasError = true;
      }

      if (hasError) return;

      // Loading state
      submitBtn.classList.add('is-submitting');
      submitBtn.disabled = true;

      // Ensure hidden fields are up to date
      updateHiddenFields();

      // Dynamic descriptive subject line for email notification
      const formSubject = document.getElementById('form-subject');
      const selectedBudget = document.querySelector('#budget-pills .budget-pill.active')?.dataset.value || '';
      if (formSubject) {
        formSubject.value = `New Inquiry from ${nameInput.value.trim()} [Budget: ${selectedBudget}]`;
      }

      try {
        const formData = new FormData(form);
        formData.set('message', detailsInput.value.trim());
        formData.set('replyto', emailInput.value.trim());

        const response = await fetch(form.action || 'https://api.web3forms.com/submit', {
          method: 'POST',
          body: formData,
        });

        const result = await response.json();

        if (response.ok && result.success) {
          // Populate client name in success screen
          const clientFirstName = nameInput.value.trim().split(' ')[0] || 'there';
          const successNameEl = document.getElementById('success-client-name');
          if (successNameEl) successNameEl.textContent = clientFirstName;

          // Hide form and show success view
          form.style.display = 'none';
          successView.classList.add('show');
        } else {
          alert(result.message || 'There was an issue sending your message. Please try again.');
        }
      } catch (err) {
        console.error('Submission error:', err);
        alert('Network error. Please check your connection or contact directly via techxplr10@gmail.com');
      } finally {
        submitBtn.classList.remove('is-submitting');
        submitBtn.disabled = false;
      }
    });

    // Reset and send another inquiry
    if (sendAnotherBtn) {
      sendAnotherBtn.addEventListener('click', () => {
        form.reset();
        form.style.display = 'flex';
        successView.classList.remove('show');
        // Reset pills to defaults
        servicePills.forEach((p, idx) => {
          if (idx < 2) p.classList.add('active');
          else p.classList.remove('active');
        });
        budgetPills.forEach((p, idx) => {
          if (idx === 1) p.classList.add('active');
          else p.classList.remove('active');
        });
        updateHiddenFields();
      });
    }
  }

  // 5. Back to Top Button
  const backToTopBtn = document.getElementById('btn-back-to-top');
  if (backToTopBtn) {
    backToTopBtn.addEventListener('click', () => {
      window.scrollTo({
        top: 0,
        behavior: 'smooth',
      });
    });
  }
}

// ============================================================================
// 5. COVER FLOW SHOWCASE MANAGERS (5 FULLY ISOLATED MODALS)
// ============================================================================

// ============================================================================
// 5.1. MODAL 1: MOTION GRAPHICS SHOWCASE (#coverflow-modal)
// Grid Trigger: #card-motion-graphics (Card 1) | ID Prefix: "cf-"
// HOW TO EDIT TRACKS: Locate the `TRACKS` array below to modify titles,
// artwork, links, audio durations, or lyrics.
// ============================================================================
function setupCoverFlowPlayer() {
  const modal = document.getElementById('coverflow-modal');
  const cardTrigger = document.getElementById('card-motion-graphics');
  const btnClose = document.getElementById('coverflow-btn-close');
  const backdrop = document.getElementById('coverflow-backdrop');
  const deck = document.getElementById('coverflow-deck');
  const cards = deck ? Array.from(deck.querySelectorAll('.cf-card')) : [];
  const btnPrev = document.getElementById('cf-btn-prev');
  const btnNext = document.getElementById('cf-btn-next');
  const stagePrev = document.getElementById('coverflow-prev');
  const stageNext = document.getElementById('coverflow-next');
  const btnPlayPause = document.getElementById('cf-btn-playpause');
  const iconPlay = btnPlayPause?.querySelector('.icon-play');
  const iconPause = btnPlayPause?.querySelector('.icon-pause');
  const ambientGlow = document.getElementById('coverflow-ambient-glow');

  // Center Capsule elements
  const nowPlayingPill = document.getElementById('cf-now-playing-pill');
  const npThumb = document.getElementById('cf-np-thumb');
  const npTitle = document.getElementById('cf-np-title');
  const npArtist = document.getElementById('cf-np-artist');
  const npTime = document.getElementById('cf-np-time');
  const progressFill = document.getElementById('cf-progress-fill');
  const progressContainer = document.getElementById('cf-progress-container');
  const playerPill = document.getElementById('cf-player-pill');

  // Popover elements
  const castWrapper = document.getElementById('cf-cast-wrapper');
  const btnCast = document.getElementById('cf-btn-cast');
  const castPopover = document.getElementById('cf-cast-popover');
  const deviceItems = castPopover ? Array.from(castPopover.querySelectorAll('.cf-device-item')) : [];

  const optionsWrapper = document.getElementById('cf-options-wrapper');
  const btnOptions = document.getElementById('cf-btn-options');
  const optFullscreen = document.getElementById('cf-opt-fullscreen');
  const optInstagram = document.getElementById('cf-opt-instagram');
  const optCopyLink = document.getElementById('cf-opt-copylink');
  const optFavorite = document.getElementById('cf-opt-favorite');
  const toast = document.getElementById('cf-toast');

  // Drawers
  const btnLyrics = document.getElementById('cf-btn-lyrics');
  const lyricsDrawer = document.getElementById('cf-lyrics-drawer');
  const lyricsClose = document.getElementById('cf-lyrics-close');
  const lyricsBody = document.getElementById('cf-lyrics-body');
  const lyricsTrackTitle = document.getElementById('cf-lyrics-track-title');

  const btnQueue = document.getElementById('cf-btn-queue');
  const queueDrawer = document.getElementById('cf-queue-drawer');
  const queueClose = document.getElementById('cf-queue-close');
  const queueList = document.getElementById('cf-queue-list');

  // Volume
  const volumeWrapper = document.getElementById('cf-volume-wrapper');
  const volumeSlider = document.getElementById('cf-volume-slider');
  const btnVolume = document.getElementById('cf-btn-volume');

  // Video & Cinema elements
  const cardVideo = document.getElementById('cf-card-video');
  const reelWrap = document.getElementById('cf-reel-wrap');
  const btnCardFs = document.getElementById('cf-card-fs-btn');
  const btnCardSound = document.getElementById('cf-card-sound-btn');

  // Video Card 1 (Agentic AI YouTube Reel)
  const cardVideo1 = document.getElementById('cf-card-video-1');
  const reelWrap1 = document.getElementById('cf-reel-wrap-1');
  const btnCardFs1 = document.getElementById('cf-card-fs-btn-1');
  const btnCardSound1 = document.getElementById('cf-card-sound-btn-1');

  // Video Card 2 (Pinterest SaaS Explainer Reel)
  const cardVideo2 = document.getElementById('cf-card-video-2');
  const reelWrap2 = document.getElementById('cf-reel-wrap-2');
  const btnCardFs2 = document.getElementById('cf-card-fs-btn-2');
  const btnCardSound2 = document.getElementById('cf-card-sound-btn-2');

  // Video Card 3 (Pinterest Motion Inspiration Reel)
  const cardVideo3 = document.getElementById('cf-card-video-3');
  const reelWrap3 = document.getElementById('cf-reel-wrap-3');
  const btnCardFs3 = document.getElementById('cf-card-fs-btn-3');
  const btnCardSound3 = document.getElementById('cf-card-sound-btn-3');

  // Video Card 4 (Pinterest Apple Motion Reel)
  const cardVideo4 = document.getElementById('cf-card-video-4');
  const reelWrap4 = document.getElementById('cf-reel-wrap-4');
  const btnCardFs4 = document.getElementById('cf-card-fs-btn-4');
  const btnCardSound4 = document.getElementById('cf-card-sound-btn-4');

  // Video Card 5 (Pinterest Brand Motion Reel)
  const cardVideo5 = document.getElementById('cf-card-video-5');
  const reelWrap5 = document.getElementById('cf-reel-wrap-5');
  const btnCardFs5 = document.getElementById('cf-card-fs-btn-5');
  const btnCardSound5 = document.getElementById('cf-card-sound-btn-5');

  const cinemaModal = document.getElementById('cf-cinema-modal');
  const cinemaVideoBox = document.getElementById('cf-cinema-video-box');
  const cinemaVideo = document.getElementById('cf-cinema-video');
  const cinemaClose = document.getElementById('cf-cinema-close');
  const cinemaBackdrop = document.getElementById('cf-cinema-backdrop');
  const cinemaSoundToggle = document.getElementById('cf-cinema-sound-toggle');
  const cinemaFsToggle = document.getElementById('cf-cinema-fs-toggle');
  const cinemaPlayOverlay = document.getElementById('cf-cinema-play-overlay');
  const cinemaTimeline = document.getElementById('cf-cinema-timeline');
  const cinemaProgress = document.getElementById('cf-cinema-progress');
  const cinemaBadgeText = document.getElementById('cf-cinema-badge-text');
  const cinemaCaptionTitle = document.getElementById('cf-cinema-caption-title');
  const cinemaCaptionDesc = document.getElementById('cf-cinema-caption-desc');

  if (!modal || !cardTrigger) return;

  // Player State
  let activeIndex = 0; // Default to Card 0: Motion Graphics Reel
  let isPlaying = false;
  let trackCurrentTime = 0;
  let progressTimer = null;
  let audioCtx = null;
  let masterGain = null;
  let synthInterval = null;
  let currentVolume = 0.8;
  let isMuted = false;

  function getCardVideo(idx) {
    if (idx === 0) return cardVideo;
    if (idx === 1) return cardVideo1;
    if (idx === 2) return cardVideo2;
    if (idx === 3) return cardVideo3;
    if (idx === 4) return cardVideo4;
    if (idx === 5) return cardVideo5;
    return null;
  }

  function stopProgressTimer() {
    if (progressTimer) {
      clearInterval(progressTimer);
      progressTimer = null;
    }
  }

  function stopSynth() {
    if (synthInterval) {
      clearInterval(synthInterval);
      synthInterval = null;
    }
  }

  // Guaranteed single-audio authority: strictly pause and mute all other videos & synth
  function pauseAndMuteAllVideos(exceptTarget = -1) {
    for (let i = 0; i <= 5; i++) {
      if (i !== exceptTarget) {
        const v = getCardVideo(i);
        if (v) {
          v.pause();
          v.muted = true;
        }
      }
    }
    if (cinemaVideo && exceptTarget !== 'cinema') {
      cinemaVideo.pause();
      cinemaVideo.muted = true;
    }
    stopSynth();
    stopProgressTimer();
  }

  // Strictly pause and mute all videos on initial setup
  pauseAndMuteAllVideos(-1);

  // Track Data
  const TRACKS = [
    {
      id: 0,
      title: 'Motion Design Reel',
      artist: 'Instagram Reel',
      album: 'Motion Edit',
      image: 'images/music-player/motion_square_thumb.jpg',
      url: 'https://www.instagram.com/p/DbAzIYOgxk1/',
      duration: 180,
      accent: 'rgba(225, 48, 108, 0.48)',
      bpm: 110,
      scale: [220, 261.63, 293.66, 329.63, 392.00],
      bassNotes: [55, 65.41, 73.42, 82.41],
      lyrics: [
        { time: 0, text: 'Motion Graphics & Visual Design' },
        { time: 10, text: 'Custom keyframing & fluid typography' },
        { time: 25, text: 'Speed ramps & 3D camera tracking' },
        { time: 45, text: 'Watch full video on Instagram' }
      ]
    },
    {
      id: 1,
      title: 'Agentic AI Roadmap',
      artist: 'Unskilled Engineer',
      album: 'YouTube Video',
      image: 'images/music-player/agentic_ai_cover.jpg',
      url: 'https://youtu.be/p5KWZRhKLwc?si=JC9BU42PuxK-nKpX',
      duration: 313,
      accent: 'rgba(239, 68, 68, 0.55)',
      bpm: 95,
      scale: [261.63, 293.66, 329.63, 392.00, 440.00], // C major vintage
      bassNotes: [65.41, 73.42, 82.41, 98.00],
      lyrics: [
        { time: 0, text: 'How to Become an Agentic AI Engineer in 2026? Complete Roadmap' },
        { time: 18, text: 'Mastering LLMs, Function Calling, Tools & Structured Outputs' },
        { time: 42, text: 'Agent Frameworks: LangGraph, CrewAI, AutoGen & Claude Agents' },
        { time: 78, text: 'Cognitive Architecture: Planning, Reflection & Memory Systems' },
        { time: 120, text: 'Production Reliability: Evals, Observability & Guardrails' },
        { time: 180, text: 'Watch full breakdown and roadmap on YouTube' }
      ]
    },
    {
      id: 2,
      title: 'SaaS Explainer Video',
      artist: 'Motion & SaaS UI',
      album: 'Pinterest Reel',
      image: 'images/music-player/saas_cover.jpg',
      url: 'https://pin.it/5dcwJ5OlX',
      duration: 7,
      accent: 'rgba(230, 0, 35, 0.55)',
      bpm: 120,
      scale: [349.23, 392.00, 440.00, 466.16, 523.25, 587.33],
      bassNotes: [87.31, 77.78, 65.41, 69.30],
      lyrics: [
        { time: 0, text: 'SaaS Explainer Video & Product Motion' },
        { time: 2, text: 'Dynamic UI animations & interface transitions' },
        { time: 4, text: 'Engaging feature walkthrough for product launch' },
        { time: 6, text: 'Watch original pin on Pinterest' }
      ]
    },
    {
      id: 3,
      title: 'Motion Inspiration Reel',
      artist: 'Motion Graphics & 3D',
      album: 'Pinterest Reel',
      image: 'images/music-player/motion_insp_cover.jpg',
      url: 'https://pin.it/1C06vmkDf',
      duration: 32,
      accent: 'rgba(230, 0, 35, 0.55)',
      bpm: 115,
      scale: [293.66, 329.63, 369.99, 440.00, 493.88],
      bassNotes: [73.42, 82.41, 92.50, 110.00],
      lyrics: [
        { time: 0, text: 'Motion Inspiration — High Energy 3D Motion Reel' },
        { time: 8, text: 'Fluid typography, sleek dynamic camera moves' },
        { time: 18, text: 'Custom 3D shaders, physics simulation & kinetic impact' },
        { time: 26, text: 'Watch full inspiration clip on Pinterest' }
      ]
    },
    {
      id: 4,
      title: 'Motion Graphics - Apple',
      artist: 'Apple & Motion Design',
      album: 'Pinterest Reel',
      image: 'images/music-player/apple_motion_cover.jpg',
      url: 'https://pin.it/dJzhBvwgV',
      duration: 10,
      accent: 'rgba(242, 100, 64, 0.55)',
      bpm: 110,
      scale: [261.63, 293.66, 329.63, 392.00, 440.00],
      bassNotes: [65.41, 73.42, 82.41, 98.00],
      lyrics: [
        { time: 0, text: 'Clean Apple-style kinetic typography & motion' },
        { time: 2, text: 'Precise cubic-bezier easing and minimal layout' },
        { time: 4, text: 'Sleek product visual sequencing and pacing' },
        { time: 7, text: 'Micro-interactions and fluid interface transitions' },
        { time: 9, text: 'Explore full pin reel on Pinterest' }
      ]
    },
    {
      id: 5,
      title: 'Brand Motion & Visual Identity',
      artist: 'Studio Spend & Motion',
      album: 'Pinterest Reel',
      image: 'images/music-player/creative_design_cover.jpg',
      url: 'https://pin.it/5vjcKNgol',
      duration: 29,
      accent: 'rgba(59, 130, 246, 0.55)',
      bpm: 125,
      scale: [293.66, 329.63, 369.99, 440.00, 493.88],
      bassNotes: [73.42, 82.41, 92.50, 110.00],
      lyrics: [
        { time: 0, text: 'Dynamic brand identity & kinetic typography' },
        { time: 5, text: 'Modular grid layouts and fluid UI motion' },
        { time: 12, text: 'Bold contrast, neon light streaks & high energy' },
        { time: 20, text: 'Modern fintech product pacing and transitions' },
        { time: 27, text: 'Explore full creative reel on Pinterest' }
      ]
    }
  ];

  // Format seconds to mm:ss
  function formatTime(sec) {
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  }

  // Update 3D Cover Flow layout according to activeIndex
  function updateCarousel(instant = false) {
    const isMobile = window.innerWidth < 640;
    const isTablet = window.innerWidth < 1024;

    const xOffset1 = isMobile ? 120 : isTablet ? 170 : 210;
    const xOffset2 = isMobile ? 220 : isTablet ? 320 : 400;
    const zOffset1 = isMobile ? -60 : -80;
    const zOffset2 = isMobile ? -120 : -160;
    const rot1 = isMobile ? 20 : 26;
    const rot2 = isMobile ? 32 : 40;

    cards.forEach((card, idx) => {
      const diff = idx - activeIndex;

      // Reset transition if instant
      if (instant) {
        card.style.transition = 'none';
      } else {
        card.style.transition = 'transform 0.6s cubic-bezier(0.25, 1, 0.5, 1), opacity 0.5s ease, filter 0.5s ease, box-shadow 0.6s ease';
      }

      if (diff === 0) {
        // Active Center Card
        card.classList.add('active');
        card.style.transform = 'translate3d(0, 0, 40px) rotateY(0deg) scale(1)';
        card.style.zIndex = '10';
        card.style.opacity = '1';
        card.style.filter = 'brightness(1)';
        card.style.pointerEvents = 'auto';
      } else if (diff === -1) {
        // Left 1
        card.classList.remove('active');
        card.style.transform = `translate3d(-${xOffset1}px, 0, ${zOffset1}px) rotateY(${rot1}deg) scale(0.85)`;
        card.style.zIndex = '7';
        card.style.opacity = '0.92';
        card.style.filter = 'brightness(0.82)';
        card.style.pointerEvents = 'auto';
      } else if (diff === -2) {
        // Left 2 (Far Left)
        card.classList.remove('active');
        card.style.transform = `translate3d(-${xOffset2}px, 0, ${zOffset2}px) rotateY(${rot2}deg) scale(0.72)`;
        card.style.zIndex = '4';
        card.style.opacity = '0.75';
        card.style.filter = 'brightness(0.6)';
        card.style.pointerEvents = 'auto';
      } else if (diff === 1) {
        // Right 1
        card.classList.remove('active');
        card.style.transform = `translate3d(${xOffset1}px, 0, ${zOffset1}px) rotateY(-${rot1}deg) scale(0.85)`;
        card.style.zIndex = '7';
        card.style.opacity = '0.92';
        card.style.filter = 'brightness(0.82)';
        card.style.pointerEvents = 'auto';
      } else if (diff === 2) {
        // Right 2 (Far Right)
        card.classList.remove('active');
        card.style.transform = `translate3d(${xOffset2}px, 0, ${zOffset2}px) rotateY(-${rot2}deg) scale(0.72)`;
        card.style.zIndex = '4';
        card.style.opacity = '0.75';
        card.style.filter = 'brightness(0.6)';
        card.style.pointerEvents = 'auto';
      } else {
        // Out of immediate view (wrap around or hidden)
        card.classList.remove('active');
        const sign = diff > 0 ? 1 : -1;
        card.style.transform = `translate3d(${sign * (xOffset2 + 100)}px, 0, -260px) rotateY(${-sign * 50}deg) scale(0.55)`;
        card.style.zIndex = '1';
        card.style.opacity = '0';
        card.style.filter = 'brightness(0.3)';
        card.style.pointerEvents = 'none';
      }
    });

    // Update ambient mood glow
    const track = TRACKS[activeIndex];
    if (ambientGlow && track) {
      ambientGlow.style.background = `radial-gradient(circle, ${track.accent} 0%, rgba(242, 100, 64, 0.05) 55%, transparent 75%)`;
    }

    // Update Player bar UI
    if (track) {
      if (npThumb) npThumb.src = track.image;
      if (npTitle) npTitle.textContent = track.title;
      if (npArtist) npArtist.textContent = track.artist;
      if (lyricsTrackTitle) lyricsTrackTitle.textContent = `${track.artist} — ${track.title}`;
      if (optInstagram && track.url) {
        optInstagram.href = track.url;
        const span = optInstagram.querySelector('span');
        const svg = optInstagram.querySelector('svg');
        if (span) {
          if (track.url.includes('youtube.com') || track.url.includes('youtu.be')) {
            span.textContent = 'Open on YouTube';
            if (svg) {
              svg.innerHTML = '<path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>';
              svg.setAttribute('viewBox', '0 0 24 24');
              svg.setAttribute('fill', 'currentColor');
            }
          } else if (track.url.includes('pin.it') || track.url.includes('pinterest.com')) {
            span.textContent = 'Open on Pinterest';
            if (svg) {
              svg.innerHTML = '<path d="M12 0C5.373 0 0 5.372 0 12c0 5.084 3.163 9.426 7.627 11.174-.105-.949-.2-2.405.042-3.441.218-.937 1.407-5.965 1.407-5.965s-.359-.719-.359-1.782c0-1.668.967-2.914 2.171-2.914 1.023 0 1.518.769 1.518 1.69 0 1.029-.655 2.568-.994 3.995-.283 1.194.599 2.169 1.777 2.169 2.133 0 3.772-2.249 3.772-5.495 0-2.873-2.064-4.882-5.012-4.882-3.414 0-5.418 2.561-5.418 5.207 0 1.031.397 2.138.893 2.738.098.119.112.224.083.345-.09.375-.291 1.199-.334 1.357-.053.225-.172.271-.401.165-1.495-.69-2.433-2.878-2.433-4.646 0-3.776 2.748-7.252 7.92-7.252 4.158 0 7.392 2.967 7.392 6.923 0 4.135-2.607 7.462-6.233 7.462-1.214 0-2.354-.629-2.758-1.379l-.749 2.848c-.269 1.045-1.004 2.352-1.498 3.146 1.123.345 2.306.535 3.546.535 6.627 0 12-5.373 12-12 0-6.628-5.373-12-12-12z"/>';
              svg.setAttribute('viewBox', '0 0 24 24');
              svg.setAttribute('fill', 'currentColor');
            }
          } else if (track.url.includes('instagram.com')) {
            span.textContent = 'Open on Instagram';
            if (svg) {
              svg.innerHTML = '<rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>';
              svg.setAttribute('viewBox', '0 0 24 24');
              svg.setAttribute('fill', 'none');
            }
          } else {
            span.textContent = 'Open Source Reel';
            if (svg) {
              svg.innerHTML = '<circle cx="12" cy="12" r="10"></circle><polygon points="10 8 16 12 10 16 10 8"></polygon>';
              svg.setAttribute('viewBox', '0 0 24 24');
              svg.setAttribute('fill', 'currentColor');
            }
          }
        }
      }
      updateProgressDisplay();
      populateLyrics();
      updateQueueActiveItem();
    }
  }

  // Switch Active Track
  function setActiveTrack(index, restartAudio = false) {
    if (index < 0) index = TRACKS.length - 1;
    if (index >= TRACKS.length) index = 0;

    const changed = activeIndex !== index;
    activeIndex = index;
    trackCurrentTime = 0;

    updateCarousel();

    // First and foremost: strictly pause and mute all other videos & synth so audio NEVER overlaps
    pauseAndMuteAllVideos(activeIndex);

    const activeVid = getCardVideo(activeIndex);
    if (activeVid) {
      activeVid.currentTime = 0;
      if (isPlaying || restartAudio) {
        activeVid.volume = currentVolume;
        activeVid.muted = isMuted;
        activeVid.play().then(() => {
          setPlayPauseState(true);
        }).catch(() => {
          activeVid.muted = true;
          activeVid.play().then(() => setPlayPauseState(true)).catch(() => setPlayPauseState(false));
        });
      } else {
        activeVid.pause();
        activeVid.muted = true;
        setPlayPauseState(false);
      }
    } else {
      // Fallback synth
      if (isPlaying || restartAudio) {
        initAudio();
        setPlayPauseState(true);
        startSynthTrack();
        startProgressTimer();
      } else {
        stopSynth();
        stopProgressTimer();
        setPlayPauseState(false);
      }
    }
  }

  // Update Progress Display
  function updateProgressDisplay() {
    const track = TRACKS[activeIndex];
    if (!track) return;

    if (npTime) {
      npTime.textContent = `${formatTime(trackCurrentTime)} / ${formatTime(track.duration)}`;
    }

    if (progressFill) {
      const pct = Math.min(100, Math.max(0, (trackCurrentTime / track.duration) * 100));
      progressFill.style.width = pct.toFixed(2) + '%';
    }

    // Update Synced Lyrics active line
    updateActiveLyricLine();
  }

  // Populate Lyrics for Active Track
  function populateLyrics() {
    if (!lyricsBody) return;
    lyricsBody.innerHTML = '';
    const track = TRACKS[activeIndex];
    if (!track || !track.lyrics) return;

    track.lyrics.forEach((item, lIdx) => {
      const p = document.createElement('p');
      p.className = 'cf-lyric-line';
      p.dataset.time = item.time;
      p.textContent = item.text;
      p.addEventListener('click', () => {
        trackCurrentTime = item.time;
        updateProgressDisplay();
      });
      lyricsBody.appendChild(p);
    });
    updateActiveLyricLine();
  }

  // Highlight current lyric line
  function updateActiveLyricLine() {
    if (!lyricsBody) return;
    const lines = lyricsBody.querySelectorAll('.cf-lyric-line');
    let activeLine = null;

    lines.forEach((line) => {
      const time = parseFloat(line.dataset.time);
      if (trackCurrentTime >= time) {
        activeLine = line;
      }
    });

    lines.forEach((l) => l.classList.remove('active'));
    if (activeLine) {
      activeLine.classList.add('active');
      activeLine.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }

  // Populate & Update Queue
  function buildQueue() {
    if (!queueList) return;
    queueList.innerHTML = '';
    TRACKS.forEach((t, i) => {
      const item = document.createElement('div');
      item.className = `cf-queue-item ${i === activeIndex ? 'active' : ''}`;
      item.dataset.index = i;
      item.innerHTML = `
        <img src="${t.image}" alt="${t.title}" class="cf-qi-thumb" />
        <div class="cf-qi-info">
          <span class="cf-qi-title">${t.title}</span>
          <span class="cf-qi-artist">${t.artist}</span>
        </div>
      `;
      item.addEventListener('click', () => {
        setActiveTrack(i, true);
      });
      queueList.appendChild(item);
    });
  }

  function updateQueueActiveItem() {
    if (!queueList) return;
    queueList.querySelectorAll('.cf-queue-item').forEach((item) => {
      const idx = parseInt(item.dataset.index, 10);
      if (idx === activeIndex) {
        item.classList.add('active');
      } else {
        item.classList.remove('active');
      }
    });
  }

  // =========================================================
  // Web Audio API Synthesizer (Realistic Synthwave Soundscape)
  // =========================================================
  function initAudio() {
    if (!audioCtx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      audioCtx = new AudioCtx();
      masterGain = audioCtx.createGain();
      masterGain.gain.setValueAtTime(currentVolume, audioCtx.currentTime);
      masterGain.connect(audioCtx.destination);
    }
    if (audioCtx.state === 'suspended') {
      audioCtx.resume();
    }
  }

  function playSynthChordNote(freq, type = 'sawtooth', duration = 0.4, vol = 0.15) {
    if (!audioCtx || isMuted) return;
    try {
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      const filter = audioCtx.createBiquadFilter();

      osc.type = type;
      osc.frequency.setValueAtTime(freq, audioCtx.currentTime);

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(type === 'sawtooth' ? 1400 : 800, audioCtx.currentTime);
      filter.frequency.exponentialRampToValueAtTime(300, audioCtx.currentTime + duration);

      const now = audioCtx.currentTime;
      gain.gain.setValueAtTime(0.001, now);
      gain.gain.linearRampToValueAtTime(vol, now + 0.04);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(masterGain);

      osc.start(now);
      osc.stop(now + duration + 0.05);
    } catch (e) {
      // Audio fallback catch
    }
  }

  function playKick() {
    if (!audioCtx || isMuted) return;
    try {
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      const now = audioCtx.currentTime;

      osc.frequency.setValueAtTime(140, now);
      osc.frequency.exponentialRampToValueAtTime(38, now + 0.12);

      gain.gain.setValueAtTime(0.28, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);

      osc.connect(gain);
      gain.connect(masterGain);

      osc.start(now);
      osc.stop(now + 0.16);
    } catch (e) { }
  }

  function playHihat() {
    if (!audioCtx || isMuted) return;
    try {
      const bufferSize = audioCtx.sampleRate * 0.03;
      const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
      }
      const noise = audioCtx.createBufferSource();
      noise.buffer = buffer;

      const filter = audioCtx.createBiquadFilter();
      filter.type = 'highpass';
      filter.frequency.value = 7000;

      const gain = audioCtx.createGain();
      gain.gain.setValueAtTime(0.08, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.04);

      noise.connect(filter);
      filter.connect(gain);
      gain.connect(masterGain);

      noise.start();
    } catch (e) { }
  }

  // Synthesizer Loop Step
  let step = 0;
  function startSynthTrack() {
    initAudio();
    stopSynth();

    const track = TRACKS[activeIndex];
    const intervalMs = (60 / track.bpm) * 500; // 8th note interval

    step = 0;
    synthInterval = setInterval(() => {
      if (!isPlaying) return;

      const scale = track.scale;
      const bassNotes = track.bassNotes;

      // Beat rhythm
      if (step % 4 === 0) {
        playKick();
        // Bass note
        const b = bassNotes[Math.floor((step / 4) % bassNotes.length)];
        playSynthChordNote(b, 'sawtooth', 0.35, 0.22);
      } else if (step % 2 === 0) {
        playHihat();
      }

      // Arpeggio / melody lead
      const melodyFreq = scale[(step * 2 + activeIndex) % scale.length];
      playSynthChordNote(melodyFreq, 'triangle', 0.25, 0.14);

      // Harmony chord pad on 1 and 3
      if (step % 8 === 0) {
        const root = scale[0];
        const third = scale[2] || scale[1];
        const fifth = scale[4] || scale[3];
        playSynthChordNote(root, 'sawtooth', 0.8, 0.08);
        playSynthChordNote(third, 'sawtooth', 0.8, 0.06);
        playSynthChordNote(fifth, 'sawtooth', 0.8, 0.06);
      }

      step++;
    }, intervalMs);
  }

  // =========================================================
  // Playback State, Toast & Volume Controller
  // =========================================================
  let toastTimer = null;
  function showToast(msg) {
    if (!toast) return;
    toast.textContent = msg;
    toast.classList.add('is-active');
    toast.setAttribute('aria-hidden', 'false');
    if (toastTimer) clearTimeout(toastTimer);
    toastTimer = setTimeout(() => {
      toast.classList.remove('is-active');
      toast.setAttribute('aria-hidden', 'true');
    }, 2400);
  }

  function setPlayPauseState(playing) {
    isPlaying = playing;
    if (iconPlay) iconPlay.style.display = playing ? 'none' : 'block';
    if (iconPause) iconPause.style.display = playing ? 'block' : 'none';
    if (playerPill) {
      if (playing) playerPill.classList.add('is-playing');
      else playerPill.classList.remove('is-playing');
    }
  }

  function updateCinemaSoundUI(unmuted) {
    if (!cinemaSoundToggle) return;
    const iconMuted = cinemaSoundToggle.querySelector('.cinema-icon-muted');
    const iconUnmuted = cinemaSoundToggle.querySelector('.cinema-icon-unmuted');
    if (unmuted) {
      iconMuted?.style.setProperty('display', 'none');
      iconUnmuted?.style.setProperty('display', 'block');
    } else {
      iconMuted?.style.setProperty('display', 'block');
      iconUnmuted?.style.setProperty('display', 'none');
    }
  }

  function applyVolume(vol, muted) {
    currentVolume = Math.max(0, Math.min(1, vol));
    isMuted = !!muted || currentVolume === 0;

    const isCinemaOpen = cinemaModal && cinemaModal.classList.contains('is-open');

    // Strictly enforce single audio source:
    // If Cinema modal is open, only cinemaVideo can be unmuted; all 6 card videos MUST be muted.
    // If Cinema modal is closed, cinemaVideo MUST be muted; only the active playing card video can be unmuted.
    for (let i = 0; i <= 5; i++) {
      const v = getCardVideo(i);
      if (v) {
        if (!isCinemaOpen && i === activeIndex && isPlaying) {
          v.volume = currentVolume;
          v.muted = isMuted;
        } else {
          v.muted = true;
        }
      }
    }

    if (cinemaVideo) {
      if (isCinemaOpen) {
        cinemaVideo.volume = currentVolume;
        cinemaVideo.muted = isMuted;
      } else {
        cinemaVideo.muted = true;
      }
      updateCinemaSoundUI(!isMuted);
    }

    // Update sound buttons UI on all cards
    const soundBtns = [btnCardSound, btnCardSound1, btnCardSound2, btnCardSound3, btnCardSound4, btnCardSound5];
    soundBtns.forEach((btn) => {
      if (!btn) return;
      const iconMuted = btn.querySelector('.icon-muted');
      const iconUnmuted = btn.querySelector('.icon-unmuted');
      if (isMuted) {
        iconMuted?.style.setProperty('display', 'block');
        iconUnmuted?.style.setProperty('display', 'none');
      } else {
        iconMuted?.style.setProperty('display', 'none');
        iconUnmuted?.style.setProperty('display', 'block');
      }
    });

    // Web Audio master gain
    if (masterGain && audioCtx) {
      try {
        masterGain.gain.setValueAtTime(isMuted ? 0 : currentVolume, audioCtx.currentTime);
      } catch (e) { }
    }
    // Pill volume slider
    const volPct = isMuted ? 0 : Math.round(currentVolume * 100);
    if (volumeSlider) {
      volumeSlider.value = volPct;
      volumeSlider.style.setProperty('--vol-pct', volPct + '%');
    }
    const valDisplay = document.getElementById('cf-volume-val');
    if (valDisplay) {
      valDisplay.textContent = volPct + '%';
    }
    // Pill volume button icons
    if (btnVolume) {
      const vUnmuted = btnVolume.querySelector('.vol-icon-unmuted');
      const vMuted = btnVolume.querySelector('.vol-icon-muted');
      if (isMuted) {
        vUnmuted?.style.setProperty('display', 'none');
        vMuted?.style.setProperty('display', 'block');
      } else {
        vUnmuted?.style.setProperty('display', 'block');
        vMuted?.style.setProperty('display', 'none');
      }
    }
  }

  function startProgressTimer() {
    stopProgressTimer();
    progressTimer = setInterval(() => {
      if (!isPlaying || (activeIndex >= 0 && activeIndex <= 5)) return;
      trackCurrentTime += 0.5;
      const track = TRACKS[activeIndex];
      if (track && trackCurrentTime >= track.duration) {
        setActiveTrack((activeIndex + 1) % TRACKS.length, true);
      } else {
        updateProgressDisplay();
      }
    }, 500);
  }

  function stopProgressTimer() {
    if (progressTimer) {
      clearInterval(progressTimer);
      progressTimer = null;
    }
  }

  function stopSynth() {
    if (synthInterval) {
      clearInterval(synthInterval);
      synthInterval = null;
    }
  }

  // Play / Pause Toggle
  function togglePlayPause() {
    const activeVid = getCardVideo(activeIndex);
    if (activeVid) {
      // First ensure all other videos and synth are strictly paused and muted
      pauseAndMuteAllVideos(activeIndex);

      if (activeVid.paused) {
        activeVid.volume = currentVolume;
        activeVid.muted = isMuted;
        activeVid.play().then(() => {
          setPlayPauseState(true);
        }).catch(() => {
          activeVid.muted = true;
          activeVid.play().then(() => setPlayPauseState(true)).catch(() => { });
        });
        stopSynth();
        stopProgressTimer();
      } else {
        activeVid.pause();
        setPlayPauseState(false);
      }
    } else {
      // Fallback synth
      pauseAndMuteAllVideos(-1);
      initAudio();

      if (!isPlaying) {
        setPlayPauseState(true);
        startSynthTrack();
        startProgressTimer();
      } else {
        setPlayPauseState(false);
        stopSynth();
        stopProgressTimer();
      }
    }
  }

  // Scrubber scrubbing
  if (progressContainer) {
    function handleScrub(e) {
      const rect = progressContainer.getBoundingClientRect();
      const clientX = e.clientX !== undefined ? e.clientX : (e.touches && e.touches[0] ? e.touches[0].clientX : 0);
      const clickX = clientX - rect.left;
      const pct = Math.max(0, Math.min(1, clickX / rect.width));
      const track = TRACKS[activeIndex];
      const activeVid = getCardVideo(activeIndex);

      if (activeVid) {
        const duration = activeVid.duration || (track ? track.duration : 30);
        activeVid.currentTime = pct * duration;
        trackCurrentTime = activeVid.currentTime;
        if (progressFill) progressFill.style.width = (pct * 100).toFixed(2) + '%';
        if (npTime) npTime.textContent = `${formatTime(trackCurrentTime)} / ${formatTime(duration)}`;
      } else if (track) {
        trackCurrentTime = pct * track.duration;
        updateProgressDisplay();
      }
    }

    let isScrubbing = false;
    progressContainer.addEventListener('mousedown', (e) => {
      isScrubbing = true;
      handleScrub(e);
    });
    window.addEventListener('mousemove', (e) => {
      if (isScrubbing) handleScrub(e);
    });
    window.addEventListener('mouseup', () => {
      isScrubbing = false;
    });

    progressContainer.addEventListener('touchstart', (e) => {
      handleScrub(e);
    }, { passive: true });
    progressContainer.addEventListener('touchmove', (e) => {
      handleScrub(e);
    }, { passive: true });
  }

  // Card Video sync events
  function bindCardVideoEvents(videoEl, trackIdx) {
    if (!videoEl) return;
    videoEl.addEventListener('play', () => {
      if (!modal.classList.contains('is-open')) {
        videoEl.pause();
        videoEl.muted = true;
        return;
      }
      if (cinemaModal && cinemaModal.classList.contains('is-open')) {
        videoEl.pause();
        videoEl.muted = true;
        return;
      }
      if (activeIndex === trackIdx) {
        setPlayPauseState(true);
        pauseAndMuteAllVideos(trackIdx);
      } else {
        videoEl.pause();
        videoEl.muted = true;
      }
    });
    videoEl.addEventListener('pause', () => {
      if (activeIndex === trackIdx && (!cinemaModal || !cinemaModal.classList.contains('is-open'))) {
        setPlayPauseState(false);
      }
    });
    videoEl.addEventListener('timeupdate', () => {
      if (activeIndex === trackIdx && videoEl.duration) {
        trackCurrentTime = videoEl.currentTime;
        const pct = (videoEl.currentTime / videoEl.duration) * 100;
        if (progressFill) progressFill.style.width = pct.toFixed(2) + '%';
        if (npTime) {
          npTime.textContent = `${formatTime(videoEl.currentTime)} / ${formatTime(videoEl.duration)}`;
        }
        updateActiveLyricLine();
      }
    });
    videoEl.addEventListener('loadedmetadata', () => {
      if (videoEl.duration && !isNaN(videoEl.duration)) {
        if (TRACKS[trackIdx]) {
          TRACKS[trackIdx].duration = Math.round(videoEl.duration);
        }
        if (activeIndex === trackIdx) {
          updateProgressDisplay();
        }
      }
    });
    videoEl.addEventListener('ended', () => {
      if (activeIndex === trackIdx) {
        videoEl.currentTime = 0;
        videoEl.play().catch(() => { });
      }
    });
  }

  bindCardVideoEvents(cardVideo, 0);
  bindCardVideoEvents(cardVideo1, 1);
  bindCardVideoEvents(cardVideo2, 2);
  bindCardVideoEvents(cardVideo3, 3);
  bindCardVideoEvents(cardVideo4, 4);
  bindCardVideoEvents(cardVideo5, 5);

  // Left Controls: Prev, Next, Play/Pause
  btnPrev?.addEventListener('click', (e) => {
    e.stopPropagation();
    setActiveTrack(activeIndex - 1, isPlaying);
  });
  btnNext?.addEventListener('click', (e) => {
    e.stopPropagation();
    setActiveTrack(activeIndex + 1, isPlaying);
  });
  stagePrev?.addEventListener('click', (e) => {
    e.stopPropagation();
    setActiveTrack(activeIndex - 1, isPlaying);
  });
  stageNext?.addEventListener('click', (e) => {
    e.stopPropagation();
    setActiveTrack(activeIndex + 1, isPlaying);
  });
  btnPlayPause?.addEventListener('click', (e) => {
    e.stopPropagation();
    togglePlayPause();
  });

  // Center Capsule click -> open cinema mode or play
  if (nowPlayingPill) {
    nowPlayingPill.addEventListener('click', (e) => {
      if (e.target.closest('#cf-progress-container') || e.target.closest('.cf-np-icons')) {
        return;
      }
      if (activeIndex >= 0 && activeIndex <= 5) {
        openCinemaFullscreen(e, activeIndex);
      } else {
        togglePlayPause();
      }
    });
  }

  // Popover: AirPlay Audio Output Picker
  if (btnCast && castWrapper) {
    btnCast.addEventListener('click', (e) => {
      e.stopPropagation();
      optionsWrapper?.classList.remove('active');
      volumeWrapper?.classList.remove('active');
      castWrapper.classList.toggle('active');
    });

    deviceItems.forEach((item) => {
      item.addEventListener('click', (e) => {
        e.stopPropagation();
        const devName = item.dataset.device || item.textContent.trim();
        deviceItems.forEach((d) => {
          d.classList.remove('active');
          const chk = d.querySelector('.cf-device-check');
          if (chk) chk.style.display = 'none';
        });
        item.classList.add('active');
        const chk = item.querySelector('.cf-device-check');
        if (chk) chk.style.display = 'inline';

        castWrapper.classList.remove('active');
        showToast(`Connected to ${devName}`);
      });
    });
  }

  // Popover: More Options Menu
  if (btnOptions && optionsWrapper) {
    btnOptions.addEventListener('click', (e) => {
      e.stopPropagation();
      castWrapper?.classList.remove('active');
      volumeWrapper?.classList.remove('active');
      optionsWrapper.classList.toggle('active');
    });

    optFullscreen?.addEventListener('click', (e) => {
      e.stopPropagation();
      optionsWrapper.classList.remove('active');
      openCinemaFullscreen(e);
    });

    optInstagram?.addEventListener('click', () => {
      optionsWrapper?.classList.remove('active');
    });

    optCopyLink?.addEventListener('click', (e) => {
      e.stopPropagation();
      optionsWrapper.classList.remove('active');
      const reelUrls = [
        'https://www.instagram.com/p/DbAzIYOgxk1/',
        'https://youtu.be/p5KWZRhKLwc?si=JC9BU42PuxK-nKpX',
        'https://pin.it/5dcwJ5OlX',
        'https://pin.it/1C06vmkDf',
        'https://pin.it/dJzhBvwgV',
        'https://pin.it/5vjcKNgol'
      ];
      const reelUrl = reelUrls[activeIndex] || reelUrls[0];
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(reelUrl).then(() => {
          showToast('Reel link copied to clipboard!');
        }).catch(() => {
          showToast(`Link: ${reelUrl}`);
        });
      } else {
        showToast(`Link: ${reelUrl}`);
      }
    });

    let isFavorite = false;
    optFavorite?.addEventListener('click', (e) => {
      e.stopPropagation();
      isFavorite = !isFavorite;
      if (isFavorite) {
        optFavorite.classList.add('is-loved');
        showToast('Added to Favorite Tracks ❤️');
      } else {
        optFavorite.classList.remove('is-loved');
        showToast('Removed from Favorites');
      }
    });
  }

  // Right Controls: Lyrics & Queue drawers
  function closeAllDrawers() {
    lyricsDrawer?.classList.remove('is-active');
    queueDrawer?.classList.remove('is-active');
    btnLyrics?.classList.remove('active');
    btnQueue?.classList.remove('active');
  }

  btnLyrics?.addEventListener('click', (e) => {
    e.stopPropagation();
    const willOpen = !lyricsDrawer?.classList.contains('is-active');
    closeAllDrawers();
    if (willOpen) {
      lyricsDrawer?.classList.add('is-active');
      btnLyrics?.classList.add('active');
    }
  });

  lyricsClose?.addEventListener('click', (e) => {
    e.stopPropagation();
    lyricsDrawer?.classList.remove('is-active');
    btnLyrics?.classList.remove('active');
  });

  btnQueue?.addEventListener('click', (e) => {
    e.stopPropagation();
    const willOpen = !queueDrawer?.classList.contains('is-active');
    closeAllDrawers();
    if (willOpen) {
      queueDrawer?.classList.add('is-active');
      btnQueue?.classList.add('active');
    }
  });

  queueClose?.addEventListener('click', (e) => {
    e.stopPropagation();
    queueDrawer?.classList.remove('is-active');
    btnQueue?.classList.remove('active');
  });

  // Volume slider & button
  if (volumeSlider) {
    const onVolumeChange = (e) => {
      const val = parseFloat(e.target.value) / 100;
      applyVolume(val, val === 0);
    };
    volumeSlider.addEventListener('input', onVolumeChange);
    volumeSlider.addEventListener('change', onVolumeChange);

    const startDrag = () => {
      volumeWrapper?.classList.add('is-dragging', 'active');
    };
    const endDrag = () => {
      volumeWrapper?.classList.remove('is-dragging');
    };
    volumeSlider.addEventListener('mousedown', startDrag);
    volumeSlider.addEventListener('touchstart', startDrag, { passive: true });
    window.addEventListener('mouseup', endDrag);
    window.addEventListener('touchend', endDrag);
  }

  if (btnVolume) {
    btnVolume.addEventListener('click', (e) => {
      e.stopPropagation();
      optionsWrapper?.classList.remove('active');
      castWrapper?.classList.remove('active');
      const isCurrentlyActive = volumeWrapper?.classList.contains('active');
      if (!isCurrentlyActive) {
        volumeWrapper?.classList.add('active');
      } else {
        isMuted = !isMuted;
        applyVolume(currentVolume || 0.8, isMuted);
        showToast(isMuted ? 'Muted' : `Volume ${Math.round((currentVolume || 0.8) * 100)}%`);
      }
    });

    btnVolume.addEventListener('dblclick', (e) => {
      e.stopPropagation();
      isMuted = !isMuted;
      applyVolume(currentVolume || 0.8, isMuted);
      showToast(isMuted ? 'Muted' : `Volume ${Math.round((currentVolume || 0.8) * 100)}%`);
    });
  }

  if (volumeWrapper) {
    volumeWrapper.addEventListener('wheel', (e) => {
      e.preventDefault();
      const delta = e.deltaY < 0 ? 0.05 : -0.05;
      const nextVol = Math.max(0, Math.min(1, (isMuted ? 0 : currentVolume) + delta));
      applyVolume(nextVol, nextVol === 0);
      showToast(`Volume ${Math.round(nextVol * 100)}%`);
    }, { passive: false });
  }

  // Close popovers on click outside
  document.addEventListener('click', (e) => {
    if (!e.target.closest('#cf-cast-wrapper')) {
      castWrapper?.classList.remove('active');
    }
    if (!e.target.closest('#cf-options-wrapper')) {
      optionsWrapper?.classList.remove('active');
    }
    if (!e.target.closest('#cf-volume-wrapper')) {
      volumeWrapper?.classList.remove('active');
    }
  });

  // Click on cards to bring them to center or trigger card action
  cards.forEach((card, idx) => {
    card.addEventListener('click', (e) => {
      if (idx >= 0 && idx <= 5) {
        if (activeIndex === idx) {
          openCinemaFullscreen(e, idx);
        } else {
          setActiveTrack(idx, isPlaying);
        }
      } else if (idx !== activeIndex) {
        setActiveTrack(idx, isPlaying);
      } else {
        togglePlayPause();
      }
    });

    card.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        if (idx >= 0 && idx <= 5) {
          if (activeIndex === idx) {
            openCinemaFullscreen(e, idx);
          } else {
            setActiveTrack(idx, isPlaying);
          }
        } else if (idx !== activeIndex) {
          setActiveTrack(idx, isPlaying);
        } else {
          togglePlayPause();
        }
      }
    });
  });

  // Swipe / Drag on Cover Flow Stage
  let touchStartX = 0;
  let touchEndX = 0;
  const stage = document.getElementById('coverflow-stage');
  if (stage) {
    stage.addEventListener('touchstart', (e) => {
      touchStartX = e.changedTouches[0].screenX;
    }, { passive: true });

    stage.addEventListener('touchend', (e) => {
      touchEndX = e.changedTouches[0].screenX;
      handleSwipe();
    }, { passive: true });

    let isMouseDown = false;
    stage.addEventListener('mousedown', (e) => {
      isMouseDown = true;
      touchStartX = e.clientX;
    });

    stage.addEventListener('mouseup', (e) => {
      if (!isMouseDown) return;
      isMouseDown = false;
      touchEndX = e.clientX;
      handleSwipe();
    });

    stage.addEventListener('mouseleave', () => {
      isMouseDown = false;
    });

    function handleSwipe() {
      const diff = touchEndX - touchStartX;
      if (Math.abs(diff) > 40) {
        if (diff > 0) {
          setActiveTrack(activeIndex - 1, isPlaying);
        } else {
          setActiveTrack(activeIndex + 1, isPlaying);
        }
      }
    }
  }

  // Card 0 Sound toggle button
  function toggleCardVideoSound(e) {
    if (e) e.stopPropagation();
    isMuted = !isMuted;
    applyVolume(currentVolume, isMuted);
    showToast(isMuted ? 'Muted' : `Volume ${Math.round(currentVolume * 100)}%`);
  }

  btnCardSound?.addEventListener('click', toggleCardVideoSound);

  // Cinema sound toggle
  function toggleCinemaSound(e) {
    if (e) e.stopPropagation();
    isMuted = !isMuted;
    applyVolume(currentVolume, isMuted);
    showToast(isMuted ? 'Cinema Audio: Muted' : 'Cinema Audio: On');
  }

  cinemaSoundToggle?.addEventListener('click', toggleCinemaSound);

  function flashPlayOverlay(isPaused) {
    if (!cinemaPlayOverlay) return;
    const iconPlay = cinemaPlayOverlay.querySelector('.cinema-overlay-play');
    const iconPause = cinemaPlayOverlay.querySelector('.cinema-overlay-pause');
    if (isPaused) {
      iconPlay?.style.setProperty('display', 'block');
      iconPause?.style.setProperty('display', 'none');
    } else {
      iconPlay?.style.setProperty('display', 'none');
      iconPause?.style.setProperty('display', 'block');
    }
    cinemaPlayOverlay.classList.add('show-flash');
    setTimeout(() => {
      cinemaPlayOverlay.classList.remove('show-flash');
    }, 400);
  }

  function toggleCinemaPlayPause() {
    if (!cinemaVideo) return;
    if (cinemaVideo.paused) {
      cinemaVideo.play().catch(() => { });
      flashPlayOverlay(false);
    } else {
      cinemaVideo.pause();
      flashPlayOverlay(true);
    }
  }

  cinemaVideoBox?.addEventListener('click', (e) => {
    // Prevent timeline clicks from triggering play/pause
    if (e.target.closest('#cf-cinema-timeline')) return;
    toggleCinemaPlayPause();
  });

  // Cinema timeline scrub
  cinemaVideo?.addEventListener('timeupdate', () => {
    if (!cinemaVideo || !cinemaProgress) return;
    if (cinemaVideo.duration) {
      const pct = (cinemaVideo.currentTime / cinemaVideo.duration) * 100;
      cinemaProgress.style.width = `${pct}%`;
    }
  });

  cinemaTimeline?.addEventListener('click', (e) => {
    e.stopPropagation();
    if (!cinemaVideo || !cinemaTimeline) return;
    const rect = cinemaTimeline.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const ratio = Math.max(0, Math.min(1, clickX / rect.width));
    if (cinemaVideo.duration) {
      cinemaVideo.currentTime = ratio * cinemaVideo.duration;
    }
  });

  // Toggle native browser monitor fullscreen
  function toggleNativeFullscreen() {
    const isFs = document.fullscreenElement || document.webkitFullscreenElement;
    if (isFs) {
      if (document.exitFullscreen) {
        document.exitFullscreen().catch(() => { });
      } else if (document.webkitExitFullscreen) {
        document.webkitExitFullscreen().catch(() => { });
      }
    } else {
      const target = cinemaModal || document.documentElement;
      const requestFs = target.requestFullscreen ||
        target.webkitRequestFullscreen ||
        target.webkitEnterFullscreen ||
        target.msRequestFullscreen;
      if (requestFs) {
        try {
          const p = requestFs.call(target);
          if (p && typeof p.catch === 'function') p.catch(() => { });
        } catch (err) { }
      }
    }
  }

  cinemaFsToggle?.addEventListener('click', (e) => {
    e.stopPropagation();
    toggleNativeFullscreen();
  });

  function updateFsIcon() {
    const isFs = !!(document.fullscreenElement || document.webkitFullscreenElement);
    const iconExp = cinemaFsToggle?.querySelector('.cinema-icon-expand');
    const iconComp = cinemaFsToggle?.querySelector('.cinema-icon-compress');
    if (isFs) {
      iconExp?.style.setProperty('display', 'none');
      iconComp?.style.setProperty('display', 'block');
    } else {
      iconExp?.style.setProperty('display', 'block');
      iconComp?.style.setProperty('display', 'none');
    }
  }

  document.addEventListener('fullscreenchange', updateFsIcon);
  document.addEventListener('webkitfullscreenchange', updateFsIcon);

  let cinemaCurrentVideoIdx = 0;

  function openCinemaFullscreen(e, targetIdx) {
    if (e) {
      e.stopPropagation();
      e.preventDefault();
    }

    const cModal = document.getElementById('cf-cinema-modal');
    const cVideo = document.getElementById('cf-cinema-video');
    const cBadgeText = document.getElementById('cf-cinema-badge-text');
    const cCaptionTitle = document.getElementById('cf-cinema-caption-title');
    const cCaptionDesc = document.getElementById('cf-cinema-caption-desc');

    if (!cModal || !cVideo) return;

    cinemaCurrentVideoIdx = (typeof targetIdx === 'number') ? targetIdx : (activeIndex >= 0 && activeIndex <= 5 ? activeIndex : 0);
    const origVideo = getCardVideo(cinemaCurrentVideoIdx);

    // CRITICAL: Immediately pause and mute the origin card video before starting cinema playback!
    // This stops TWO audios from playing simultaneously!
    if (origVideo) {
      origVideo.pause();
      origVideo.muted = true;
    }
    pauseAndMuteAllVideos('cinema');

    // Set correct video source and descriptions
    if (cinemaCurrentVideoIdx === 5) {
      if (!cVideo.src.includes('creative_design.mp4')) {
        cVideo.src = 'images/music-player/creative_design.mp4';
      }
      if (cBadgeText) cBadgeText.textContent = 'Brand Motion Showcase';
      if (cCaptionTitle) cCaptionTitle.textContent = 'Brand Motion & Visual Identity';
      if (cCaptionDesc) cCaptionDesc.textContent = 'Kinetic Branding & Fintech Motion Reel • Tap video to Play/Pause • Press ESC to exit';
    } else if (cinemaCurrentVideoIdx === 4) {
      if (!cVideo.src.includes('apple_motion.mp4')) {
        cVideo.src = 'images/music-player/apple_motion.mp4';
      }
      if (cBadgeText) cBadgeText.textContent = 'Apple Motion Graphics Showcase';
      if (cCaptionTitle) cCaptionTitle.textContent = 'Motion Graphics - Apple';
      if (cCaptionDesc) cCaptionDesc.textContent = 'Kinetic Typography & Minimal Motion • Tap video to Play/Pause • Press ESC to exit';
    } else if (cinemaCurrentVideoIdx === 3) {
      if (!cVideo.src.includes('motion_inspiration.mp4')) {
        cVideo.src = 'images/music-player/motion_inspiration.mp4';
      }
      if (cBadgeText) cBadgeText.textContent = 'Motion Inspiration Showcase';
      if (cCaptionTitle) cCaptionTitle.textContent = 'High-Energy 3D Motion Inspiration';
      if (cCaptionDesc) cCaptionDesc.textContent = 'Kinetic Physics & 3D Shaders Reel • Tap video to Play/Pause • Press ESC to exit';
    } else if (cinemaCurrentVideoIdx === 2) {
      if (!cVideo.src.includes('saas_explainer.mp4')) {
        cVideo.src = 'images/music-player/saas_explainer.mp4';
      }
      if (cBadgeText) cBadgeText.textContent = 'SaaS Explainer Showcase';
      if (cCaptionTitle) cCaptionTitle.textContent = 'SaaS Explainer Video & Product Motion';
      if (cCaptionDesc) cCaptionDesc.textContent = 'Fluid SaaS Product Animations • Tap video to Play/Pause • Press ESC to exit';
    } else if (cinemaCurrentVideoIdx === 1) {
      if (!cVideo.src.includes('agentic_ai.mp4')) {
        cVideo.src = 'images/music-player/agentic_ai.mp4';
      }
      if (cBadgeText) cBadgeText.textContent = 'Agentic AI Engineer Roadmap (2026)';
      if (cCaptionTitle) cCaptionTitle.textContent = 'How to Become an Agentic AI Engineer in 2026?';
      if (cCaptionDesc) cCaptionDesc.textContent = 'Complete Roadmap by Unskilled Engineer • Tap video to Play/Pause • Press ESC to exit';
    } else {
      if (!cVideo.src.includes('motion_reel.mp4')) {
        cVideo.src = 'images/music-player/motion_reel.mp4';
      }
      if (cBadgeText) cBadgeText.textContent = 'Motion Graphics Showcase';
      if (cCaptionTitle) cCaptionTitle.textContent = 'Motion Graphics & Visual Design';
      if (cCaptionDesc) cCaptionDesc.textContent = 'High Definition 60fps Motion Reel • Tap video to Play/Pause • Press ESC to exit';
    }

    // Sync playback position
    if (origVideo && !isNaN(origVideo.currentTime) && origVideo.currentTime > 0) {
      cVideo.currentTime = origVideo.currentTime;
    }

    // Set cinema video volume
    cVideo.muted = isMuted;
    cVideo.volume = currentVolume;
    updateCinemaSoundUI(!isMuted);

    // Open Cinema Fullscreen Lightbox
    cModal.classList.add('is-open');
    cModal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';

    // Push cinema history state for browser back button support
    if (window.location.hash !== '#cinema') {
      if (window.history && window.history.pushState) {
        window.history.pushState({ modal: 'cinema' }, '', '#cinema');
      }
    }

    // Play video
    const playPromise = cVideo.play();
    if (playPromise !== undefined) {
      playPromise.then(() => {
        setPlayPauseState(true);
      }).catch(() => {
        // Fallback to muted playback if browser restricts unmuted autoplay
        cVideo.muted = true;
        updateCinemaSoundUI(false);
        cVideo.play().then(() => setPlayPauseState(true)).catch(() => { });
      });
    }

    // Request native browser fullscreen on modal container
    const requestFs = cModal.requestFullscreen ||
      cModal.webkitRequestFullscreen ||
      cModal.webkitEnterFullscreen ||
      cModal.msRequestFullscreen;

    if (requestFs) {
      try {
        const fsPromise = requestFs.call(cModal);
        if (fsPromise && typeof fsPromise.catch === 'function') {
          fsPromise.catch(() => { });
        }
      } catch (err) { }
    }
  }

  function closeCinemaFullscreen(fromHistory = false) {
    const cModal = document.getElementById('cf-cinema-modal');
    const cVideo = document.getElementById('cf-cinema-video');
    const origVideo = getCardVideo(cinemaCurrentVideoIdx);

    if (!cModal || !cVideo || !cModal.classList.contains('is-open')) return;

    const wasCinemaPlaying = !cVideo.paused;
    const isPlayerOpen = modal && modal.classList.contains('is-open');

    // Immediately pause and mute cinema video
    cVideo.pause();
    cVideo.muted = true;

    cModal.classList.remove('is-open');
    cModal.setAttribute('aria-hidden', 'true');

    if (isPlayerOpen && wasCinemaPlaying && origVideo && !isNaN(cVideo.currentTime)) {
      origVideo.currentTime = cVideo.currentTime;
      origVideo.volume = currentVolume;
      origVideo.muted = isMuted;
      origVideo.play().then(() => {
        setPlayPauseState(true);
      }).catch(() => { });
    } else {
      if (origVideo) {
        origVideo.pause();
        origVideo.muted = true;
      }
      setPlayPauseState(false);
    }

    if (document.fullscreenElement || document.webkitFullscreenElement) {
      if (document.exitFullscreen) {
        document.exitFullscreen().catch(() => { });
      } else if (document.webkitExitFullscreen) {
        document.webkitExitFullscreen().catch(() => { });
      }
    }

    // Synchronize browser history if not triggered by popstate
    if (!fromHistory) {
      if (window.history && window.history.state && window.history.state.modal === 'cinema') {
        window.history.back();
      } else if (window.location.hash === '#cinema') {
        if (window.history && window.history.replaceState) {
          window.history.replaceState({ modal: 'coverflow-player' }, '', '#player');
        }
      }
    }
  }

  cinemaClose?.addEventListener('click', closeCinemaFullscreen);
  cinemaBackdrop?.addEventListener('click', closeCinemaFullscreen);

  // Card Fullscreen buttons, sound toggles & video click handlers (Cards 0 to 5)
  for (let idx = 0; idx <= 5; idx++) {
    const fsBtn = idx === 0 ? btnCardFs : document.getElementById(`cf-card-fs-btn-${idx}`);
    const soundBtn = idx === 0 ? btnCardSound : document.getElementById(`cf-card-sound-btn-${idx}`);
    const rWrap = idx === 0 ? reelWrap : document.getElementById(`cf-reel-wrap-${idx}`);
    const cVid = getCardVideo(idx);

    fsBtn?.addEventListener('click', (e) => {
      e.stopPropagation();
      setActiveTrack(idx, false);
      openCinemaFullscreen(e, idx);
    });

    soundBtn?.addEventListener('click', toggleCardVideoSound);

    rWrap?.addEventListener('click', (e) => {
      e.stopPropagation();
      if (activeIndex === idx) {
        openCinemaFullscreen(e, idx);
      } else {
        setActiveTrack(idx, isPlaying);
      }
    });

    cVid?.addEventListener('click', (e) => {
      e.stopPropagation();
      if (activeIndex === idx) {
        openCinemaFullscreen(e, idx);
      } else {
        setActiveTrack(idx, isPlaying);
      }
    });
  }

  // Modal Open & Close logic
  function openModal(pushHistory = true) {
    if (window.closeHeadTalkingModal) window.closeHeadTalkingModal(true);
    if (window.stopHeadTalkingMedia) window.stopHeadTalkingMedia(-1);
    if (window.closePhonkModal) window.closePhonkModal(true);
    if (window.stopPhonkMedia) window.stopPhonkMedia(-1);
    if (window.closeRealEstateModal) window.closeRealEstateModal(true);
    if (window.stopRealEstateMedia) window.stopRealEstateMedia(-1);
    if (window.closeCinematicModal) window.closeCinematicModal(true);
    if (window.stopCinematicMedia) window.stopCinematicMedia(-1);
    modal.classList.add('is-open');
    modal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';

    // Push browser history state for Chrome back button support
    if (pushHistory && window.location.hash !== '#player') {
      if (window.history && window.history.pushState) {
        window.history.pushState({ modal: 'coverflow-player' }, '', '#player');
      }
    }

    // Do NOT autoplay videos when opening cards section - keep all videos paused and muted
    pauseAndMuteAllVideos(-1);
    setPlayPauseState(false);

    // Set Card 0 as default active (paused)
    setActiveTrack(0, false);

    // Build items
    buildQueue();
    populateLyrics();
    updateCarousel(true);

    // Subtle entrance animation refresh
    setTimeout(() => {
      updateCarousel();
    }, 50);
  }

  function closeModal(fromHistory = false) {
    if (!modal.classList.contains('is-open')) return;

    closeCinemaFullscreen(fromHistory);

    modal.classList.remove('is-open');
    modal.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';

    // Strictly pause and mute all videos and audio
    pauseAndMuteAllVideos(-1);
    setPlayPauseState(false);

    closeAllDrawers();
    castWrapper?.classList.remove('active');
    optionsWrapper?.classList.remove('active');
    volumeWrapper?.classList.remove('active');

    // Synchronize browser history if not triggered by popstate
    if (!fromHistory) {
      if (window.history && window.history.state && (window.history.state.modal === 'coverflow-player' || window.history.state.modal === 'cinema')) {
        window.history.back();
      } else if (window.location.hash === '#player' || window.location.hash === '#cinema') {
        if (window.history && window.history.replaceState) {
          window.history.replaceState(null, '', window.location.pathname + window.location.search);
        }
      }
    }
  }

  window.stopMotionGraphicsMedia = pauseAndMuteAllVideos;
  window.closeMotionGraphicsModal = closeModal;

  cardTrigger.addEventListener('click', (e) => {
    e.preventDefault();
    openModal();
  });

  cardTrigger.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      openModal();
    }
  });

  btnClose?.addEventListener('click', () => closeModal(false));
  backdrop?.addEventListener('click', () => closeModal(false));

  // Chrome Back Button / History API popstate handling
  window.addEventListener('popstate', (e) => {
    const isCinemaOpen = cinemaModal && cinemaModal.classList.contains('is-open');
    const isPlayerOpen = modal && modal.classList.contains('is-open');

    if (isCinemaOpen) {
      closeCinemaFullscreen(true);
      // If user navigated all the way back before player modal, return to home page
      if (!e.state || e.state.modal !== 'coverflow-player') {
        closeModal(true);
      }
    } else if (isPlayerOpen) {
      // Returning cleanly to home page
      closeModal(true);
    }
  });

  // Direct deep link check
  if (window.location.hash === '#player' || window.location.hash === '#music-player') {
    openModal(false);
  }

  // Global Keyboard shortcuts when modal is active
  window.addEventListener('keydown', (e) => {
    if (!modal.classList.contains('is-open')) return;

    if (cinemaModal && cinemaModal.classList.contains('is-open')) {
      if (e.key === 'Escape') {
        closeCinemaFullscreen();
      } else if (e.key === ' ' || e.code === 'Space') {
        e.preventDefault();
        toggleCinemaPlayPause();
      } else if (e.key === 'm' || e.key === 'M') {
        e.preventDefault();
        toggleCinemaSound();
      } else if (e.key === 'f' || e.key === 'F') {
        e.preventDefault();
        toggleNativeFullscreen();
      }
      return;
    }

    if (e.key === 'Escape') {
      closeModal();
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault();
      setActiveTrack(activeIndex - 1, isPlaying);
    } else if (e.key === 'ArrowRight') {
      e.preventDefault();
      setActiveTrack(activeIndex + 1, isPlaying);
    } else if (e.key === ' ') {
      // Toggle play/pause only if not focused on input
      if (document.activeElement.tagName !== 'INPUT') {
        e.preventDefault();
        togglePlayPause();
      }
    }
  });

  // Window resize handler for responsive 3D cover flow recalculations
  window.addEventListener('resize', () => {
    if (modal.classList.contains('is-open')) {
      updateCarousel();
    }
  });
}

// ============================================================================
// 5.2. MODAL 2: TALKING HEAD & RETENTION SHOWCASE (#ht-coverflow-modal)
// Grid Trigger: #card-head-talking (Card 2) | ID Prefix: "ht-"
// HOW TO EDIT TRACKS: Locate the `TRACKS` array below to modify titles,
// artwork, links, audio durations, or lyrics.
// ============================================================================
function setupHeadTalkingPlayer() {
  const modal = document.getElementById('ht-coverflow-modal');
  const cardTrigger = document.getElementById('card-head-talking');
  const btnClose = document.getElementById('ht-coverflow-btn-close');
  const backdrop = document.getElementById('ht-coverflow-backdrop');
  const deck = document.getElementById('ht-coverflow-deck');
  const cards = deck ? Array.from(deck.querySelectorAll('.cf-card')) : [];
  const btnPrev = document.getElementById('ht-btn-prev');
  const btnNext = document.getElementById('ht-btn-next');
  const stagePrev = document.getElementById('ht-coverflow-prev');
  const stageNext = document.getElementById('ht-coverflow-next');
  const btnPlayPause = document.getElementById('ht-btn-playpause');
  const iconPlay = btnPlayPause?.querySelector('.icon-play');
  const iconPause = btnPlayPause?.querySelector('.icon-pause');
  const ambientGlow = document.getElementById('ht-coverflow-ambient-glow');

  // Center Capsule elements
  const nowPlayingPill = document.getElementById('ht-now-playing-pill');
  const npThumb = document.getElementById('ht-np-thumb');
  const npTitle = document.getElementById('ht-np-title');
  const npArtist = document.getElementById('ht-np-artist');
  const npTime = document.getElementById('ht-np-time');
  const progressFill = document.getElementById('ht-progress-fill');
  const progressContainer = document.getElementById('ht-progress-container');
  const playerPill = document.getElementById('ht-player-pill');

  // Popover elements
  const castWrapper = document.getElementById('ht-cast-wrapper');
  const btnCast = document.getElementById('ht-btn-cast');
  const castPopover = document.getElementById('ht-cast-popover');
  const deviceItems = castPopover ? Array.from(castPopover.querySelectorAll('.cf-device-item')) : [];

  const optionsWrapper = document.getElementById('ht-options-wrapper');
  const btnOptions = document.getElementById('ht-btn-options');
  const optFullscreen = document.getElementById('ht-opt-fullscreen');
  const optLink = document.getElementById('ht-opt-link');
  const optCopyLink = document.getElementById('ht-opt-copylink');
  const optFavorite = document.getElementById('ht-opt-favorite');
  const toast = document.getElementById('ht-toast');

  // Drawers
  const btnLyrics = document.getElementById('ht-btn-lyrics');
  const lyricsDrawer = document.getElementById('ht-lyrics-drawer');
  const lyricsClose = document.getElementById('ht-lyrics-close');
  const lyricsBody = document.getElementById('ht-lyrics-body');
  const lyricsTrackTitle = document.getElementById('ht-lyrics-track-title');

  const btnQueue = document.getElementById('ht-btn-queue');
  const queueDrawer = document.getElementById('ht-queue-drawer');
  const queueClose = document.getElementById('ht-queue-close');
  const queueList = document.getElementById('ht-queue-list');

  // Volume
  const volumeWrapper = document.getElementById('ht-volume-wrapper');
  const btnVolume = document.getElementById('ht-btn-volume');
  const volumeSlider = document.getElementById('ht-volume-slider');

  // Card Videos
  const cardVideos = [];
  for (let i = 0; i <= 5; i++) {
    cardVideos.push(document.getElementById(`ht-card-video-${i}`));
  }

  // Shared Cinema Modal elements
  const cinemaModal = document.getElementById('cf-cinema-modal');
  const cinemaVideoBox = document.getElementById('cf-cinema-video-box');
  const cinemaVideo = document.getElementById('cf-cinema-video');
  const cinemaClose = document.getElementById('cf-cinema-close');
  const cinemaBackdrop = document.getElementById('cf-cinema-backdrop');
  const cinemaSoundToggle = document.getElementById('cf-cinema-sound-toggle');
  const cinemaFsToggle = document.getElementById('cf-cinema-fs-toggle');
  const cinemaPlayOverlay = document.getElementById('cf-cinema-play-overlay');
  const cinemaTimeline = document.getElementById('cf-cinema-timeline');
  const cinemaProgress = document.getElementById('cf-cinema-progress');
  const cinemaBadgeText = document.getElementById('cf-cinema-badge-text');
  const cinemaCaptionTitle = document.getElementById('cf-cinema-caption-title');
  const cinemaCaptionDesc = document.getElementById('cf-cinema-caption-desc');

  if (!modal || !cardTrigger) return;

  // Player State
  let activeIndex = 0;
  let isPlaying = false;
  let trackCurrentTime = 0;
  let progressTimer = null;
  let currentVolume = 0.8;
  let isMuted = false;
  let isCinemaFromHT = false;

  function getCardVideo(idx) {
    return cardVideos[idx] || null;
  }

  function stopProgressTimer() {
    if (progressTimer) {
      clearInterval(progressTimer);
      progressTimer = null;
    }
  }

  function pauseAndMuteAllVideos(exceptTarget = -1) {
    for (let i = 0; i <= 5; i++) {
      if (i !== exceptTarget) {
        const v = getCardVideo(i);
        if (v) {
          v.pause();
          v.muted = true;
        }
      }
    }
    if (cinemaVideo && exceptTarget !== 'cinema') {
      cinemaVideo.pause();
      cinemaVideo.muted = true;
    }
    stopProgressTimer();
  }

  // Initial pause and mute
  pauseAndMuteAllVideos(-1);

  // Tracks Data for Head Talking & Sound Design
  const TRACKS = [
    {
      id: 0,
      title: 'Head Talking - Viral Editing',
      artist: 'Head Talking & Sound Design',
      album: 'High Ticket Master',
      image: 'images/projects/headphones.jpg',
      url: 'https://drive.google.com/file/d/1cmTEtLehzMrXkulp7460IwJp8meuBKDL/view?usp=drive_link',
      duration: 38,
      accent: 'rgba(242, 100, 64, 0.55)',
      lyrics: [
        { time: 0, text: 'Head Talking — New Viral Editing Style' },
        { time: 5, text: 'High Ticket Sales & Hook Optimization' },
        { time: 14, text: 'Dynamic typography, jump cuts & sound design' },
        { time: 24, text: 'B-roll pacing, sound FX & audio master' },
        { time: 34, text: 'Full HD video playback with crystal audio' }
      ]
    },
    {
      id: 1,
      title: 'BMI vs BMR - Fitness Reel',
      artist: 'fitaura.gains',
      album: 'Instagram Reel',
      image: 'images/music-player/fitaura_reel.jpg',
      url: 'https://www.instagram.com/p/DcQt_-UqZSF/',
      duration: 23,
      accent: 'rgba(225, 48, 108, 0.55)',
      lyrics: [
        { time: 0, text: 'Stop getting confused between BMI & BMR! 🛑💡' },
        { time: 4, text: 'BMI = Height vs Weight ratio' },
        { time: 9, text: 'BMR = Daily resting calorie burn' },
        { time: 15, text: 'Fitness journey lo BMR knowledge primary step! 🏋️' },
        { time: 20, text: 'Watch full reel on Instagram (@fitaura.gains)' }
      ]
    },
    {
      id: 2,
      title: 'Modern Talking Head',
      artist: 'Motion Pet',
      album: 'Pinterest Reel',
      image: 'images/music-player/modern_talking_head.jpg',
      url: 'https://pin.it/52zJUa5uT',
      duration: 17,
      accent: 'rgba(230, 0, 35, 0.55)',
      lyrics: [
        { time: 0, text: 'Modern Talking Head — Real Estate Subtitles' },
        { time: 4, text: 'Dynamic typography & smooth transitions' },
        { time: 8, text: 'Clean kinetic sound FX & seamless pacing' },
        { time: 13, text: 'Watch original pin on Pinterest (@nanproperties)' }
      ]
    },
    {
      id: 3,
      title: 'Video Editing Before vs After',
      artist: 'Revuteck',
      album: 'Pinterest Reel',
      image: 'images/music-player/before_after_edit.jpg',
      url: 'https://pin.it/5ut4l3scS',
      duration: 30,
      accent: 'rgba(230, 0, 35, 0.55)',
      lyrics: [
        { time: 0, text: 'Video Editing Before vs After — Ultimate Transformation' },
        { time: 7, text: 'Turning raw footage into cinematic content' },
        { time: 16, text: 'Dynamic color grading, smooth transitions & visual effects' },
        { time: 24, text: 'Watch full inspiration clip on Pinterest (@revuteck)' }
      ]
    },
    {
      id: 4,
      title: 'Short Form Editing Inspiration',
      artist: 'Creative Kings Studio',
      album: 'Pinterest Reel',
      image: 'images/music-player/short_form_edit.jpg',
      url: 'https://pin.it/2K1JXegI6',
      duration: 37,
      accent: 'rgba(242, 100, 64, 0.55)',
      lyrics: [
        { time: 0, text: 'Short Form Editing Inspiration for Creators 🎬✨' },
        { time: 8, text: 'Snappy transitions & syncing to music 🎵' },
        { time: 18, text: 'Viral-style cuts, text overlays & dynamic effects' },
        { time: 28, text: 'Watch full inspiration on Pinterest (@creativekingsstudio)' }
      ]
    },
    {
      id: 5,
      title: 'Talking Head Raw vs Edit Comparison',
      artist: 'Designinspiration',
      album: 'Pinterest Reel',
      image: 'images/music-player/raw_vs_edit.jpg',
      url: 'https://pin.it/tYf6oLQAo',
      duration: 51,
      accent: 'rgba(230, 0, 35, 0.55)',
      lyrics: [
        { time: 0, text: 'Talking Head Raw vs Edit Comparison' },
        { time: 10, text: 'Raw speaking footage vs professional motion graphics' },
        { time: 25, text: 'Custom captions, sound FX, kinetic zooms & transitions' },
        { time: 42, text: 'Watch full comparison on Pinterest (@designinspiration)' }
      ]
    }
  ];

  function formatTime(sec) {
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  }

  // 3D Cover Flow layout calculation
  function updateCarousel(instant = false) {
    const isMobile = window.innerWidth < 640;
    const isTablet = window.innerWidth < 1024;

    const xOffset1 = isMobile ? 120 : isTablet ? 170 : 210;
    const xOffset2 = isMobile ? 220 : isTablet ? 320 : 400;
    const zOffset1 = isMobile ? -60 : -80;
    const zOffset2 = isMobile ? -120 : -160;
    const rot1 = isMobile ? 20 : 26;
    const rot2 = isMobile ? 32 : 40;

    cards.forEach((card, idx) => {
      const diff = idx - activeIndex;

      if (instant) {
        card.style.transition = 'none';
      } else {
        card.style.transition = 'transform 0.6s cubic-bezier(0.25, 1, 0.5, 1), opacity 0.5s ease, filter 0.5s ease, box-shadow 0.6s ease';
      }

      if (diff === 0) {
        card.classList.add('active');
        card.style.transform = 'translate3d(0, 0, 40px) rotateY(0deg) scale(1)';
        card.style.zIndex = '10';
        card.style.opacity = '1';
        card.style.filter = 'brightness(1)';
        card.style.pointerEvents = 'auto';
      } else if (diff === -1) {
        card.classList.remove('active');
        card.style.transform = `translate3d(-${xOffset1}px, 0, ${zOffset1}px) rotateY(${rot1}deg) scale(0.85)`;
        card.style.zIndex = '7';
        card.style.opacity = '0.92';
        card.style.filter = 'brightness(0.82)';
        card.style.pointerEvents = 'auto';
      } else if (diff === -2) {
        card.classList.remove('active');
        card.style.transform = `translate3d(-${xOffset2}px, 0, ${zOffset2}px) rotateY(${rot2}deg) scale(0.72)`;
        card.style.zIndex = '4';
        card.style.opacity = '0.75';
        card.style.filter = 'brightness(0.6)';
        card.style.pointerEvents = 'auto';
      } else if (diff === 1) {
        card.classList.remove('active');
        card.style.transform = `translate3d(${xOffset1}px, 0, ${zOffset1}px) rotateY(-${rot1}deg) scale(0.85)`;
        card.style.zIndex = '7';
        card.style.opacity = '0.92';
        card.style.filter = 'brightness(0.82)';
        card.style.pointerEvents = 'auto';
      } else if (diff === 2) {
        card.classList.remove('active');
        card.style.transform = `translate3d(${xOffset2}px, 0, ${zOffset2}px) rotateY(-${rot2}deg) scale(0.72)`;
        card.style.zIndex = '4';
        card.style.opacity = '0.75';
        card.style.filter = 'brightness(0.6)';
        card.style.pointerEvents = 'auto';
      } else {
        card.classList.remove('active');
        const sign = diff > 0 ? 1 : -1;
        card.style.transform = `translate3d(${sign * (xOffset2 + 100)}px, 0, -260px) rotateY(${-sign * 50}deg) scale(0.55)`;
        card.style.zIndex = '1';
        card.style.opacity = '0';
        card.style.filter = 'brightness(0.3)';
        card.style.pointerEvents = 'none';
      }
    });

    // Update ambient mood glow
    const track = TRACKS[activeIndex];
    if (ambientGlow && track) {
      ambientGlow.style.background = `radial-gradient(circle, ${track.accent} 0%, rgba(242, 100, 64, 0.05) 55%, transparent 75%)`;
    }

    // Update Player bar UI
    if (track) {
      if (npThumb) npThumb.src = track.image;
      if (npTitle) npTitle.textContent = track.title;
      if (npArtist) npArtist.textContent = track.artist;
      if (lyricsTrackTitle) lyricsTrackTitle.textContent = `${track.artist} — ${track.title}`;
      if (optLink && track.url) {
        optLink.href = track.url;
        const optSpan = optLink.querySelector('span');
        if (optSpan) {
          if (track.url.includes('instagram.com')) optSpan.textContent = 'Open on Instagram';
          else if (track.url.includes('youtu')) optSpan.textContent = 'Open on YouTube';
          else if (track.url.includes('pin.it')) optSpan.textContent = 'Open on Pinterest';
          else if (track.url.includes('drive.google.com')) optSpan.textContent = 'Open Drive Link';
          else optSpan.textContent = 'Open Link';
        }
      }
      updateProgressDisplay();
      populateLyrics();
      updateQueueActiveItem();
    }
  }

  // Switch Active Track
  function setActiveTrack(index, restartAudio = false) {
    if (index < 0) index = TRACKS.length - 1;
    if (index >= TRACKS.length) index = 0;

    activeIndex = index;
    trackCurrentTime = 0;

    updateCarousel();
    pauseAndMuteAllVideos(activeIndex);

    const activeVid = getCardVideo(activeIndex);
    if (activeVid) {
      activeVid.currentTime = 0;
      if (isPlaying || restartAudio) {
        activeVid.volume = currentVolume;
        activeVid.muted = isMuted;
        activeVid.play().then(() => {
          setPlayPauseState(true);
        }).catch(() => {
          activeVid.muted = true;
          activeVid.play().then(() => setPlayPauseState(true)).catch(() => setPlayPauseState(false));
        });
      } else {
        activeVid.pause();
        activeVid.muted = true;
        setPlayPauseState(false);
      }
    }
  }

  function updateProgressDisplay() {
    const track = TRACKS[activeIndex];
    if (!track) return;

    if (npTime) {
      npTime.textContent = `${formatTime(trackCurrentTime)} / ${formatTime(track.duration)}`;
    }

    if (progressFill) {
      const pct = Math.min(100, Math.max(0, (trackCurrentTime / track.duration) * 100));
      progressFill.style.width = pct.toFixed(2) + '%';
    }

    updateActiveLyricLine();
  }

  function populateLyrics() {
    if (!lyricsBody) return;
    lyricsBody.innerHTML = '';
    const track = TRACKS[activeIndex];
    if (!track || !track.lyrics) return;

    track.lyrics.forEach((item) => {
      const p = document.createElement('p');
      p.className = 'cf-lyric-line';
      p.dataset.time = item.time;
      p.textContent = item.text;
      p.addEventListener('click', () => {
        const activeVid = getCardVideo(activeIndex);
        if (activeVid) {
          activeVid.currentTime = item.time;
        }
        trackCurrentTime = item.time;
        updateProgressDisplay();
      });
      lyricsBody.appendChild(p);
    });
    updateActiveLyricLine();
  }

  function updateActiveLyricLine() {
    if (!lyricsBody) return;
    const lines = lyricsBody.querySelectorAll('.cf-lyric-line');
    let currentLine = null;
    lines.forEach((l) => {
      const t = parseFloat(l.dataset.time || '0');
      if (trackCurrentTime >= t) {
        currentLine = l;
      }
    });

    lines.forEach((l) => l.classList.remove('is-active'));
    if (currentLine) {
      currentLine.classList.add('is-active');
      currentLine.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }

  function buildQueue() {
    if (!queueList) return;
    queueList.innerHTML = '';
    TRACKS.forEach((t, i) => {
      const item = document.createElement('div');
      item.className = `cf-queue-item ${i === activeIndex ? 'active' : ''}`;
      item.dataset.index = i;
      item.innerHTML = `
        <span class="cf-qi-num">${i + 1}</span>
        <img class="cf-qi-thumb" src="${t.image}" alt="${t.title}" />
        <div class="cf-qi-info">
          <span class="cf-qi-title">${t.title}</span>
          <span class="cf-qi-artist">${t.artist}</span>
        </div>
        <span class="cf-qi-duration">${formatTime(t.duration)}</span>
      `;
      item.addEventListener('click', () => {
        setActiveTrack(i, isPlaying);
        closeAllDrawers();
      });
      queueList.appendChild(item);
    });
  }

  function updateQueueActiveItem() {
    if (!queueList) return;
    const items = queueList.querySelectorAll('.cf-queue-item');
    items.forEach((it) => {
      const idx = parseInt(it.dataset.index, 10);
      if (idx === activeIndex) it.classList.add('active');
      else it.classList.remove('active');
    });
  }

  let toastTimer = null;
  function showToast(msg) {
    if (!toast) return;
    toast.textContent = msg;
    toast.classList.add('is-active');
    toast.setAttribute('aria-hidden', 'false');
    if (toastTimer) clearTimeout(toastTimer);
    toastTimer = setTimeout(() => {
      toast.classList.remove('is-active');
      toast.setAttribute('aria-hidden', 'true');
    }, 2400);
  }

  function setPlayPauseState(playing) {
    isPlaying = playing;
    if (iconPlay) iconPlay.style.display = playing ? 'none' : 'block';
    if (iconPause) iconPause.style.display = playing ? 'block' : 'none';
    if (playerPill) {
      if (playing) playerPill.classList.add('is-playing');
      else playerPill.classList.remove('is-playing');
    }
  }

  function applyVolume(vol, muted) {
    currentVolume = Math.max(0, Math.min(1, vol));
    isMuted = !!muted || currentVolume === 0;

    const isCinemaOpen = cinemaModal && cinemaModal.classList.contains('is-open');

    for (let i = 0; i <= 5; i++) {
      const v = getCardVideo(i);
      if (v) {
        if (!isCinemaOpen && i === activeIndex && isPlaying) {
          v.volume = currentVolume;
          v.muted = isMuted;
        } else {
          v.muted = true;
        }
      }
    }

    if (cinemaVideo && isCinemaFromHT) {
      cinemaVideo.volume = currentVolume;
      cinemaVideo.muted = isMuted;
    }

    // Update sound buttons UI on cards
    for (let i = 0; i <= 5; i++) {
      const btn = document.getElementById(`ht-card-sound-btn-${i}`);
      if (!btn) continue;
      const iconMuted = btn.querySelector('.icon-muted');
      const iconUnmuted = btn.querySelector('.icon-unmuted');
      if (isMuted) {
        iconMuted?.style.setProperty('display', 'block');
        iconUnmuted?.style.setProperty('display', 'none');
      } else {
        iconMuted?.style.setProperty('display', 'none');
        iconUnmuted?.style.setProperty('display', 'block');
      }
    }

    const volPct = isMuted ? 0 : Math.round(currentVolume * 100);
    if (volumeSlider) {
      volumeSlider.value = volPct;
      volumeSlider.style.setProperty('--vol-pct', volPct + '%');
    }
    const valDisplay = document.getElementById('ht-volume-val');
    if (valDisplay) {
      valDisplay.textContent = volPct + '%';
    }
    if (btnVolume) {
      const vUnmuted = btnVolume.querySelector('.vol-icon-unmuted');
      const vMuted = btnVolume.querySelector('.vol-icon-muted');
      if (isMuted) {
        vUnmuted?.style.setProperty('display', 'none');
        vMuted?.style.setProperty('display', 'block');
      } else {
        vUnmuted?.style.setProperty('display', 'block');
        vMuted?.style.setProperty('display', 'none');
      }
    }
  }

  // Play / Pause Toggle
  function togglePlayPause() {
    const activeVid = getCardVideo(activeIndex);
    if (!activeVid) return;

    pauseAndMuteAllVideos(activeIndex);

    if (activeVid.paused) {
      activeVid.volume = currentVolume;
      activeVid.muted = isMuted;
      activeVid.play().then(() => {
        setPlayPauseState(true);
      }).catch(() => {
        activeVid.muted = true;
        activeVid.play().then(() => setPlayPauseState(true)).catch(() => { });
      });
    } else {
      activeVid.pause();
      setPlayPauseState(false);
    }
  }

  // Scrubber scrubbing
  if (progressContainer) {
    function handleScrub(e) {
      const rect = progressContainer.getBoundingClientRect();
      const clientX = e.clientX !== undefined ? e.clientX : (e.touches && e.touches[0] ? e.touches[0].clientX : 0);
      const clickX = clientX - rect.left;
      const pct = Math.max(0, Math.min(1, clickX / rect.width));
      const track = TRACKS[activeIndex];
      const activeVid = getCardVideo(activeIndex);

      if (activeVid) {
        const duration = activeVid.duration || (track ? track.duration : 30);
        activeVid.currentTime = pct * duration;
        trackCurrentTime = activeVid.currentTime;
        if (progressFill) progressFill.style.width = (pct * 100).toFixed(2) + '%';
        if (npTime) npTime.textContent = `${formatTime(trackCurrentTime)} / ${formatTime(duration)}`;
      }
    }

    let isScrubbing = false;
    progressContainer.addEventListener('mousedown', (e) => {
      isScrubbing = true;
      handleScrub(e);
    });
    window.addEventListener('mousemove', (e) => {
      if (isScrubbing) handleScrub(e);
    });
    window.addEventListener('mouseup', () => {
      isScrubbing = false;
    });
    progressContainer.addEventListener('touchstart', (e) => {
      handleScrub(e);
    }, { passive: true });
    progressContainer.addEventListener('touchmove', (e) => {
      handleScrub(e);
    }, { passive: true });
  }

  // Video sync events
  cardVideos.forEach((videoEl, trackIdx) => {
    if (!videoEl) return;
    videoEl.addEventListener('play', () => {
      if (!modal.classList.contains('is-open')) {
        videoEl.pause();
        videoEl.muted = true;
        return;
      }
      if (cinemaModal && cinemaModal.classList.contains('is-open')) {
        videoEl.pause();
        videoEl.muted = true;
        return;
      }
      if (activeIndex === trackIdx) {
        setPlayPauseState(true);
        pauseAndMuteAllVideos(trackIdx);
      } else {
        videoEl.pause();
        videoEl.muted = true;
      }
    });

    videoEl.addEventListener('pause', () => {
      if (activeIndex === trackIdx && (!cinemaModal || !cinemaModal.classList.contains('is-open'))) {
        setPlayPauseState(false);
      }
    });

    videoEl.addEventListener('timeupdate', () => {
      if (activeIndex === trackIdx && videoEl.duration) {
        trackCurrentTime = videoEl.currentTime;
        const pct = (videoEl.currentTime / videoEl.duration) * 100;
        if (progressFill) progressFill.style.width = pct.toFixed(2) + '%';
        if (npTime) {
          npTime.textContent = `${formatTime(videoEl.currentTime)} / ${formatTime(videoEl.duration)}`;
        }
        updateActiveLyricLine();
      }
    });

    videoEl.addEventListener('loadedmetadata', () => {
      if (videoEl.duration && !isNaN(videoEl.duration)) {
        if (TRACKS[trackIdx]) {
          TRACKS[trackIdx].duration = Math.round(videoEl.duration);
        }
        if (activeIndex === trackIdx) {
          updateProgressDisplay();
        }
      }
    });

    videoEl.addEventListener('ended', () => {
      if (activeIndex === trackIdx) {
        videoEl.currentTime = 0;
        videoEl.play().catch(() => { });
      }
    });
  });

  // Left Controls: Prev, Next, Play/Pause
  btnPrev?.addEventListener('click', (e) => {
    e.stopPropagation();
    setActiveTrack(activeIndex - 1, isPlaying);
  });
  btnNext?.addEventListener('click', (e) => {
    e.stopPropagation();
    setActiveTrack(activeIndex + 1, isPlaying);
  });
  stagePrev?.addEventListener('click', (e) => {
    e.stopPropagation();
    setActiveTrack(activeIndex - 1, isPlaying);
  });
  stageNext?.addEventListener('click', (e) => {
    e.stopPropagation();
    setActiveTrack(activeIndex + 1, isPlaying);
  });
  btnPlayPause?.addEventListener('click', (e) => {
    e.stopPropagation();
    togglePlayPause();
  });

  // Center Capsule click -> open cinema mode or play
  nowPlayingPill?.addEventListener('click', (e) => {
    if (e.target.closest('#ht-progress-container') || e.target.closest('.cf-np-icons')) {
      return;
    }
    openCinemaFullscreen(e, activeIndex);
  });

  // Cast Popover
  if (btnCast && castWrapper) {
    btnCast.addEventListener('click', (e) => {
      e.stopPropagation();
      optionsWrapper?.classList.remove('active');
      volumeWrapper?.classList.remove('active');
      castWrapper.classList.toggle('active');
    });

    deviceItems.forEach((item) => {
      item.addEventListener('click', (e) => {
        e.stopPropagation();
        const devName = item.dataset.device || item.textContent.trim();
        deviceItems.forEach((d) => {
          d.classList.remove('active');
          const chk = d.querySelector('.cf-device-check');
          if (chk) chk.style.display = 'none';
        });
        item.classList.add('active');
        const chk = item.querySelector('.cf-device-check');
        if (chk) chk.style.display = 'inline';

        castWrapper.classList.remove('active');
        showToast(`Connected to ${devName}`);
      });
    });
  }

  // Options Popover
  if (btnOptions && optionsWrapper) {
    btnOptions.addEventListener('click', (e) => {
      e.stopPropagation();
      castWrapper?.classList.remove('active');
      volumeWrapper?.classList.remove('active');
      optionsWrapper.classList.toggle('active');
    });

    optFullscreen?.addEventListener('click', (e) => {
      e.stopPropagation();
      optionsWrapper.classList.remove('active');
      openCinemaFullscreen(e, activeIndex);
    });

    optLink?.addEventListener('click', () => {
      optionsWrapper?.classList.remove('active');
    });

    optCopyLink?.addEventListener('click', (e) => {
      e.stopPropagation();
      optionsWrapper.classList.remove('active');
      const track = TRACKS[activeIndex] || TRACKS[0];
      const link = track.url;
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(link).then(() => {
          showToast('Project link copied to clipboard!');
        }).catch(() => {
          showToast(`Link: ${link}`);
        });
      } else {
        showToast(`Link: ${link}`);
      }
    });

    let isFavorite = false;
    optFavorite?.addEventListener('click', (e) => {
      e.stopPropagation();
      isFavorite = !isFavorite;
      if (isFavorite) {
        optFavorite.classList.add('is-loved');
        showToast('Added to Favorite Tracks ❤️');
      } else {
        optFavorite.classList.remove('is-loved');
        showToast('Removed from Favorites');
      }
    });
  }

  // Right Controls: Lyrics & Queue drawers
  function closeAllDrawers() {
    lyricsDrawer?.classList.remove('is-active');
    queueDrawer?.classList.remove('is-active');
    btnLyrics?.classList.remove('active');
    btnQueue?.classList.remove('active');
  }

  btnLyrics?.addEventListener('click', (e) => {
    e.stopPropagation();
    const willOpen = !lyricsDrawer?.classList.contains('is-active');
    closeAllDrawers();
    if (willOpen) {
      lyricsDrawer?.classList.add('is-active');
      btnLyrics?.classList.add('active');
    }
  });

  lyricsClose?.addEventListener('click', (e) => {
    e.stopPropagation();
    lyricsDrawer?.classList.remove('is-active');
    btnLyrics?.classList.remove('active');
  });

  btnQueue?.addEventListener('click', (e) => {
    e.stopPropagation();
    const willOpen = !queueDrawer?.classList.contains('is-active');
    closeAllDrawers();
    if (willOpen) {
      queueDrawer?.classList.add('is-active');
      btnQueue?.classList.add('active');
    }
  });

  queueClose?.addEventListener('click', (e) => {
    e.stopPropagation();
    queueDrawer?.classList.remove('is-active');
    btnQueue?.classList.remove('active');
  });

  // Volume slider & button
  if (volumeSlider) {
    const onVolumeChange = (e) => {
      const val = parseFloat(e.target.value) / 100;
      applyVolume(val, val === 0);
    };
    volumeSlider.addEventListener('input', onVolumeChange);
    volumeSlider.addEventListener('change', onVolumeChange);

    const startDrag = () => {
      volumeWrapper?.classList.add('is-dragging', 'active');
    };
    const endDrag = () => {
      volumeWrapper?.classList.remove('is-dragging');
    };
    volumeSlider.addEventListener('mousedown', startDrag);
    volumeSlider.addEventListener('touchstart', startDrag, { passive: true });
    window.addEventListener('mouseup', endDrag);
    window.addEventListener('touchend', endDrag);
  }

  if (btnVolume) {
    btnVolume.addEventListener('click', (e) => {
      e.stopPropagation();
      optionsWrapper?.classList.remove('active');
      castWrapper?.classList.remove('active');
      const isCurrentlyActive = volumeWrapper?.classList.contains('active');
      if (!isCurrentlyActive) {
        volumeWrapper?.classList.add('active');
      } else {
        isMuted = !isMuted;
        applyVolume(currentVolume || 0.8, isMuted);
        showToast(isMuted ? 'Muted' : `Volume ${Math.round((currentVolume || 0.8) * 100)}%`);
      }
    });

    btnVolume.addEventListener('dblclick', (e) => {
      e.stopPropagation();
      isMuted = !isMuted;
      applyVolume(currentVolume || 0.8, isMuted);
      showToast(isMuted ? 'Muted' : `Volume ${Math.round((currentVolume || 0.8) * 100)}%`);
    });
  }

  if (volumeWrapper) {
    volumeWrapper.addEventListener('wheel', (e) => {
      e.preventDefault();
      const delta = e.deltaY < 0 ? 0.05 : -0.05;
      const nextVol = Math.max(0, Math.min(1, (isMuted ? 0 : currentVolume) + delta));
      applyVolume(nextVol, nextVol === 0);
      showToast(`Volume ${Math.round(nextVol * 100)}%`);
    }, { passive: false });
  }

  // Close popovers on click outside
  document.addEventListener('click', (e) => {
    if (!e.target.closest('#ht-cast-wrapper')) {
      castWrapper?.classList.remove('active');
    }
    if (!e.target.closest('#ht-options-wrapper')) {
      optionsWrapper?.classList.remove('active');
    }
    if (!e.target.closest('#ht-volume-wrapper')) {
      volumeWrapper?.classList.remove('active');
    }
  });

  // Click on cards to bring them to center or trigger fullscreen
  cards.forEach((card, idx) => {
    card.addEventListener('click', (e) => {
      if (activeIndex === idx) {
        openCinemaFullscreen(e, idx);
      } else {
        setActiveTrack(idx, isPlaying);
      }
    });

    card.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        if (activeIndex === idx) {
          openCinemaFullscreen(e, idx);
        } else {
          setActiveTrack(idx, isPlaying);
        }
      }
    });
  });

  // Card Controls (Fullscreen button, sound toggle, reel wrap click)
  for (let idx = 0; idx <= 5; idx++) {
    const fsBtn = document.getElementById(`ht-card-fs-btn-${idx}`);
    const soundBtn = document.getElementById(`ht-card-sound-btn-${idx}`);
    const rWrap = document.getElementById(`ht-reel-wrap-${idx}`);
    const cVid = getCardVideo(idx);

    fsBtn?.addEventListener('click', (e) => {
      e.stopPropagation();
      setActiveTrack(idx, false);
      openCinemaFullscreen(e, idx);
    });

    soundBtn?.addEventListener('click', (e) => {
      e.stopPropagation();
      isMuted = !isMuted;
      applyVolume(currentVolume, isMuted);
      showToast(isMuted ? 'Muted' : `Volume ${Math.round(currentVolume * 100)}%`);
    });

    rWrap?.addEventListener('click', (e) => {
      e.stopPropagation();
      if (activeIndex === idx) {
        openCinemaFullscreen(e, idx);
      } else {
        setActiveTrack(idx, isPlaying);
      }
    });

    cVid?.addEventListener('click', (e) => {
      e.stopPropagation();
      if (activeIndex === idx) {
        openCinemaFullscreen(e, idx);
      } else {
        setActiveTrack(idx, isPlaying);
      }
    });
  }

  // Swipe / Drag on Stage
  let touchStartX = 0;
  let touchEndX = 0;
  const stage = document.getElementById('ht-coverflow-stage');
  if (stage) {
    stage.addEventListener('touchstart', (e) => {
      touchStartX = e.changedTouches[0].screenX;
    }, { passive: true });

    stage.addEventListener('touchend', (e) => {
      touchEndX = e.changedTouches[0].screenX;
      handleSwipe();
    }, { passive: true });

    let isMouseDown = false;
    stage.addEventListener('mousedown', (e) => {
      isMouseDown = true;
      touchStartX = e.clientX;
    });

    stage.addEventListener('mouseup', (e) => {
      if (!isMouseDown) return;
      isMouseDown = false;
      touchEndX = e.clientX;
      handleSwipe();
    });

    stage.addEventListener('mouseleave', () => {
      isMouseDown = false;
    });

    function handleSwipe() {
      const diff = touchEndX - touchStartX;
      if (Math.abs(diff) > 40) {
        if (diff > 0) {
          setActiveTrack(activeIndex - 1, isPlaying);
        } else {
          setActiveTrack(activeIndex + 1, isPlaying);
        }
      }
    }
  }

  // Cinema Fullscreen for Head Talking
  function openCinemaFullscreen(e, trackIndex = activeIndex) {
    if (e) e.stopPropagation();
    if (!cinemaModal || !cinemaVideo) return;

    isCinemaFromHT = true;
    const track = TRACKS[trackIndex] || TRACKS[0];
    const sourceVideo = getCardVideo(trackIndex);

    if (cinemaBadgeText) cinemaBadgeText.textContent = 'Head Talking & Sound Design';
    if (cinemaCaptionTitle) cinemaCaptionTitle.textContent = track.title;
    if (cinemaCaptionDesc) cinemaCaptionDesc.textContent = `${track.artist} • Tap video to Play/Pause • Press ESC to exit`;

    if (sourceVideo && sourceVideo.src) {
      if (!cinemaVideo.src.endsWith(sourceVideo.getAttribute('src'))) {
        cinemaVideo.src = sourceVideo.getAttribute('src');
      }
      cinemaVideo.currentTime = sourceVideo.currentTime || 0;
    }

    pauseAndMuteAllVideos('cinema');

    cinemaModal.classList.add('is-open');
    cinemaModal.setAttribute('aria-hidden', 'false');

    cinemaVideo.volume = currentVolume;
    cinemaVideo.muted = isMuted;

    cinemaVideo.play().then(() => {
      setPlayPauseState(true);
    }).catch(() => {
      cinemaVideo.muted = true;
      cinemaVideo.play().then(() => setPlayPauseState(true)).catch(() => { });
    });

    if (window.location.hash !== '#cinema-headtalking') {
      if (window.history && window.history.pushState) {
        window.history.pushState({ modal: 'cinema-headtalking' }, '', '#cinema-headtalking');
      }
    }
  }

  function closeCinemaFullscreen(fromHistory = false) {
    if (!cinemaModal || !cinemaModal.classList.contains('is-open')) return;
    if (!isCinemaFromHT) return;

    const sourceVideo = getCardVideo(activeIndex);
    if (sourceVideo && cinemaVideo) {
      sourceVideo.currentTime = cinemaVideo.currentTime || 0;
    }

    cinemaVideo.pause();
    cinemaVideo.muted = true;
    isCinemaFromHT = false;

    cinemaModal.classList.remove('is-open');
    cinemaModal.setAttribute('aria-hidden', 'true');

    if (document.fullscreenElement || document.webkitFullscreenElement) {
      if (document.exitFullscreen) document.exitFullscreen().catch(() => { });
      else if (document.webkitExitFullscreen) document.webkitExitFullscreen().catch(() => { });
    }

    if (!fromHistory) {
      if (window.history && window.history.state && window.history.state.modal === 'cinema-headtalking') {
        window.history.back();
      } else if (window.location.hash === '#cinema-headtalking') {
        if (window.history && window.history.replaceState) {
          window.history.replaceState({ modal: 'headtalking-player' }, '', '#headtalking');
        }
      }
    }
  }

  // Modal Open & Close logic
  function openModal(pushHistory = true) {
    // Coordinate with other modals: pause and close them if open
    if (window.closeMotionGraphicsModal) window.closeMotionGraphicsModal(true);
    if (window.stopMotionGraphicsMedia) window.stopMotionGraphicsMedia(-1);
    if (window.closePhonkModal) window.closePhonkModal(true);
    if (window.stopPhonkMedia) window.stopPhonkMedia(-1);
    if (window.closeRealEstateModal) window.closeRealEstateModal(true);
    if (window.stopRealEstateMedia) window.stopRealEstateMedia(-1);
    if (window.closeCinematicModal) window.closeCinematicModal(true);
    if (window.stopCinematicMedia) window.stopCinematicMedia(-1);

    modal.classList.add('is-open');
    modal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';

    if (pushHistory && window.location.hash !== '#headtalking') {
      if (window.history && window.history.pushState) {
        window.history.pushState({ modal: 'headtalking-player' }, '', '#headtalking');
      }
    }

    pauseAndMuteAllVideos(-1);
    setPlayPauseState(false);
    setActiveTrack(0, false);

    buildQueue();
    populateLyrics();
    updateCarousel(true);

    setTimeout(() => {
      updateCarousel();
    }, 50);
  }

  function closeModal(fromHistory = false) {
    if (!modal.classList.contains('is-open')) return;

    if (isCinemaFromHT) {
      closeCinemaFullscreen(fromHistory);
    }

    modal.classList.remove('is-open');
    modal.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';

    pauseAndMuteAllVideos(-1);
    setPlayPauseState(false);

    closeAllDrawers();
    castWrapper?.classList.remove('active');
    optionsWrapper?.classList.remove('active');
    volumeWrapper?.classList.remove('active');

    if (!fromHistory) {
      if (window.history && window.history.state && (window.history.state.modal === 'headtalking-player' || window.history.state.modal === 'cinema-headtalking')) {
        window.history.back();
      } else if (window.location.hash === '#headtalking' || window.location.hash === '#cinema-headtalking') {
        if (window.history && window.history.replaceState) {
          window.history.replaceState(null, '', window.location.pathname + window.location.search);
        }
      }
    }
  }

  window.stopHeadTalkingMedia = pauseAndMuteAllVideos;
  window.closeHeadTalkingModal = closeModal;

  cardTrigger.addEventListener('click', (e) => {
    e.preventDefault();
    openModal();
  });

  cardTrigger.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      openModal();
    }
  });

  btnClose?.addEventListener('click', () => closeModal(false));
  backdrop?.addEventListener('click', () => closeModal(false));

  // History popstate
  window.addEventListener('popstate', (e) => {
    const isCinemaOpen = cinemaModal && cinemaModal.classList.contains('is-open') && isCinemaFromHT;
    const isPlayerOpen = modal && modal.classList.contains('is-open');

    if (isCinemaOpen) {
      closeCinemaFullscreen(true);
      if (!e.state || e.state.modal !== 'headtalking-player') {
        closeModal(true);
      }
    } else if (isPlayerOpen) {
      closeModal(true);
    }
  });

  // Direct deep link check
  if (window.location.hash === '#headtalking' || window.location.hash === '#head-talking') {
    openModal(false);
  }

  // Keyboard navigation when modal is open
  window.addEventListener('keydown', (e) => {
    if (!modal.classList.contains('is-open')) return;

    if (cinemaModal && cinemaModal.classList.contains('is-open') && isCinemaFromHT) {
      if (e.key === 'Escape') {
        closeCinemaFullscreen();
      } else if (e.key === ' ' || e.code === 'Space') {
        e.preventDefault();
        if (cinemaVideo.paused) {
          cinemaVideo.play().catch(() => { });
        } else {
          cinemaVideo.pause();
        }
      } else if (e.key === 'm' || e.key === 'M') {
        e.preventDefault();
        isMuted = !isMuted;
        applyVolume(currentVolume, isMuted);
      }
      return;
    }

    if (e.key === 'Escape') {
      closeModal();
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault();
      setActiveTrack(activeIndex - 1, isPlaying);
    } else if (e.key === 'ArrowRight') {
      e.preventDefault();
      setActiveTrack(activeIndex + 1, isPlaying);
    } else if (e.key === ' ') {
      if (document.activeElement.tagName !== 'INPUT') {
        e.preventDefault();
        togglePlayPause();
      }
    }
  });

  window.addEventListener('resize', () => {
    if (modal.classList.contains('is-open')) {
      updateCarousel();
    }
  });
}

// ============================================================================
// 5.3. MODAL 3: PHONK EDITS & SPEED RAMPS SHOWCASE (#phonk-coverflow-modal)
// Grid Trigger: #card-phonk-edits (Card 3) | ID Prefix: "phonk-"
// HOW TO EDIT TRACKS: Locate the `TRACKS` array below to modify titles,
// artwork, links, audio durations, or lyrics.
// ============================================================================
function setupPhonkCoverFlowPlayer() {
  const modal = document.getElementById('phonk-coverflow-modal');
  const cardTrigger = document.getElementById('card-phonk-edits');
  const btnClose = document.getElementById('phonk-coverflow-btn-close');
  const backdrop = document.getElementById('phonk-coverflow-backdrop');
  const deck = document.getElementById('phonk-coverflow-deck');
  const cards = deck ? Array.from(deck.querySelectorAll('.cf-card')) : [];
  const btnPrev = document.getElementById('phonk-btn-prev');
  const btnNext = document.getElementById('phonk-btn-next');
  const stagePrev = document.getElementById('phonk-coverflow-prev');
  const stageNext = document.getElementById('phonk-coverflow-next');
  const btnPlayPause = document.getElementById('phonk-btn-playpause');
  const iconPlay = btnPlayPause?.querySelector('.icon-play');
  const iconPause = btnPlayPause?.querySelector('.icon-pause');
  const ambientGlow = document.getElementById('phonk-coverflow-ambient-glow');

  // Center Capsule elements
  const nowPlayingPill = document.getElementById('phonk-now-playing-pill');
  const npThumb = document.getElementById('phonk-np-thumb');
  const npTitle = document.getElementById('phonk-np-title');
  const npArtist = document.getElementById('phonk-np-artist');
  const npTime = document.getElementById('phonk-np-time');
  const progressFill = document.getElementById('phonk-progress-fill');
  const progressContainer = document.getElementById('phonk-progress-container');
  const playerPill = document.getElementById('phonk-player-pill');

  // Popover elements
  const castWrapper = document.getElementById('phonk-cast-wrapper');
  const btnCast = document.getElementById('phonk-btn-cast');
  const castPopover = document.getElementById('phonk-cast-popover');
  const deviceItems = castPopover ? Array.from(castPopover.querySelectorAll('.cf-device-item')) : [];

  const optionsWrapper = document.getElementById('phonk-options-wrapper');
  const btnOptions = document.getElementById('phonk-btn-options');
  const optFullscreen = document.getElementById('phonk-opt-fullscreen');
  const optLink = document.getElementById('phonk-opt-link');
  const optCopyLink = document.getElementById('phonk-opt-copylink');
  const optFavorite = document.getElementById('phonk-opt-favorite');
  const toast = document.getElementById('phonk-toast');

  // Drawers
  const btnLyrics = document.getElementById('phonk-btn-lyrics');
  const lyricsDrawer = document.getElementById('phonk-lyrics-drawer');
  const lyricsClose = document.getElementById('phonk-lyrics-close');
  const lyricsBody = document.getElementById('phonk-lyrics-body');
  const lyricsTrackTitle = document.getElementById('phonk-lyrics-track-title');

  const btnQueue = document.getElementById('phonk-btn-queue');
  const queueDrawer = document.getElementById('phonk-queue-drawer');
  const queueClose = document.getElementById('phonk-queue-close');
  const queueList = document.getElementById('phonk-queue-list');

  // Volume
  const volumeWrapper = document.getElementById('phonk-volume-wrapper');
  const btnVolume = document.getElementById('phonk-btn-volume');
  const volumeSlider = document.getElementById('phonk-volume-slider');

  // Card Videos (0 to 5)
  const cardVideos = [];
  for (let i = 0; i <= 5; i++) {
    cardVideos.push(document.getElementById(`phonk-card-video-${i}`));
  }

  // Shared Cinema Modal elements
  const cinemaModal = document.getElementById('cf-cinema-modal');
  const cinemaVideoBox = document.getElementById('cf-cinema-video-box');
  const cinemaVideo = document.getElementById('cf-cinema-video');
  const cinemaClose = document.getElementById('cf-cinema-close');
  const cinemaBackdrop = document.getElementById('cf-cinema-backdrop');
  const cinemaSoundToggle = document.getElementById('cf-cinema-sound-toggle');
  const cinemaFsToggle = document.getElementById('cf-cinema-fs-toggle');
  const cinemaPlayOverlay = document.getElementById('cf-cinema-play-overlay');
  const cinemaTimeline = document.getElementById('cf-cinema-timeline');
  const cinemaProgress = document.getElementById('cf-cinema-progress');
  const cinemaBadgeText = document.getElementById('cf-cinema-badge-text');
  const cinemaCaptionTitle = document.getElementById('cf-cinema-caption-title');
  const cinemaCaptionDesc = document.getElementById('cf-cinema-caption-desc');

  if (!modal || !cardTrigger) return;

  // Player State
  let activeIndex = 0;
  let isPlaying = false;
  let trackCurrentTime = 0;
  let progressTimer = null;
  let currentVolume = 0.8;
  let isMuted = false;
  let isCinemaFromPhonk = false;

  function getCardVideo(idx) {
    return cardVideos[idx] || null;
  }

  function stopProgressTimer() {
    if (progressTimer) {
      clearInterval(progressTimer);
      progressTimer = null;
    }
  }

  function pauseAndMuteAllVideos(exceptTarget = -1) {
    for (let i = 0; i <= 5; i++) {
      if (i !== exceptTarget) {
        const v = getCardVideo(i);
        if (v) {
          v.pause();
          v.muted = true;
        }
      }
    }
    if (cinemaVideo && exceptTarget !== 'cinema' && isCinemaFromPhonk) {
      cinemaVideo.pause();
      cinemaVideo.muted = true;
    }
    stopProgressTimer();
  }

  // Initial pause and mute
  pauseAndMuteAllVideos(-1);

  // Tracks Data for The "Aura" & Instagram Phonks Edits
  const TRACKS = [
    {
      id: 0,
      title: 'The Aura & Glowing Edge',
      artist: 'Instagram Phonks Edits',
      album: 'Instagram Reel',
      image: 'images/music-player/aura_phonk_reel.jpg',
      url: 'https://www.instagram.com/p/DdJctMlT9cV/',
      duration: 20,
      accent: 'rgba(0, 210, 255, 0.55)',
      lyrics: [
        { time: 0, text: 'The "Aura" & Glowing Edge Effect — Instagram Phonk Edit' },
        { time: 4, text: 'Saber glow highlights, dynamic mask tracking & edge neon' },
        { time: 9, text: 'Bass impact synchronization & frame-rate speed ramps' },
        { time: 14, text: 'Chromatic aberration pulses & optical flow displacement' },
        { time: 18, text: 'Watch original edit on Instagram (@saicharanracha)' }
      ]
    },
    {
      id: 1,
      title: 'Editor Edits His Own Video',
      artist: 'Phonk Edits & Speed Ramps',
      album: 'Instagram Reel',
      image: 'images/music-player/phonk_reel_2.jpg',
      url: 'https://www.instagram.com/p/DcdsEMVtSNk/',
      duration: 20,
      accent: 'rgba(239, 68, 68, 0.55)',
      lyrics: [
        { time: 0, text: 'When an Editor edits his own video 🔥' },
        { time: 4, text: 'After Effects speed ramps & kinetic velocity curves' },
        { time: 8, text: 'Bass synchronization, optical flow & chromatic glow' },
        { time: 13, text: 'Seamless transition cuts & glitch aesthetic impacts' },
        { time: 18, text: 'Watch on Instagram (@saicharanracha)' }
      ]
    },
    {
      id: 2,
      title: 'Microwave Trend Velocity',
      artist: 'Phonk & Kinetic Velocity',
      album: 'Instagram Reel',
      image: 'images/music-player/phonk_reel_3.jpg',
      url: 'https://www.instagram.com/p/DcgkvPBNJXZ/',
      duration: 9,
      accent: 'rgba(168, 85, 247, 0.55)',
      lyrics: [
        { time: 0, text: '⚡ Microwave Trend — Viral Velocity Edit' },
        { time: 2, text: 'After Effects frame-rate speed ramp synchronization' },
        { time: 5, text: 'Punchy bass impacts & kinetic optical glow effects' },
        { time: 7, text: 'Watch on Instagram (@saicharanracha)' }
      ]
    },
    {
      id: 3,
      title: 'Kurukshetra — Lord Krishna & Karna',
      artist: 'Telugu History & Cinematic Edit',
      album: 'Instagram Reel',
      image: 'images/music-player/phonk_reel_4.jpg',
      url: 'https://www.instagram.com/reel/DVlZLwUDJJT/',
      duration: 19,
      accent: 'rgba(245, 158, 11, 0.55)',
      lyrics: [
        { time: 0, text: 'Kurukshetra — Lord Krishna & Karna Cinematic' },
        { time: 4, text: 'Epic Telugu mythological narrative pacing & visual grading' },
        { time: 9, text: 'Atmospheric depth, embers & battle scene motion transitions' },
        { time: 14, text: 'Cinematic soundtrack synchronization & emotional arcs' },
        { time: 18, text: 'Watch on Instagram (@helotoonz)' }
      ]
    },
    {
      id: 4,
      title: 'Lucky Baskhar — Cinematic Narrative',
      artist: 'Cinema Motion & Dialogue Edit',
      album: 'Instagram Reel',
      image: 'images/music-player/phonk_reel_5.jpg',
      url: 'https://www.instagram.com/reel/DdHqhkRTK18/',
      duration: 40,
      accent: 'rgba(230, 0, 35, 0.55)',
      lyrics: [
        { time: 0, text: 'Lucky Baskhar (2024) — Cinematic Narrative Cut' },
        { time: 8, text: 'Dramatic dialogue delivery & emotional story beats' },
        { time: 18, text: 'Retro film grading, subtle film grain & camera push-ins' },
        { time: 28, text: 'Pacing aligned to orchestral cinematic score' },
        { time: 38, text: 'Watch on Instagram (@am.ronitxd_10k)' }
      ]
    },
    {
      id: 5,
      title: 'Kinetic VFX & Phonk Velocity',
      artist: 'Alfredo EFX & Motion Design',
      album: 'Instagram Reel',
      image: 'images/music-player/phonk_reel_6.jpg',
      url: 'https://www.instagram.com/reel/Dd3Xb3nz4VA/',
      duration: 37,
      accent: 'rgba(59, 130, 246, 0.55)',
      lyrics: [
        { time: 0, text: 'Kinetic VFX & Phonk Velocity — Alfredo EFX' },
        { time: 8, text: 'Intense bass drops, speed ramps & seamless morph cuts' },
        { time: 18, text: 'Neon edge tracking, saber lighting & particle dynamics' },
        { time: 28, text: 'Hyper-kinetic visual rhythm & customized sound sync' },
        { time: 35, text: 'Watch original edit on Instagram (@alfredo.efx)' }
      ]
    }
  ];

  function formatTime(sec) {
    if (isNaN(sec) || sec < 0) return '0:00';
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  }

  // 3D Cover Flow layout calculation
  function updateCarousel(instant = false) {
    const isMobile = window.innerWidth < 640;
    const isTablet = window.innerWidth < 1024;

    const xOffset1 = isMobile ? 120 : isTablet ? 170 : 210;
    const xOffset2 = isMobile ? 220 : isTablet ? 320 : 400;
    const zOffset1 = isMobile ? -60 : -80;
    const zOffset2 = isMobile ? -120 : -160;
    const rot1 = isMobile ? 20 : 26;
    const rot2 = isMobile ? 32 : 40;

    cards.forEach((card, idx) => {
      const diff = idx - activeIndex;

      if (instant) {
        card.style.transition = 'none';
      } else {
        card.style.transition = 'transform 0.6s cubic-bezier(0.25, 1, 0.5, 1), opacity 0.5s ease, filter 0.5s ease, box-shadow 0.6s ease';
      }

      if (diff === 0) {
        card.classList.add('active');
        card.style.transform = 'translate3d(0, 0, 40px) rotateY(0deg) scale(1)';
        card.style.zIndex = '10';
        card.style.opacity = '1';
        card.style.filter = 'brightness(1)';
        card.style.pointerEvents = 'auto';
      } else if (diff === -1) {
        card.classList.remove('active');
        card.style.transform = `translate3d(-${xOffset1}px, 0, ${zOffset1}px) rotateY(${rot1}deg) scale(0.85)`;
        card.style.zIndex = '7';
        card.style.opacity = '0.92';
        card.style.filter = 'brightness(0.82)';
        card.style.pointerEvents = 'auto';
      } else if (diff === -2) {
        card.classList.remove('active');
        card.style.transform = `translate3d(-${xOffset2}px, 0, ${zOffset2}px) rotateY(${rot2}deg) scale(0.72)`;
        card.style.zIndex = '4';
        card.style.opacity = '0.75';
        card.style.filter = 'brightness(0.6)';
        card.style.pointerEvents = 'auto';
      } else if (diff === 1) {
        card.classList.remove('active');
        card.style.transform = `translate3d(${xOffset1}px, 0, ${zOffset1}px) rotateY(-${rot1}deg) scale(0.85)`;
        card.style.zIndex = '7';
        card.style.opacity = '0.92';
        card.style.filter = 'brightness(0.82)';
        card.style.pointerEvents = 'auto';
      } else if (diff === 2) {
        card.classList.remove('active');
        card.style.transform = `translate3d(${xOffset2}px, 0, ${zOffset2}px) rotateY(-${rot2}deg) scale(0.72)`;
        card.style.zIndex = '4';
        card.style.opacity = '0.75';
        card.style.filter = 'brightness(0.6)';
        card.style.pointerEvents = 'auto';
      } else {
        card.classList.remove('active');
        const sign = diff > 0 ? 1 : -1;
        card.style.transform = `translate3d(${sign * (xOffset2 + 100)}px, 0, -260px) rotateY(${-sign * 50}deg) scale(0.55)`;
        card.style.zIndex = '1';
        card.style.opacity = '0';
        card.style.filter = 'brightness(0.3)';
        card.style.pointerEvents = 'none';
      }
    });

    // Update ambient mood glow
    const track = TRACKS[activeIndex];
    if (ambientGlow && track) {
      ambientGlow.style.background = `radial-gradient(circle, ${track.accent} 0%, rgba(0, 210, 255, 0.06) 55%, transparent 75%)`;
    }

    // Update Player bar UI
    if (track) {
      if (npThumb) npThumb.src = track.image;
      if (npTitle) npTitle.textContent = track.title;
      if (npArtist) npArtist.textContent = track.artist;
      if (lyricsTrackTitle) lyricsTrackTitle.textContent = `${track.artist} — ${track.title}`;
      if (optLink && track.url) {
        optLink.href = track.url;
        const optSpan = optLink.querySelector('span');
        if (optSpan) {
          if (track.url.includes('instagram.com')) optSpan.textContent = 'Open on Instagram';
          else if (track.url.includes('youtu')) optSpan.textContent = 'Open on YouTube';
          else if (track.url.includes('pin.it')) optSpan.textContent = 'Open on Pinterest';
          else if (track.url.includes('drive.google.com')) optSpan.textContent = 'Open Drive Link';
          else optSpan.textContent = 'Open Link';
        }
      }
      updateProgressDisplay();
      populateLyrics();
      updateQueueActiveItem();
    }
  }

  // Switch Active Track
  function setActiveTrack(index, restartAudio = false) {
    if (index < 0) index = TRACKS.length - 1;
    if (index >= TRACKS.length) index = 0;

    activeIndex = index;
    trackCurrentTime = 0;

    updateCarousel();
    pauseAndMuteAllVideos(activeIndex);

    const activeVid = getCardVideo(activeIndex);
    if (activeVid) {
      activeVid.currentTime = 0;
      if (isPlaying || restartAudio) {
        activeVid.volume = currentVolume;
        activeVid.muted = isMuted;
        activeVid.play().then(() => {
          setPlayPauseState(true);
        }).catch(() => {
          activeVid.muted = true;
          activeVid.play().then(() => setPlayPauseState(true)).catch(() => setPlayPauseState(false));
        });
      } else {
        activeVid.pause();
        activeVid.muted = true;
        setPlayPauseState(false);
      }
    }
  }

  function updateProgressDisplay() {
    const track = TRACKS[activeIndex];
    if (!track) return;

    if (npTime) {
      npTime.textContent = `${formatTime(trackCurrentTime)} / ${formatTime(track.duration)}`;
    }

    if (progressFill) {
      const pct = Math.min(100, Math.max(0, (trackCurrentTime / track.duration) * 100));
      progressFill.style.width = pct.toFixed(2) + '%';
    }

    updateActiveLyricLine();
  }

  function populateLyrics() {
    if (!lyricsBody) return;
    lyricsBody.innerHTML = '';
    const track = TRACKS[activeIndex];
    if (!track || !track.lyrics) return;

    track.lyrics.forEach((item) => {
      const p = document.createElement('p');
      p.className = 'cf-lyric-line';
      p.dataset.time = item.time;
      p.textContent = item.text;
      p.addEventListener('click', () => {
        const activeVid = getCardVideo(activeIndex);
        if (activeVid) {
          activeVid.currentTime = item.time;
        }
        trackCurrentTime = item.time;
        updateProgressDisplay();
      });
      lyricsBody.appendChild(p);
    });
    updateActiveLyricLine();
  }

  function updateActiveLyricLine() {
    if (!lyricsBody) return;
    const lines = lyricsBody.querySelectorAll('.cf-lyric-line');
    let currentLine = null;
    lines.forEach((l) => {
      const t = parseFloat(l.dataset.time || '0');
      if (trackCurrentTime >= t) {
        currentLine = l;
      }
    });

    lines.forEach((l) => l.classList.remove('is-active'));
    if (currentLine) {
      currentLine.classList.add('is-active');
      currentLine.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }

  function buildQueue() {
    if (!queueList) return;
    queueList.innerHTML = '';
    TRACKS.forEach((t, i) => {
      const item = document.createElement('div');
      item.className = `cf-queue-item ${i === activeIndex ? 'active' : ''}`;
      item.dataset.index = i;
      item.innerHTML = `
        <span class="cf-qi-num">${i + 1}</span>
        <img class="cf-qi-thumb" src="${t.image}" alt="${t.title}" />
        <div class="cf-qi-info">
          <span class="cf-qi-title">${t.title}</span>
          <span class="cf-qi-artist">${t.artist}</span>
        </div>
        <span class="cf-qi-duration">${formatTime(t.duration)}</span>
      `;
      item.addEventListener('click', () => {
        setActiveTrack(i, isPlaying);
        closeAllDrawers();
      });
      queueList.appendChild(item);
    });
  }

  function updateQueueActiveItem() {
    if (!queueList) return;
    const items = queueList.querySelectorAll('.cf-queue-item');
    items.forEach((it) => {
      const idx = parseInt(it.dataset.index, 10);
      if (idx === activeIndex) it.classList.add('active');
      else it.classList.remove('active');
    });
  }

  let toastTimer = null;
  function showToast(msg) {
    if (!toast) return;
    toast.textContent = msg;
    toast.classList.add('is-active');
    toast.setAttribute('aria-hidden', 'false');
    if (toastTimer) clearTimeout(toastTimer);
    toastTimer = setTimeout(() => {
      toast.classList.remove('is-active');
      toast.setAttribute('aria-hidden', 'true');
    }, 2400);
  }

  function setPlayPauseState(playing) {
    isPlaying = playing;
    if (iconPlay) iconPlay.style.display = playing ? 'none' : 'block';
    if (iconPause) iconPause.style.display = playing ? 'block' : 'none';
    if (playerPill) {
      if (playing) playerPill.classList.add('is-playing');
      else playerPill.classList.remove('is-playing');
    }
  }

  function applyVolume(vol, muted) {
    currentVolume = Math.max(0, Math.min(1, vol));
    isMuted = !!muted || currentVolume === 0;

    const isCinemaOpen = cinemaModal && cinemaModal.classList.contains('is-open');

    for (let i = 0; i <= 5; i++) {
      const v = getCardVideo(i);
      if (v) {
        if (!isCinemaOpen && i === activeIndex && isPlaying) {
          v.volume = currentVolume;
          v.muted = isMuted;
        } else {
          v.muted = true;
        }
      }
    }

    if (cinemaVideo && isCinemaFromPhonk) {
      cinemaVideo.volume = currentVolume;
      cinemaVideo.muted = isMuted;
    }

    // Update sound buttons UI on cards
    for (let i = 0; i <= 5; i++) {
      const btn = document.getElementById(`phonk-card-sound-btn-${i}`);
      if (!btn) continue;
      const iconMuted = btn.querySelector('.icon-muted');
      const iconUnmuted = btn.querySelector('.icon-unmuted');
      if (isMuted) {
        iconMuted?.style.setProperty('display', 'block');
        iconUnmuted?.style.setProperty('display', 'none');
      } else {
        iconMuted?.style.setProperty('display', 'none');
        iconUnmuted?.style.setProperty('display', 'block');
      }
    }

    const volPct = isMuted ? 0 : Math.round(currentVolume * 100);
    if (volumeSlider) {
      volumeSlider.value = volPct;
      volumeSlider.style.setProperty('--vol-pct', volPct + '%');
    }
    const valDisplay = document.getElementById('phonk-volume-val');
    if (valDisplay) {
      valDisplay.textContent = volPct + '%';
    }
    if (btnVolume) {
      const vUnmuted = btnVolume.querySelector('.vol-icon-unmuted');
      const vMuted = btnVolume.querySelector('.vol-icon-muted');
      if (isMuted) {
        vUnmuted?.style.setProperty('display', 'none');
        vMuted?.style.setProperty('display', 'block');
      } else {
        vUnmuted?.style.setProperty('display', 'block');
        vMuted?.style.setProperty('display', 'none');
      }
    }
  }

  // Play / Pause Toggle
  function togglePlayPause() {
    const activeVid = getCardVideo(activeIndex);
    if (!activeVid) return;

    pauseAndMuteAllVideos(activeIndex);

    if (activeVid.paused) {
      activeVid.volume = currentVolume;
      activeVid.muted = isMuted;
      activeVid.play().then(() => {
        setPlayPauseState(true);
      }).catch(() => {
        activeVid.muted = true;
        activeVid.play().then(() => setPlayPauseState(true)).catch(() => { });
      });
    } else {
      activeVid.pause();
      setPlayPauseState(false);
    }
  }

  // Scrubber scrubbing
  if (progressContainer) {
    function handleScrub(e) {
      const rect = progressContainer.getBoundingClientRect();
      const clientX = e.clientX !== undefined ? e.clientX : (e.touches && e.touches[0] ? e.touches[0].clientX : 0);
      const clickX = clientX - rect.left;
      const pct = Math.max(0, Math.min(1, clickX / rect.width));
      const track = TRACKS[activeIndex];
      const activeVid = getCardVideo(activeIndex);

      if (activeVid) {
        const duration = activeVid.duration || (track ? track.duration : 30);
        activeVid.currentTime = pct * duration;
        trackCurrentTime = activeVid.currentTime;
        if (progressFill) progressFill.style.width = (pct * 100).toFixed(2) + '%';
        if (npTime) npTime.textContent = `${formatTime(trackCurrentTime)} / ${formatTime(duration)}`;
      }
    }

    let isScrubbing = false;
    progressContainer.addEventListener('mousedown', (e) => {
      isScrubbing = true;
      handleScrub(e);
    });
    window.addEventListener('mousemove', (e) => {
      if (isScrubbing) handleScrub(e);
    });
    window.addEventListener('mouseup', () => {
      isScrubbing = false;
    });
    progressContainer.addEventListener('touchstart', (e) => {
      handleScrub(e);
    }, { passive: true });
    progressContainer.addEventListener('touchmove', (e) => {
      handleScrub(e);
    }, { passive: true });
  }

  // Video sync events
  cardVideos.forEach((videoEl, trackIdx) => {
    if (!videoEl) return;
    videoEl.addEventListener('play', () => {
      if (!modal.classList.contains('is-open')) {
        videoEl.pause();
        videoEl.muted = true;
        return;
      }
      if (cinemaModal && cinemaModal.classList.contains('is-open')) {
        videoEl.pause();
        videoEl.muted = true;
        return;
      }
      if (activeIndex === trackIdx) {
        setPlayPauseState(true);
        pauseAndMuteAllVideos(trackIdx);
      } else {
        videoEl.pause();
        videoEl.muted = true;
      }
    });

    videoEl.addEventListener('pause', () => {
      if (activeIndex === trackIdx && (!cinemaModal || !cinemaModal.classList.contains('is-open'))) {
        setPlayPauseState(false);
      }
    });

    videoEl.addEventListener('timeupdate', () => {
      if (activeIndex === trackIdx && videoEl.duration) {
        trackCurrentTime = videoEl.currentTime;
        const pct = (videoEl.currentTime / videoEl.duration) * 100;
        if (progressFill) progressFill.style.width = pct.toFixed(2) + '%';
        if (npTime) {
          npTime.textContent = `${formatTime(videoEl.currentTime)} / ${formatTime(videoEl.duration)}`;
        }
        updateActiveLyricLine();
      }
    });

    videoEl.addEventListener('loadedmetadata', () => {
      if (videoEl.duration && !isNaN(videoEl.duration)) {
        if (TRACKS[trackIdx]) {
          TRACKS[trackIdx].duration = Math.round(videoEl.duration);
        }
        if (activeIndex === trackIdx) {
          updateProgressDisplay();
        }
      }
    });

    videoEl.addEventListener('ended', () => {
      if (activeIndex === trackIdx) {
        videoEl.currentTime = 0;
        videoEl.play().catch(() => { });
      }
    });
  });

  // Left Controls: Prev, Next, Play/Pause
  btnPrev?.addEventListener('click', (e) => {
    e.stopPropagation();
    setActiveTrack(activeIndex - 1, isPlaying);
  });
  btnNext?.addEventListener('click', (e) => {
    e.stopPropagation();
    setActiveTrack(activeIndex + 1, isPlaying);
  });
  stagePrev?.addEventListener('click', (e) => {
    e.stopPropagation();
    setActiveTrack(activeIndex - 1, isPlaying);
  });
  stageNext?.addEventListener('click', (e) => {
    e.stopPropagation();
    setActiveTrack(activeIndex + 1, isPlaying);
  });
  btnPlayPause?.addEventListener('click', (e) => {
    e.stopPropagation();
    togglePlayPause();
  });

  // Center Capsule click -> open cinema mode
  nowPlayingPill?.addEventListener('click', (e) => {
    if (e.target.closest('#phonk-progress-container') || e.target.closest('.cf-np-icons')) {
      return;
    }
    openCinemaFullscreen(e, activeIndex);
  });

  // Cast Popover
  if (btnCast && castWrapper) {
    btnCast.addEventListener('click', (e) => {
      e.stopPropagation();
      optionsWrapper?.classList.remove('active');
      volumeWrapper?.classList.remove('active');
      castWrapper.classList.toggle('active');
    });

    deviceItems.forEach((item) => {
      item.addEventListener('click', (e) => {
        e.stopPropagation();
        const devName = item.dataset.device || item.textContent.trim();
        deviceItems.forEach((d) => {
          d.classList.remove('active');
          const chk = d.querySelector('.cf-device-check');
          if (chk) chk.style.display = 'none';
        });
        item.classList.add('active');
        const chk = item.querySelector('.cf-device-check');
        if (chk) chk.style.display = 'inline';

        castWrapper.classList.remove('active');
        showToast(`Connected to ${devName}`);
      });
    });
  }

  // Options Popover
  if (btnOptions && optionsWrapper) {
    btnOptions.addEventListener('click', (e) => {
      e.stopPropagation();
      castWrapper?.classList.remove('active');
      volumeWrapper?.classList.remove('active');
      optionsWrapper.classList.toggle('active');
    });

    optFullscreen?.addEventListener('click', (e) => {
      e.stopPropagation();
      optionsWrapper.classList.remove('active');
      openCinemaFullscreen(e, activeIndex);
    });

    optLink?.addEventListener('click', () => {
      optionsWrapper?.classList.remove('active');
    });

    optCopyLink?.addEventListener('click', (e) => {
      e.stopPropagation();
      optionsWrapper.classList.remove('active');
      const track = TRACKS[activeIndex] || TRACKS[0];
      const link = track.url;
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(link).then(() => {
          showToast('Project link copied to clipboard!');
        }).catch(() => {
          showToast(`Link: ${link}`);
        });
      } else {
        showToast(`Link: ${link}`);
      }
    });

    let isFavorite = false;
    optFavorite?.addEventListener('click', (e) => {
      e.stopPropagation();
      isFavorite = !isFavorite;
      if (isFavorite) {
        optFavorite.classList.add('is-loved');
        showToast('Added to Favorite Tracks ❤️');
      } else {
        optFavorite.classList.remove('is-loved');
        showToast('Removed from Favorites');
      }
    });
  }

  // Right Controls: Lyrics & Queue drawers
  function closeAllDrawers() {
    lyricsDrawer?.classList.remove('is-active');
    queueDrawer?.classList.remove('is-active');
    btnLyrics?.classList.remove('active');
    btnQueue?.classList.remove('active');
  }

  btnLyrics?.addEventListener('click', (e) => {
    e.stopPropagation();
    const willOpen = !lyricsDrawer?.classList.contains('is-active');
    closeAllDrawers();
    if (willOpen) {
      lyricsDrawer?.classList.add('is-active');
      btnLyrics?.classList.add('active');
    }
  });

  lyricsClose?.addEventListener('click', (e) => {
    e.stopPropagation();
    lyricsDrawer?.classList.remove('is-active');
    btnLyrics?.classList.remove('active');
  });

  btnQueue?.addEventListener('click', (e) => {
    e.stopPropagation();
    const willOpen = !queueDrawer?.classList.contains('is-active');
    closeAllDrawers();
    if (willOpen) {
      queueDrawer?.classList.add('is-active');
      btnQueue?.classList.add('active');
    }
  });

  queueClose?.addEventListener('click', (e) => {
    e.stopPropagation();
    queueDrawer?.classList.remove('is-active');
    btnQueue?.classList.remove('active');
  });

  // Volume slider & button
  if (volumeSlider) {
    const onVolumeChange = (e) => {
      const val = parseFloat(e.target.value) / 100;
      applyVolume(val, val === 0);
    };
    volumeSlider.addEventListener('input', onVolumeChange);
    volumeSlider.addEventListener('change', onVolumeChange);

    const startDrag = () => {
      volumeWrapper?.classList.add('is-dragging', 'active');
    };
    const endDrag = () => {
      volumeWrapper?.classList.remove('is-dragging');
    };
    volumeSlider.addEventListener('mousedown', startDrag);
    volumeSlider.addEventListener('touchstart', startDrag, { passive: true });
    window.addEventListener('mouseup', endDrag);
    window.addEventListener('touchend', endDrag);
  }

  if (btnVolume) {
    btnVolume.addEventListener('click', (e) => {
      e.stopPropagation();
      optionsWrapper?.classList.remove('active');
      castWrapper?.classList.remove('active');
      const isCurrentlyActive = volumeWrapper?.classList.contains('active');
      if (!isCurrentlyActive) {
        volumeWrapper?.classList.add('active');
      } else {
        isMuted = !isMuted;
        applyVolume(currentVolume || 0.8, isMuted);
        showToast(isMuted ? 'Muted' : `Volume ${Math.round((currentVolume || 0.8) * 100)}%`);
      }
    });

    btnVolume.addEventListener('dblclick', (e) => {
      e.stopPropagation();
      isMuted = !isMuted;
      applyVolume(currentVolume || 0.8, isMuted);
      showToast(isMuted ? 'Muted' : `Volume ${Math.round((currentVolume || 0.8) * 100)}%`);
    });
  }

  if (volumeWrapper) {
    volumeWrapper.addEventListener('wheel', (e) => {
      e.preventDefault();
      const delta = e.deltaY < 0 ? 0.05 : -0.05;
      const nextVol = Math.max(0, Math.min(1, (isMuted ? 0 : currentVolume) + delta));
      applyVolume(nextVol, nextVol === 0);
      showToast(`Volume ${Math.round(nextVol * 100)}%`);
    }, { passive: false });
  }

  // Close popovers on click outside
  document.addEventListener('click', (e) => {
    if (!e.target.closest('#phonk-cast-wrapper')) {
      castWrapper?.classList.remove('active');
    }
    if (!e.target.closest('#phonk-options-wrapper')) {
      optionsWrapper?.classList.remove('active');
    }
    if (!e.target.closest('#phonk-volume-wrapper')) {
      volumeWrapper?.classList.remove('active');
    }
  });

  // Click on cards to bring them to center or trigger fullscreen
  cards.forEach((card, idx) => {
    card.addEventListener('click', (e) => {
      if (activeIndex === idx) {
        openCinemaFullscreen(e, idx);
      } else {
        setActiveTrack(idx, isPlaying);
      }
    });

    card.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        if (activeIndex === idx) {
          openCinemaFullscreen(e, idx);
        } else {
          setActiveTrack(idx, isPlaying);
        }
      }
    });
  });

  // Card Controls (Fullscreen button, sound toggle, reel wrap click)
  for (let idx = 0; idx <= 5; idx++) {
    const fsBtn = document.getElementById(`phonk-card-fs-btn-${idx}`);
    const soundBtn = document.getElementById(`phonk-card-sound-btn-${idx}`);
    const rWrap = document.getElementById(`phonk-reel-wrap-${idx}`);
    const cVid = getCardVideo(idx);

    fsBtn?.addEventListener('click', (e) => {
      e.stopPropagation();
      setActiveTrack(idx, false);
      openCinemaFullscreen(e, idx);
    });

    soundBtn?.addEventListener('click', (e) => {
      e.stopPropagation();
      isMuted = !isMuted;
      applyVolume(currentVolume, isMuted);
      showToast(isMuted ? 'Muted' : `Volume ${Math.round(currentVolume * 100)}%`);
    });

    rWrap?.addEventListener('click', (e) => {
      e.stopPropagation();
      if (activeIndex === idx) {
        openCinemaFullscreen(e, idx);
      } else {
        setActiveTrack(idx, isPlaying);
      }
    });

    cVid?.addEventListener('click', (e) => {
      e.stopPropagation();
      if (activeIndex === idx) {
        openCinemaFullscreen(e, idx);
      } else {
        setActiveTrack(idx, isPlaying);
      }
    });
  }

  // Swipe / Drag on Stage
  let touchStartX = 0;
  let touchEndX = 0;
  const stage = document.getElementById('phonk-coverflow-stage');
  if (stage) {
    stage.addEventListener('touchstart', (e) => {
      touchStartX = e.changedTouches[0].screenX;
    }, { passive: true });

    stage.addEventListener('touchend', (e) => {
      touchEndX = e.changedTouches[0].screenX;
      handleSwipe();
    }, { passive: true });

    let isMouseDown = false;
    stage.addEventListener('mousedown', (e) => {
      isMouseDown = true;
      touchStartX = e.clientX;
    });

    stage.addEventListener('mouseup', (e) => {
      if (!isMouseDown) return;
      isMouseDown = false;
      touchEndX = e.clientX;
      handleSwipe();
    });

    stage.addEventListener('mouseleave', () => {
      isMouseDown = false;
    });

    function handleSwipe() {
      const diff = touchEndX - touchStartX;
      if (Math.abs(diff) > 40) {
        if (diff > 0) {
          setActiveTrack(activeIndex - 1, isPlaying);
        } else {
          setActiveTrack(activeIndex + 1, isPlaying);
        }
      }
    }
  }

  // Cinema Fullscreen for Phonk Edits
  function openCinemaFullscreen(e, trackIndex = activeIndex) {
    if (e) e.stopPropagation();
    if (!cinemaModal || !cinemaVideo) return;

    isCinemaFromPhonk = true;
    const track = TRACKS[trackIndex] || TRACKS[0];
    const sourceVideo = getCardVideo(trackIndex);

    if (cinemaBadgeText) cinemaBadgeText.textContent = 'The "Aura" & Instagram Phonks';
    if (cinemaCaptionTitle) cinemaCaptionTitle.textContent = track.title;
    if (cinemaCaptionDesc) cinemaCaptionDesc.textContent = `${track.artist} • Tap video to Play/Pause • Press ESC to exit`;

    if (sourceVideo && sourceVideo.src) {
      if (!cinemaVideo.src.endsWith(sourceVideo.getAttribute('src'))) {
        cinemaVideo.src = sourceVideo.getAttribute('src');
      }
      cinemaVideo.currentTime = sourceVideo.currentTime || 0;
    }

    pauseAndMuteAllVideos('cinema');

    cinemaModal.classList.add('is-open');
    cinemaModal.setAttribute('aria-hidden', 'false');

    cinemaVideo.volume = currentVolume;
    cinemaVideo.muted = isMuted;

    cinemaVideo.play().then(() => {
      setPlayPauseState(true);
    }).catch(() => {
      cinemaVideo.muted = true;
      cinemaVideo.play().then(() => setPlayPauseState(true)).catch(() => { });
    });

    if (window.location.hash !== '#cinema-phonk') {
      if (window.history && window.history.pushState) {
        window.history.pushState({ modal: 'cinema-phonk' }, '', '#cinema-phonk');
      }
    }
  }

  function closeCinemaFullscreen(fromHistory = false) {
    if (!cinemaModal || !cinemaModal.classList.contains('is-open')) return;
    if (!isCinemaFromPhonk) return;

    const sourceVideo = getCardVideo(activeIndex);
    if (sourceVideo && cinemaVideo) {
      sourceVideo.currentTime = cinemaVideo.currentTime || 0;
    }

    cinemaVideo.pause();
    cinemaVideo.muted = true;
    isCinemaFromPhonk = false;

    cinemaModal.classList.remove('is-open');
    cinemaModal.setAttribute('aria-hidden', 'true');

    if (document.fullscreenElement || document.webkitFullscreenElement) {
      if (document.exitFullscreen) document.exitFullscreen().catch(() => { });
      else if (document.webkitExitFullscreen) document.webkitExitFullscreen().catch(() => { });
    }

    if (!fromHistory) {
      if (window.history && window.history.state && window.history.state.modal === 'cinema-phonk') {
        window.history.back();
      } else if (window.location.hash === '#cinema-phonk') {
        if (window.history && window.history.replaceState) {
          window.history.replaceState({ modal: 'phonk-player' }, '', '#phonk');
        }
      }
    }
  }

  // Modal Open & Close logic
  function openModal(pushHistory = true) {
    // Coordinate with other modals: pause and close them if open
    if (window.closeMotionGraphicsModal) window.closeMotionGraphicsModal(true);
    if (window.stopMotionGraphicsMedia) window.stopMotionGraphicsMedia(-1);
    if (window.closeHeadTalkingModal) window.closeHeadTalkingModal(true);
    if (window.stopHeadTalkingMedia) window.stopHeadTalkingMedia(-1);
    if (window.closeRealEstateModal) window.closeRealEstateModal(true);
    if (window.stopRealEstateMedia) window.stopRealEstateMedia(-1);
    if (window.closeCinematicModal) window.closeCinematicModal(true);
    if (window.stopCinematicMedia) window.stopCinematicMedia(-1);

    modal.classList.add('is-open');
    modal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';

    if (pushHistory && window.location.hash !== '#phonk') {
      if (window.history && window.history.pushState) {
        window.history.pushState({ modal: 'phonk-player' }, '', '#phonk');
      }
    }

    pauseAndMuteAllVideos(-1);
    setPlayPauseState(false);
    setActiveTrack(0, false);

    buildQueue();
    populateLyrics();
    updateCarousel(true);

    setTimeout(() => {
      updateCarousel();
    }, 50);
  }

  function closeModal(fromHistory = false) {
    if (!modal.classList.contains('is-open')) return;

    if (isCinemaFromPhonk) {
      closeCinemaFullscreen(fromHistory);
    }

    modal.classList.remove('is-open');
    modal.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';

    pauseAndMuteAllVideos(-1);
    setPlayPauseState(false);

    closeAllDrawers();
    castWrapper?.classList.remove('active');
    optionsWrapper?.classList.remove('active');
    volumeWrapper?.classList.remove('active');

    if (!fromHistory) {
      if (window.history && window.history.state && (window.history.state.modal === 'phonk-player' || window.history.state.modal === 'cinema-phonk')) {
        window.history.back();
      } else if (window.location.hash === '#phonk' || window.location.hash === '#cinema-phonk') {
        if (window.history && window.history.replaceState) {
          window.history.replaceState(null, '', window.location.pathname + window.location.search);
        }
      }
    }
  }

  window.stopPhonkMedia = pauseAndMuteAllVideos;
  window.closePhonkModal = closeModal;

  cardTrigger.addEventListener('click', (e) => {
    e.preventDefault();
    openModal();
  });

  cardTrigger.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      openModal();
    }
  });

  btnClose?.addEventListener('click', () => closeModal(false));
  backdrop?.addEventListener('click', () => closeModal(false));

  // History popstate
  window.addEventListener('popstate', (e) => {
    const isCinemaOpen = cinemaModal && cinemaModal.classList.contains('is-open') && isCinemaFromPhonk;
    const isPlayerOpen = modal && modal.classList.contains('is-open');

    if (isCinemaOpen) {
      closeCinemaFullscreen(true);
      if (!e.state || e.state.modal !== 'phonk-player') {
        closeModal(true);
      }
    } else if (isPlayerOpen) {
      closeModal(true);
    }
  });

  // Direct deep link check
  if (window.location.hash === '#phonk' || window.location.hash === '#phonk-edits') {
    openModal(false);
  }

  // Keyboard navigation when modal is open
  window.addEventListener('keydown', (e) => {
    if (!modal.classList.contains('is-open')) return;

    if (cinemaModal && cinemaModal.classList.contains('is-open') && isCinemaFromPhonk) {
      if (e.key === 'Escape') {
        closeCinemaFullscreen();
      } else if (e.key === ' ' || e.code === 'Space') {
        e.preventDefault();
        if (cinemaVideo.paused) {
          cinemaVideo.play().catch(() => { });
        } else {
          cinemaVideo.pause();
        }
      } else if (e.key === 'm' || e.key === 'M') {
        e.preventDefault();
        isMuted = !isMuted;
        applyVolume(currentVolume, isMuted);
      }
      return;
    }

    if (e.key === 'Escape') {
      closeModal();
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault();
      setActiveTrack(activeIndex - 1, isPlaying);
    } else if (e.key === 'ArrowRight') {
      e.preventDefault();
      setActiveTrack(activeIndex + 1, isPlaying);
    } else if (e.key === ' ') {
      if (document.activeElement.tagName !== 'INPUT') {
        e.preventDefault();
        togglePlayPause();
      }
    }
  });

  window.addEventListener('resize', () => {
    if (modal.classList.contains('is-open')) {
      updateCarousel();
    }
  });
}

// ============================================================================
// 5.4. MODAL 4: REAL ESTATE WALKTHROUGHS SHOWCASE (#re-coverflow-modal)
// Grid Trigger: #card-real-estate (Card 4) | ID Prefix: "re-"
// HOW TO EDIT TRACKS: Locate the `TRACKS` array below to modify titles,
// artwork, links, audio durations, or lyrics.
// ============================================================================
function setupRealEstatePlayer() {
  const modal = document.getElementById('re-coverflow-modal');
  const cardTrigger = document.getElementById('card-real-estate');
  const btnClose = document.getElementById('re-coverflow-btn-close');
  const backdrop = document.getElementById('re-coverflow-backdrop');
  const deck = document.getElementById('re-coverflow-deck');
  const cards = deck ? Array.from(deck.querySelectorAll('.cf-card')) : [];
  const btnPrev = document.getElementById('re-btn-prev');
  const btnNext = document.getElementById('re-btn-next');
  const stagePrev = document.getElementById('re-coverflow-prev');
  const stageNext = document.getElementById('re-coverflow-next');
  const btnPlayPause = document.getElementById('re-btn-playpause');
  const iconPlay = btnPlayPause?.querySelector('.icon-play');
  const iconPause = btnPlayPause?.querySelector('.icon-pause');
  const ambientGlow = document.getElementById('re-coverflow-ambient-glow');

  // Center Capsule elements
  const nowPlayingPill = document.getElementById('re-now-playing-pill');
  const npThumb = document.getElementById('re-np-thumb');
  const npTitle = document.getElementById('re-np-title');
  const npArtist = document.getElementById('re-np-artist');
  const npTime = document.getElementById('re-np-time');
  const progressFill = document.getElementById('re-progress-fill');
  const progressContainer = document.getElementById('re-progress-container');
  const playerPill = document.getElementById('re-player-pill');

  // Popover elements
  const castWrapper = document.getElementById('re-cast-wrapper');
  const btnCast = document.getElementById('re-btn-cast');
  const castPopover = document.getElementById('re-cast-popover');
  const deviceItems = castPopover ? Array.from(castPopover.querySelectorAll('.cf-device-item')) : [];

  const optionsWrapper = document.getElementById('re-options-wrapper');
  const btnOptions = document.getElementById('re-btn-options');
  const optFullscreen = document.getElementById('re-opt-fullscreen');
  const optLink = document.getElementById('re-opt-link');
  const optCopyLink = document.getElementById('re-opt-copylink');
  const optFavorite = document.getElementById('re-opt-favorite');
  const toast = document.getElementById('re-toast');

  // Drawers
  const btnLyrics = document.getElementById('re-btn-lyrics');
  const lyricsDrawer = document.getElementById('re-lyrics-drawer');
  const lyricsClose = document.getElementById('re-lyrics-close');
  const lyricsBody = document.getElementById('re-lyrics-body');
  const lyricsTrackTitle = document.getElementById('re-lyrics-track-title');

  const btnQueue = document.getElementById('re-btn-queue');
  const queueDrawer = document.getElementById('re-queue-drawer');
  const queueClose = document.getElementById('re-queue-close');
  const queueList = document.getElementById('re-queue-list');

  // Volume
  const volumeWrapper = document.getElementById('re-volume-wrapper');
  const btnVolume = document.getElementById('re-btn-volume');
  const volumeSlider = document.getElementById('re-volume-slider');

  // Card Videos (0 to 5)
  const cardVideos = [];
  for (let i = 0; i <= 5; i++) {
    cardVideos.push(document.getElementById(`re-card-video-${i}`));
  }

  // Shared Cinema Modal elements
  const cinemaModal = document.getElementById('cf-cinema-modal');
  const cinemaVideoBox = document.getElementById('cf-cinema-video-box');
  const cinemaVideo = document.getElementById('cf-cinema-video');
  const cinemaClose = document.getElementById('cf-cinema-close');
  const cinemaBackdrop = document.getElementById('cf-cinema-backdrop');
  const cinemaSoundToggle = document.getElementById('cf-cinema-sound-toggle');
  const cinemaFsToggle = document.getElementById('cf-cinema-fs-toggle');
  const cinemaPlayOverlay = document.getElementById('cf-cinema-play-overlay');
  const cinemaTimeline = document.getElementById('cf-cinema-timeline');
  const cinemaProgress = document.getElementById('cf-cinema-progress');
  const cinemaBadgeText = document.getElementById('cf-cinema-badge-text');
  const cinemaCaptionTitle = document.getElementById('cf-cinema-caption-title');
  const cinemaCaptionDesc = document.getElementById('cf-cinema-caption-desc');

  if (!modal || !cardTrigger) return;

  // Player State
  let activeIndex = 0;
  let isPlaying = false;
  let trackCurrentTime = 0;
  let progressTimer = null;
  let currentVolume = 0.8;
  let isMuted = false;
  let isCinemaFromRE = false;

  function getCardVideo(idx) {
    return cardVideos[idx] || null;
  }

  function stopProgressTimer() {
    if (progressTimer) {
      clearInterval(progressTimer);
      progressTimer = null;
    }
  }

  function pauseAndMuteAllVideos(exceptTarget = -1) {
    for (let i = 0; i <= 5; i++) {
      if (i !== exceptTarget) {
        const v = getCardVideo(i);
        if (v) {
          v.pause();
          v.muted = true;
        }
      }
    }
    if (cinemaVideo && exceptTarget !== 'cinema' && isCinemaFromRE) {
      cinemaVideo.pause();
      cinemaVideo.muted = true;
    }
    stopProgressTimer();
  }

  // Initial pause and mute
  pauseAndMuteAllVideos(-1);

  // Tracks Data for Real Estate Edits & Cinematic Walkthroughs
  const TRACKS = [
    {
      id: 0,
      title: 'Cinematic Drone Property Showcase',
      artist: 'Scenedrone & Aerial Cinematography',
      album: 'Pinterest Reel',
      image: 'images/music-player/realestate_drone.jpg',
      url: 'https://pin.it/7358IAF3D',
      duration: 36,
      accent: 'rgba(16, 185, 129, 0.55)',
      lyrics: [
        { time: 0, text: 'Aerial Drone Property Flythrough & Landscape Panorama' },
        { time: 8, text: 'Strategic pacing highlighting topography & plot boundary lines' },
        { time: 18, text: 'Crisp 60 FPS motion tracking & architectural value perception' },
        { time: 27, text: 'Cinematic color grading with rich shadows & balanced horizon' },
        { time: 34, text: 'Watch full showcase on Pinterest (@Scenedrone)' }
      ]
    },
    {
      id: 1,
      title: 'Real Estate Drone Tour & Animation',
      artist: 'RealEstateVisions & Aerial 3D',
      album: 'Pinterest Reel',
      image: 'images/music-player/re_reel_1.jpg',
      url: 'https://pin.it/72DYRHqQQ',
      duration: 34,
      accent: 'rgba(234, 179, 8, 0.55)',
      lyrics: [
        { time: 0, text: 'Real Estate Aerial Drone Capture & Neighborhood Views' },
        { time: 7, text: 'Animated Floor Plans, Callout Badges & Highlights' },
        { time: 16, text: 'Seamless Speed Transitions & Engaging Motion Graphics' },
        { time: 25, text: 'High Conversion Presentation for Real Estate Marketing' },
        { time: 32, text: 'Watch full video on Pinterest (@RealEstateVisions)' }
      ]
    },
    {
      id: 2,
      title: 'Aerial Land Survey & Motion Graphics',
      artist: 'RealEstateVisions & Aerial 3D',
      album: 'Pinterest Reel',
      image: 'images/music-player/re_reel_2.jpg',
      url: 'https://pin.it/1Ad2mNuYc',
      duration: 35,
      accent: 'rgba(14, 165, 233, 0.55)',
      lyrics: [
        { time: 0, text: 'Real Estate Drone Land Survey & Parcel Topography' },
        { time: 8, text: 'Animated Boundary Overlays, Land Measurements & Zones' },
        { time: 17, text: 'Motion Graphics Callouts & Geographic Context' },
        { time: 26, text: 'Commercial Marketing Elevation for Development Parcels' },
        { time: 33, text: 'Watch full video on Pinterest (@RealEstateVisions)' }
      ]
    },
    {
      id: 3,
      title: 'DSR Vatika — Luxury Villa Plots',
      artist: 'DSR Group & Premium Estates',
      album: 'Pinterest Reel',
      image: 'images/music-player/re_reel_3.jpg',
      url: 'https://pin.it/7aZqiM50w/',
      duration: 38,
      accent: 'rgba(242, 100, 64, 0.55)',
      lyrics: [
        { time: 0, text: 'DSR Vatika — 63-Acre Gated Community Aerial Showcase' },
        { time: 8, text: 'Grand Entrance, Tree-Lined Boulevards & Villa Plots' },
        { time: 18, text: 'Twin Premium Clubhouses, Sky Gym & Lifestyle Amenities' },
        { time: 28, text: 'Strategic Shamshabad Connectivity & Master Layout Plan' },
        { time: 36, text: 'Explore project details on Pinterest (@DSRGroup)' }
      ]
    },
    {
      id: 4,
      title: 'Industrial Plots in Kharkhoda',
      artist: 'WADI Group & Prime Industrial Land',
      album: 'Pinterest Reel',
      image: 'images/music-player/re_reel_4.jpg',
      url: 'https://pin.it/9uP3aObLh',
      duration: 26,
      accent: 'rgba(230, 0, 35, 0.55)',
      lyrics: [
        { time: 0, text: 'Prime Industrial Plots in Emerging Kharkhoda Hub' },
        { time: 6, text: 'Direct Expressway Connectivity & Delhi-NCR Proximity' },
        { time: 13, text: 'Rapid Infrastructure Growth & High-Yield Logistics Corridor' },
        { time: 20, text: 'Strategic Industrial Plot Allocations & Investment Potential' },
        { time: 24, text: 'View full investment presentation on Pinterest (@WADIGroup)' }
      ]
    },
    {
      id: 5,
      title: 'Freehold Industrial Plots in Kharkhoda',
      artist: 'WADI Group & Commercial Real Estate',
      album: 'Pinterest Reel',
      image: 'images/music-player/re_reel_5.jpg',
      url: 'https://pin.it/3AzTgCPTM',
      duration: 32,
      accent: 'rgba(59, 130, 246, 0.55)',
      lyrics: [
        { time: 0, text: 'Establish Your Industrial Base in Kharkhoda Hub' },
        { time: 7, text: 'Prime Freehold Plots with Custom Facility Development' },
        { time: 15, text: 'Strategic Proximity to Major Manufacturing Corridors' },
        { time: 24, text: 'Comprehensive Infrastructure, Power & Road Access' },
        { time: 30, text: 'Connect with WADI Group on Pinterest (@WADIGroup)' }
      ]
    }
  ];

  function formatTime(sec) {
    if (isNaN(sec) || sec < 0) return '0:00';
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  }

  // 3D Cover Flow layout calculation
  function updateCarousel(instant = false) {
    const isMobile = window.innerWidth < 640;
    const isTablet = window.innerWidth < 1024;

    const xOffset1 = isMobile ? 120 : isTablet ? 170 : 210;
    const xOffset2 = isMobile ? 220 : isTablet ? 320 : 400;
    const zOffset1 = isMobile ? -60 : -80;
    const zOffset2 = isMobile ? -120 : -160;
    const rot1 = isMobile ? 20 : 26;
    const rot2 = isMobile ? 32 : 40;

    cards.forEach((card, idx) => {
      const diff = idx - activeIndex;

      if (instant) {
        card.style.transition = 'none';
      } else {
        card.style.transition = 'transform 0.6s cubic-bezier(0.25, 1, 0.5, 1), opacity 0.5s ease, filter 0.5s ease, box-shadow 0.6s ease';
      }

      if (diff === 0) {
        card.classList.add('active');
        card.style.transform = 'translate3d(0, 0, 40px) rotateY(0deg) scale(1)';
        card.style.zIndex = '10';
        card.style.opacity = '1';
        card.style.filter = 'brightness(1)';
        card.style.pointerEvents = 'auto';
      } else if (diff === -1) {
        card.classList.remove('active');
        card.style.transform = `translate3d(-${xOffset1}px, 0, ${zOffset1}px) rotateY(${rot1}deg) scale(0.85)`;
        card.style.zIndex = '7';
        card.style.opacity = '0.92';
        card.style.filter = 'brightness(0.82)';
        card.style.pointerEvents = 'auto';
      } else if (diff === -2) {
        card.classList.remove('active');
        card.style.transform = `translate3d(-${xOffset2}px, 0, ${zOffset2}px) rotateY(${rot2}deg) scale(0.72)`;
        card.style.zIndex = '4';
        card.style.opacity = '0.75';
        card.style.filter = 'brightness(0.6)';
        card.style.pointerEvents = 'auto';
      } else if (diff === 1) {
        card.classList.remove('active');
        card.style.transform = `translate3d(${xOffset1}px, 0, ${zOffset1}px) rotateY(-${rot1}deg) scale(0.85)`;
        card.style.zIndex = '7';
        card.style.opacity = '0.92';
        card.style.filter = 'brightness(0.82)';
        card.style.pointerEvents = 'auto';
      } else if (diff === 2) {
        card.classList.remove('active');
        card.style.transform = `translate3d(${xOffset2}px, 0, ${zOffset2}px) rotateY(-${rot2}deg) scale(0.72)`;
        card.style.zIndex = '4';
        card.style.opacity = '0.75';
        card.style.filter = 'brightness(0.6)';
        card.style.pointerEvents = 'auto';
      } else {
        card.classList.remove('active');
        const sign = diff > 0 ? 1 : -1;
        card.style.transform = `translate3d(${sign * (xOffset2 + 100)}px, 0, -260px) rotateY(${-sign * 50}deg) scale(0.55)`;
        card.style.zIndex = '1';
        card.style.opacity = '0';
        card.style.filter = 'brightness(0.3)';
        card.style.pointerEvents = 'none';
      }
    });

    // Update ambient mood glow
    const track = TRACKS[activeIndex];
    if (ambientGlow && track) {
      ambientGlow.style.background = `radial-gradient(circle, ${track.accent} 0%, rgba(16, 185, 129, 0.06) 55%, transparent 75%)`;
    }

    // Update Player bar UI
    if (track) {
      if (npThumb) npThumb.src = track.image;
      if (npTitle) npTitle.textContent = track.title;
      if (npArtist) npArtist.textContent = track.artist;
      if (lyricsTrackTitle) lyricsTrackTitle.textContent = `${track.artist} — ${track.title}`;
      if (optLink && track.url) {
        optLink.href = track.url;
      }
      updateProgressDisplay();
      populateLyrics();
      updateQueueActiveItem();
    }
  }

  // Switch Active Track
  function setActiveTrack(index, restartAudio = false) {
    if (index < 0) index = TRACKS.length - 1;
    if (index >= TRACKS.length) index = 0;

    activeIndex = index;
    trackCurrentTime = 0;

    updateCarousel();
    pauseAndMuteAllVideos(activeIndex);

    const activeVid = getCardVideo(activeIndex);
    if (activeVid) {
      activeVid.currentTime = 0;
      if (isPlaying || restartAudio) {
        activeVid.volume = currentVolume;
        activeVid.muted = isMuted;
        activeVid.play().then(() => {
          setPlayPauseState(true);
        }).catch(() => {
          activeVid.muted = true;
          activeVid.play().then(() => setPlayPauseState(true)).catch(() => setPlayPauseState(false));
        });
      } else {
        activeVid.pause();
        activeVid.muted = true;
        setPlayPauseState(false);
      }
    }
  }

  function updateProgressDisplay() {
    const track = TRACKS[activeIndex];
    if (!track) return;

    if (npTime) {
      npTime.textContent = `${formatTime(trackCurrentTime)} / ${formatTime(track.duration)}`;
    }

    if (progressFill) {
      const pct = Math.min(100, Math.max(0, (trackCurrentTime / track.duration) * 100));
      progressFill.style.width = pct.toFixed(2) + '%';
    }

    updateActiveLyricLine();
  }

  function populateLyrics() {
    if (!lyricsBody) return;
    lyricsBody.innerHTML = '';
    const track = TRACKS[activeIndex];
    if (!track || !track.lyrics) return;

    track.lyrics.forEach((item) => {
      const p = document.createElement('p');
      p.className = 'cf-lyric-line';
      p.dataset.time = item.time;
      p.textContent = item.text;
      p.addEventListener('click', () => {
        const activeVid = getCardVideo(activeIndex);
        if (activeVid) {
          activeVid.currentTime = item.time;
        }
        trackCurrentTime = item.time;
        updateProgressDisplay();
      });
      lyricsBody.appendChild(p);
    });
    updateActiveLyricLine();
  }

  function updateActiveLyricLine() {
    if (!lyricsBody) return;
    const lines = lyricsBody.querySelectorAll('.cf-lyric-line');
    let currentLine = null;
    lines.forEach((l) => {
      const t = parseFloat(l.dataset.time || '0');
      if (trackCurrentTime >= t) {
        currentLine = l;
      }
    });

    lines.forEach((l) => l.classList.remove('is-active'));
    if (currentLine) {
      currentLine.classList.add('is-active');
      currentLine.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }

  function buildQueue() {
    if (!queueList) return;
    queueList.innerHTML = '';
    TRACKS.forEach((t, i) => {
      const item = document.createElement('div');
      item.className = `cf-queue-item ${i === activeIndex ? 'active' : ''}`;
      item.dataset.index = i;
      item.innerHTML = `
        <span class="cf-qi-num">${i + 1}</span>
        <img class="cf-qi-thumb" src="${t.image}" alt="${t.title}" />
        <div class="cf-qi-info">
          <span class="cf-qi-title">${t.title}</span>
          <span class="cf-qi-artist">${t.artist}</span>
        </div>
        <span class="cf-qi-duration">${formatTime(t.duration)}</span>
      `;
      item.addEventListener('click', () => {
        setActiveTrack(i, isPlaying);
        closeAllDrawers();
      });
      queueList.appendChild(item);
    });
  }

  function updateQueueActiveItem() {
    if (!queueList) return;
    const items = queueList.querySelectorAll('.cf-queue-item');
    items.forEach((it) => {
      const idx = parseInt(it.dataset.index, 10);
      if (idx === activeIndex) it.classList.add('active');
      else it.classList.remove('active');
    });
  }

  let toastTimer = null;
  function showToast(msg) {
    if (!toast) return;
    toast.textContent = msg;
    toast.classList.add('is-active');
    toast.setAttribute('aria-hidden', 'false');
    if (toastTimer) clearTimeout(toastTimer);
    toastTimer = setTimeout(() => {
      toast.classList.remove('is-active');
      toast.setAttribute('aria-hidden', 'true');
    }, 2400);
  }

  function setPlayPauseState(playing) {
    isPlaying = playing;
    if (iconPlay) iconPlay.style.display = playing ? 'none' : 'block';
    if (iconPause) iconPause.style.display = playing ? 'block' : 'none';
    if (playerPill) {
      if (playing) playerPill.classList.add('is-playing');
      else playerPill.classList.remove('is-playing');
    }
  }

  function applyVolume(vol, muted) {
    currentVolume = Math.max(0, Math.min(1, vol));
    isMuted = !!muted || currentVolume === 0;

    const isCinemaOpen = cinemaModal && cinemaModal.classList.contains('is-open');

    for (let i = 0; i <= 5; i++) {
      const v = getCardVideo(i);
      if (v) {
        if (!isCinemaOpen && i === activeIndex && isPlaying) {
          v.volume = currentVolume;
          v.muted = isMuted;
        } else {
          v.muted = true;
        }
      }
    }

    if (cinemaVideo && isCinemaFromRE) {
      cinemaVideo.volume = currentVolume;
      cinemaVideo.muted = isMuted;
    }

    // Update sound buttons UI on cards
    for (let i = 0; i <= 5; i++) {
      const btn = document.getElementById(`re-card-sound-btn-${i}`);
      if (!btn) continue;
      const iconMuted = btn.querySelector('.icon-muted');
      const iconUnmuted = btn.querySelector('.icon-unmuted');
      if (isMuted) {
        iconMuted?.style.setProperty('display', 'block');
        iconUnmuted?.style.setProperty('display', 'none');
      } else {
        iconMuted?.style.setProperty('display', 'none');
        iconUnmuted?.style.setProperty('display', 'block');
      }
    }

    const volPct = isMuted ? 0 : Math.round(currentVolume * 100);
    if (volumeSlider) {
      volumeSlider.value = volPct;
      volumeSlider.style.setProperty('--vol-pct', volPct + '%');
    }
    const valDisplay = document.getElementById('re-volume-val');
    if (valDisplay) {
      valDisplay.textContent = volPct + '%';
    }
    if (btnVolume) {
      const vUnmuted = btnVolume.querySelector('.vol-icon-unmuted');
      const vMuted = btnVolume.querySelector('.vol-icon-muted');
      if (isMuted) {
        vUnmuted?.style.setProperty('display', 'none');
        vMuted?.style.setProperty('display', 'block');
      } else {
        vUnmuted?.style.setProperty('display', 'block');
        vMuted?.style.setProperty('display', 'none');
      }
    }
  }

  // Play / Pause Toggle
  function togglePlayPause() {
    const activeVid = getCardVideo(activeIndex);
    if (!activeVid) return;

    pauseAndMuteAllVideos(activeIndex);

    if (activeVid.paused) {
      activeVid.volume = currentVolume;
      activeVid.muted = isMuted;
      activeVid.play().then(() => {
        setPlayPauseState(true);
      }).catch(() => {
        activeVid.muted = true;
        activeVid.play().then(() => setPlayPauseState(true)).catch(() => { });
      });
    } else {
      activeVid.pause();
      setPlayPauseState(false);
    }
  }

  // Scrubber scrubbing
  if (progressContainer) {
    function handleScrub(e) {
      const rect = progressContainer.getBoundingClientRect();
      const clientX = e.clientX !== undefined ? e.clientX : (e.touches && e.touches[0] ? e.touches[0].clientX : 0);
      const clickX = clientX - rect.left;
      const pct = Math.max(0, Math.min(1, clickX / rect.width));
      const track = TRACKS[activeIndex];
      const activeVid = getCardVideo(activeIndex);

      if (activeVid) {
        const duration = activeVid.duration || (track ? track.duration : 30);
        activeVid.currentTime = pct * duration;
        trackCurrentTime = activeVid.currentTime;
        if (progressFill) progressFill.style.width = (pct * 100).toFixed(2) + '%';
        if (npTime) npTime.textContent = `${formatTime(trackCurrentTime)} / ${formatTime(duration)}`;
      }
    }

    let isScrubbing = false;
    progressContainer.addEventListener('mousedown', (e) => {
      isScrubbing = true;
      handleScrub(e);
    });
    window.addEventListener('mousemove', (e) => {
      if (isScrubbing) handleScrub(e);
    });
    window.addEventListener('mouseup', () => {
      isScrubbing = false;
    });
    progressContainer.addEventListener('touchstart', (e) => {
      handleScrub(e);
    }, { passive: true });
    progressContainer.addEventListener('touchmove', (e) => {
      handleScrub(e);
    }, { passive: true });
  }

  // Video sync events
  cardVideos.forEach((videoEl, trackIdx) => {
    if (!videoEl) return;
    videoEl.addEventListener('play', () => {
      if (!modal.classList.contains('is-open')) {
        videoEl.pause();
        videoEl.muted = true;
        return;
      }
      if (cinemaModal && cinemaModal.classList.contains('is-open')) {
        videoEl.pause();
        videoEl.muted = true;
        return;
      }
      if (activeIndex === trackIdx) {
        setPlayPauseState(true);
        pauseAndMuteAllVideos(trackIdx);
      } else {
        videoEl.pause();
        videoEl.muted = true;
      }
    });

    videoEl.addEventListener('pause', () => {
      if (activeIndex === trackIdx && (!cinemaModal || !cinemaModal.classList.contains('is-open'))) {
        setPlayPauseState(false);
      }
    });

    videoEl.addEventListener('timeupdate', () => {
      if (activeIndex === trackIdx && videoEl.duration) {
        trackCurrentTime = videoEl.currentTime;
        const pct = (videoEl.currentTime / videoEl.duration) * 100;
        if (progressFill) progressFill.style.width = pct.toFixed(2) + '%';
        if (npTime) {
          npTime.textContent = `${formatTime(videoEl.currentTime)} / ${formatTime(videoEl.duration)}`;
        }
        updateActiveLyricLine();
      }
    });

    videoEl.addEventListener('loadedmetadata', () => {
      if (videoEl.duration && !isNaN(videoEl.duration)) {
        if (TRACKS[trackIdx]) {
          TRACKS[trackIdx].duration = Math.round(videoEl.duration);
        }
        if (activeIndex === trackIdx) {
          updateProgressDisplay();
        }
      }
    });

    videoEl.addEventListener('ended', () => {
      if (activeIndex === trackIdx) {
        videoEl.currentTime = 0;
        videoEl.play().catch(() => { });
      }
    });
  });

  // Left Controls: Prev, Next, Play/Pause
  btnPrev?.addEventListener('click', (e) => {
    e.stopPropagation();
    setActiveTrack(activeIndex - 1, isPlaying);
  });
  btnNext?.addEventListener('click', (e) => {
    e.stopPropagation();
    setActiveTrack(activeIndex + 1, isPlaying);
  });
  stagePrev?.addEventListener('click', (e) => {
    e.stopPropagation();
    setActiveTrack(activeIndex - 1, isPlaying);
  });
  stageNext?.addEventListener('click', (e) => {
    e.stopPropagation();
    setActiveTrack(activeIndex + 1, isPlaying);
  });
  btnPlayPause?.addEventListener('click', (e) => {
    e.stopPropagation();
    togglePlayPause();
  });

  // Center Capsule click -> open cinema mode
  nowPlayingPill?.addEventListener('click', (e) => {
    if (e.target.closest('#re-progress-container') || e.target.closest('.cf-np-icons')) {
      return;
    }
    openCinemaFullscreen(e, activeIndex);
  });

  // Cast Popover
  if (btnCast && castWrapper) {
    btnCast.addEventListener('click', (e) => {
      e.stopPropagation();
      optionsWrapper?.classList.remove('active');
      volumeWrapper?.classList.remove('active');
      castWrapper.classList.toggle('active');
    });

    deviceItems.forEach((item) => {
      item.addEventListener('click', (e) => {
        e.stopPropagation();
        const devName = item.dataset.device || item.textContent.trim();
        deviceItems.forEach((d) => {
          d.classList.remove('active');
          const chk = d.querySelector('.cf-device-check');
          if (chk) chk.style.display = 'none';
        });
        item.classList.add('active');
        const chk = item.querySelector('.cf-device-check');
        if (chk) chk.style.display = 'inline';

        castWrapper.classList.remove('active');
        showToast(`Connected to ${devName}`);
      });
    });
  }

  // Options Popover
  if (btnOptions && optionsWrapper) {
    btnOptions.addEventListener('click', (e) => {
      e.stopPropagation();
      castWrapper?.classList.remove('active');
      volumeWrapper?.classList.remove('active');
      optionsWrapper.classList.toggle('active');
    });

    optFullscreen?.addEventListener('click', (e) => {
      e.stopPropagation();
      optionsWrapper.classList.remove('active');
      openCinemaFullscreen(e, activeIndex);
    });

    optLink?.addEventListener('click', () => {
      optionsWrapper?.classList.remove('active');
    });

    optCopyLink?.addEventListener('click', (e) => {
      e.stopPropagation();
      optionsWrapper.classList.remove('active');
      const track = TRACKS[activeIndex] || TRACKS[0];
      const link = track.url;
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(link).then(() => {
          showToast('Project link copied to clipboard!');
        }).catch(() => {
          showToast(`Link: ${link}`);
        });
      } else {
        showToast(`Link: ${link}`);
      }
    });

    let isFavorite = false;
    optFavorite?.addEventListener('click', (e) => {
      e.stopPropagation();
      isFavorite = !isFavorite;
      if (isFavorite) {
        optFavorite.classList.add('is-loved');
        showToast('Added to Favorite Tracks ❤️');
      } else {
        optFavorite.classList.remove('is-loved');
        showToast('Removed from Favorites');
      }
    });
  }

  // Right Controls: Lyrics & Queue drawers
  function closeAllDrawers() {
    lyricsDrawer?.classList.remove('is-active');
    queueDrawer?.classList.remove('is-active');
    btnLyrics?.classList.remove('active');
    btnQueue?.classList.remove('active');
  }

  btnLyrics?.addEventListener('click', (e) => {
    e.stopPropagation();
    const willOpen = !lyricsDrawer?.classList.contains('is-active');
    closeAllDrawers();
    if (willOpen) {
      lyricsDrawer?.classList.add('is-active');
      btnLyrics?.classList.add('active');
    }
  });

  lyricsClose?.addEventListener('click', (e) => {
    e.stopPropagation();
    lyricsDrawer?.classList.remove('is-active');
    btnLyrics?.classList.remove('active');
  });

  btnQueue?.addEventListener('click', (e) => {
    e.stopPropagation();
    const willOpen = !queueDrawer?.classList.contains('is-active');
    closeAllDrawers();
    if (willOpen) {
      queueDrawer?.classList.add('is-active');
      btnQueue?.classList.add('active');
    }
  });

  queueClose?.addEventListener('click', (e) => {
    e.stopPropagation();
    queueDrawer?.classList.remove('is-active');
    btnQueue?.classList.remove('active');
  });

  // Volume slider & button
  if (volumeSlider) {
    const onVolumeChange = (e) => {
      const val = parseFloat(e.target.value) / 100;
      applyVolume(val, val === 0);
    };
    volumeSlider.addEventListener('input', onVolumeChange);
    volumeSlider.addEventListener('change', onVolumeChange);

    const startDrag = () => {
      volumeWrapper?.classList.add('is-dragging', 'active');
    };
    const endDrag = () => {
      volumeWrapper?.classList.remove('is-dragging');
    };
    volumeSlider.addEventListener('mousedown', startDrag);
    volumeSlider.addEventListener('touchstart', startDrag, { passive: true });
    window.addEventListener('mouseup', endDrag);
    window.addEventListener('touchend', endDrag);
  }

  if (btnVolume) {
    btnVolume.addEventListener('click', (e) => {
      e.stopPropagation();
      optionsWrapper?.classList.remove('active');
      castWrapper?.classList.remove('active');
      const isCurrentlyActive = volumeWrapper?.classList.contains('active');
      if (!isCurrentlyActive) {
        volumeWrapper?.classList.add('active');
      } else {
        isMuted = !isMuted;
        applyVolume(currentVolume || 0.8, isMuted);
        showToast(isMuted ? 'Muted' : `Volume ${Math.round((currentVolume || 0.8) * 100)}%`);
      }
    });

    btnVolume.addEventListener('dblclick', (e) => {
      e.stopPropagation();
      isMuted = !isMuted;
      applyVolume(currentVolume || 0.8, isMuted);
      showToast(isMuted ? 'Muted' : `Volume ${Math.round((currentVolume || 0.8) * 100)}%`);
    });
  }

  if (volumeWrapper) {
    volumeWrapper.addEventListener('wheel', (e) => {
      e.preventDefault();
      const delta = e.deltaY < 0 ? 0.05 : -0.05;
      const nextVol = Math.max(0, Math.min(1, (isMuted ? 0 : currentVolume) + delta));
      applyVolume(nextVol, nextVol === 0);
      showToast(`Volume ${Math.round(nextVol * 100)}%`);
    }, { passive: false });
  }

  // Close popovers on click outside
  document.addEventListener('click', (e) => {
    if (!e.target.closest('#re-cast-wrapper')) {
      castWrapper?.classList.remove('active');
    }
    if (!e.target.closest('#re-options-wrapper')) {
      optionsWrapper?.classList.remove('active');
    }
    if (!e.target.closest('#re-volume-wrapper')) {
      volumeWrapper?.classList.remove('active');
    }
  });

  // Click on cards to bring them to center or trigger fullscreen
  cards.forEach((card, idx) => {
    card.addEventListener('click', (e) => {
      if (activeIndex === idx) {
        openCinemaFullscreen(e, idx);
      } else {
        setActiveTrack(idx, isPlaying);
      }
    });

    card.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        if (activeIndex === idx) {
          openCinemaFullscreen(e, idx);
        } else {
          setActiveTrack(idx, isPlaying);
        }
      }
    });
  });

  // Card Controls (Fullscreen button, sound toggle, reel wrap click)
  for (let idx = 0; idx <= 5; idx++) {
    const fsBtn = document.getElementById(`re-card-fs-btn-${idx}`);
    const soundBtn = document.getElementById(`re-card-sound-btn-${idx}`);
    const rWrap = document.getElementById(`re-reel-wrap-${idx}`);
    const cVid = getCardVideo(idx);

    fsBtn?.addEventListener('click', (e) => {
      e.stopPropagation();
      setActiveTrack(idx, false);
      openCinemaFullscreen(e, idx);
    });

    soundBtn?.addEventListener('click', (e) => {
      e.stopPropagation();
      isMuted = !isMuted;
      applyVolume(currentVolume, isMuted);
      showToast(isMuted ? 'Muted' : `Volume ${Math.round(currentVolume * 100)}%`);
    });

    rWrap?.addEventListener('click', (e) => {
      e.stopPropagation();
      if (activeIndex === idx) {
        openCinemaFullscreen(e, idx);
      } else {
        setActiveTrack(idx, isPlaying);
      }
    });

    cVid?.addEventListener('click', (e) => {
      e.stopPropagation();
      if (activeIndex === idx) {
        openCinemaFullscreen(e, idx);
      } else {
        setActiveTrack(idx, isPlaying);
      }
    });
  }

  // Swipe / Drag on Stage
  let touchStartX = 0;
  let touchEndX = 0;
  const stage = document.getElementById('re-coverflow-stage');
  if (stage) {
    stage.addEventListener('touchstart', (e) => {
      touchStartX = e.changedTouches[0].screenX;
    }, { passive: true });

    stage.addEventListener('touchend', (e) => {
      touchEndX = e.changedTouches[0].screenX;
      handleSwipe();
    }, { passive: true });

    let isMouseDown = false;
    stage.addEventListener('mousedown', (e) => {
      isMouseDown = true;
      touchStartX = e.clientX;
    });

    stage.addEventListener('mouseup', (e) => {
      if (!isMouseDown) return;
      isMouseDown = false;
      touchEndX = e.clientX;
      handleSwipe();
    });

    stage.addEventListener('mouseleave', () => {
      isMouseDown = false;
    });

    function handleSwipe() {
      const diff = touchEndX - touchStartX;
      if (Math.abs(diff) > 40) {
        if (diff > 0) {
          setActiveTrack(activeIndex - 1, isPlaying);
        } else {
          setActiveTrack(activeIndex + 1, isPlaying);
        }
      }
    }
  }

  // Cinema Fullscreen for Real Estate Edits
  function openCinemaFullscreen(e, trackIndex = activeIndex) {
    if (e) e.stopPropagation();
    if (!cinemaModal || !cinemaVideo) return;

    isCinemaFromRE = true;
    const track = TRACKS[trackIndex] || TRACKS[0];
    const sourceVideo = getCardVideo(trackIndex);

    if (cinemaBadgeText) cinemaBadgeText.textContent = 'Cinematic Walkthroughs & Real Estate';
    if (cinemaCaptionTitle) cinemaCaptionTitle.textContent = track.title;
    if (cinemaCaptionDesc) cinemaCaptionDesc.textContent = `${track.artist} • Tap video to Play/Pause • Press ESC to exit`;

    if (sourceVideo && sourceVideo.src) {
      if (!cinemaVideo.src.endsWith(sourceVideo.getAttribute('src'))) {
        cinemaVideo.src = sourceVideo.getAttribute('src');
      }
      cinemaVideo.currentTime = sourceVideo.currentTime || 0;
    }

    pauseAndMuteAllVideos('cinema');

    cinemaModal.classList.add('is-open');
    cinemaModal.setAttribute('aria-hidden', 'false');

    cinemaVideo.volume = currentVolume;
    cinemaVideo.muted = isMuted;

    cinemaVideo.play().then(() => {
      setPlayPauseState(true);
    }).catch(() => {
      cinemaVideo.muted = true;
      cinemaVideo.play().then(() => setPlayPauseState(true)).catch(() => { });
    });

    if (window.location.hash !== '#cinema-realestate') {
      if (window.history && window.history.pushState) {
        window.history.pushState({ modal: 'cinema-realestate' }, '', '#cinema-realestate');
      }
    }
  }

  function closeCinemaFullscreen(fromHistory = false) {
    if (!cinemaModal || !cinemaModal.classList.contains('is-open')) return;
    if (!isCinemaFromRE) return;

    const sourceVideo = getCardVideo(activeIndex);
    if (sourceVideo && cinemaVideo) {
      sourceVideo.currentTime = cinemaVideo.currentTime || 0;
    }

    cinemaVideo.pause();
    cinemaVideo.muted = true;
    isCinemaFromRE = false;

    cinemaModal.classList.remove('is-open');
    cinemaModal.setAttribute('aria-hidden', 'true');

    if (document.fullscreenElement || document.webkitFullscreenElement) {
      if (document.exitFullscreen) document.exitFullscreen().catch(() => { });
      else if (document.webkitExitFullscreen) document.webkitExitFullscreen().catch(() => { });
    }

    if (!fromHistory) {
      if (window.history && window.history.state && window.history.state.modal === 'cinema-realestate') {
        window.history.back();
      } else if (window.location.hash === '#cinema-realestate') {
        if (window.history && window.history.replaceState) {
          window.history.replaceState({ modal: 'realestate-player' }, '', '#realestate');
        }
      }
    }
  }

  // Modal Open & Close logic
  function openModal(pushHistory = true) {
    // Coordinate with other modals: pause and close them if open
    if (window.closeMotionGraphicsModal) window.closeMotionGraphicsModal(true);
    if (window.stopMotionGraphicsMedia) window.stopMotionGraphicsMedia(-1);
    if (window.closeHeadTalkingModal) window.closeHeadTalkingModal(true);
    if (window.stopHeadTalkingMedia) window.stopHeadTalkingMedia(-1);
    if (window.closePhonkModal) window.closePhonkModal(true);
    if (window.stopPhonkMedia) window.stopPhonkMedia(-1);
    if (window.closeCinematicModal) window.closeCinematicModal(true);
    if (window.stopCinematicMedia) window.stopCinematicMedia(-1);

    modal.classList.add('is-open');
    modal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';

    if (pushHistory && window.location.hash !== '#realestate') {
      if (window.history && window.history.pushState) {
        window.history.pushState({ modal: 'realestate-player' }, '', '#realestate');
      }
    }

    pauseAndMuteAllVideos(-1);
    setPlayPauseState(false);
    setActiveTrack(0, false);

    buildQueue();
    populateLyrics();
    updateCarousel(true);

    setTimeout(() => {
      updateCarousel();
    }, 50);
  }

  function closeModal(fromHistory = false) {
    if (!modal.classList.contains('is-open')) return;

    if (isCinemaFromRE) {
      closeCinemaFullscreen(fromHistory);
    }

    modal.classList.remove('is-open');
    modal.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';

    pauseAndMuteAllVideos(-1);
    setPlayPauseState(false);

    closeAllDrawers();
    castWrapper?.classList.remove('active');
    optionsWrapper?.classList.remove('active');
    volumeWrapper?.classList.remove('active');

    if (!fromHistory) {
      if (window.history && window.history.state && (window.history.state.modal === 'realestate-player' || window.history.state.modal === 'cinema-realestate')) {
        window.history.back();
      } else if (window.location.hash === '#realestate' || window.location.hash === '#cinema-realestate') {
        if (window.history && window.history.replaceState) {
          window.history.replaceState(null, '', window.location.pathname + window.location.search);
        }
      }
    }
  }

  window.stopRealEstateMedia = pauseAndMuteAllVideos;
  window.closeRealEstateModal = closeModal;

  cardTrigger.addEventListener('click', (e) => {
    e.preventDefault();
    openModal();
  });

  cardTrigger.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      openModal();
    }
  });

  btnClose?.addEventListener('click', () => closeModal(false));
  backdrop?.addEventListener('click', () => closeModal(false));

  // History popstate
  window.addEventListener('popstate', (e) => {
    const isCinemaOpen = cinemaModal && cinemaModal.classList.contains('is-open') && isCinemaFromRE;
    const isPlayerOpen = modal && modal.classList.contains('is-open');

    if (isCinemaOpen) {
      closeCinemaFullscreen(true);
      if (!e.state || e.state.modal !== 'realestate-player') {
        closeModal(true);
      }
    } else if (isPlayerOpen) {
      closeModal(true);
    }
  });

  // Direct deep link check
  if (window.location.hash === '#realestate' || window.location.hash === '#real-estate') {
    openModal(false);
  }

  // Keyboard navigation when modal is open
  window.addEventListener('keydown', (e) => {
    if (!modal.classList.contains('is-open')) return;

    if (cinemaModal && cinemaModal.classList.contains('is-open') && isCinemaFromRE) {
      if (e.key === 'Escape') {
        closeCinemaFullscreen();
      } else if (e.key === ' ' || e.code === 'Space') {
        e.preventDefault();
        if (cinemaVideo.paused) {
          cinemaVideo.play().catch(() => { });
        } else {
          cinemaVideo.pause();
        }
      } else if (e.key === 'm' || e.key === 'M') {
        e.preventDefault();
        isMuted = !isMuted;
        applyVolume(currentVolume, isMuted);
      }
      return;
    }

    if (e.key === 'Escape') {
      closeModal();
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault();
      setActiveTrack(activeIndex - 1, isPlaying);
    } else if (e.key === 'ArrowRight') {
      e.preventDefault();
      setActiveTrack(activeIndex + 1, isPlaying);
    } else if (e.key === ' ') {
      if (document.activeElement.tagName !== 'INPUT') {
        e.preventDefault();
        togglePlayPause();
      }
    }
  });

  window.addEventListener('resize', () => {
    if (modal.classList.contains('is-open')) {
      updateCarousel();
    }
  });
}

// ============================================================================
// 5.5. MODAL 5: CINEMATIC EDITS SHOWCASE (#ce-coverflow-modal)
// Grid Trigger: #card-cinematic-edits (Card 5) | ID Prefix: "ce-"
// HOW TO EDIT TRACKS: Locate the `TRACKS` array below to modify titles,
// artwork, links, audio durations, or lyrics.
// ============================================================================
function setupCinematicPlayer() {
  const modal = document.getElementById('ce-coverflow-modal');
  const cardTrigger = document.getElementById('card-cinematic-edits');
  const btnClose = document.getElementById('ce-coverflow-btn-close');
  const backdrop = document.getElementById('ce-coverflow-backdrop');
  const deck = document.getElementById('ce-coverflow-deck');
  const cards = deck ? Array.from(deck.querySelectorAll('.cf-card')) : [];
  const btnPrev = document.getElementById('ce-btn-prev');
  const btnNext = document.getElementById('ce-btn-next');
  const stagePrev = document.getElementById('ce-coverflow-prev');
  const stageNext = document.getElementById('ce-coverflow-next');
  const btnPlayPause = document.getElementById('ce-btn-playpause');
  const iconPlay = btnPlayPause?.querySelector('.icon-play');
  const iconPause = btnPlayPause?.querySelector('.icon-pause');
  const ambientGlow = document.getElementById('ce-coverflow-ambient-glow');

  // Center Capsule elements
  const nowPlayingPill = document.getElementById('ce-now-playing-pill');
  const npThumb = document.getElementById('ce-np-thumb');
  const npTitle = document.getElementById('ce-np-title');
  const npArtist = document.getElementById('ce-np-artist');
  const npTime = document.getElementById('ce-np-time');
  const progressFill = document.getElementById('ce-progress-fill');
  const progressContainer = document.getElementById('ce-progress-container');
  const playerPill = document.getElementById('ce-player-pill');

  // Popover elements
  const castWrapper = document.getElementById('ce-cast-wrapper');
  const btnCast = document.getElementById('ce-btn-cast');
  const castPopover = document.getElementById('ce-cast-popover');
  const deviceItems = castPopover ? Array.from(castPopover.querySelectorAll('.cf-device-item')) : [];

  const optionsWrapper = document.getElementById('ce-options-wrapper');
  const btnOptions = document.getElementById('ce-btn-options');
  const optFullscreen = document.getElementById('ce-opt-fullscreen');
  const optLink = document.getElementById('ce-opt-link');
  const optCopyLink = document.getElementById('ce-opt-copylink');
  const optFavorite = document.getElementById('ce-opt-favorite');
  const toast = document.getElementById('ce-toast');

  // Drawers
  const btnLyrics = document.getElementById('ce-btn-lyrics');
  const lyricsDrawer = document.getElementById('ce-lyrics-drawer');
  const lyricsClose = document.getElementById('ce-lyrics-close');
  const lyricsBody = document.getElementById('ce-lyrics-body');
  const lyricsTrackTitle = document.getElementById('ce-lyrics-track-title');

  const btnQueue = document.getElementById('ce-btn-queue');
  const queueDrawer = document.getElementById('ce-queue-drawer');
  const queueClose = document.getElementById('ce-queue-close');
  const queueList = document.getElementById('ce-queue-list');

  // Volume
  const volumeWrapper = document.getElementById('ce-volume-wrapper');
  const btnVolume = document.getElementById('ce-btn-volume');
  const volumeSlider = document.getElementById('ce-volume-slider');

  // Card Videos (0 to 5)
  const cardVideos = [];
  for (let i = 0; i <= 5; i++) {
    cardVideos.push(document.getElementById(`ce-card-video-${i}`));
  }

  // Shared Cinema Modal elements
  const cinemaModal = document.getElementById('cf-cinema-modal');
  const cinemaVideoBox = document.getElementById('cf-cinema-video-box');
  const cinemaVideo = document.getElementById('cf-cinema-video');
  const cinemaClose = document.getElementById('cf-cinema-close');
  const cinemaBackdrop = document.getElementById('cf-cinema-backdrop');
  const cinemaSoundToggle = document.getElementById('cf-cinema-sound-toggle');
  const cinemaFsToggle = document.getElementById('cf-cinema-fs-toggle');
  const cinemaPlayOverlay = document.getElementById('cf-cinema-play-overlay');
  const cinemaTimeline = document.getElementById('cf-cinema-timeline');
  const cinemaProgress = document.getElementById('cf-cinema-progress');
  const cinemaBadgeText = document.getElementById('cf-cinema-badge-text');
  const cinemaCaptionTitle = document.getElementById('cf-cinema-caption-title');
  const cinemaCaptionDesc = document.getElementById('cf-cinema-caption-desc');

  if (!modal || !cardTrigger) return;

  // Player State
  let activeIndex = 0;
  let isPlaying = false;
  let trackCurrentTime = 0;
  let progressTimer = null;
  let currentVolume = 0.8;
  let isMuted = false;
  let isCinemaFromCE = false;

  function getCardVideo(idx) {
    return cardVideos[idx] || null;
  }

  function stopProgressTimer() {
    if (progressTimer) {
      clearInterval(progressTimer);
      progressTimer = null;
    }
  }

  function pauseAndMuteAllVideos(exceptTarget = -1) {
    for (let i = 0; i <= 5; i++) {
      if (i !== exceptTarget) {
        const v = getCardVideo(i);
        if (v) {
          v.pause();
          v.muted = true;
        }
      }
    }
    if (cinemaVideo && exceptTarget !== 'cinema' && isCinemaFromCE) {
      cinemaVideo.pause();
      cinemaVideo.muted = true;
    }
    stopProgressTimer();
  }

  // Initial pause and mute
  pauseAndMuteAllVideos(-1);

  // Tracks Data for Cinematic Edits Showcase (Modal 5)
    const TRACKS = [
    {
      id: 0,
      title: 'Cinematic Film & Color Grade',
      artist: 'Visual Storytelling & Anamorphic Grading',
      album: 'Cinematic Showcase',
      image: 'images/music-player/cinematic_insta_reel.jpg',
      url: 'https://www.instagram.com/p/DUFiwA6EZZl/',
      duration: 32,
      accent: 'rgba(245, 158, 11, 0.55)',
      lyrics: [
        { time: 0, text: 'Anamorphic Lens Flare & 35mm Film Grain' },
        { time: 7, text: 'Moody Warm Amber & Teal Cinematic Grade' },
        { time: 15, text: 'Intense Story Pacing & Shallow Depth of Field' },
        { time: 24, text: 'Dynamic Rim Lighting & Film Master Aesthetic' },
        { time: 30, text: 'Watch full showcase reel' }
      ]
    },
    {
      id: 1,
      title: 'Moody Teal & Orange Grading',
      artist: 'Color Science & 35mm Emulation',
      album: 'Hollywood Grade',
      image: 'images/music-player/cinematic_insta_reel_1.jpg',
      url: 'https://www.instagram.com/p/Db8LHWZAQkz/',
      duration: 15,
      accent: 'rgba(14, 165, 233, 0.55)',
      lyrics: [
        { time: 0, text: 'Hollywood Blockbuster Palette Calibration' },
        { time: 4, text: 'Rich Shadow Density & Highlight Roll-off' },
        { time: 8, text: 'Clean Skin Tone Preservation in Mixed Light' },
        { time: 12, text: 'Film Halation & Custom Optical Curve' }
      ]
    },
    {
      id: 2,
      title: '35mm Grain & Warm Highlights',
      artist: 'Analog Texture & Halation',
      album: 'Vintage Cinema',
      image: 'images/music-player/cinematic_insta_reel_2.jpg',
      url: 'https://www.instagram.com/p/DbVmGwAAw8X/',
      duration: 12,
      accent: 'rgba(217, 119, 6, 0.55)',
      lyrics: [
        { time: 0, text: 'Analog Texture & 35mm Film Halation' },
        { time: 3, text: 'Warm Highlights & Organic Roll-off' },
        { time: 7, text: 'Authentic Kodak Film Stock Emulation' },
        { time: 10, text: 'Vintage Cinematic Grade & Depth' }
      ]
    },
    {
      id: 3,
      title: 'Anamorphic Flare & Dynamic Pacing',
      artist: 'Kinetic Cut & Sound Mix',
      album: 'High Energy Cinema',
      image: 'images/music-player/cinematic_insta_reel_3.jpg',
      url: 'https://www.instagram.com/p/DaLVRj0A9z4/',
      duration: 15,
      accent: 'rgba(249, 115, 22, 0.55)',
      lyrics: [
        { time: 0, text: 'Anamorphic Streak Flares & Optical Glow' },
        { time: 4, text: 'Kinetic Pacing & Beat Synchronization' },
        { time: 8, text: 'High-Energy Cinematic Impact Cut' },
        { time: 12, text: 'Dynamic Sound Design & Sound Effects' }
      ]
    },
    {
      id: 4,
      title: 'Teal & Orange Blockbuster Grade',
      artist: 'Hollywood Color Science',
      album: 'Theatrical Look',
      image: 'images/music-player/cinematic_insta_reel_4.jpg',
      url: 'https://www.instagram.com/p/DUvT5CUDf_w/',
      duration: 18,
      accent: 'rgba(20, 184, 166, 0.55)',
      lyrics: [
        { time: 0, text: 'Complementary Teal & Orange Color Contrast' },
        { time: 5, text: 'Rich Theatrical Shadows & Highlight Separation' },
        { time: 10, text: 'Hollywood Blockbuster Cinema Grading' },
        { time: 15, text: 'Lush Cinematic Skin Tone Balance' }
      ]
    },
    {
      id: 5,
      title: 'Low Light Neon Reflections',
      artist: 'Shadow Detail & HDR Look',
      album: 'Nightscape Visuals',
      image: 'images/music-player/cinematic_insta_reel_5.jpg',
      url: 'https://www.instagram.com/p/DUS7pXMEWy_/',
      duration: 20,
      accent: 'rgba(168, 85, 247, 0.55)',
      lyrics: [
        { time: 0, text: 'Low-Light Neon Reflections & Atmospheric Glow' },
        { time: 5, text: 'Deep Shadow Recovery & HDR Tone Mapping' },
        { time: 10, text: 'Vibrant Cyberpunk Chromatic Palette' },
        { time: 15, text: 'Rich Nightscape Visual Grading' }
      ]
    }
  ];

  function formatTime(sec) {
    if (isNaN(sec) || sec < 0) return '0:00';
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  }

  // 3D Cover Flow layout calculation
  function updateCarousel(instant = false) {
    const isMobile = window.innerWidth < 640;
    const isTablet = window.innerWidth < 1024;

    const xOffset1 = isMobile ? 120 : isTablet ? 170 : 210;
    const xOffset2 = isMobile ? 220 : isTablet ? 320 : 400;
    const zOffset1 = isMobile ? -60 : -80;
    const zOffset2 = isMobile ? -120 : -160;
    const rot1 = isMobile ? 20 : 26;
    const rot2 = isMobile ? 32 : 40;

    cards.forEach((card, idx) => {
      const diff = idx - activeIndex;

      if (instant) {
        card.style.transition = 'none';
      } else {
        card.style.transition = 'transform 0.6s cubic-bezier(0.25, 1, 0.5, 1), opacity 0.5s ease, filter 0.5s ease, box-shadow 0.6s ease';
      }

      if (diff === 0) {
        card.classList.add('active');
        card.style.transform = 'translate3d(0, 0, 40px) rotateY(0deg) scale(1)';
        card.style.zIndex = '10';
        card.style.opacity = '1';
        card.style.filter = 'brightness(1)';
        card.style.pointerEvents = 'auto';
      } else if (diff === -1) {
        card.classList.remove('active');
        card.style.transform = `translate3d(-${xOffset1}px, 0, ${zOffset1}px) rotateY(${rot1}deg) scale(0.85)`;
        card.style.zIndex = '7';
        card.style.opacity = '0.92';
        card.style.filter = 'brightness(0.82)';
        card.style.pointerEvents = 'auto';
      } else if (diff === -2) {
        card.classList.remove('active');
        card.style.transform = `translate3d(-${xOffset2}px, 0, ${zOffset2}px) rotateY(${rot2}deg) scale(0.72)`;
        card.style.zIndex = '4';
        card.style.opacity = '0.75';
        card.style.filter = 'brightness(0.6)';
        card.style.pointerEvents = 'auto';
      } else if (diff === 1) {
        card.classList.remove('active');
        card.style.transform = `translate3d(${xOffset1}px, 0, ${zOffset1}px) rotateY(-${rot1}deg) scale(0.85)`;
        card.style.zIndex = '7';
        card.style.opacity = '0.92';
        card.style.filter = 'brightness(0.82)';
        card.style.pointerEvents = 'auto';
      } else if (diff === 2) {
        card.classList.remove('active');
        card.style.transform = `translate3d(${xOffset2}px, 0, ${zOffset2}px) rotateY(-${rot2}deg) scale(0.72)`;
        card.style.zIndex = '4';
        card.style.opacity = '0.75';
        card.style.filter = 'brightness(0.6)';
        card.style.pointerEvents = 'auto';
      } else {
        card.classList.remove('active');
        const sign = diff > 0 ? 1 : -1;
        card.style.transform = `translate3d(${sign * (xOffset2 + 100)}px, 0, -260px) rotateY(${-sign * 50}deg) scale(0.55)`;
        card.style.zIndex = '1';
        card.style.opacity = '0';
        card.style.filter = 'brightness(0.3)';
        card.style.pointerEvents = 'none';
      }
    });

    // Update ambient mood glow
    const track = TRACKS[activeIndex];
    if (ambientGlow && track) {
      ambientGlow.style.background = `radial-gradient(circle, ${track.accent} 0%, rgba(245, 158, 11, 0.08) 55%, transparent 75%)`;
    }

    // Update Player bar UI
    if (track) {
      if (npThumb) npThumb.src = track.image;
      if (npTitle) npTitle.textContent = track.title;
      if (npArtist) npArtist.textContent = track.artist;
      if (lyricsTrackTitle) lyricsTrackTitle.textContent = `${track.artist} — ${track.title}`;
      if (optLink && track.url) {
        optLink.href = track.url;
      }
      updateProgressDisplay();
      populateLyrics();
      updateQueueActiveItem();
    }
  }

  // Switch Active Track
  function setActiveTrack(index, restartAudio = false) {
    if (index < 0) index = TRACKS.length - 1;
    if (index >= TRACKS.length) index = 0;

    activeIndex = index;
    trackCurrentTime = 0;

    updateCarousel();
    pauseAndMuteAllVideos(activeIndex);

    const activeVid = getCardVideo(activeIndex);
    if (activeVid) {
      activeVid.currentTime = 0;
      if (isPlaying || restartAudio) {
        activeVid.volume = currentVolume;
        activeVid.muted = isMuted;
        activeVid.play().then(() => {
          setPlayPauseState(true);
        }).catch(() => {
          activeVid.muted = true;
          activeVid.play().then(() => setPlayPauseState(true)).catch(() => setPlayPauseState(false));
        });
      } else {
        activeVid.pause();
        activeVid.muted = true;
        setPlayPauseState(false);
      }
    }
  }

  function updateProgressDisplay() {
    const track = TRACKS[activeIndex];
    if (!track) return;

    if (npTime) {
      npTime.textContent = `${formatTime(trackCurrentTime)} / ${formatTime(track.duration)}`;
    }

    if (progressFill) {
      const pct = Math.min(100, Math.max(0, (trackCurrentTime / track.duration) * 100));
      progressFill.style.width = pct.toFixed(2) + '%';
    }

    updateActiveLyricLine();
  }

  function populateLyrics() {
    if (!lyricsBody) return;
    lyricsBody.innerHTML = '';
    const track = TRACKS[activeIndex];
    if (!track || !track.lyrics) return;

    track.lyrics.forEach((item) => {
      const p = document.createElement('p');
      p.className = 'cf-lyric-line';
      p.dataset.time = item.time;
      p.textContent = item.text;
      p.addEventListener('click', () => {
        const activeVid = getCardVideo(activeIndex);
        if (activeVid) {
          activeVid.currentTime = item.time;
        }
        trackCurrentTime = item.time;
        updateProgressDisplay();
      });
      lyricsBody.appendChild(p);
    });
    updateActiveLyricLine();
  }

  function updateActiveLyricLine() {
    if (!lyricsBody) return;
    const lines = lyricsBody.querySelectorAll('.cf-lyric-line');
    let currentLine = null;
    lines.forEach((l) => {
      const t = parseFloat(l.dataset.time || '0');
      if (trackCurrentTime >= t) {
        currentLine = l;
      }
    });

    lines.forEach((l) => l.classList.remove('is-active'));
    if (currentLine) {
      currentLine.classList.add('is-active');
      currentLine.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }

  function buildQueue() {
    if (!queueList) return;
    queueList.innerHTML = '';
    TRACKS.forEach((t, i) => {
      const item = document.createElement('div');
      item.className = `cf-queue-item ${i === activeIndex ? 'active' : ''}`;
      item.dataset.index = i;
      item.innerHTML = `
        <span class="cf-qi-num">${i + 1}</span>
        <img class="cf-qi-thumb" src="${t.image}" alt="${t.title}" />
        <div class="cf-qi-info">
          <span class="cf-qi-title">${t.title}</span>
          <span class="cf-qi-artist">${t.artist}</span>
        </div>
        <span class="cf-qi-duration">${formatTime(t.duration)}</span>
      `;
      item.addEventListener('click', () => {
        setActiveTrack(i, isPlaying);
        closeAllDrawers();
      });
      queueList.appendChild(item);
    });
  }

  function updateQueueActiveItem() {
    if (!queueList) return;
    const items = queueList.querySelectorAll('.cf-queue-item');
    items.forEach((it) => {
      const idx = parseInt(it.dataset.index, 10);
      if (idx === activeIndex) it.classList.add('active');
      else it.classList.remove('active');
    });
  }

  let toastTimer = null;
  function showToast(msg) {
    if (!toast) return;
    toast.textContent = msg;
    toast.classList.add('is-active');
    toast.setAttribute('aria-hidden', 'false');
    if (toastTimer) clearTimeout(toastTimer);
    toastTimer = setTimeout(() => {
      toast.classList.remove('is-active');
      toast.setAttribute('aria-hidden', 'true');
    }, 2400);
  }

  function setPlayPauseState(playing) {
    isPlaying = playing;
    if (iconPlay) iconPlay.style.display = playing ? 'none' : 'block';
    if (iconPause) iconPause.style.display = playing ? 'block' : 'none';
    if (playerPill) {
      if (playing) playerPill.classList.add('is-playing');
      else playerPill.classList.remove('is-playing');
    }
  }

  function applyVolume(vol, muted) {
    currentVolume = Math.max(0, Math.min(1, vol));
    isMuted = !!muted || currentVolume === 0;

    const isCinemaOpen = cinemaModal && cinemaModal.classList.contains('is-open');

    for (let i = 0; i <= 5; i++) {
      const v = getCardVideo(i);
      if (v) {
        if (!isCinemaOpen && i === activeIndex && isPlaying) {
          v.volume = currentVolume;
          v.muted = isMuted;
        } else {
          v.muted = true;
        }
      }
    }

    if (cinemaVideo && isCinemaFromCE) {
      cinemaVideo.volume = currentVolume;
      cinemaVideo.muted = isMuted;
    }

    // Update sound buttons UI on cards
    for (let i = 0; i <= 5; i++) {
      const btn = document.getElementById(`ce-card-sound-btn-${i}`);
      if (!btn) continue;
      const iconMuted = btn.querySelector('.icon-muted');
      const iconUnmuted = btn.querySelector('.icon-unmuted');
      if (isMuted) {
        iconMuted?.style.setProperty('display', 'block');
        iconUnmuted?.style.setProperty('display', 'none');
      } else {
        iconMuted?.style.setProperty('display', 'none');
        iconUnmuted?.style.setProperty('display', 'block');
      }
    }

    const volPct = isMuted ? 0 : Math.round(currentVolume * 100);
    if (volumeSlider) {
      volumeSlider.value = volPct;
      volumeSlider.style.setProperty('--vol-pct', volPct + '%');
    }
    const valDisplay = document.getElementById('ce-volume-val');
    if (valDisplay) {
      valDisplay.textContent = volPct + '%';
    }
    if (btnVolume) {
      const vUnmuted = btnVolume.querySelector('.vol-icon-unmuted');
      const vMuted = btnVolume.querySelector('.vol-icon-muted');
      if (isMuted) {
        vUnmuted?.style.setProperty('display', 'none');
        vMuted?.style.setProperty('display', 'block');
      } else {
        vUnmuted?.style.setProperty('display', 'block');
        vMuted?.style.setProperty('display', 'none');
      }
    }
  }

  // Play / Pause Toggle
  function togglePlayPause() {
    const activeVid = getCardVideo(activeIndex);
    if (!activeVid) return;

    pauseAndMuteAllVideos(activeIndex);

    if (activeVid.paused) {
      activeVid.volume = currentVolume;
      activeVid.muted = isMuted;
      activeVid.play().then(() => {
        setPlayPauseState(true);
      }).catch(() => {
        activeVid.muted = true;
        activeVid.play().then(() => setPlayPauseState(true)).catch(() => { });
      });
    } else {
      activeVid.pause();
      setPlayPauseState(false);
    }
  }

  // Scrubber scrubbing
  if (progressContainer) {
    function handleScrub(e) {
      const rect = progressContainer.getBoundingClientRect();
      const clientX = e.clientX !== undefined ? e.clientX : (e.touches && e.touches[0] ? e.touches[0].clientX : 0);
      const clickX = clientX - rect.left;
      const pct = Math.max(0, Math.min(1, clickX / rect.width));
      const track = TRACKS[activeIndex];
      const activeVid = getCardVideo(activeIndex);

      if (activeVid) {
        const duration = activeVid.duration || (track ? track.duration : 30);
        activeVid.currentTime = pct * duration;
        trackCurrentTime = activeVid.currentTime;
        if (progressFill) progressFill.style.width = (pct * 100).toFixed(2) + '%';
        if (npTime) npTime.textContent = `${formatTime(trackCurrentTime)} / ${formatTime(duration)}`;
      }
    }

    let isScrubbing = false;
    progressContainer.addEventListener('mousedown', (e) => {
      isScrubbing = true;
      handleScrub(e);
    });
    window.addEventListener('mousemove', (e) => {
      if (isScrubbing) handleScrub(e);
    });
    window.addEventListener('mouseup', () => {
      isScrubbing = false;
    });
    progressContainer.addEventListener('touchstart', (e) => {
      handleScrub(e);
    }, { passive: true });
    progressContainer.addEventListener('touchmove', (e) => {
      handleScrub(e);
    }, { passive: true });
  }

  // Video sync events
  cardVideos.forEach((videoEl, trackIdx) => {
    if (!videoEl) return;
    videoEl.addEventListener('play', () => {
      if (!modal.classList.contains('is-open')) {
        videoEl.pause();
        videoEl.muted = true;
        return;
      }
      if (cinemaModal && cinemaModal.classList.contains('is-open')) {
        videoEl.pause();
        videoEl.muted = true;
        return;
      }
      if (activeIndex === trackIdx) {
        setPlayPauseState(true);
        pauseAndMuteAllVideos(trackIdx);
      } else {
        videoEl.pause();
        videoEl.muted = true;
      }
    });

    videoEl.addEventListener('pause', () => {
      if (activeIndex === trackIdx && (!cinemaModal || !cinemaModal.classList.contains('is-open'))) {
        setPlayPauseState(false);
      }
    });

    videoEl.addEventListener('timeupdate', () => {
      if (activeIndex === trackIdx && videoEl.duration) {
        trackCurrentTime = videoEl.currentTime;
        const pct = (videoEl.currentTime / videoEl.duration) * 100;
        if (progressFill) progressFill.style.width = pct.toFixed(2) + '%';
        if (npTime) {
          npTime.textContent = `${formatTime(videoEl.currentTime)} / ${formatTime(videoEl.duration)}`;
        }
        updateActiveLyricLine();
      }
    });

    videoEl.addEventListener('loadedmetadata', () => {
      if (videoEl.duration && !isNaN(videoEl.duration)) {
        if (TRACKS[trackIdx]) {
          TRACKS[trackIdx].duration = Math.round(videoEl.duration);
        }
        if (activeIndex === trackIdx) {
          updateProgressDisplay();
        }
      }
    });

    videoEl.addEventListener('ended', () => {
      if (activeIndex === trackIdx) {
        videoEl.currentTime = 0;
        videoEl.play().catch(() => { });
      }
    });
  });

  // Left Controls: Prev, Next, Play/Pause
  btnPrev?.addEventListener('click', (e) => {
    e.stopPropagation();
    setActiveTrack(activeIndex - 1, isPlaying);
  });
  btnNext?.addEventListener('click', (e) => {
    e.stopPropagation();
    setActiveTrack(activeIndex + 1, isPlaying);
  });
  stagePrev?.addEventListener('click', (e) => {
    e.stopPropagation();
    setActiveTrack(activeIndex - 1, isPlaying);
  });
  stageNext?.addEventListener('click', (e) => {
    e.stopPropagation();
    setActiveTrack(activeIndex + 1, isPlaying);
  });
  btnPlayPause?.addEventListener('click', (e) => {
    e.stopPropagation();
    togglePlayPause();
  });

  // Center Capsule click -> open cinema mode
  nowPlayingPill?.addEventListener('click', (e) => {
    if (e.target.closest('#ce-progress-container') || e.target.closest('.cf-np-icons')) {
      return;
    }
    openCinemaFullscreen(e, activeIndex);
  });

  // Cast Popover
  if (btnCast && castWrapper) {
    btnCast.addEventListener('click', (e) => {
      e.stopPropagation();
      optionsWrapper?.classList.remove('active');
      volumeWrapper?.classList.remove('active');
      castWrapper.classList.toggle('active');
    });

    deviceItems.forEach((item) => {
      item.addEventListener('click', (e) => {
        e.stopPropagation();
        const devName = item.dataset.device || item.textContent.trim();
        deviceItems.forEach((d) => {
          d.classList.remove('active');
          const chk = d.querySelector('.cf-device-check');
          if (chk) chk.style.display = 'none';
        });
        item.classList.add('active');
        const chk = item.querySelector('.cf-device-check');
        if (chk) chk.style.display = 'inline';

        castWrapper.classList.remove('active');
        showToast(`Connected to ${devName}`);
      });
    });
  }

  // Options Popover
  if (btnOptions && optionsWrapper) {
    btnOptions.addEventListener('click', (e) => {
      e.stopPropagation();
      castWrapper?.classList.remove('active');
      volumeWrapper?.classList.remove('active');
      optionsWrapper.classList.toggle('active');
    });

    optFullscreen?.addEventListener('click', (e) => {
      e.stopPropagation();
      optionsWrapper.classList.remove('active');
      openCinemaFullscreen(e, activeIndex);
    });

    optLink?.addEventListener('click', () => {
      optionsWrapper?.classList.remove('active');
    });

    optCopyLink?.addEventListener('click', (e) => {
      e.stopPropagation();
      optionsWrapper.classList.remove('active');
      const track = TRACKS[activeIndex] || TRACKS[0];
      const link = track.url;
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(link).then(() => {
          showToast('Project link copied to clipboard!');
        }).catch(() => {
          showToast(`Link: ${link}`);
        });
      } else {
        showToast(`Link: ${link}`);
      }
    });

    let isFavorite = false;
    optFavorite?.addEventListener('click', (e) => {
      e.stopPropagation();
      isFavorite = !isFavorite;
      if (isFavorite) {
        optFavorite.classList.add('is-loved');
        showToast('Added to Favorite Tracks ❤️');
      } else {
        optFavorite.classList.remove('is-loved');
        showToast('Removed from Favorites');
      }
    });
  }

  // Right Controls: Lyrics & Queue drawers
  function closeAllDrawers() {
    lyricsDrawer?.classList.remove('is-active');
    queueDrawer?.classList.remove('is-active');
    btnLyrics?.classList.remove('active');
    btnQueue?.classList.remove('active');
  }

  btnLyrics?.addEventListener('click', (e) => {
    e.stopPropagation();
    const willOpen = !lyricsDrawer?.classList.contains('is-active');
    closeAllDrawers();
    if (willOpen) {
      lyricsDrawer?.classList.add('is-active');
      btnLyrics?.classList.add('active');
    }
  });

  lyricsClose?.addEventListener('click', (e) => {
    e.stopPropagation();
    lyricsDrawer?.classList.remove('is-active');
    btnLyrics?.classList.remove('active');
  });

  btnQueue?.addEventListener('click', (e) => {
    e.stopPropagation();
    const willOpen = !queueDrawer?.classList.contains('is-active');
    closeAllDrawers();
    if (willOpen) {
      queueDrawer?.classList.add('is-active');
      btnQueue?.classList.add('active');
    }
  });

  queueClose?.addEventListener('click', (e) => {
    e.stopPropagation();
    queueDrawer?.classList.remove('is-active');
    btnQueue?.classList.remove('active');
  });

  // Volume slider & button
  if (volumeSlider) {
    const onVolumeChange = (e) => {
      const val = parseFloat(e.target.value) / 100;
      applyVolume(val, val === 0);
    };
    volumeSlider.addEventListener('input', onVolumeChange);
    volumeSlider.addEventListener('change', onVolumeChange);

    const startDrag = () => {
      volumeWrapper?.classList.add('is-dragging', 'active');
    };
    const endDrag = () => {
      volumeWrapper?.classList.remove('is-dragging');
    };
    volumeSlider.addEventListener('mousedown', startDrag);
    volumeSlider.addEventListener('touchstart', startDrag, { passive: true });
    window.addEventListener('mouseup', endDrag);
    window.addEventListener('touchend', endDrag);
  }

  if (btnVolume) {
    btnVolume.addEventListener('click', (e) => {
      e.stopPropagation();
      optionsWrapper?.classList.remove('active');
      castWrapper?.classList.remove('active');
      const isCurrentlyActive = volumeWrapper?.classList.contains('active');
      if (!isCurrentlyActive) {
        volumeWrapper?.classList.add('active');
      } else {
        isMuted = !isMuted;
        applyVolume(currentVolume || 0.8, isMuted);
        showToast(isMuted ? 'Muted' : `Volume ${Math.round((currentVolume || 0.8) * 100)}%`);
      }
    });

    btnVolume.addEventListener('dblclick', (e) => {
      e.stopPropagation();
      isMuted = !isMuted;
      applyVolume(currentVolume || 0.8, isMuted);
      showToast(isMuted ? 'Muted' : `Volume ${Math.round((currentVolume || 0.8) * 100)}%`);
    });
  }

  if (volumeWrapper) {
    volumeWrapper.addEventListener('wheel', (e) => {
      e.preventDefault();
      const delta = e.deltaY < 0 ? 0.05 : -0.05;
      const nextVol = Math.max(0, Math.min(1, (isMuted ? 0 : currentVolume) + delta));
      applyVolume(nextVol, nextVol === 0);
      showToast(`Volume ${Math.round(nextVol * 100)}%`);
    }, { passive: false });
  }

  // Close popovers on click outside
  document.addEventListener('click', (e) => {
    if (!e.target.closest('#ce-cast-wrapper')) {
      castWrapper?.classList.remove('active');
    }
    if (!e.target.closest('#ce-options-wrapper')) {
      optionsWrapper?.classList.remove('active');
    }
    if (!e.target.closest('#ce-volume-wrapper')) {
      volumeWrapper?.classList.remove('active');
    }
  });

  // Click on cards to bring them to center or trigger fullscreen
  cards.forEach((card, idx) => {
    card.addEventListener('click', (e) => {
      if (activeIndex === idx) {
        openCinemaFullscreen(e, idx);
      } else {
        setActiveTrack(idx, isPlaying);
      }
    });

    card.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        if (activeIndex === idx) {
          openCinemaFullscreen(e, idx);
        } else {
          setActiveTrack(idx, isPlaying);
        }
      }
    });
  });

  // Card Controls (Fullscreen button, sound toggle, reel wrap click)
  for (let idx = 0; idx <= 5; idx++) {
    const fsBtn = document.getElementById(`ce-card-fs-btn-${idx}`);
    const soundBtn = document.getElementById(`ce-card-sound-btn-${idx}`);
    const rWrap = document.getElementById(`ce-reel-wrap-${idx}`);
    const cVid = getCardVideo(idx);

    fsBtn?.addEventListener('click', (e) => {
      e.stopPropagation();
      setActiveTrack(idx, false);
      openCinemaFullscreen(e, idx);
    });

    soundBtn?.addEventListener('click', (e) => {
      e.stopPropagation();
      isMuted = !isMuted;
      applyVolume(currentVolume, isMuted);
      showToast(isMuted ? 'Muted' : `Volume ${Math.round(currentVolume * 100)}%`);
    });

    rWrap?.addEventListener('click', (e) => {
      e.stopPropagation();
      if (activeIndex === idx) {
        openCinemaFullscreen(e, idx);
      } else {
        setActiveTrack(idx, isPlaying);
      }
    });

    cVid?.addEventListener('click', (e) => {
      e.stopPropagation();
      if (activeIndex === idx) {
        openCinemaFullscreen(e, idx);
      } else {
        setActiveTrack(idx, isPlaying);
      }
    });
  }

  // Swipe / Drag on Stage
  let touchStartX = 0;
  let touchEndX = 0;
  const stage = document.getElementById('ce-coverflow-stage');
  if (stage) {
    stage.addEventListener('touchstart', (e) => {
      touchStartX = e.changedTouches[0].screenX;
    }, { passive: true });

    stage.addEventListener('touchend', (e) => {
      touchEndX = e.changedTouches[0].screenX;
      handleSwipe();
    }, { passive: true });

    let isMouseDown = false;
    stage.addEventListener('mousedown', (e) => {
      isMouseDown = true;
      touchStartX = e.clientX;
    });

    stage.addEventListener('mouseup', (e) => {
      if (!isMouseDown) return;
      isMouseDown = false;
      touchEndX = e.clientX;
      handleSwipe();
    });

    stage.addEventListener('mouseleave', () => {
      isMouseDown = false;
    });

    function handleSwipe() {
      const diff = touchEndX - touchStartX;
      if (Math.abs(diff) > 40) {
        if (diff > 0) {
          setActiveTrack(activeIndex - 1, isPlaying);
        } else {
          setActiveTrack(activeIndex + 1, isPlaying);
        }
      }
    }
  }

  // Cinema Fullscreen for Cinematic Edits
  function openCinemaFullscreen(e, trackIndex = activeIndex) {
    if (e) e.stopPropagation();
    if (!cinemaModal || !cinemaVideo) return;

    isCinemaFromCE = true;
    const track = TRACKS[trackIndex] || TRACKS[0];
    const sourceVideo = getCardVideo(trackIndex);

    if (cinemaBadgeText) cinemaBadgeText.textContent = 'Cinematic Edits & Color Grading';
    if (cinemaCaptionTitle) cinemaCaptionTitle.textContent = track.title;
    if (cinemaCaptionDesc) cinemaCaptionDesc.textContent = `${track.artist} • Tap video to Play/Pause • Press ESC to exit`;

    if (sourceVideo && sourceVideo.src) {
      if (!cinemaVideo.src.endsWith(sourceVideo.getAttribute('src'))) {
        cinemaVideo.src = sourceVideo.getAttribute('src');
      }
      cinemaVideo.currentTime = sourceVideo.currentTime || 0;
    }

    pauseAndMuteAllVideos('cinema');

    cinemaModal.classList.add('is-open');
    cinemaModal.setAttribute('aria-hidden', 'false');

    cinemaVideo.volume = currentVolume;
    cinemaVideo.muted = isMuted;

    cinemaVideo.play().then(() => {
      setPlayPauseState(true);
    }).catch(() => {
      cinemaVideo.muted = true;
      cinemaVideo.play().then(() => setPlayPauseState(true)).catch(() => { });
    });

    if (window.location.hash !== '#cinema-cinematic') {
      if (window.history && window.history.pushState) {
        window.history.pushState({ modal: 'cinema-cinematic' }, '', '#cinema-cinematic');
      }
    }
  }

  function closeCinemaFullscreen(fromHistory = false) {
    if (!cinemaModal || !cinemaModal.classList.contains('is-open')) return;
    if (!isCinemaFromCE) return;

    const sourceVideo = getCardVideo(activeIndex);
    if (sourceVideo && cinemaVideo) {
      sourceVideo.currentTime = cinemaVideo.currentTime || 0;
    }

    cinemaVideo.pause();
    cinemaVideo.muted = true;
    isCinemaFromCE = false;

    cinemaModal.classList.remove('is-open');
    cinemaModal.setAttribute('aria-hidden', 'true');

    if (document.fullscreenElement || document.webkitFullscreenElement) {
      if (document.exitFullscreen) document.exitFullscreen().catch(() => { });
      else if (document.webkitExitFullscreen) document.webkitExitFullscreen().catch(() => { });
    }

    if (!fromHistory) {
      if (window.history && window.history.state && window.history.state.modal === 'cinema-cinematic') {
        window.history.back();
      } else if (window.location.hash === '#cinema-cinematic') {
        if (window.history && window.history.replaceState) {
          window.history.replaceState({ modal: 'cinematic-player' }, '', '#cinematic');
        }
      }
    }
  }

  // Modal Open & Close logic
  function openModal(pushHistory = true) {
    // Coordinate with other modals: pause and close them if open
    if (window.closeMotionGraphicsModal) window.closeMotionGraphicsModal(true);
    if (window.stopMotionGraphicsMedia) window.stopMotionGraphicsMedia(-1);
    if (window.closeHeadTalkingModal) window.closeHeadTalkingModal(true);
    if (window.stopHeadTalkingMedia) window.stopHeadTalkingMedia(-1);
    if (window.closePhonkModal) window.closePhonkModal(true);
    if (window.stopPhonkMedia) window.stopPhonkMedia(-1);
    if (window.closeRealEstateModal) window.closeRealEstateModal(true);
    if (window.stopRealEstateMedia) window.stopRealEstateMedia(-1);

    modal.classList.add('is-open');
    modal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';

    if (pushHistory && window.location.hash !== '#cinematic') {
      if (window.history && window.history.pushState) {
        window.history.pushState({ modal: 'cinematic-player' }, '', '#cinematic');
      }
    }

    pauseAndMuteAllVideos(-1);
    setPlayPauseState(false);
    setActiveTrack(0, false);

    buildQueue();
    populateLyrics();
    updateCarousel(true);

    setTimeout(() => {
      updateCarousel();
    }, 50);
  }

  function closeModal(fromHistory = false) {
    if (!modal.classList.contains('is-open')) return;

    if (isCinemaFromCE) {
      closeCinemaFullscreen(fromHistory);
    }

    modal.classList.remove('is-open');
    modal.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';

    pauseAndMuteAllVideos(-1);
    setPlayPauseState(false);

    closeAllDrawers();
    castWrapper?.classList.remove('active');
    optionsWrapper?.classList.remove('active');
    volumeWrapper?.classList.remove('active');

    if (!fromHistory) {
      if (window.history && window.history.state && (window.history.state.modal === 'cinematic-player' || window.history.state.modal === 'cinema-cinematic')) {
        window.history.back();
      } else if (window.location.hash === '#cinematic' || window.location.hash === '#cinema-cinematic') {
        if (window.history && window.history.replaceState) {
          window.history.replaceState(null, '', window.location.pathname + window.location.search);
        }
      }
    }
  }

  window.stopCinematicMedia = pauseAndMuteAllVideos;
  window.closeCinematicModal = closeModal;

  cardTrigger.addEventListener('click', (e) => {
    e.preventDefault();
    openModal();
  });

  cardTrigger.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      openModal();
    }
  });

  btnClose?.addEventListener('click', () => closeModal(false));
  backdrop?.addEventListener('click', () => closeModal(false));

  // History popstate
  window.addEventListener('popstate', (e) => {
    const isCinemaOpen = cinemaModal && cinemaModal.classList.contains('is-open') && isCinemaFromCE;
    const isPlayerOpen = modal && modal.classList.contains('is-open');

    if (isCinemaOpen) {
      closeCinemaFullscreen(true);
      if (!e.state || e.state.modal !== 'cinematic-player') {
        closeModal(true);
      }
    } else if (isPlayerOpen) {
      closeModal(true);
    }
  });

  // Direct deep link check
  if (window.location.hash === '#cinematic' || window.location.hash === '#cinematic-edits') {
    openModal(false);
  }

  // Keyboard navigation when modal is open
  window.addEventListener('keydown', (e) => {
    if (!modal.classList.contains('is-open')) return;

    if (cinemaModal && cinemaModal.classList.contains('is-open') && isCinemaFromCE) {
      if (e.key === 'Escape') {
        closeCinemaFullscreen();
      } else if (e.key === ' ' || e.code === 'Space') {
        e.preventDefault();
        if (cinemaVideo.paused) {
          cinemaVideo.play().catch(() => { });
        } else {
          cinemaVideo.pause();
        }
      } else if (e.key === 'm' || e.key === 'M') {
        e.preventDefault();
        isMuted = !isMuted;
        applyVolume(currentVolume, isMuted);
      }
      return;
    }

    if (e.key === 'Escape') {
      closeModal();
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault();
      setActiveTrack(activeIndex - 1, isPlaying);
    } else if (e.key === 'ArrowRight') {
      e.preventDefault();
      setActiveTrack(activeIndex + 1, isPlaying);
    } else if (e.key === ' ') {
      if (document.activeElement.tagName !== 'INPUT') {
        e.preventDefault();
        togglePlayPause();
      }
    }
  });

  window.addEventListener('resize', () => {
    if (modal.classList.contains('is-open')) {
      updateCarousel();
    }
  });
}

// ============================================================================
// 7. APPLICATION BOOTSTRAP & INITIALIZATION (init)
// ============================================================================
function init() {
  // Always guarantee opening cleanly from the Home page at (0, 0)
  window.scrollTo(0, 0);
  currentProgress = 0;
  targetProgress = 0;

  resizeCanvas();
  preloadImages();
  renderFrame(0);
  setupSmoothNavigation();
  setupMobileMenu();
  setupContactSection();
  setupCoverFlowPlayer();
  setupHeadTalkingPlayer();
  setupPhonkCoverFlowPlayer();
  setupRealEstatePlayer();
  setupCinematicPlayer();
  updateScrollProgress();
  updateActiveNavLink(0);
  requestAnimationFrame(animate);
}

// Extra guarantee on window load (after all media/fonts are settled)
window.addEventListener('load', () => {
  window.scrollTo(0, 0);
});

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}


