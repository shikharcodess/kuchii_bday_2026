# Graph Report - kuchii_bday  (2026-09-17)

## Corpus Check
- Corpus is ~31,480 words - fits in a single context window. You may not need a graph.

## Summary
- 310 nodes · 713 edges · 14 communities (10 shown, 4 thin omitted)
- Extraction: 96% EXTRACTED · 4% INFERRED · 0% AMBIGUOUS · INFERRED: 28 edges (avg confidence: 0.84)
- Token cost: 55,000 input · 6,000 output

## Community Hubs (Navigation)
- Scene Bootstrap & Camera
- Pond & Procedural Props
- Project Brief & Stations
- Interaction & Lighting
- Instanced Vegetation
- Atmosphere & PostFX
- Materials & Textures
- Input Manager
- Package Config
- Food Street Builders
- Path System
- Character Model
- Message Panel UI
- Ground Terrain

## God Nodes (most connected - your core abstractions)
1. `three` - 26 edges
2. `tinted()` - 26 edges
3. `InputManager` - 19 edges
4. `seededRandom()` - 18 edges
5. `Character` - 17 edges
6. `World` - 15 edges
7. `SurpriseSystem` - 13 edges
8. `createLantern()` - 13 edges
9. `damp()` - 12 edges
10. `MAT` - 12 edges

## Surprising Connections (you probably didn't know these)
- `#canvas-container (Three.js mount point)` --implements--> `Tech Stack: Three.js, static single page, primitive geometry + PBR`  [INFERRED]
  index.html → brd.md
- `Built-in Stylized Character (fallback)` --implements--> `Tech Stack: Three.js, static single page, primitive geometry + PBR`  [INFERRED]
  public/models/README.txt → brd.md
- `#interaction-prompt ('E · Look closer' badge)` --implements--> `Discovery System (proximity prompt + message overlay)`  [INFERRED]
  index.html → brd.md
- `#message-panel (surprise/message modal)` --implements--> `Discovery System (proximity prompt + message overlay)`  [INFERRED]
  index.html → brd.md
- `#surprise-counter-pill ('Surprises: 0 / 8')` --conceptually_related_to--> `Discovery System (proximity prompt + message overlay)`  [INFERRED]
  index.html → brd.md

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **Station walk order (House → Finale)** — brd_house_station, brd_sunflower_garden, brd_dream_travel_globe, brd_nostalgia_corner, brd_food_street, brd_road_that_led_to_us, brd_finale [EXTRACTED 1.00]
- **Discovery UI flow (prompt → panel → counter)** — brd_discovery_system, index_interaction_prompt, index_message_panel, index_surprise_counter, index_script_entry [INFERRED 0.85]
- **Character model strategy (placeholder humanoid vs optional glb)** — brd_tech_stack, public_models_readme_character_glb, public_models_readme_builtin_stylized_character, public_models_readme_ready_player_me, public_models_readme_mixamo [INFERRED 0.75]

## Communities (14 total, 4 thin omitted)

### Community 0 - "Scene Bootstrap & Camera"
Cohesion: 0.10
Nodes (14): three, ref_three_examples_jsm_loaders_gltfloader_js, ref_three_examples_jsm_objects_sky_js, CONTENT, CameraController, DevOptions, params, Dog (+6 more)

### Community 1 - "Pond & Procedural Props"
Cohesion: 0.14
Nodes (27): seededRandom(), MAT, tinted(), koi, makeKoi(), Pond, createBench(), createFenceRun() (+19 more)

### Community 2 - "Project Brief & Stations"
Cohesion: 0.08
Nodes (33): Audio Plan (ambient loop, chime, mute toggle), Content Boundaries (no intimate content, no private chat quotes), Single Content Config File (content.js/json), Discovery System (proximity prompt + message overlay), Dog Companion (follow-AI), Dream Travel Globe, Finale (hand-holding, slow dance, personal message), Food Street (+25 more)

### Community 3 - "Interaction & Lighting"
Cohesion: 0.09
Nodes (5): InteractionSystem, Lighting, SurpriseSystem, App, HUD

### Community 4 - "Instanced Vegetation"
Cohesion: 0.14
Nodes (13): ref_three_examples_jsm_math_improvednoise_js, bushField(), grassTuftField(), hashUnit(), InstancedField, mergeGeometries(), _noise, pineField() (+5 more)

### Community 5 - "Atmosphere & PostFX"
Cohesion: 0.11
Nodes (9): ref_three_examples_jsm_postprocessing_effectcomposer_js, ref_three_examples_jsm_postprocessing_outputpass_js, ref_three_examples_jsm_postprocessing_renderpass_js, ref_three_examples_jsm_postprocessing_shaderpass_js, ref_three_examples_jsm_postprocessing_unrealbloompass_js, ref_three_examples_jsm_shaders_vignetteshader_js, Atmosphere, PostFX (+1 more)

### Community 6 - "Materials & Textures"
Cohesion: 0.31
Nodes (17): cache, fabricTexture(), fbm(), finish(), foliageTexture(), generate(), grassTexture(), gravelTexture() (+9 more)

### Community 8 - "Package Config"
Cohesion: 0.13
Nodes (13): dependencies, three, devDependencies, vite, name, private, scripts, build (+5 more)

### Community 9 - "Food Street Builders"
Cohesion: 0.32
Nodes (14): buildBakeryShop(), buildBurgerShop(), buildChickenShop(), buildFlowerPlanter(), buildFoodStreet(), buildPaniPuriShop(), buildPicnicTable(), buildStallShell() (+6 more)

### Community 10 - "Path System"
Cohesion: 0.18
Nodes (5): Paths, _probe, _side, _tangent, _up

## Knowledge Gaps
- **24 isolated node(s):** `name`, `private`, `version`, `type`, `dev` (+19 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 83 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **4 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `three` connect `Scene Bootstrap & Camera` to `Pond & Procedural Props`, `Instanced Vegetation`, `Atmosphere & PostFX`, `Materials & Textures`, `Package Config`, `Food Street Builders`, `Path System`?**
  _High betweenness centrality (0.251) - this node is a cross-community bridge._
- **Why does `InputManager` connect `Input Manager` to `Scene Bootstrap & Camera`, `Interaction & Lighting`?**
  _High betweenness centrality (0.090) - this node is a cross-community bridge._
- **Why does `Character` connect `Character Model` to `Scene Bootstrap & Camera`?**
  _High betweenness centrality (0.073) - this node is a cross-community bridge._
- **What connects `name`, `private`, `version` to the rest of the system?**
  _24 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Scene Bootstrap & Camera` be split into smaller, more focused modules?**
  _Cohesion score 0.10253699788583509 - nodes in this community are weakly interconnected._
- **Should `Pond & Procedural Props` be split into smaller, more focused modules?**
  _Cohesion score 0.13742071881606766 - nodes in this community are weakly interconnected._
- **Should `Project Brief & Stations` be split into smaller, more focused modules?**
  _Cohesion score 0.08143939393939394 - nodes in this community are weakly interconnected._