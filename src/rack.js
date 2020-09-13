import * as Config from './config';
import * as Util from './util';
import Vec2 from './vec2';
import Module from './module';

export default class Rack {

  constructor(width, height, texture, main) {

    this.modules = [];
    this.main = main;
    this.worldSize = new Vec2(Config.MODULE_SIZE * Config.RACK_WIDTH + (Config.RACK_WIDTH-1) * Config.MODULE_SPACING,
                              Config.MODULE_SIZE * Config.RACK_HEIGHT + (Config.RACK_HEIGHT-1) * Config.MODULE_SPACING);
    this.map = Array(Config.RACK_HEIGHT).fill().map(() => Array(Config.RACK_WIDTH).fill(0));

    //Create modules
    for(let y = 0; y<Config.RACK_HEIGHT; y++) {
      for(let x = 0; x<Config.RACK_WIDTH; x++) {

        //Check rack map for empty space
        if(this.map[y][x] != 0) continue;

        //Check for fittable size
        const maxWidth = Math.min(Config.RACK_WIDTH - x, Config.MODULE_MAX_WIDTH);
        if(maxWidth > Config.MODULE_MAX_WIDTH || maxWidth < Config.MODULE_MIN_WIDTH) break;
        const maxHeight = Math.min(Config.RACK_HEIGHT - y, Config.MODULE_MAX_HEIGHT);
        if(maxHeight > Config.MODULE_MAX_HEIGHT || maxHeight < Config.MODULE_MIN_HEIGHT) break;

        //Check for rack space
        let width = Util.random(Config.MODULE_MIN_WIDTH, maxWidth);
        let height =  Util.random(Config.MODULE_MIN_HEIGHT, maxHeight)
        let space = this.checkSpace(x, y, width, height);

        //Try shrinking module if not enough space
        while(!space && width > Config.MODULE_MIN_WIDTH && height > Config.MODULE_MIN_HEIGHT) {
          width--;
          height--;
          space = this.checkSpace(x, y, width, height);
        }

        if(!space) break;

        const module = new Module(x, y, width, height, this.main);
        this.modules.push(module);

        const id = this.modules.length;
        x += module.size.x;

        //Update rack map
        for(let i = 0; i<module.size.y; i++) {
          for(let j = 0; j<module.size.x; j++) {
            this.map[module.pos.y + i][module.pos.x + j] = id;
          }
        }
      }
    }

    //Randomize module horizontal positions
  }

  checkSpace(x, y, width, height) {

    for(let i = 0; i<height; i++) {
      for(let j = 0; j<width; j++) {
        if(this.map[y + i][x + j] != 0) return false;
      }
    }

    return true;
  }

  getSocket(at) {

    for(let i = 0; i<this.modules.length; i++) {
      const module = this.modules[i];
      const socket = module.getSocket(at);
      if(socket && !socket.cable) return socket;
    }
    return false;
  }

  updatePowers() {

    const modulePath = this.main.modulePath;
    for(let i = 0; i<modulePath.length; i++) {
      this.modules[modulePath[i]].updatePower();
    }
    for(let i = modulePath.length-1; i>-1; i--) {
      this.modules[modulePath[i]].updatePower();
    }

    this.main.checkComplete();
  }

  update(deltaTime) {

    this.modules.forEach(module => module.update(deltaTime));
  }

  draw(ctx) {

    //Draw background
    ctx.fillStyle = '#222';
    ctx.beginPath();
    ctx.rect(this.main.offset.x + Math.round(Config.MODULE_SIZE * .5), this.main.offset.y + Math.round(Config.MODULE_SIZE * .25), this.worldSize.x - Math.round(Config.MODULE_SIZE), this.worldSize.y);
    ctx.fill();

    if(Config.DEBUG_DRAW.ENABLED && Config.DEBUG_DRAW.MODULE_BLOCKS) {
      //Draw rack tiles
      ctx.fillStyle = 'rgba(0, 0, 0, .1)';
      for(let y = 0; y<Config.RACK_HEIGHT; y++) {
        for(let x = 0; x<Config.RACK_WIDTH; x++) {
          ctx.beginPath();
          ctx.rect(x * (Config.MODULE_SIZE + Config.MODULE_SPACING) + this.main.offset.x, y * (Config.MODULE_SIZE + Config.MODULE_SPACING) + this.main.offset.y, Config.MODULE_SIZE, Config.MODULE_SIZE);
          ctx.fill();
        }
      }
    }

    //Draw modules
    this.modules.forEach(module => module.draw(ctx));
  }
}
