# Project Brief & Phased Build Plan
## "Her World" — A Walkable 3D Birthday Experience

---

## 1. Project Overview

A single-page, browser-based 3D interactive experience built as a birthday gift. The recipient controls a character with **WASD** movement through a small, realistic-leaning 3D world. As she explores, she discovers stations tied to things she genuinely loves — each one revealing a message, memory, or small interactive moment. The experience should feel like a **3–4 minute guided-but-free walk**, not a quick 3-click demo — enough content and pacing that she slows down, reads, smiles, and wants to see what's around the next corner.

**Target completion:** Before Oct 13 (her birthday).
**Delivery format:** Single-page website (can be hosted anywhere static — Vercel/Netlify/GitHub Pages).
**Builder:** Claude Code, working phase-by-phase from this document.

---

## 2. Goals & Success Criteria

- She feels *seen* — every station reflects something true and specific about her, not generic "cute girlfriend site" filler.
- The experience takes **3–4 minutes minimum** to walk through at a natural pace, with room to linger.
- It feels like a small world, not a slideshow — movement, discovery, and pacing matter as much as content.
- Visual style leans **realistic / semi-realistic** (soft PBR lighting, real shadows, good materials) rather than flat cartoon low-poly — while staying achievable in a browser without a huge asset budget.
- Runs smoothly on a laptop browser (Chrome/Safari). Mobile fallback is nice-to-have, not required.
- **Tone:** warm, sincere, playful in places, emotionally honest — but tasteful (see Section 3).

---

## 3. Content Boundaries (Non-Negotiable)

- **No intimate or suggestive scenes of any kind.**
- The only physical affection depicted: **hand-holding** and a **slow dance** between two simple/stylized avatars near the end of the experience. Nothing beyond that, ever — no kissing animations, no bedroom scenes, nothing suggestive.
- Deeply personal/private conversation content (trust issues, past struggles, apologies, etc.) should **not** be quoted or displayed literally anywhere in the site. These can only inform *tone* (e.g., a station about "feeling safe") — never literal text pulled from private chats.
- All written messages shown to her should be written fresh by the user (placeholders are provided below for him to fill in — Claude Code should NOT invent deeply personal messages on his behalf, only light/fun copy for non-emotional stations).

---

## 4. Recipient Profile (For Tone & Content Reference Only — Not for Literal Display)

Use this to guide *mood, color, pacing, and what each station represents* — not to be pasted as on-site text.

- Independent, brilliant, hardworking, kind, deeply empathetic, wise beyond her years.
- Feminine and strong at once — gorgeous, stylish, loves fashion and hairstyling.
- A caretaker — looks after the people she loves. Loves dogs/animals.
- Foodie, especially spicy food; loves prawn curry (West Bengal style).
- Big personality around fun/nostalgia: Shin-chan, Doremon, watches tons of movies, loves music.
- Dreams of travel: Amazon rainforest, Japan, South Indian temples, Switzerland, Paris.
- Wants to learn to drive, loves swimming.
- Loves: sunflowers, small earrings, delicate anklets (payal), glitter/golden-pink eyeshadow, transparent/glitter nail polish with tiny star details, pockets in dresses, turtlenecks, midi dresses.
- Was cautious about relationships (trust took time to build) — now feels safe. This should be reflected only as an *emotional undertone* near the final station, never spelled out literally.

---

## 5. Tech Stack & Constraints

- **Three.js** (vanilla or via a lightweight framework — Claude Code may choose vanilla JS + Three.js for simplicity, or React Three Fiber if it speeds up development).
- Single HTML page, single build output. No backend required — no login, no database. All content can be hardcoded in a config/content file for easy editing.
- Assets: primitive geometry + simple stylized/realistic materials (avoid needing custom sculpted 3D character models — use approachable low-poly-but-well-lit humanoid placeholders, or simple articulated "capsule + sphere" style characters with soft PBR shading, so it reads as "realistic-leaning" through lighting/materials rather than model complexity).
- Free/open asset sources only (e.g., Poly Haven, Kenney assets, Google Fonts) — no paid or copyrighted branded assets (especially avoid literal Shin-chan/Doremon character models — represent these thematically via colors, props, or fan-safe original designs instead of copyrighted character likenesses).
- Sound: optional ambient background music + soft interaction sound effects (chime on discovery).
- Must run entirely client-side, deployable as static files.

---

## 6. World Layout & Flow

**Format:** One continuous connected map, with a road/path system linking each station. Player starts at the House, and the path guides her (loosely — she can wander) through each station in a logical order, ending at a Finale Station.

Recommended layout (Claude Code has flexibility on exact geometry, but should preserve this order and pacing):

