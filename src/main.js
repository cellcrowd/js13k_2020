import * as Config from './config';
import * as Util from './util';
import Vec2 from './vec2';
import Rack from './rack';
import Cable from './cable';
import Animation from './animation';

class Main {

  constructor() {

    this.spritesheet = new Image();
    this.spritesheet.onload = this.init.bind(this);
    this.spritesheet.src = 'spritesheet.png';
  }

  init() {

    document.body.style.backgroundColor = Config.BACKGROUND_COLOR;

    this.canvas = document.querySelector('#canvas');
    this.ctx = this.canvas.getContext('2d');
    this.ctx.imageSmoothingEnabled = false;
    this.ctx.mozImageSmoothingEnabled = false;
    this.ctx.webkitImageSmoothingEnabled = false;
    this.ctx.msImageSmoothingEnabled = false;

    //Calculate and set canvas size
    const rackWidth = this.canvas.width = Config.MODULE_SIZE * Config.RACK_WIDTH + (Config.RACK_WIDTH-1) * Config.MODULE_SPACING;
    const rackHeight = this.canvas.height = Config.MODULE_SIZE * Config.RACK_HEIGHT + (Config.RACK_HEIGHT-1) * Config.MODULE_SPACING;
    this.offset = new Vec2();

    const minWidth = 110;
    if(this.canvas.width < minWidth) this.canvas.width = minWidth;
    const minHeight = 75;
    if(this.canvas.height < minHeight) this.canvas.height = minHeight;

    //Add extra space for cable drawing
    this.canvas.width += 5 * Config.MODULE_SIZE;
    this.canvas.height += 5 * Config.MODULE_SIZE;

    //Calculate rack offset
    this.offset.x = Math.round((this.canvas.width - rackWidth)/2);
    this.offset.y = Math.round((this.canvas.height - rackHeight)/2);

    //Init variables
    this.dimAlpha = 0;
    this.scale = 1;
    this.dimmed = false;
    this.hilight = -1;
    this.note = true;
    this.animations = [];
    this.cables = [];
    this.cableCounts = [0, 0, 0]; //small, medium, large
    this.cableLengths = [0, 0, 0];
    this.socket = null;
    this.prevTime = 0;
    this.cursor = new Vec2();
    this.cable = null;
    this.gameloop = this.update.bind(this);
    this.rack = new Rack(this.canvas.width, this.canvas.height, this.spritesheet, this);

    //Create the puzzle
    const moduleCount = this.rack.modules.length;
    this.modulePath = [];
    for(let i = 0; i<moduleCount; i++) this.modulePath.push(i);
    Util.randomize(this.modulePath);

    let module1 = this.rack.modules[this.modulePath[0]];
    let module2 = this.rack.modules[this.modulePath[1]];

    let minCableLength = 1000000;
    let maxCableLength = 0;

    for(let i = 2; i<moduleCount+1; i++) {

      const socket1 = module1.sockets[0];
      const socket2 = module2.sockets[1];

      //Get random color
      const color = Config.CABLE_COLORS[Util.random(0, Config.CABLE_COLORS.length-1)];
      //Add some random shading for better distinguishing
      const shade = -.05 + Math.random() * .1;

      const cableLength = socket1.worldPos.distance(socket2.worldPos);
      if(cableLength > maxCableLength) maxCableLength = cableLength;
      if(cableLength < minCableLength) minCableLength = cableLength;

      const cable = new Cable(socket1.worldPos, cableLength * Config.CABLE_LENGTH, Util.shadeColor(shade, color[0]), Util.shadeColor(shade, color[1]), this);
      cable.endA.plugged = socket1;
      socket1.cable = cable;
      cable.endB.plugged = socket2;
      socket2.cable = cable;
      cable.endB.pos.set(socket2.worldPos.x, socket2.worldPos.y);
      cable.updateIK(socket2.worldPos);
      this.cables.push(cable);

      module2.powerFrom = module1;
      module1 = module2;
      module2 = this.rack.modules[this.modulePath[i]];
    }

    //Create 3 cable lengths from min and max lengths
    minCableLength += 50;
    const cableSub = (maxCableLength - minCableLength)/2;
    this.cableLengths = [(minCableLength), (minCableLength + cableSub), (minCableLength + 2 * cableSub)];

    for(let i = 0; i<this.cables.length; i++) {
      const cable = this.cables[i];
      let type = 0;
      while(cable.length > minCableLength + type * cableSub) {
        type++;
        if(type == 2) break;
      }
      this.cableCounts[type]++;
      cable.type = type;
      cable.resizeChain((minCableLength + type * cableSub) * Config.CABLE_LENGTH);
      cable.updateIK(cable.endB.pos);

      //color cable per type
      const shade = -.05 + Math.random() * .1;
      cable.wireColor = Util.shadeColor(shade, Config.CABLE_COLORS[type][0]);
      cable.plugColor = Util.shadeColor(shade, Config.CABLE_COLORS[type][1]);
    }

    //Remove unused sockets
    this.rack.modules[this.modulePath[0]].removeSocket(1);
    this.rack.modules[this.modulePath[moduleCount-1]].removeSocket(0);

    //Power first module
    this.rack.modules[this.modulePath[0]].powered = true;
    //Retain power on first module
    this.rack.modules[this.modulePath[0]].powerFrom = this.rack.modules[this.modulePath[0]];

    //Unpower modules
    for(let i = 1; i<moduleCount; i++) this.rack.modules[this.modulePath[i]].powered = false;

    //Remove cables
    for(let i = 0; i<this.cables.length; i++) {
      const cable = this.cables[i];
      if(cable.endA.plugged) cable.endA.plugged.cable = null;
      if(cable.endB.plugged) cable.endB.plugged.cable = null;
    }
    this.cables = [];

    this.resize();

    //Setup listeners
    //if(Config.TOUCH) {
      this.canvas.addEventListener('touchstart', this.mousedown.bind(this));
      this.canvas.addEventListener('touchend', this.mouseup.bind(this));
      this.canvas.addEventListener('touchcancel', this.mouseup.bind(this));
      this.canvas.addEventListener('touchmove', this.mousemove.bind(this));
    //}else {
      this.canvas.addEventListener('mousedown', this.mousedown.bind(this));
      this.canvas.addEventListener('mouseup', this.mouseup.bind(this));
      this.canvas.addEventListener('mouseleave', this.mouseup.bind(this));
      this.canvas.addEventListener('mousemove', this.mousemove.bind(this));
    //}
    window.addEventListener('resize', this.resize.bind(this));

    //Kick off game loop
    this.gameloop(0);
  }

