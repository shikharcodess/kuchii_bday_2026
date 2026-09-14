import * as THREE from 'three';
import { CONTENT } from '../config/content.js';

/**
 * SurpriseSystem
 * 
 * Manages virtual surprises:
 * - Raycasting click detection on 3D objects
 * - Progress tracking (e.g. 1 of 8 surprises found)
 * - Audio chimes (synthesized Web Audio for offline-ready delight)
 * - Celebration particle effects (confetti & hearts)
 * - Guidance arrow targeting
 */
export class SurpriseSystem {
  constructor(scene, camera, hud, messagePanel, guidanceArrow) {
    this.scene = scene;
    this.camera = camera;
    this.hud = hud;
    this.messagePanel = messagePanel;
    this.guidanceArrow = guidanceArrow;

    this.surprises = CONTENT.surprises || [];
    this.found = new Set();
    this.clickables = [];

    this.raycaster = new THREE.Raycaster();
    this.mouse = new THREE.Vector2();

    this._setupAudio();
    this._setupEventListeners();
    this._updateTarget();
    this._updateHUD();
  }

  _setupAudio() {
    // Elegant, soft synthesized chime chords using Web Audio API
    this.audioCtx = null;
    const initAudio = () => {
      if (!this.audioCtx) {
        this.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      }
    };
    window.addEventListener('pointerdown', initAudio, { once: true });
    window.addEventListener('keydown', initAudio, { once: true });
  }

  playChime() {
    if (!this.audioCtx) return;
    try {
      if (this.audioCtx.state === 'suspended') {
        this.audioCtx.resume();
      }
      const now = this.audioCtx.currentTime;
      // Soft arpeggiated music box chime: C5, E5, G5, B5, C6
      const freqs = [523.25, 659.25, 783.99, 987.77, 1046.5];
      freqs.forEach((freq, index) => {
        const osc = this.audioCtx.createOscillator();
        const gain = this.audioCtx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + index * 0.08);

        gain.gain.setValueAtTime(0, now + index * 0.08);
        gain.gain.linearRampToValueAtTime(0.18, now + index * 0.08 + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + index * 0.08 + 0.85);

        osc.connect(gain);
        gain.connect(this.audioCtx.destination);

        osc.start(now + index * 0.08);
        osc.stop(now + index * 0.08 + 0.9);
      });
    } catch (e) {
      console.warn('Audio play error:', e);
    }
  }

  _setupEventListeners() {
    window.addEventListener('surprise_found', (e) => {
      if (e.detail && e.detail.id) {
        this.triggerSurprise(e.detail.id);
      }
    });
  }

  registerClickable(object, surpriseId) {
    object.userData.surpriseId = surpriseId;
    object.userData.isClickable = true;
    this.clickables.push(object);
  }

  update(input, character) {
    // Check if player clicked
    const click = input.consumeClick();
    if (click && this.clickables.length > 0) {
      this.mouse.x = (click.x / window.innerWidth) * 2 - 1;
      this.mouse.y = -(click.y / window.innerHeight) * 2 + 1;

      this.raycaster.setFromCamera(this.mouse, this.camera);
      const intersects = this.raycaster.intersectObjects(this.clickables, true);

      if (intersects.length > 0) {
        let hit = intersects[0].object;
        while (hit && !hit.userData.surpriseId && hit.parent) {
          hit = hit.parent;
        }
        if (hit && hit.userData.surpriseId) {
          this.triggerSurprise(hit.userData.surpriseId);
        }
      }
    }
  }

  triggerSurprise(surpriseId) {
    const item = this.surprises.find((s) => s.id === surpriseId);
    if (!item) return;

    const isFirstTime = !this.found.has(surpriseId);
    this.found.add(surpriseId);

    if (isFirstTime) {
      this.playChime();
      this._launchConfetti();
      this._updateHUD();
      this._updateTarget();
    }

    // Display rich surprise card modal
    this.messagePanel.showSurprise(item, this.found.size, this.surprises.length);
  }

  _updateTarget() {
    if (!this.guidanceArrow) return;

    // Find first undiscovered surprise
    const nextSurprise = this.surprises.find((s) => !this.found.has(s.id));
    if (nextSurprise) {
      // Find matching station or coordinate
      const stationMatch = CONTENT.stations.find((st) => 
        nextSurprise.id.startsWith(st.id) || st.id.includes(nextSurprise.id.split('_')[0])
      );
      if (stationMatch) {
        this.guidanceArrow.setTarget(new THREE.Vector3(stationMatch.position.x, 0, stationMatch.position.z));
      }
    } else {
      // All surprises found! Point to Finale
      const finale = CONTENT.stations.find((s) => s.id === 'finale');
      if (finale) {
        this.guidanceArrow.setTarget(new THREE.Vector3(finale.position.x, 0, finale.position.z));
      }
    }
  }

  _updateHUD() {
    if (this.hud && this.hud.updateCounter) {
      this.hud.updateCounter(this.found.size, this.surprises.length);
    }
  }

  _launchConfetti() {
    // Pure CSS & canvas confetti burst on surprise discovery
    const container = document.body;
    const canvas = document.createElement('canvas');
    canvas.style.position = 'fixed';
    canvas.style.top = '0';
    canvas.style.left = '0';
    canvas.style.width = '100vw';
    canvas.style.height = '100vh';
    canvas.style.pointerEvents = 'none';
    canvas.style.zIndex = '999';
    container.appendChild(canvas);

    const ctx = canvas.getContext('2d');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const colors = ['#f6c878', '#f4a261', '#e07a5f', '#f2cc8f', '#efb0c0', '#ffd166'];
    const particles = [];
    for (let i = 0; i < 48; i++) {
      particles.push({
        x: canvas.width / 2,
        y: canvas.height / 2,
        vx: (Math.random() - 0.5) * 14,
        vy: (Math.random() - 0.8) * 16,
        size: 5 + Math.random() * 8,
        color: colors[Math.floor(Math.random() * colors.length)],
        rot: Math.random() * 360,
        rotSpeed: (Math.random() - 0.5) * 12,
        alpha: 1
      });
    }

    let start = null;
    const animate = (timestamp) => {
      if (!start) start = timestamp;
      const progress = timestamp - start;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      let anyAlive = false;
      particles.forEach((p) => {
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.45; // gravity
        p.rot += p.rotSpeed;
        p.alpha -= 0.015;

        if (p.alpha > 0) {
          anyAlive = true;
          ctx.save();
          ctx.globalAlpha = Math.max(0, p.alpha);
          ctx.translate(p.x, p.y);
          ctx.rotate((p.rot * Math.PI) / 180);
          ctx.fillStyle = p.color;
          ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.7);
          ctx.restore();
        }
      });

      if (anyAlive && progress < 2200) {
        requestAnimationFrame(animate);
      } else {
        canvas.remove();
      }
    };
    requestAnimationFrame(animate);
  }
}
