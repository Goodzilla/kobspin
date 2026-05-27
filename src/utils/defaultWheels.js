import { getVibrantColor } from './colors';

// Default list of wheels if none are stored in localStorage
export const getDefaultWheels = () => [
  {
    id: 'sub-5',
    name: '5 Gifted Subs',
    spinDuration: 10,
    originalOptions: [
      {
        id: '5-opt-1',
        name: 'Only drink liquids through a tiny coffee stirrer straw for the next 2 hours',
        weight: 40,
        lives: 0,
        currentLives: 0,
        shrouds: 2,
        currentShrouds: 2,
        color: getVibrantColor(0),
        subOption: null
      },
      {
        id: '5-opt-2',
        name: 'Mod a completely random active chatter for 1 hour',
        weight: 20,
        lives: 3,
        currentLives: 3,
        shields: 2,
        currentShields: 2,
        color: getVibrantColor(1),
        subOption: null
      },
      {
        id: '5-opt-3',
        name: 'Sing a dramatic opera song chosen by chat',
        weight: 20,
        lives: 2,
        currentLives: 2,
        color: getVibrantColor(2),
        subOption: {
          id: '5-opt-3-sub',
          name: 'Eat a single raw garlic clove with no water for 3 minutes',
          weight: 15,
          lives: 1,
          currentLives: 1,
          color: getVibrantColor(3),
          subOption: null
        }
      },
      {
        id: '5-opt-4',
        name: 'Do 20 burpees live on camera',
        weight: 14,
        lives: 3,
        currentLives: 3,
        color: getVibrantColor(4),
        subOption: {
          id: '5-opt-4-sub',
          name: 'Do 40 burpees while wearing your shoes on your hands',
          weight: 25,
          lives: 1,
          currentLives: 1,
          color: getVibrantColor(5),
          subOption: null
        }
      },
      {
        id: '5-opt-link-10',
        name: '10 Gifted Subs Escalation',
        weight: 5,
        lives: 0,
        currentLives: 0,
        color: getVibrantColor(6),
        linkedWheelId: 'sub-10',
        subOption: null
      },
      {
        id: '5-opt-link-20',
        name: '20 Gifted Subs Mega Wheel',
        weight: 1,
        lives: 0,
        currentLives: 0,
        color: getVibrantColor(7),
        linkedWheelId: 'sub-20',
        subOption: null
      }
    ],
    activeOptions: []
  },
  {
    id: 'sub-10',
    name: '10 Gifted Subs',
    spinDuration: 10,
    originalOptions: [
      {
        id: '10-opt-1',
        name: 'Do 45 air squats while balancing a book on your head',
        weight: 32,
        lives: 3,
        currentLives: 3,
        shields: 2,
        currentShields: 2,
        color: getVibrantColor(0),
        subOption: {
          id: '10-opt-1-sub',
          name: 'Wear a heavy backpack filled with books for the next 1 hour',
          weight: 20,
          lives: 1,
          currentLives: 1,
          color: getVibrantColor(1),
          subOption: null
        }
      },
      {
        id: '10-opt-2',
        name: 'Only speak in a fake, over-the-top British/French accent for the next 30 minutes',
        weight: 20,
        lives: 2,
        currentLives: 2,
        shrouds: 2,
        currentShrouds: 2,
        color: getVibrantColor(2),
        subOption: null
      },
      {
        id: '10-opt-3',
        name: 'Send a cringey, out-of-context text message to the last person you messaged',
        weight: 15,
        lives: 2,
        currentLives: 2,
        color: getVibrantColor(3),
        subOption: null
      },
      {
        id: '10-opt-4',
        name: 'Mod a random chatter and let them write a tweet for you to post',
        weight: 15,
        lives: 0,
        currentLives: 0,
        color: getVibrantColor(4),
        subOption: null
      },
      {
        id: '10-opt-5',
        name: 'Call a random pizza place and try to order a pizza with fake ingredients for 3 minutes',
        weight: 10,
        lives: 1,
        currentLives: 1,
        color: getVibrantColor(5),
        subOption: null
      },
      {
        id: '10-opt-link-20',
        name: '20 Gifted Subs Mega Wheel',
        weight: 3,
        lives: 0,
        currentLives: 0,
        color: getVibrantColor(6),
        linkedWheelId: 'sub-20',
        subOption: null
      }
    ],
    activeOptions: []
  },
  {
    id: 'sub-20',
    name: '20 Gifted Subs',
    spinDuration: 12,
    originalOptions: [
      {
        id: '20-opt-1',
        name: 'Eat a whole raw lemon (peel included) without making a face',
        weight: 5,
        lives: 1,
        currentLives: 1,
        shrouds: 2,
        currentShrouds: 2,
        color: getVibrantColor(0),
        subOption: null
      },
      {
        id: '20-opt-2',
        name: 'Wax a small patch of arm or leg hair live on camera',
        weight: 10,
        lives: 1,
        currentLives: 1,
        shields: 2,
        currentShields: 2,
        color: getVibrantColor(1),
        subOption: null
      },
      {
        id: '20-opt-3',
        name: 'Gift 5 subs to a random streamer with under 5 viewers',
        weight: 15,
        lives: 2,
        currentLives: 2,
        color: getVibrantColor(2),
        subOption: null
      },
      {
        id: '20-opt-4',
        name: 'Ice cubes down your shirt and pants for 4 minutes while talking normally',
        weight: 20,
        lives: 2,
        currentLives: 2,
        color: getVibrantColor(3),
        subOption: null
      },
      {
        id: '20-opt-5',
        name: 'Marker drawing on your face chosen by chat (must stay for the rest of the stream)',
        weight: 20,
        lives: 0,
        currentLives: 0,
        color: getVibrantColor(4),
        subOption: null
      },
      {
        id: '20-opt-6',
        name: 'Play a YouTube sound chosen by chat on a loop in your headphones for 10 minutes',
        weight: 30,
        lives: 3,
        currentLives: 3,
        color: getVibrantColor(5),
        subOption: null
      }
    ],
    activeOptions: []
  }
];
