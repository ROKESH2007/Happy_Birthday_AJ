/* ==========================================================================
   HEARTCRAFT INTERACTIVE BIRTHDAY EXPERIENCE - LOGIC & SOUND ENGINE
   ========================================================================== */

(function () {
  'use strict';

  // --- State Configuration ---
  const state = {
    currentStage: 0,
    totalStages: 7,
    name: 'Arulselvi',
    passcode: '2519',
    pinEntered: '',
    balloonsPopped: 0,
    candleBlown: false,
    isMusicPlaying: false,
    soundMuted: false,
    micListening: false,
    audioContext: null
  };

  // --- Sound Effects Synthesizer (Web Audio API - No external files needed!) ---
  function getAudioContext() {
    if (!state.audioContext) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        state.audioContext = new AudioCtx();
      }
    }
    if (state.audioContext && state.audioContext.state === 'suspended') {
      state.audioContext.resume();
    }
    return state.audioContext;
  }

  const sfx = {
    keyClick: function () {
      if (state.soundMuted) return;
      const ctx = getAudioContext();
      if (!ctx) return;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(600, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(300, ctx.currentTime + 0.05);
      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.05);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.05);
    },

    unlockChime: function () {
      if (state.soundMuted) return;
      const ctx = getAudioContext();
      if (!ctx) return;
      const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
      notes.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, ctx.currentTime + idx * 0.08);
        gain.gain.setValueAtTime(0, ctx.currentTime + idx * 0.08);
        gain.gain.linearRampToValueAtTime(0.2, ctx.currentTime + idx * 0.08 + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + idx * 0.08 + 0.5);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(ctx.currentTime + idx * 0.08);
        osc.stop(ctx.currentTime + idx * 0.08 + 0.5);
      });
    },

    pop: function (pitch = 1) {
      if (state.soundMuted) return;
      const ctx = getAudioContext();
      if (!ctx) return;
      // White noise buffer for balloon pop sound
      const bufferSize = ctx.sampleRate * 0.08;
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
      }
      const noise = ctx.createBufferSource();
      noise.buffer = buffer;

      const filter = ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(800 * pitch, ctx.currentTime);
      filter.Q.setValueAtTime(1.5, ctx.currentTime);

      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.4, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.08);

      noise.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);

      noise.start();
    },

    whoosh: function () {
      if (state.soundMuted) return;
      const ctx = getAudioContext();
      if (!ctx) return;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(450, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(120, ctx.currentTime + 0.25);
      gain.gain.setValueAtTime(0.2, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.25);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.25);
    },

    fanfare: function () {
      if (state.soundMuted) return;
      const ctx = getAudioContext();
      if (!ctx) return;
      const melody = [
        { f: 523.25, d: 0.12 }, // C5
        { f: 523.25, d: 0.12 }, // C5
        { f: 523.25, d: 0.12 }, // C5
        { f: 659.25, d: 0.35 }, // E5
        { f: 587.33, d: 0.15 }, // D5
        { f: 659.25, d: 0.15 }, // E5
        { f: 783.99, d: 0.60 }  // G5
      ];
      let t = ctx.currentTime;
      melody.forEach(item => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(item.f, t);
        gain.gain.setValueAtTime(0.22, t);
        gain.gain.exponentialRampToValueAtTime(0.01, t + item.d);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(t);
        osc.stop(t + item.d);
        t += item.d + 0.04;
      });
    }
  };

  // --- Background Song Manager (Zero Video Overhead) ---
  let isSongStarted = false;

  function startBackgroundSong() {
    if (isSongStarted) return;
    const audio = document.getElementById('bgMusic');
    if (audio) {
      audio.volume = 0.85;
      audio.play().then(() => {
        isSongStarted = true;
      }).catch(err => {
        // Autoplay policy: will trigger on next user gesture
        console.log('Audio awaiting interaction:', err);
      });
    }
  }

  // Trigger song on first user interaction anywhere
  document.addEventListener('click', startBackgroundSong, { once: true, passive: true });
  document.addEventListener('touchstart', startBackgroundSong, { once: true, passive: true });
  document.addEventListener('keydown', startBackgroundSong, { once: true, passive: true });

  function initAudioAutoplay() {
    startBackgroundSong();
  }

  // --- High-Performance Floating Hearts (Hardware-Accelerated Sprite) ---
  const heartsCanvas = document.getElementById('heartsCanvas');
  const hCtx = heartsCanvas.getContext('2d', { alpha: true });
  let hearts = [];

  // Pre-render a single heart into an offscreen canvas sprite once
  const heartSprite = document.createElement('canvas');
  heartSprite.width = 48;
  heartSprite.height = 48;
  const sCtx = heartSprite.getContext('2d');
  sCtx.fillStyle = '#f43f7a';
  sCtx.beginPath();
  sCtx.moveTo(24, 14);
  sCtx.bezierCurveTo(24, 6, 10, 6, 10, 18);
  sCtx.bezierCurveTo(10, 27, 24, 38, 24, 42);
  sCtx.bezierCurveTo(24, 38, 38, 27, 38, 18);
  sCtx.bezierCurveTo(38, 6, 24, 6, 24, 14);
  sCtx.closePath();
  sCtx.fill();

  function resizeHeartsCanvas() {
    heartsCanvas.width = window.innerWidth;
    heartsCanvas.height = window.innerHeight;
  }
  window.addEventListener('resize', resizeHeartsCanvas, { passive: true });
  resizeHeartsCanvas();

  class HeartParticle {
    constructor() {
      this.reset();
    }
    reset() {
      this.x = Math.random() * heartsCanvas.width;
      this.y = heartsCanvas.height + Math.random() * 40;
      this.size = Math.random() * 12 + 10;
      this.speedY = Math.random() * 0.7 + 0.35;
      this.wobbleSpeed = Math.random() * 0.02 + 0.01;
      this.wobbleAmp = Math.random() * 1.2 + 0.5;
      this.wobbleOffset = Math.random() * Math.PI * 2;
      this.opacity = Math.random() * 0.35 + 0.15;
    }
    update() {
      this.y -= this.speedY;
      this.x += Math.sin(this.y * this.wobbleSpeed + this.wobbleOffset) * this.wobbleAmp;
      if (this.y < -30) {
        this.reset();
      }
    }
    draw(ctx) {
      ctx.globalAlpha = this.opacity;
      ctx.drawImage(heartSprite, this.x - this.size / 2, this.y - this.size / 2, this.size, this.size);
    }
  }

  // 12 particles is the sweet spot: graceful romantic look with 0% CPU lag
  for (let i = 0; i < 12; i++) {
    const hp = new HeartParticle();
    hp.y = Math.random() * heartsCanvas.height;
    hearts.push(hp);
  }

  function renderHearts() {
    hCtx.clearRect(0, 0, heartsCanvas.width, heartsCanvas.height);
    for (let i = 0; i < hearts.length; i++) {
      hearts[i].update();
      hearts[i].draw(hCtx);
    }
    hCtx.globalAlpha = 1;
    requestAnimationFrame(renderHearts);
  }
  renderHearts();

  // --- High-Performance Confetti Engine (Runs ONLY When Triggered) ---
  const confettiCanvas = document.getElementById('confettiCanvas');
  const cCtx = confettiCanvas.getContext('2d', { alpha: true });
  let confettiPieces = [];
  let confettiRafId = null;

  function resizeConfettiCanvas() {
    confettiCanvas.width = window.innerWidth;
    confettiCanvas.height = window.innerHeight;
  }
  window.addEventListener('resize', resizeConfettiCanvas, { passive: true });
  resizeConfettiCanvas();

  const confettiColors = ['#f43f7a', '#ff6b98', '#ffd166', '#06d6a0', '#118ab2', '#a855f7', '#fb5607'];

  class ConfettiPiece {
    constructor(x, y) {
      this.x = x !== undefined ? x : Math.random() * confettiCanvas.width;
      this.y = y !== undefined ? y : Math.random() * (confettiCanvas.height * 0.3);
      this.size = Math.random() * 7 + 4;
      this.color = confettiColors[Math.floor(Math.random() * confettiColors.length)];
      this.vx = (Math.random() - 0.5) * 8;
      this.vy = Math.random() * -5 - 3;
      this.gravity = 0.22;
      this.rotation = Math.random() * 360;
      this.rotSpeed = (Math.random() - 0.5) * 10;
      this.opacity = 1;
      this.isRibbon = Math.random() > 0.4;
      this.aspect = Math.random() * 0.4 + 0.3;
    }
    update() {
      this.x += this.vx;
      this.y += this.vy;
      this.vy += this.gravity;
      this.vx *= 0.98;
      this.rotation += this.rotSpeed;
      if (this.vy > 0) {
        this.opacity -= 0.009;
      }
    }
    draw(ctx) {
      if (this.opacity <= 0) return;
      ctx.save();
      ctx.translate(this.x, this.y);
      ctx.rotate((this.rotation * Math.PI) / 180);
      ctx.globalAlpha = Math.max(0, this.opacity);
      ctx.fillStyle = this.color;
      if (this.isRibbon) {
        ctx.fillRect(-this.size, -this.size * this.aspect, this.size * 2, this.size * this.aspect * 2);
      } else {
        ctx.beginPath();
        ctx.arc(0, 0, this.size * 0.5, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    }
  }

  function triggerConfettiBurst(count = 50, x, y) {
    for (let i = 0; i < count; i++) {
      confettiPieces.push(new ConfettiPiece(x, y));
    }
    if (!confettiRafId) {
      renderConfetti();
    }
  }

  function renderConfetti() {
    if (confettiPieces.length === 0) {
      cCtx.clearRect(0, 0, confettiCanvas.width, confettiCanvas.height);
      confettiRafId = null;
      return; // STOP animation loop completely when idle!
    }
    cCtx.clearRect(0, 0, confettiCanvas.width, confettiCanvas.height);
    for (let i = confettiPieces.length - 1; i >= 0; i--) {
      const p = confettiPieces[i];
      p.update();
      p.draw(cCtx);
      if (p.opacity <= 0 || p.y > confettiCanvas.height + 40) {
        confettiPieces.splice(i, 1);
      }
    }
    confettiRafId = requestAnimationFrame(renderConfetti);
  }

  // --- Stage Navigation & UI Management ---
  const stages = [
    document.getElementById('stage-passcode'),
    document.getElementById('stage-greeting'),
    document.getElementById('stage-balloons'),
    document.getElementById('stage-cake'),
    document.getElementById('stage-bouquet'),
    document.getElementById('stage-photos'),
    document.getElementById('stage-letter')
  ];

  const backBtn = document.getElementById('backBtn');
  const balloonBadge = document.getElementById('balloonBadge');

  function goToStage(idx) {
    if (idx < 0 || idx >= stages.length) return;
    state.currentStage = idx;

    stages.forEach((st, i) => {
      if (i === idx) {
        st.classList.add('active');
      } else {
        st.classList.remove('active');
      }
    });

    // Back button visibility
    if (idx > 0) {
      backBtn.classList.remove('hidden');
    } else {
      backBtn.classList.add('hidden');
    }

    // Balloon badge counter
    if (idx === 2) {
      balloonBadge.style.display = 'inline-block';
      updateBalloonBadge();
    } else {
      balloonBadge.style.display = 'none';
    }

    // Auto-open letter when reaching letter stage
    if (idx === 6) {
      setTimeout(() => {
        if (typeof openLetter === 'function') {
          openLetter();
        }
      }, 900);
    }

    // Sound effect on screen switch
    sfx.whoosh();
  }

  backBtn.addEventListener('click', () => {
    if (state.currentStage > 0) {
      goToStage(state.currentStage - 1);
    }
  });

  // --- STAGE 1: PASSCODE LOGIC ---
  const pinBoxes = [
    document.getElementById('pin0'),
    document.getElementById('pin1'),
    document.getElementById('pin2'),
    document.getElementById('pin3')
  ];
  const keypad = document.getElementById('keypadGrid');
  const passcodeHint = document.getElementById('passcodeHint');

  function updatePinBoxes() {
    pinBoxes.forEach((box, i) => {
      if (i < state.pinEntered.length) {
        box.textContent = state.pinEntered[i];
        box.classList.add('filled');
      } else {
        box.textContent = '';
        box.classList.remove('filled');
      }
      box.classList.toggle('active', i === state.pinEntered.length);
    });
  }

  function handleKeyPress(key) {
    initAudioAutoplay();
    getAudioContext();

    if (key === 'clear') {
      state.pinEntered = '';
      sfx.keyClick();
      updatePinBoxes();
      return;
    }

    if (key === 'back') {
      state.pinEntered = state.pinEntered.slice(0, -1);
      sfx.keyClick();
      updatePinBoxes();
      return;
    }

    if (state.pinEntered.length < 4) {
      state.pinEntered += key;
      sfx.keyClick();
      updatePinBoxes();

      if (state.pinEntered.length === 4) {
        // Validate passcode: accepts exact set code (default 2519)
        const valid = (
          state.pinEntered === state.passcode ||
          state.pinEntered === '2519'
        );

        if (valid) {
          sfx.unlockChime();
          triggerConfettiBurst(50);
          setTimeout(() => {
            goToStage(1); // To Greeting stage
          }, 450);
        } else {
          // Shake on wrong pin
          const inputsContainer = document.querySelector('.passcode-inputs');
          inputsContainer.classList.add('shake');
          setTimeout(() => {
            inputsContainer.classList.remove('shake');
            state.pinEntered = '';
            updatePinBoxes();
          }, 500);
        }
      }
    }
  }

  keypad.addEventListener('click', (e) => {
    const btn = e.target.closest('.key-btn');
    if (!btn) return;
    const key = btn.dataset.key;
    handleKeyPress(key);
  });

  // Physical keyboard support
  window.addEventListener('keydown', (e) => {
    if (state.currentStage !== 0) return;
    if (e.key >= '0' && e.key <= '9') {
      handleKeyPress(e.key);
    } else if (e.key === 'Backspace') {
      handleKeyPress('back');
    }
  });

  passcodeHint.addEventListener('click', () => {
    alert(`Hint: Enter passcode 2519 ❤️`);
  });

  // --- STAGE 2: GREETING LOGIC ---
  const yesExcitedBtn = document.getElementById('yesExcitedBtn');
  yesExcitedBtn.addEventListener('click', () => {
    initAudioAutoplay();
    triggerConfettiBurst(60);
    sfx.unlockChime();
    setTimeout(() => {
      goToStage(2); // To Balloon stage
    }, 350);
  });

  // --- STAGE 3: BALLOON POPPING GAME ---
  const balloonItems = document.querySelectorAll('.balloon-item');
  const revealedMessage = document.getElementById('revealedMessage');
  const secretWords = ['You', 'are', 'so', 'special'];

  function updateBalloonBadge() {
    balloonBadge.textContent = `${state.balloonsPopped}/4 POPPED`;
  }

  balloonItems.forEach((item, index) => {
    item.addEventListener('click', () => {
      if (item.classList.contains('popped')) return;

      item.classList.add('popped');
      state.balloonsPopped++;
      updateBalloonBadge();

      // Sound and visual pop effect
      sfx.pop(1 + index * 0.2);
      const rect = item.getBoundingClientRect();
      triggerConfettiBurst(20, rect.left + rect.width / 2, rect.top + rect.height / 2);

      // Reveal words progressively
      const currentWords = secretWords.slice(0, state.balloonsPopped).join(' ');
      revealedMessage.textContent = currentWords;

      if (state.balloonsPopped === 4) {
        triggerConfettiBurst(80);
        sfx.unlockChime();
        setTimeout(() => {
          goToStage(3); // To Cake stage
        }, 1800);
      }
    });
  });

  // --- STAGE 4: CAKE & CANDLE BLOWING ---
  const candleFlame = document.getElementById('candleFlame');
  const blowMicBtn = document.getElementById('blowMicBtn');
  const wishMessage = document.getElementById('wishMessage');
  const cakeArt = document.querySelector('.cake-visual-wrap');

  function extinguishCandle() {
    if (state.candleBlown) return;
    state.candleBlown = true;

    // Extinguish visual
    candleFlame.classList.add('flame-extinguished');
    sfx.whoosh();

    // Create rising smoke particles
    for (let i = 0; i < 5; i++) {
      setTimeout(() => {
        const smoke = document.createElement('div');
        smoke.className = 'smoke-particle';
        smoke.style.left = '50%';
        smoke.style.top = '28%';
        cakeArt.appendChild(smoke);
        setTimeout(() => smoke.remove(), 1600);
      }, i * 150);
    }

    // Show wish message
    wishMessage.classList.add('visible');
    blowMicBtn.style.opacity = '0.5';
    blowMicBtn.style.pointerEvents = 'none';

    setTimeout(() => {
      goToStage(4); // To Rose Bouquet stage
    }, 2800);
  }

  // Tap cake to blow candle fallback
  cakeArt.addEventListener('click', extinguishCandle);

  // Microphone detection using Web Audio API
  blowMicBtn.addEventListener('click', async () => {
    if (state.candleBlown) return;

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      extinguishCandle();
      return;
    }

    try {
      blowMicBtn.classList.add('mic-listening');
      blowMicBtn.innerHTML = '<span>🎙️ Listening... Blow now!</span>';

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
      const ctx = getAudioContext();
      const micSource = ctx.createMediaStreamSource(stream);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 256;
      micSource.connect(analyser);

      const bufferLength = analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);

      let blowDetectionCount = 0;

      function checkAudioLevel() {
        if (state.candleBlown) {
          stream.getTracks().forEach(t => t.stop());
          return;
        }

        analyser.getByteFrequencyData(dataArray);
        let sum = 0;
        for (let i = 0; i < bufferLength; i++) {
          sum += dataArray[i];
        }
        const average = sum / bufferLength;

        // Threshold for wind/blowing into the mic
        if (average > 45) {
          blowDetectionCount++;
          if (blowDetectionCount > 3) {
            stream.getTracks().forEach(t => t.stop());
            extinguishCandle();
            return;
          }
        } else {
          blowDetectionCount = Math.max(0, blowDetectionCount - 1);
        }

        requestAnimationFrame(checkAudioLevel);
      }

      checkAudioLevel();

      // Timeout fallback after 6 seconds so user doesn't get stuck
      setTimeout(() => {
        if (!state.candleBlown) {
          extinguishCandle();
        }
      }, 6000);

    } catch (err) {
      console.warn('Microphone permission denied or unsupported:', err);
      extinguishCandle();
    }
  });

  // --- STAGE 5: ROSE BOUQUET & COMPLIMENTS ---
  const bouquetContinueBtn = document.getElementById('bouquetContinueBtn');
  const complimentBadges = document.querySelectorAll('.compliment-badge');

  complimentBadges.forEach(badge => {
    badge.addEventListener('click', (e) => {
      sfx.keyClick();
      const rect = badge.getBoundingClientRect();
      triggerConfettiBurst(12, rect.left + rect.width / 2, rect.top + rect.height / 2);
    });
  });

  bouquetContinueBtn.addEventListener('click', () => {
    goToStage(5); // To Photo cards stage
  });

  // --- STAGE 6: POLAROID PHOTO CARDS (SWIPING DECK) ---
  const cardsDeck = document.getElementById('cardsDeck');
  const photosContinueBtn = document.getElementById('photosContinueBtn');
  let cards = Array.from(document.querySelectorAll('.polaroid-card'));

  function updateCardsStack() {
    cards.forEach((card, i) => {
      card.className = `polaroid-card card-${Math.min(i, 4)}`;
      card.style.transform = '';
    });
  }

  function swipeTopCard(direction = 1) {
    if (cards.length === 0) return;
    const topCard = cards[0];
    sfx.whoosh();

    // Hardware accelerated fly-off with translate3d
    topCard.style.transform = `translate3d(${direction * 380}px, -40px, 0) rotate(${direction * 25}deg)`;
    topCard.style.opacity = '0';

    setTimeout(() => {
      // Move top card to back of deck
      topCard.style.opacity = '';
      cards.shift();
      cards.push(topCard);
      cardsDeck.appendChild(topCard);
      updateCardsStack();
    }, 280);
  }

  // High-performance pointer / touch gestures with RAF throttling
  let startX = 0, currentX = 0, isDragging = false, dragRaf = null;

  cardsDeck.addEventListener('pointerdown', (e) => {
    if (cards.length === 0) return;
    isDragging = true;
    startX = e.clientX;
    currentX = e.clientX;
    const topCard = cards[0];
    topCard.setPointerCapture(e.pointerId);
  }, { passive: true });

  cardsDeck.addEventListener('pointermove', (e) => {
    if (!isDragging || cards.length === 0) return;
    currentX = e.clientX;
    if (!dragRaf) {
      dragRaf = requestAnimationFrame(() => {
        const deltaX = currentX - startX;
        const rotate = deltaX * 0.08;
        const topCard = cards[0];
        if (topCard) {
          topCard.style.transform = `translate3d(${deltaX}px, 0, 0) rotate(${rotate}deg)`;
        }
        dragRaf = null;
      });
    }
  }, { passive: true });

  cardsDeck.addEventListener('pointerup', (e) => {
    if (!isDragging || cards.length === 0) return;
    isDragging = false;
    if (dragRaf) {
      cancelAnimationFrame(dragRaf);
      dragRaf = null;
    }
    const deltaX = currentX - startX;
    if (Math.abs(deltaX) > 60) {
      swipeTopCard(deltaX > 0 ? 1 : -1);
    } else {
      const topCard = cards[0];
      if (Math.abs(deltaX) < 5) {
        swipeTopCard(1); // Tap advances card
      } else if (topCard) {
        topCard.style.transform = '';
      }
    }
  });

  photosContinueBtn.addEventListener('click', () => {
    goToStage(6); // To Letter stage (Finale)
  });

  // --- STAGE 7: A MESSAGE FROM MY HEART (ENVELOPE & LETTER - FINALE) ---
  const envelopeWrap = document.getElementById('envelopeWrap');
  const letterSheet = document.getElementById('letterSheet');
  const tapLetterHint = document.getElementById('tapLetterHint');
  const letterScene = document.querySelector('.letter-scene-container');
  const replayBtn = document.getElementById('replayBtn');

  function openLetter() {
    if (!envelopeWrap || envelopeWrap.classList.contains('open')) return;
    sfx.unlockChime();
    triggerConfettiBurst(55);
    envelopeWrap.classList.add('open');
    if (tapLetterHint) tapLetterHint.style.display = 'none';
    setTimeout(() => {
      letterSheet.classList.add('expanded');
    }, 280);
  }

  if (envelopeWrap) {
    envelopeWrap.addEventListener('click', openLetter);
  }
  if (tapLetterHint) {
    tapLetterHint.addEventListener('click', openLetter);
  }
  if (letterScene) {
    letterScene.addEventListener('click', (e) => {
      if (!letterSheet.classList.contains('expanded')) {
        openLetter();
      }
    });
  }

  if (replayBtn) {
    replayBtn.addEventListener('click', () => {
      state.balloonsPopped = 0;
      state.candleBlown = false;
      state.pinEntered = '';

      balloonItems.forEach(b => b.classList.remove('popped'));
      revealedMessage.textContent = '';
      candleFlame.classList.remove('flame-extinguished');
      wishMessage.classList.remove('visible');
      blowMicBtn.style.opacity = '1';
      blowMicBtn.style.pointerEvents = 'auto';
      blowMicBtn.innerHTML = '<span>🎙️ Blow into the mic</span>';

      envelopeWrap.classList.remove('open');
      letterSheet.classList.remove('expanded');
      if (tapLetterHint) tapLetterHint.style.display = 'block';

      updatePinBoxes();
      goToStage(0);
    });
  }

  // Offline fallback SVGs for photos if needed
  const fallbackSvgs = [
    'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="300" height="300" viewBox="0 0 100 100"><rect width="100" height="100" fill="%23ffd6e0"/><circle cx="50" cy="45" r="22" fill="%23ff758c"/><path d="M50 30 C45 20 25 30 50 55 C75 30 55 20 50 30 Z" fill="%23ffffff"/><text x="50" y="80" font-family="sans-serif" font-size="7" font-weight="bold" fill="%23a23961" text-anchor="middle">Precious Smile 💖</text></svg>',
    'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="300" height="300" viewBox="0 0 100 100"><rect width="100" height="100" fill="%23ffe5ec"/><circle cx="50" cy="42" r="20" fill="%23f43f7a"/><polygon points="50,15 42,32 58,32" fill="%23ffd166"/><text x="50" y="80" font-family="sans-serif" font-size="7" font-weight="bold" fill="%23a23961" text-anchor="middle">Make A Wish 🎂</text></svg>',
    'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="300" height="300" viewBox="0 0 100 100"><rect width="100" height="100" fill="%23fcd5ce"/><circle cx="40" cy="45" r="18" fill="%23ffb5a7"/><circle cx="60" cy="45" r="18" fill="%23f8edeb"/><text x="50" y="80" font-family="sans-serif" font-size="7" font-weight="bold" fill="%23a23961" text-anchor="middle">Beautiful Soul ✨</text></svg>',
    'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="300" height="300" viewBox="0 0 100 100"><rect width="100" height="100" fill="%23f8edeb"/><path d="M50 30 Q 30 10 20 30 Q 10 50 50 80 Q 90 50 80 30 Q 70 10 50 30 Z" fill="%23f43f7a"/><text x="50" y="55" font-family="sans-serif" font-size="12" fill="%23ffffff" text-anchor="middle">Forever</text></svg>'
  ];

  document.querySelectorAll('.photo-frame img').forEach((img, i) => {
    img.addEventListener('error', () => {
      img.src = fallbackSvgs[i % fallbackSvgs.length];
    });
  });

  // Apply recipient name
  document.querySelectorAll('.recipient-name').forEach(el => {
    el.textContent = state.name;
  });

  // Global user interaction to enable audio context smoothly
  document.body.addEventListener('click', () => {
    getAudioContext();
  }, { once: true });

})();
