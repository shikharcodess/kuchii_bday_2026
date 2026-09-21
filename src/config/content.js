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
    birthday: 'September 22',
    tone: 'warm, playful, sincere'
  },

  theme: {
    // Physical sky settings — a low sun for warm, raking golden-hour light.
    sky: {
      elevation: 28,
      azimuth: 40,
      turbidity: 3.2,
      rayleigh: 1.4,
      mieCoefficient: 0.005,
      mieDirectionalG: 0.84,
      hazeColor: 0xc3b79c,
      hazeDensity: 0.003,
      groundBounce: 0x5e5340,
      environmentIntensity: 0.9
    },

    sunColor: 0xffe2bd,
    sunIntensity: 2.8,
    ambientSky: 0xdde7f2,
    ambientGround: 0x6e5c42,

    accentGold: '#f6c878',
    accentPink: '#f4a261',
    accentSunflower: '#f3c053'
  },

  /**
   * World scale & feel:
   * A cozy, intimate ~130m village walk with responsive movement speeds.
   */
  world: {
    walkSpeed: 5.4, // fast & nimble
    sprintSpeed: 8.0, // hold Shift to run
    turnSpeed: 18.0, // crisp, immediate steering
    jump: {
      velocity: 6.8,
      gravity: 21.0
    },
    ground: { width: 90, depth: 165, centerZ: -62 },
    bounds: { minX: -38, maxX: 38, minZ: -142, maxZ: 22 },
    pathWidth: 3.6
  },

  camera: {
    distance: 6.8,
    height: 4.0,
    lookHeight: 1.4,
    indoorDistance: 4.4,
    indoorHeight: 2.3,
    followEase: 9.5,
    yawEase: 5.5
  },

  // Stations configuration
  stations: [
    {
      id: 'house',
      title: 'Our Cozy Cottage & Porch',
      position: { x: 0, z: 0 },
      radius: 8,
      prompt: 'Explore the cottage',
      message: 'Welcome to your world, Kuchii. Step inside the cottage — every corner was built with love for you.'
    },
    {
      id: 'sunflower_garden',
      title: 'Sunflower Garden & Getting Ready Corner',
      position: { x: -4, z: -24 },
      radius: 8,
      prompt: 'Admire the sunflowers & koi pond',
      message: 'Sunflowers dancing in the breeze, golden & baby-pink sparkles, and delicate payals. Your absolute favorite place.'
    },
    {
      id: 'dream_travel',
      title: 'Dream Travel Pavilion',
      position: { x: 12, z: -46 },
      radius: 8.5,
      prompt: 'Explore dream destinations',
      message: 'From the Amazon rainforest and Tokyo to the Swiss Alps and Paris — all the adventures waiting for us.'
    },
    {
      id: 'driving_overlook',
      title: 'Drive & Dream Scenic Overlook',
      position: { x: -12, z: -68 },
      radius: 8.5,
      prompt: 'Hop into the driver seat & dream big',
      message: 'A stylish vintage convertible waiting for Kuchii. Learning to drive, conquering every road, and celebrating your independence!'
    },
    {
      id: 'food_street',
      title: 'Street of Flavors & Food Bazaar',
      position: { x: 9, z: -88 },
      radius: 9.5,
      prompt: 'Explore the Food Bazaar',
      message: 'Gourmet burgers, spicy crunchy pani puri & chaat, artisan strawberry cheesecakes, and crispy golden chicken — every craving made with love for you!'
    },
    {
      id: 'road_to_us',
      title: 'The Road That Led To Us',
      position: { x: 0, z: -106 },
      radius: 8.5,
      prompt: 'Walk the gentle path',
      message: 'Step by step, through patience, understanding, and finding complete safety in each other.'
    },
    {
      id: 'finale',
      title: 'Under The Starlit Canopy',
      position: { x: 0, z: -126 },
      radius: 10,
      prompt: 'Step onto the dance stage',
      message: 'Happy Birthday, my Kuchii! Holding hands, dancing under the lanterns, forever celebrating you.'
    }
  ],

  // Virtual surprises to find across the world
  surprises: [
    {
      id: 'house_letter',
      title: 'A Secret Letter on the Desk',
      category: 'Heartfelt Note',
      hint: 'Inside the cottage on the study desk',
      icon: '💌',
      text: 'My Kuchii, from the moment we started talking, you brought so much warmth, laughter, and light into my life. Happy Birthday to the strongest, kindest, most brilliant girl!'
    },
    {
      id: 'house_gallery',
      title: 'Our Gallery Wall',
      category: 'Future Home Memory',
      hint: 'Living room wall inside the house',
      icon: '🖼️',
      text: 'Remember when we talked about our future home? A server room, a library, a garden, and a grand gallery wall for paintings. Here is the first frame of our forever.'
    },
    {
      id: 'house_fireplace',
      title: 'Warm Hearth & Cozy Socks',
      category: 'Comfort & Love',
      hint: 'Next to the fireplace inside the house',
      icon: '🧦',
      text: 'A warm crackling fire, the coziest fuzzy socks, and someone who will always keep you safe and warm no matter how cold the world gets.'
    },
    {
      id: 'sunflower_sparkle',
      title: 'Dressing Corner: Sparkles, Star Nails & Delicate Payal',
      category: 'Her Favorite Details',
      hint: 'Dressing corner by the sunflower garden',
      icon: '✨',
      text: 'Golden & baby-pink shimmer eyeshadow, transparent nail polish with tiny star details, and delicate silver payals that chime with every happy step you take.'
    },
    {
      id: 'travel_paris',
      title: 'Paris: Evenings by the Seine & Eiffel Tower',
      category: 'Dream Travel',
      hint: 'Paris diorama at Dream Travel Pavilion',
      icon: '🥐',
      text: 'Strolling hand-in-hand along the Seine, sipping coffee at little Parisian cafes, and watching the Eiffel Tower sparkle into the night sky with you.'
    },
    {
      id: 'travel_japan',
      title: 'Japan: Blooming Sakura & Torii Shrines',
      category: 'Dream Travel',
      hint: 'Japan diorama at Dream Travel Pavilion',
      icon: '🌸',
      text: 'Wandering under falling pink cherry blossoms in Kyoto, walking through vibrant vermilion Torii gates, and discovering cozy late-night ramen spots together.'
    },
    {
      id: 'travel_switzerland',
      title: 'Swiss Alps: Snowcapped Peaks & Mountain Chalets',
      category: 'Dream Travel',
      hint: 'Switzerland diorama at Dream Travel Pavilion',
      icon: '🏔️',
      text: 'Scenic train rides through snow-covered alpine valleys, cozy wooden chalets with a roaring fireplace, and mugs of rich hot chocolate after a day in the snow.'
    },
    {
      id: 'travel_south_india',
      title: 'South Indian Temples: Sacred Gopurams & Golden Chimes',
      category: 'Dream Travel',
      hint: 'South India diorama at Dream Travel Pavilion',
      icon: '🛕',
      text: 'Marveling at ancient towering temple gopurams, hearing the peaceful echoes of temple bells, and taking slow, sacred walks immersed in history and calm.'
    },
    {
      id: 'travel_amazon',
      title: 'Amazon Rainforest: Wild Canopies & Tropical Rivers',
      category: 'Dream Travel',
      hint: 'Amazon diorama at Dream Travel Pavilion',
      icon: '🦜',
      text: 'Canopy walkways above lush emerald rainforests, spotting colorful toucans and wildlife, and feeling the untamed spirit of adventure by the river.'
    },
    {
      id: 'travel_balloon',
      title: 'Our World Passport: The Adventures Ahead',
      category: 'Dream Travel',
      hint: 'Central rotating globe at Dream Travel Pavilion',
      icon: '✈️',
      text: 'Every destination, every city, every sunrise on this globe — all of them are waiting for us. One ticket, one flight, forever together.'
    },
    {
      id: 'driving_roadster',
      title: 'Conquer The Roads, Kuchii!',
      category: 'Dream Goal',
      hint: 'The vintage convertible roadster at the Scenic Overlook',
      icon: '🚗',
      text: 'Beep beep! Car achhe se seekho, proud feel karo... Har road tumhari hai, and I will always be your co-driver cheering for you every mile of the way ❤️'
    },
    {
      id: 'food_burger',
      title: 'The Ultimate Gourmet Burger & Fries',
      category: 'Foodie Craving',
      hint: 'At the Burger Shack counter',
      icon: '🍔',
      text: 'Fresh toasted sesame bun, juicy grilled patty, melted cheddar, and a basket of crispy golden fries with extra ketchup — always ready for our burger dates!'
    },
    {
      id: 'food_panipuri',
      title: 'Pani Puri & Chaat Chatori',
      category: 'Street Food Love',
      hint: 'At the Pani Puri cart',
      icon: '🥣',
      text: 'Extra spicy teekha pani, sweet sonth chutney, crunchy puris filled with spiced aloo and sev. Nobody can beat Kuchii at a pani puri challenge!'
    },
    {
      id: 'food_cheesecake',
      title: 'Artisan Strawberry Cheesecake',
      category: 'Sweet Tooth Heaven',
      hint: 'Inside the Bakery glass display',
      icon: '🍰',
      text: 'Velvety New York style cheesecake with a golden buttery graham crust and glistening ruby strawberry glaze. The sweetest treat for the sweetest girl.'
    },
    {
      id: 'food_chicken',
      title: 'Crispy Sizzling Chicken',
      category: 'Flavor Feast',
      hint: 'At the Crispy Chicken grill',
      icon: '🍗',
      text: 'Sizzling hot, crunchy seasoned fried chicken and tender grilled skewers with peri-peri dip. Maximum flavor for my absolute food freak!'
    },
    {
      id: 'finale_dance',
      title: 'Dance Under the Lanterns',
      category: 'The Grand Surprise',
      hint: 'At the Finale Gazebo',
      icon: '💖',
      text: 'September 22 — the day the most wonderful person was born. Happy Birthday Kuchii! Thank you for loving me, for trusting me, and for being my home.'
    }
  ]
};

