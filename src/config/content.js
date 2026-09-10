/**
 * Central Content Configuration for "Her World"
 * 
 * You can customize and personalize message text here without altering
 * 3D scene logic or animation code.
 */

export const CONTENT = {
  recipient: {
    name: 'Shivani',
    nickname: 'Kuchii',
    birthday: 'October 13',
    tone: 'warm, playful, sincere'
  },

  theme: {
    skyColor: 0x2b2236, // dusk purple
    fogColor: 0x42314f,
    sunColor: 0xffe2b2, // warm golden hour sun
    ambientSky: 0xffe9d2,
    ambientGround: 0x4a3b32,
    accentGold: '#f6c878',
    accentPink: '#f4a261',
    accentSunflower: '#f3c053'
  },

  // Stations configuration (placeholder text ready for future phases)
  stations: [
    {
      id: 'house',
      title: 'Our Starting Porch',
      position: { x: 0, z: 0 },
      prompt: 'Welcome to your world, Kuchii',
      message: 'Welcome to your world — a little place built just for you to wander through.'
    },
    {
      id: 'sunflower_garden',
      title: 'Sunflower Garden & Getting Ready Corner',
      position: { x: 0, z: -35 },
      prompt: 'Admire the sunflowers',
      message: 'Sunflowers standing tall in the sunlight, tiny sparkling payals, and your favorite little details.'
    },
    {
      id: 'dream_travel',
      title: 'Dream Travel Globe',
      position: { x: 25, z: -75 },
      prompt: 'Spin the globe',
      message: 'From the Amazon canopy to Paris and the quiet mountain peaks — the world we dream of exploring together.'
    },
    {
      id: 'nostalgia_corner',
      title: 'Nostalgia Corner',
      position: { x: -25, z: -115 },
      prompt: 'Tune into melodies',
      message: 'Old cartoon laughs, movie nights, tunes that stay stuck in our heads, and pure comfort.'
    },
    {
      id: 'food_street',
      title: 'Food Street',
      position: { x: 10, z: -155 },
      prompt: 'Smell the spices',
      message: 'Spice level: her level. Fragrant West Bengal prawn curry and warm string lights.'
    },
    {
      id: 'road_to_us',
      title: 'The Road That Led To Us',
      position: { x: 0, z: -195 },
      prompt: 'Walk along the quiet path',
      message: 'Step by step, through every moment of patience and gentle trust.'
    },
    {
      id: 'finale',
      title: 'Under The Starlit Canopy',
      position: { x: 0, z: -240 },
      prompt: 'Step onto the dance floor',
      message: 'Happy Birthday, Shivani! (User personal message placeholder)'
    }
  ]
};
