//Debug draw stuff
export const DEBUG_DRAW = {
  ENABLED: false,
  CABLE_ENDS: false,
  CABLE_BONES: true,
  CABLE_TOUCH_AREAS: false,
  MODULE_BLOCKS: true,
  CURSOR: true
};
//Touch support
//export const TOUCH = true;
//Module horizontal blocks
export const RACK_WIDTH = 8;
//Module vertical blocks
export const RACK_HEIGHT = 13;
//Module block size, setting this other than the spritesheet tile size (=10) will induce smoothing
//TODO: has something to do with canvas.drawImage + imageSmoothingEnabled?
export const MODULE_SIZE = 10;
//Module min width, needs to be at least 3
export const MODULE_MIN_WIDTH = 3;
//Module max width
export const MODULE_MAX_WIDTH = 5;
//Module min height, needs to be at least 1
export const MODULE_MIN_HEIGHT = 1;
//Module max height
export const MODULE_MAX_HEIGHT = 2;
//Space between modules
export const MODULE_SPACING = 2;
//Module random assets fillrate (0-1)
export const MODULE_RANDOM_ASSETS = .4;
//Cable css colors [wireColor, plugColor]
export const CABLE_COLORS = [['#eb7414', '#964300'], ['#086bd1', '#0452a2'], ['#720303', '#4a0202']];
//Cable length multiplier, needs to be at least 1 (=minumum length)
export const CABLE_LENGTH = 1.1;
//Cable width
export const CABLE_WIDTH = 2;
//Cable IK bone count
export const BONE_COUNT = 5;
//IK iteration count, more is better for precision but worse for performance
export const IK_ITERATIONS = 200;
//Scale the canvas to this percentage of the smallest window dimension, 0-1
export const SCALE = 1;
//Limit the canvas scale to this factor, 0 for no limit
export const MAX_SCALE = 4;
//Background css color
export const BACKGROUND_COLOR = '#cc4d4d';
//Background css color when completed
export const BACKGROUND_COLOR_COMPLETE = '#548d38';
//Wire toucharea size
export const WIRE_TOUCH_AREA = 10;
//URL to be opened on completion
export const URL = 'https://js13kgames.com/entries';
//Spritesheet positions+sizes
export const SPRITESHEET = {
  NUMBERS: [[45, 93, 4, 5], [2, 93, 2, 5], [5, 93, 4, 5], [10, 93, 4, 5], [15, 93, 4, 5], [20, 93, 4, 5], [25, 93, 4, 5], [30, 93, 4, 5], [35, 93, 4, 5], [40, 93, 4, 5]],
  SMALL: [2, 100, 23, 5],
  MEDIUM: [28, 100, 29, 5],
  LARGE: [60, 100, 22, 5]
};
