import * as Config from './config';
import * as Util from './util';
import Vec2 from './vec2';
import Socket from './socket';

export default class Module {

  constructor(x, y, width, height, main) {

    this.main = main;
    this.pos = new Vec2(x, y);
    this.size = new Vec2(width, height);
    this.worldPos = new Vec2(x * (Config.MODULE_SIZE + Config.MODULE_SPACING) + this.main.offset.x, y * (Config.MODULE_SIZE + Config.MODULE_SPACING) + this.main.offset.y);
    this.worldSize = new Vec2(width * Config.MODULE_SIZE + Math.max(width-1, 0) * Config.MODULE_SPACING, height * Config.MODULE_SIZE + Math.max(height-1, 0) * Config.MODULE_SPACING);
    this.texture = this.main.spritesheet;
    this.powerFrom = null;
    this.powered = false;

    const blocks = width * height;
    this.textures = Array(blocks).fill(-1);

    //Add lights
    this.textures[0] = 5;
    //Add sockets
    this.textures[1] = 2;
    this.textures[2] = 2;

    //Add left handle
    if(blocks > 3) this.textures[3] = 0;
    //Add right handle
    if(blocks > 4) this.textures[4] = 1;
    //Add random assets with a 50% fillrate
    const rest = blocks-4;
    for(let i = 0; i<rest; i++) {
      if(Math.random() < Config.MODULE_RANDOM_ASSETS) this.textures[4+i] = Util.random(3, 4);
    }

    //randomize elements
    Util.randomize(this.textures);

    //Store light texture position
    this.lightTexture = this.textures.indexOf(5);
    this.lightTextureAcc = 0;
    this.lightTextureDur = Util.random(10, 250);

    //Store socket positions
    this.sockets = [];
    for(let i = 0; i<this.textures.length; i++) {
      if(this.textures[i] == 2) this.sockets.push(new Socket(i%width, Math.floor(i/width), this));
    }
  }

  updatePower() {

    let otherModule = null;
    let powered = false;

    for(let i = 0; i<this.sockets.length; i++) {
      const socket = this.sockets[i];
      const cable = socket.cable;
      if(cable) {
        if(cable.endA.plugged && cable.endA.plugged == socket) {
          if(cable.endB.plugged && cable.endB.plugged.module == this.powerFrom && this.powerFrom.powered) powered = true;
        }
        else if(cable.endB.plugged && cable.endB.plugged == socket) {
          if(cable.endA.plugged && cable.endA.plugged.module == this.powerFrom && this.powerFrom.powered) powered = true;
        }
      }
    }

    this.powered = powered;

    //Override self powered module
    if(this.powerFrom == this) this.powered = true;
  }

  getSocket(at) {

    if(at.x < this.worldPos.x || at.x > this.worldPos.x + this.worldSize.x) return false;
    if(at.y < this.worldPos.y || at.y > this.worldPos.y + this.worldSize.y) return false;

    for(let i = 0; i<this.sockets.length; i++) {
      const socket = this.sockets[i];
      if(socket.hit(at)) return socket;
    }

    return false;
  }

  removeSocket(index) {

    const socket = this.sockets.splice(index, 1)[0];
    this.textures[socket.pos.y * this.size.x + socket.pos.x] = Math.random() < Config.MODULE_RANDOM_ASSETS ? Util.random(3, 4) : -1;
  }

  update(deltaTime) {

    if(!this.powered) {
      this.textures[this.lightTexture] = 5;
      return;
    }

    this.lightTextureAcc += deltaTime;
    if(this.lightTextureAcc > this.lightTextureDur) {
      this.lightTextureAcc = 0;
      //this.lightTextureDur = Util.random(10, 100);
      this.textures[this.lightTexture] = Util.random(6, 19);
    }
  }

  draw(ctx) {

    //Draw background
    ctx.fillStyle = '#474747';
    ctx.beginPath();
    ctx.rect(this.worldPos.x, this.worldPos.y, this.worldSize.x, this.worldSize.y);
    ctx.fill();

    //Draw textures
    const width = this.size.x;
    const height = this.size.y;
    for(let j = 0; j<height; j++) {
      for(let i = 0; i<width; i++) {
        const tex = this.textures[j*width+i];
        if(tex == -1) continue;
        const texX = tex%10;
        const texY = Math.floor(tex/10);
        if(tex > -1) ctx.drawImage(this.texture, texX * 10, texY * 10, 10, 10,
                                    this.worldPos.x + i * (Config.MODULE_SIZE + Config.MODULE_SPACING),
                                    this.worldPos.y + j * (Config.MODULE_SIZE + Config.MODULE_SPACING),
                                    Config.MODULE_SIZE, Config.MODULE_SIZE);
      }
    }
  }
}