  mousedown(event) {

    if(event) event.preventDefault();

    if(this.note) {
      this.note = false;
      return;
    }

    if(this.dimAlpha > 0) return;

    //this.updateCursor(event.offsetX, event.offsetY);
    const eventPos = this.getEventPos(event);
    this.updateCursor(eventPos[0], eventPos[1]);

    for(let i = 0; i<this.cables.length; i++) {
      const cable = this.cables[i];
      if(cable.hit(this.cursor)) {
        this.cable = cable;
        break;
      }
    };

    if(this.cable) {
      //bring to front
      this.cables.splice(this.cables.indexOf(this.cable), 1);
      this.cables.push(this.cable);
      this.cable.press(this.cursor);
    }else {
      //check for empty socket hit
      this.socket = this.rack.getSocket(this.cursor);
      if(this.socket) this.dim(true);
    }
  }

  dim(dim) {

    this.dimmed = dim;
    this.killAnimationsOf(this);
    this.addAnimation(new Animation(this, 'dimAlpha', dim ? 1 : 0, 200, 0, Animation.EASE.LINEAR));
  }

  deleteCable(cable) {

    this.cableCounts[cable.type]++;
    const index = this.cables.indexOf(cable);
    if(index > -1) this.cables.splice(index, 1);
  }

  checkComplete() {

    //check for game completion
    let completed = true;
    for(let i = 0; i<this.rack.modules.length; i++) {
      if(!this.rack.modules[i].powered) {
        completed = false;
        break;
      }
    }
    if(completed) {
      window.document.title = '200';
      document.body.style.backgroundColor = Config.BACKGROUND_COLOR_COMPLETE;
      window.open(Config.URL);
    }
  }

