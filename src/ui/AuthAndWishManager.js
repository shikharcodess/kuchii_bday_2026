/**
 * AuthAndWishManager
 * 
 * Manages:
 * 1. Password protection screen ('22x10')
 * 2. Romantic birthday wish letter page with heartfelt letter from Shikhar
 * 3. Confetti, floating balloons, sparkles (tasteful & romantic, not childish)
 * 4. Birthday song playback (checks public/audio/ for birthday.mp3/bday.mp3, with sweet music box fallback)
 * 5. Smooth loading transition into the 3D world ("Enter The World I Made For You")
 */

export class AuthAndWishManager {
  constructor({ onEnterWorld }) {
    this.onEnterWorld = onEnterWorld;
    this.isAuthenticated = false;
    this.isWorldEntered = false;

    this.audioElement = null;
    this.audioCtx = null;
    this.musicBoxInterval = null;
    this.isPlayingMusic = false;

    this.confettiActive = false;
    this.confettiParticles = [];

    this._initElements();
    this._initPasswordForm();
    this._initWishLetter();
    this._initConfetti();
    this._initAudio();
  }

  _initElements() {
    this.passwordScreen = document.getElementById('password-screen');
    this.passwordInput = document.getElementById('password-input');
    this.passwordForm = document.getElementById('password-form');
    this.passwordError = document.getElementById('password-error');

    this.wishScreen = document.getElementById('wish-screen');
    this.wishMusicStatus = document.getElementById('wish-music-status');
    this.wishAudioBtn = document.getElementById('wish-audio-btn');
    this.wishAudioToggle = document.getElementById('wish-audio-toggle');

    this.enterWorldBtn = document.getElementById('enter-world-btn');
    this.enterWorldBottomBtn = document.getElementById('enter-world-bottom-btn');
    this.loadingOverlay = document.getElementById('world-loading-overlay');
    this.uiOverlay = document.getElementById('ui-overlay');

    if (this.enterWorldBtn) {
      this.enterWorldBtn.addEventListener('click', () => this.handleEnterWorld());
    }
    if (this.enterWorldBottomBtn) {
      this.enterWorldBottomBtn.addEventListener('click', () => this.handleEnterWorld());
    }

    if (this.wishAudioBtn && this.wishAudioToggle) {
      const toggle = () => this.toggleWishMusic();
      this.wishAudioBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        toggle();
      });
      this.wishAudioToggle.addEventListener('click', toggle);
    }
  }

  _initPasswordForm() {
    if (!this.passwordForm || !this.passwordInput) return;

    const urlParams = new URLSearchParams(window.location.search);
    const isAuthed = sessionStorage.getItem('kuchii_auth') === 'true' || urlParams.get('skipAuth') === '1';

    if (isAuthed) {
      this.isAuthenticated = true;
      this.passwordScreen.classList.add('hidden');
      if (urlParams.get('skipWish') === '1') {
        this.wishScreen.classList.add('hidden');
        if (this.onEnterWorld) this.onEnterWorld();
        if (this.uiOverlay) this.uiOverlay.classList.remove('hidden');
        return;
      }
      this.wishScreen.classList.remove('hidden');
      this.startWishMusic();
      return;
    }

    const checkPassword = () => {
      const val = this.passwordInput.value.trim().toLowerCase();
      if (val === '22x10') {
        this.passwordError.classList.add('hidden');
        sessionStorage.setItem('kuchii_auth', 'true');
        this.unlockWishPage();
      } else {
        this.passwordError.classList.remove('hidden');
        this.passwordInput.classList.add('shake');
        setTimeout(() => this.passwordInput.classList.remove('shake'), 600);
      }
    };

    this.passwordForm.addEventListener('submit', (e) => {
      e.preventDefault();
      checkPassword();
    });

    const submitBtn = document.getElementById('password-submit-btn');
    if (submitBtn) {
      submitBtn.addEventListener('click', checkPassword);
    }
  }

  unlockWishPage() {
    this.isAuthenticated = true;
    sessionStorage.setItem('kuchii_auth', 'true');
    this.passwordScreen.classList.add('fade-out');

    setTimeout(() => {
      this.passwordScreen.classList.add('hidden');
      this.wishScreen.classList.remove('hidden');
      this.wishScreen.classList.add('fade-in');
      this.startConfetti();
      this.startWishMusic();
    }, 500);
  }

  _initWishLetter() {
    const container = document.getElementById('wish-letter-content');
    if (!container) return;

    // Load from /wish.txt if available, or populate structured heartfelt message
    fetch('/wish.txt')
      .then((res) => {
        if (!res.ok) throw new Error('File not found');
        return res.text();
      })
      .then((text) => {
        this._renderLetterParagraphs(container, text);
      })
      .catch(() => {
        // Safe fallback embedded message
        const fallback = `HAPPIEST BIRTHDAY TO MY SMART INTELIGENT AND BEAUTIFUL GIRL❤️🎂🎊🌹💐💐🍫🕯️.. my favourite person❤️ in this entire universe and I love you soooooo muchhhhh❤️. Wishing you nothing but lots and lots of happiness, love and good health🧿. Just like last few every years, one line will be constant which is WORLD NEED MORE PEOPLE LIKE YOU. 
I want and I'll pray ki tumhari sari sari sari sari dreams wishes sb sb puri ho.. tm sb achhe se ghumo.. car achhe se shikhooo and proud feel kro tm.. job jldi se mile🧿 and parents ko proud feel karao🧿.. And bohot bohot khus rhhoooooo..

You tough me so many things that i dont have count of those things and I just want you to always be like this for❤️🧿.. MY SAFE PLACE.. I'm never going to compare neither you nor your effort for me with anyone. I'm just soo lucky to have you and want to spend rest of my life with you. ye sb to mai kafi bar bol chuka hu waise😂
And most important thing happening this year, thank you for teaching me the way you wanted to be loved❤️🧿. this is by far one of the best thing happening this year.
SO SHIVANI THANK YOU FOR BEING IN KU LIFE❤️ AND PLEASE ME MINE ONLY❤️

Aur kitti tafeez karu mai tumhari🫠🫠🫠🫠.. mai jo sb bol rha sb km hai jitti achhi ho tm.. mai ye sb samne baithke bolna chahta hu.. milne ke liye itta paresan hu chahe bol na pau kuchh tumhare samne.. bss itta jarur jano ki jo bhi mai bol rha wish krrr rha wo ikdam sachi wish hai..
And yes you are soo beautiful🫶🏻🫶🏻 and and I love your voice soooo muchhhhhh❤️.. 
I'm never going to get bored by your voice. I love your gigle your laugh you gussa everythnggg.. 
I just wanna see yourrr face every day and i dont really know how to express how much I love you how much i admire you as a person..
You are a KHUBSURAT INSAN BY HEART. I love how empathic you are. I love how kind you are..
And and I love howw muchh you want to do things for yourself.. it is just sooo impressive..
I love how fearless you are.. I love you much you value womens right and all. I love you different you are from others, the way you thing sb sb❤️
And I miss you more than I'll ever soo and even idk how can i show that I miss you muchh and I just crave your presence everydayyyyy❤️

I just want to see you win in life. I want to see you being proud of your efforts and be successful the way you want.. I'll be soo soo soo happy see you like this.

And yes tm kitta bhi bologi ki nhi shikhar tm krr rhe bt mai yhi tmse hamesa yhi bolunga ki I met the best and happiest version of me when are like this "tegether❤️"
Thank you for being my safe place.

And this b'day I wanted to give you a gift which is "it does not matter ki hmm dono ke beech me cheeze kitti bhi tough ho jaye.. ya tm kitti bhi dudhi ho jao wrinkles aa jaye🌚 ya tm chidhchidhi ho jao ya tm kitti bhi gussa ho jao.. mai kabhi tmko chodhke kahi aur nhi jane wala" Ye mera tmko b'day gift hai.. promise hai sb hai..
and that day you asked me ki kyu mai tumahare sath ayu na shivani.. is liye ayo b'cos i want to give you love❤️`;
        this._renderLetterParagraphs(container, fallback);
      });
  }

  _renderLetterParagraphs(container, rawText) {
    container.innerHTML = '';
    const rawParagraphs = rawText.split(/\n\s*\n/);

    rawParagraphs.forEach((para) => {
      const trimmed = para.trim();
      if (!trimmed) return;

      // Check if this paragraph contains the special gift promise
      if (trimmed.includes('mai kabhi tmko chodhke kahi aur nhi jane wala')) {
        const quoteEl = document.createElement('div');
        quoteEl.className = 'letter-highlight-box';
        quoteEl.innerHTML = `<span class="quote-mark">❝</span><p>${this._formatText(trimmed)}</p><span class="quote-mark right">❞</span>`;
        container.appendChild(quoteEl);
      } else if (trimmed.startsWith('Again HAPPY BIRTHDAY')) {
        // Sign-off handled separately
      } else {
        const p = document.createElement('p');
        p.className = 'letter-paragraph';
        p.innerHTML = this._formatText(trimmed);
        container.appendChild(p);
      }
    });
  }

  _formatText(text) {
    // Preserve linebreaks within a paragraph
    let formatted = text.replace(/\n/g, '<br/>');
    // Emphasize key sweet phrases gently
    formatted = formatted.replace(
      /WORLD NEED MORE PEOPLE LIKE YOU/g,
      '<strong>WORLD NEED MORE PEOPLE LIKE YOU</strong>'
    );
    formatted = formatted.replace(
      /MY SAFE PLACE/g,
      '<strong class="gold-accent">MY SAFE PLACE</strong>'
    );
    formatted = formatted.replace(
      /KHUBSURAT INSAN BY HEART/g,
      '<strong class="gold-accent">KHUBSURAT INSAN BY HEART</strong>'
    );
    return formatted;
  }

  // ---------------------------------------------------------------- Confetti
  _initConfetti() {
    this.canvas = document.getElementById('confetti-canvas');
    if (!this.canvas) return;
    this.ctx = this.canvas.getContext('2d');

    const resize = () => {
      this.canvas.width = window.innerWidth;
      this.canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', resize);
    resize();

    const colors = [
      '#f6c878', // warm sun gold
      '#e07a5f', // coral sunset
      '#f4a261', // soft apricot
      '#ffb5a7', // rose petal
      '#fae1dd', // soft champagne
      '#fcd5ce'  // blush
    ];

    const count = 65;
    this.confettiParticles = [];
    for (let i = 0; i < count; i++) {
      this.confettiParticles.push({
        x: Math.random() * window.innerWidth,
        y: Math.random() * window.innerHeight - window.innerHeight,
        w: 8 + Math.random() * 8,
        h: 12 + Math.random() * 10,
        color: colors[Math.floor(Math.random() * colors.length)],
        vx: (Math.random() - 0.5) * 1.5,
        vy: 1.2 + Math.random() * 2.0,
        angle: Math.random() * Math.PI * 2,
        rotSpeed: (Math.random() - 0.5) * 0.06,
        wobbleSpeed: 0.02 + Math.random() * 0.03,
        wobble: Math.random() * Math.PI * 2
      });
    }
  }

  startConfetti() {
    if (this.confettiActive) return;
    this.confettiActive = true;

    const render = () => {
      if (!this.confettiActive) return;
      this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

      const w = this.canvas.width;
      const h = this.canvas.height;

      this.confettiParticles.forEach((p) => {
        p.wobble += p.wobbleSpeed;
        p.angle += p.rotSpeed;
        p.x += p.vx + Math.sin(p.wobble) * 1.2;
        p.y += p.vy;

        if (p.y > h + 20) {
          p.y = -20;
          p.x = Math.random() * w;
        }

        this.ctx.save();
        this.ctx.translate(p.x, p.y);
        this.ctx.rotate(p.angle);
        this.ctx.fillStyle = p.color;
        this.ctx.fillRect(-p.w / 2, -p.h / 2, p.w * Math.cos(p.wobble), p.h);
        this.ctx.restore();
      });

      requestAnimationFrame(render);
    };

    requestAnimationFrame(render);
  }

  stopConfetti() {
    this.confettiActive = false;
    if (this.ctx && this.canvas) {
      this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }
  }

  // ---------------------------------------------------------------- Audio
  _initAudio() {
    // Check candidate paths for user's birthday song
    const candidateFiles = [
      '/audio/birthday.mp3',
      '/audio/bday.mp3',
      '/audio/happy_birthday.mp3',
      '/audio/hbd.mp3',
      '/audio/song.mp3'
    ];

    const tryLoad = (idx) => {
      if (idx >= candidateFiles.length) {
        // No custom file found yet -> will use sweet Web Audio music box melody
        return;
      }
      const file = candidateFiles[idx];
      const audio = new Audio();
      audio.src = file;
      audio.loop = true;
      audio.volume = 0.65;
      audio.addEventListener('canplaythrough', () => {
        this.audioElement = audio;
        if (this.isPlayingMusic) {
          this._stopMusicBox();
          audio.play().catch(() => {});
        }
      });
      audio.addEventListener('error', () => {
        tryLoad(idx + 1);
      });
    };

    tryLoad(0);
  }

  startWishMusic() {
    this.isPlayingMusic = true;
    if (this.wishAudioBtn) this.wishAudioBtn.textContent = '⏸';
    if (this.wishMusicStatus) this.wishMusicStatus.textContent = 'Birthday Song: Playing';

    if (this.audioElement) {
      this.audioElement.play().catch(() => {
        this._startMusicBox();
      });
    } else {
      this._startMusicBox();
    }
  }

  pauseWishMusic() {
    this.isPlayingMusic = false;
    if (this.wishAudioBtn) this.wishAudioBtn.textContent = '▶';
    if (this.wishMusicStatus) this.wishMusicStatus.textContent = 'Birthday Song: Paused';

    if (this.audioElement) {
      this.audioElement.pause();
    }
    this._stopMusicBox();
  }

  toggleWishMusic() {
    if (this.isPlayingMusic) {
      this.pauseWishMusic();
    } else {
      this.startWishMusic();
    }
  }

  _startMusicBox() {
    if (this.musicBoxInterval) return;

    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) return;
    if (!this.audioCtx) {
      this.audioCtx = new AudioContextClass();
    }
    if (this.audioCtx.state === 'suspended') {
      this.audioCtx.resume();
    }

    // Gentle celesta chime melody for "Happy Birthday to You"
    // Notes: [freq, duration in beats]
    const notes = [
      [261.63, 1], [261.63, 1], [293.66, 2], [261.63, 2], [349.23, 2], [329.63, 4], // Happy birthday to you
      [261.63, 1], [261.63, 1], [293.66, 2], [261.63, 2], [392.00, 2], [349.23, 4], // Happy birthday to you
      [261.63, 1], [261.63, 1], [523.25, 2], [440.00, 2], [349.23, 2], [329.63, 2], [293.66, 3], // Happy birthday dear Kuchii
      [466.16, 1], [466.16, 1], [440.00, 2], [349.23, 2], [392.00, 2], [349.23, 5]  // Happy birthday to you
    ];

    let noteIndex = 0;
    const playNext = () => {
      if (!this.isPlayingMusic || this.audioElement) return;

      const [freq, dur] = notes[noteIndex];
      noteIndex = (noteIndex + 1) % notes.length;

      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, this.audioCtx.currentTime);

      // Sweet bell-like harmonic overtone
      const osc2 = this.audioCtx.createOscillator();
      osc2.type = 'triangle';
      osc2.frequency.setValueAtTime(freq * 2, this.audioCtx.currentTime);

      const now = this.audioCtx.currentTime;
      gain.gain.setValueAtTime(0.001, now);
      gain.gain.linearRampToValueAtTime(0.09, now + 0.03);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + dur * 0.45);

      osc.connect(gain);
      osc2.connect(gain);
      gain.connect(this.audioCtx.destination);

      osc.start(now);
      osc2.start(now);
      osc.stop(now + dur * 0.48);
      osc2.stop(now + dur * 0.48);

      const delay = dur * 320;
      this.musicBoxInterval = setTimeout(playNext, delay);
    };

    playNext();
  }

  _stopMusicBox() {
    if (this.musicBoxInterval) {
      clearTimeout(this.musicBoxInterval);
      this.musicBoxInterval = null;
    }
  }

  // ---------------------------------------------------------------- Enter World Transition
  handleEnterWorld() {
    if (this.isWorldEntered) return;
    this.isWorldEntered = true;

    // Show loading state on button
    if (this.enterWorldBtn) {
      this.enterWorldBtn.disabled = true;
      this.enterWorldBtn.innerHTML = `
        <span class="btn-spinner"></span>
        <span class="cta-text">Loading your world...</span>
      `;
    }
    if (this.enterWorldBottomBtn) {
      this.enterWorldBottomBtn.disabled = true;
      this.enterWorldBottomBtn.innerHTML = `
        <span class="btn-spinner"></span>
        <span>Loading your world...</span>
      `;
    }

    // Show heartfelt loading overlay
    if (this.loadingOverlay) {
      this.loadingOverlay.classList.remove('hidden');
      this.loadingOverlay.classList.add('fade-in');
    }

    // Smoothly fade out birthday music
    this._fadeOutWishMusic(1200);

    // Allow Three.js engine and world to confirm readiness
    setTimeout(() => {
      this.stopConfetti();

      // Trigger 3D world start
      if (this.onEnterWorld) {
        this.onEnterWorld();
      }

      // Smoothly transition from wish screen into 3D world
      this.wishScreen.classList.add('fade-out');
      setTimeout(() => {
        this.wishScreen.classList.add('hidden');
        if (this.loadingOverlay) {
          this.loadingOverlay.classList.add('fade-out');
          setTimeout(() => this.loadingOverlay.classList.add('hidden'), 600);
        }
        if (this.uiOverlay) {
          this.uiOverlay.classList.remove('hidden');
          this.uiOverlay.classList.add('fade-in');
        }
      }, 700);
    }, 1200);
  }

  _fadeOutWishMusic(durationMs) {
    if (this.audioElement) {
      const startVol = this.audioElement.volume;
      const steps = 15;
      const stepTime = durationMs / steps;
      let currentStep = 0;

      const fade = setInterval(() => {
        currentStep++;
        this.audioElement.volume = Math.max(0, startVol * (1 - currentStep / steps));
        if (currentStep >= steps) {
          clearInterval(fade);
          this.audioElement.pause();
        }
      }, stepTime);
    } else {
      this._stopMusicBox();
    }
  }
}
