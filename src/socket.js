import * as Config from './config';
import Vec2 from './vec2';

export default class Socket {

  constructor(x, y, module) {

    this.pos = new Vec2(x, y);
    this.worldPos = new Vec2(module.worldPos.x + x * (Config.MODULE_SIZE + Config.MODULE_SPACING) + 5, module.worldPos.y + y * (Config.MODULE_SIZE + Config.MODULE_SPACING) + 5);
    this.module = module;
    this.size = 6;
    this.cable = null;
  }

  hit(at) {

    if(at.x < this.worldPos.x - 5 || at.x > this.worldPos.x + this.size) return false;
    if(at.y < this.worldPos.y - 5 || at.y > this.worldPos.y + this.size) return false;

    return true;
  }
}