  getEventPos(event) {

    if(event.changedTouches && event.changedTouches[0]) {
      return [event.changedTouches[0].clientX / this.scale, event.changedTouches[0].clientY / this.scale - (this.canvas.getBoundingClientRect().top / this.scale)];
    }
    else if(event.touches && event.touches[0]) {
      return [event.touches[0].clientX / this.scale, event.touches[0].clientY / this.scale - (this.canvas.getBoundingClientRect().top / this.scale)];
    }
    else return [event.offsetX, event.offsetY];
  }

  mouseup(event) {

    if(event) event.preventDefault();

    //this.updateCursor(event.offsetX, event.offsetY);
    const eventPos = this.getEventPos(event);
    this.updateCursor(eventPos[0], eventPos[1]);

    if(this.dimmed) {
      this.dim(false);
      if(this.socket && this.hilight > -1) {

        //TODO: duplicate stuff, create method

        if(this.cableCounts[this.hilight] == 0) return;

        //Get random color
        const color = Config.CABLE_COLORS[this.hilight];
        //Add some random shading for better distinguishing
        const shade = -.05 + Math.random() * .1;
        const cableLength = this.cableLengths[this.hilight];

        const cable = new Cable(this.socket.worldPos, cableLength * Config.CABLE_LENGTH, Util.shadeColor(shade, color[0]), Util.shadeColor(shade, color[1]), this);
        cable.endA.plugged = this.socket;
        this.socket.cable = cable;
        cable.type = this.hilight;
        this.cableCounts[cable.type]--;

        //Generate a random position
        const angle = Math.random() * Math.PI * 2;
        const to = new Vec2(cable.endA.pos.x + Math.cos(angle) * (cable.length * .25 + Config.WIRE_TOUCH_AREA * .75), cable.endA.pos.y + Math.sin(angle) * (cable.length * .25 + Config.WIRE_TOUCH_AREA * .75));
        //Cap position to screen space
        to.x = Math.max(Math.min(to.x, this.canvas.width-10), 10);
        to.y = Math.max(Math.min(to.y, this.canvas.height-10), 10);
        //Animate end
        this.addAnimation(new Animation(cable.endB.pos, 'x', to.x, 750, 0, Animation.EASE.OUT_ELASTIC, per => cable.chain.update(cable.endB.pos)));
        this.addAnimation(new Animation(cable.endB.pos, 'y', to.y, 750, 0, Animation.EASE.OUT_ELASTIC));

        cable.endB.plugged = null;
        cable.endB.pos.set(to.x, to.y);
        cable.updateIK(this.socket.worldPos);
        this.cables.push(cable);

        this.hilight = -1;
      }
    }
    else {
      if(this.cable) this.cable.release(this.cursor, this.rack.getSocket(this.cursor));
      this.cable = null;
    }
  }

  mousemove(event) {

    if(event) event.preventDefault();

    //this.updateCursor(event.offsetX, event.offsetY);
    const eventPos = this.getEventPos(event);
    this.updateCursor(eventPos[0], eventPos[1]);

    if(this.dimmed) {
      const hilightSub = Math.round(this.canvas.width/3);
      this.hilight = Math.floor(this.cursor.x / hilightSub);
      if(this.hilight < 0) this.hilight = 0;
      else if(this.hilight > 2) this.hilight = 2;
      return;
    }

    if(this.cable) this.cable.drag(this.cursor);
  }

  updateCursor(x, y) {

    this.cursor.set(x, y);
  }