```
[House / Start] 
     |
[Sunflower Garden — Getting Ready corner]
     |
[Dream Travel Globe]
     |
[Nostalgia Corner — cartoons, movies, music]
     |
[Food Street]
     |
[The Road That Led To Us]  <-- transition/emotional beat
     |
[Finale — Hand-holding & Dance + Personal Message]
```

Target: 6 major stations + connecting road segments with ambient details (trees, streetlights, small props) so walking between stations doesn't feel empty. Total walk time at comfortable pace: **3–4 minutes**, achieved through map scale and pacing, not artificial slowdowns.

---

## 7. Station-by-Station Specification

### 7.1 House (Start Point)
- Small cozy house exterior, warm lighting, front porch.
- Her character (stylized avatar) + a **dog companion** that follows her around the whole world (simple follow-AI: trails behind at a fixed offset, small idle animations).
- Optional: a sign or doormat with a short welcome line (placeholder: *"Welcome to your world"*).
- This is also a good place for a subtle nod to the home you two have talked about building together (garden, sunlight, a wall for painting) — keep it visual/atmospheric only, not spelled out in text.

### 7.2 Sunflower Garden ("Getting Ready" Corner)
- Field of sunflowers (main visual centerpiece — should look genuinely nice, this is her favorite flower).
- Small interactive props: a jewelry stand (tiny earrings, anklet with pendant), a glitter/makeup vanity with a "sparkle" particle effect on click (gold + baby pink), a nail polish bottle prop (transparent/glitter with tiny star detail).
- Interaction: clicking/approaching each prop shows a short label + optional note.

### 7.3 Dream Travel Globe
- Central rotating globe or a cluster of small dioramas/signposts, each representing a destination:
  - Amazon rainforest (greenery, small toucan or leaf detail)
  - Japan (torii gate silhouette)
  - South Indian temples (temple silhouette/gopuram shape)
  - Switzerland (small mountain peaks)
  - Paris (mini Eiffel Tower)
- Clicking each one shows the destination name + a short "someday, we'll go here" style line (placeholder text, user to personalize).

### 7.4 Nostalgia Corner
- Playful area referencing cartoons she loves, movies, and music — **without using copyrighted character likenesses**. Use color palettes, silhouettes, or generic "TV/movie reel/vinyl record" props with labels instead of drawing the actual characters, to stay safe and tasteful.
- A small "jukebox" or boombox prop that (optionally) plays a short ambient tune or shows a scrolling list of songs/movies.

### 7.5 Food Street
- A tiny stall or table scene: prawn curry dish prop, spicy chili detail, warm string lights.
- Light, fun captions only here (e.g., "spice level: her level").

### 7.6 The Road That Led To Us
- A quieter stretch of path — softer lighting, maybe dusk/sunset tones — with a few small signposts along the way with short, gentle lines (placeholders — user writes final copy) that build emotionally toward the finale without stating anything overly private.
- This is a pacing/transition beat — should feel like the mood shifting from "fun" to "heartfelt."

### 7.7 Finale
- Two simple stylized avatars standing together, hands linked (hand-holding pose/animation).
- A short slow "dance" animation (gentle spin/sway loop) — tasteful, PG, nothing further.
- A message panel/overlay appears with the user's own final written message to her (text to be supplied by user — Claude Code should leave this as a clearly marked placeholder in the content config).
- Optional: gentle particle effect (fireflies, floating hearts, or flower petals) and warm sunset lighting.
- Optional: a "Happy Birthday [Name]" reveal as the closing beat.

---

## 8. Controls & Camera

- **WASD** (or arrow keys) for movement.
- Camera: third-person, slightly elevated/angled behind the character (not full top-down — user wants it to feel more immersive/realistic, so a soft-follow chase camera works better than a strict top-down camera).
- Smooth camera-follow with slight lag/easing for a polished feel.
- Simple collision/boundary so she can't walk off the map; collision with buildings/props optional (soft bounding boxes fine — doesn't need to be pixel-perfect).
- Discovery trigger: proximity-based (walking near a station auto-triggers a subtle prompt like "press E to look closer") rather than requiring precise clicking, so it feels natural to explore.

---

## 9. Visual Style Guidelines

- **Realistic-leaning, not flat cartoon**: soft shadows, ambient occlusion where feasible, warm directional "sunset/golden hour" lighting as the default mood for most of the map, with the Finale transitioning to a warmer dusk palette.
- Color palette: warm neutrals + her favorite tones (soft pinks, gold, sunflower yellow, sky blue) — avoid harsh saturated "toy" colors.
- Materials: simple PBR (roughness/metalness) rather than flat-shaded toon materials, to support the "realistic" feel without requiring complex geometry.
- Typography (for UI text/messages): a soft, handwritten-style or elegant serif font for message overlays; clean sans-serif for small UI hints.