  update(currTime) {

    const deltaTime = currTime - this.prevTime;
    this.prevTime = currTime;

    //Update animations and remove finished ones
    this.animations = this.animations.reduce((animations, animation) => {
      animation.update(deltaTime);
      if(animation.per != 1) animations.push(animation);
      return animations;
    }, []);

    //Clear the canvas
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    //Update and draw grid
    this.rack.update(deltaTime);
    this.rack.draw(this.ctx);

    //Update and draw cables
    this.cables.forEach(cable => {
      cable.update(deltaTime);
      cable.draw(this.ctx);
    });

    //Dimmer
    if(this.dimAlpha > 0) {

      this.ctx.fillStyle = 'rgba(0, 0, 0, ' + (this.dimAlpha * .7) + ')';
      // const gradient = this.ctx.createLinearGradient(0, 0, this.canvas.width, 0);
      // gradient.addColorStop(0, 'rgba(0, 0, 0, 0)');
      // gradient.addColorStop(.1, 'rgba(0, 0, 0, ' + (this.dimAlpha * .7) + ')');
      // gradient.addColorStop(.9, 'rgba(0, 0, 0, ' + (this.dimAlpha * .7) + ')');
      // gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
      // this.ctx.fillStyle = gradient;

      this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

      const hilightSub = Math.ceil(this.canvas.width/3);

      this.ctx.globalAlpha = this.dimAlpha * .2;

      if(this.hilight > -1) {
        this.ctx.fillStyle = Config.CABLE_COLORS[this.hilight][0];
        this.ctx.fillRect(Math.round(this.hilight * hilightSub), 0, hilightSub, this.canvas.height);
      }

      this.ctx.globalAlpha = this.dimAlpha;

      const sizes = [Config.SPRITESHEET.SMALL, Config.SPRITESHEET.MEDIUM, Config.SPRITESHEET.LARGE];
      const nums = Config.SPRITESHEET.NUMBERS;
      for(let i = 0; i<sizes.length; i++) {
        //Draw label
        const txt = sizes[i];
        const txtX = Math.round(i * hilightSub + (hilightSub - txt[2])/2);
        const txtY = Math.round((this.canvas.height - txt[3])/2) + txt[3];
        this.ctx.drawImage(this.spritesheet, txt[0], txt[1], txt[2], txt[3], txtX, txtY, txt[2], txt[3]);
        //Draw count
        const count = this.cableCounts[i].toString();
        const numbers = [];
        let numsWidth = 0;
        for(let j = 0; j<count.length; j++) {
          const num = count[j];
          numsWidth += nums[num][2];
          if(j < count.length-1) numsWidth += 1;
        }
        const numX = Math.round(i * hilightSub + (hilightSub - numsWidth)/2);
        for(let j = 0; j<count.length; j++) {
          const num = count[j];
          this.ctx.drawImage(this.spritesheet, nums[num][0], nums[num][1], nums[num][2], nums[num][3], numX, txtY - nums[num][3] - Config.MODULE_SIZE * .5, nums[num][2], nums[num][3]);
          numX += nums[num][2] + 1;
        }
      }

      this.ctx.globalAlpha = 1;
    }

    //Note
    if(this.note) {
      const noteX = Math.round((this.canvas.width - 106)/2);
      const noteY = Math.round((this.canvas.height - 70)/2);
      this.ctx.drawImage(this.spritesheet, 2, 22, 106, 70, noteX, noteY, 106, 70);
    }

    //Debug cursor
    if(Config.DEBUG_DRAW.ENABLED && Config.DEBUG_DRAW.CURSOR) {
      this.ctx.strokeStyle = 'rgba(0, 150, 0, .5)';
      this.ctx.beginPath();
      this.ctx.arc(this.cursor.x, this.cursor.y, 5, 0, Math.PI * 2);
      this.ctx.stroke();
      this.ctx.closePath();
    }

    //Schedule next frame
    requestAnimationFrame(this.gameloop);
  }

  killAnimationsOf(obj) {

    if(Array.isArray(obj)) {
      this.animations = this.animations.filter(animation => {
        !obj.includes(animation.obj);
      });
    }else {
      this.animations = this.animations.filter(animation => {
        animation.obj != obj;
      });
    }
  }

  addAnimation(animation) {

    this.animations.push(animation);
  }

  resize() {

    const SCALE_X = (window.innerWidth * Config.SCALE) / this.canvas.width;
    const SCALE_Y = (window.innerHeight * Config.SCALE) / this.canvas.height;

    let scale = Math.min(SCALE_X, SCALE_Y);

    //Limit scale per config
    if(Config.MAX_SCALE > 0) scale = Math.min(Config.MAX_SCALE, scale);

    this.canvas.style.transform = `scale(${scale})`;
    this.scale = scale;
  }
}

const MAIN = new Main();