---

## 10. Audio Plan (Nice-to-Have, Not Blocking)

- Soft ambient background music loop (royalty-free, warm/acoustic).
- Optional short chime sound effect when discovering a station.
- Mute/volume toggle in a corner UI element.

---

## 11. Non-Functional Requirements

- Must run smoothly in-browser on a mid-range laptop (target 60fps where possible, no hard requirement below 30fps).
- Load time: reasonable for a personal gift site — optimize assets but doesn't need production-grade CDN optimization.
- No backend, no user data collection, no analytics needed.
- Should work fully offline once loaded (all assets bundled) — nice to have, not mandatory, in case of unreliable venue wifi when showing her.

---

## 12. Phased Implementation Plan (For Claude Code)

Claude Code should implement strictly in this order. Do not skip ahead or reorder phases — each phase should be functional and testable before moving to the next.

### Phase 0 — Project Scaffold
- Set up project structure (vanilla JS + Three.js, or React Three Fiber — Claude Code's choice).
- Basic HTML page, Three.js scene with a ground plane, camera, and lighting rig (ambient + directional "sun" light with shadows enabled).
- Confirm build/dev server runs locally.

### Phase 1 — Character & Movement
- Add a simple placeholder character (capsule/box-based humanoid is fine at this stage).
- Implement WASD movement + third-person chase camera with smooth follow/easing.
- Implement map boundary collision (can't walk off the edge).
- Add the dog companion with basic follow behavior.

### Phase 2 — World Geometry & Layout
- Build the base terrain/map layout matching Section 6 (house, garden, globe area, nostalgia corner, food street, connecting road, finale area).
- Place connecting paths/roads and basic environmental props (trees, streetlights, fences) for visual continuity between stations.
- No interactivity yet — just the physical world layout and correct scale for a 3–4 minute walk.

### Phase 3 — Station Interactivity (Content Layer)
- Implement a reusable "discovery" system: proximity detection + UI prompt + message/overlay panel.
- Build out each station per Section 7, one at a time, in this order: House → Sunflower Garden → Dream Travel Globe → Nostalgia Corner → Food Street → Road → Finale.
- All station text/content should live in a single content config file (e.g. `content.json` or `content.js`) so the user can edit wording later without touching code.
- Insert clearly marked placeholders for all personal message text (do not invent deeply personal copy).

### Phase 4 — Finale Sequence
- Build the two-avatar hand-holding + slow dance animation.
- Implement the final message reveal panel + optional "Happy Birthday" reveal moment.
- Add finale particle effects and lighting mood shift.

### Phase 5 — Visual Polish
- Upgrade materials/lighting to hit the "realistic-leaning" visual target (Section 9).
- Add ambient particle effects across the map where relevant (fireflies at dusk, floating petals near garden, glitter sparkle at vanity station).
- Tune color grading/post-processing (bloom, soft vignette) if performance allows.

### Phase 6 — Audio
- Add background music loop + mute toggle.
- Add discovery chime sound effects.

### Phase 7 — QA & Performance Pass
- Test full walkthrough start-to-finish, confirm pacing lands in the 3–4 minute range at a natural walking speed.
- Performance check (frame rate, load time) and optimize any heavy assets.
- Cross-browser check (Chrome, Safari at minimum).

### Phase 8 — Final Content Pass
- User fills in all placeholder message text (Phase 3 & 4 content config) with his own personal words.
- Final proofread + click-through test together before deployment.

### Phase 9 — Deployment
- Deploy as a static site (Vercel/Netlify/GitHub Pages — user's choice).
- Confirm it loads correctly on the exact device/browser it'll be shown on for the birthday reveal.

---

## 13. Open Items for the User to Decide Before/During Build

- [ ] Confirm her name for on-site personalization (e.g., "Shivani").
- [ ] Write final placeholder message text for: Dream Travel signs, Road-to-Us signposts, and the Finale message.
- [ ] Decide on background music track (royalty-free source).
- [ ] Decide hosting platform + whether the link will be sent digitally or shown in person on launch day.
- [ ] Confirm exact reveal date/context (Oct 13 birthday).

---

## 14. Explicit Reminders for Claude Code

- Do not use copyrighted character likenesses (Shin-chan, Doremon, or any branded IP) — represent thematically only.
- Do not add any romantic content beyond hand-holding and a slow dance.
- Do not invent deeply personal/emotional message copy — leave clearly marked placeholders for the user to fill in himself.
- Prioritize a working, walkable, testable version at the end of every phase over front-loading visual polish — polish comes in Phase 5, not before.