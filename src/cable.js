import * as Config from './config';
import * as Util from './util';
import Animation from './animation';
import Bone from './bone';
import Chain from './chain';
import Vec2 from './vec2';

export default class Cable {

  //IK implementation based on
  //https://www.davepagurek.com/blog/inverse-kinematics/
  //https://codepen.io/davepvm/pen/gmgGdQ

  constructor(at, length, wireColor, plugColor, main) {

    this.endA = {
      pos: new Vec2(at.x, at.y),
      plugged: null
    }
    this.endB = {
      pos: new Vec2(at.x, at.y + length),
      plugged: null
    };

    this.cursor = null;
    this.order = [this.endB, this.endA]; //0: dragged end, 1: other end
    this.chain = new Chain(at, length);
    this.lastDrag = this.endB;
    this.length = length;
    this.alpha = 1;
    this.wireColor = wireColor;
    this.plugColor = plugColor;
    this.main = main;
    this.dropped = false;
    this.type = 0;
  }

  resizeChain(length) {

    this.length = length;
    this.chain = new Chain(this.endA.pos, length);
  }

  hit(cursor) {

    if(this.dropped) return false;

    if(this.endA.pos.distance(cursor) < Config.WIRE_TOUCH_AREA) {
      this.order = [this.endA, this.endB];
      if(this.lastDrag != this.endA) this.chain.reverse(this.endA.pos);
      this.lastDrag = this.endA;
      return true;
    };
    if(this.endB.pos.distance(cursor) < Config.WIRE_TOUCH_AREA) {
      this.order = [this.endB, this.endA];
      if(this.lastDrag != this.endB) this.chain.reverse(this.endB.pos);
      this.lastDrag = this.endB;
      return true;
    }
    return false;
  }

  press(cursor) {

    if(this.dropped) return;

    this.cursor = cursor;
    this.main.killAnimationsOf([this.endA.pos, this.endB.pos]);
  }

  release(cursor, socket) {

    if(this.dropped) return;

    this.cursor = null;

    //Ignore socket if distance is too large
    if(this.order[0].pos.distance(this.order[1].pos) > this.length) socket = null;

    if(socket && !socket.cable) {
      this.order[0].pos.set(socket.worldPos.x, socket.worldPos.y);
      this.order[0].plugged = socket;
      socket.cable = this;
      socket.module.updatePower();
      this.main.rack.updatePowers();
      //Update IK bones
      this.updateIK(this.order[0].pos);
    }else {
      const lastBoneWorldEndPos = this.chain.lastBone().worldEndPosition();
      this.order[0].pos.set(lastBoneWorldEndPos.x, lastBoneWorldEndPos.y);
    }

    //drop cable if not connected
    if(!this.order[0].plugged && !this.order[1].plugged) {
      this.dropped = true;
      this.main.addAnimation(new Animation(this, 'alpha', 0, 200, 0, Animation.EASE.LINEAR, null, () => {
        this.main.deleteCable(this);
      }));
    }

    //Dangle animation
    else if(!this.order[0].plugged && this.order[1].plugged) {
      //Generate a random position
      const angle = Math.random() * Math.PI * 2;
      const to = new Vec2(this.order[1].pos.x + Math.cos(angle) * (this.length * .25 + Config.WIRE_TOUCH_AREA * .75), this.order[1].pos.y + Math.sin(angle) * (this.length * .25 + Config.WIRE_TOUCH_AREA * .75));
      //Cap position to screen space
      to.x = Math.max(Math.min(to.x, this.main.canvas.width-10), 10);
      to.y = Math.max(Math.min(to.y, this.main.canvas.height-10), 10);
      //Animate end
      this.main.addAnimation(new Animation(this.order[0].pos, 'x', to.x, 750, 0, Animation.EASE.OUT_ELASTIC, per => this.chain.update(this.order[0].pos)));
      this.main.addAnimation(new Animation(this.order[0].pos, 'y', to.y, 750, 0, Animation.EASE.OUT_ELASTIC));
    }
  }

  drag(cursor) {

    if(this.dropped) return;

    //Update dragged end position
    this.order[0].pos.set(cursor.x, cursor.y);

    //Update IK bones
    this.updateIK(cursor);

    //Unplug
    if(this.order[0].plugged) {
      const socket = this.order[0].plugged;
      this.order[0].plugged.cable = null;
      this.order[0].plugged = null;
      socket.module.updatePower();
      this.main.rack.updatePowers();
    }

    //Unplug other end when dragged too far
    // if(this.order[1].plugged && this.order[0].pos.distance(this.order[1].pos) > this.length + 4) {
    //   this.order[1].plugged.cable = null;
    //   this.order[1].plugged = null;
    // }
  }

  updateIK(target) {

    for(let i = 0; i<Config.IK_ITERATIONS; i++) this.chain.update(target);
  }

  update(deltaTime) {

  }

  draw(ctx) {

    const halfLength = this.length/2;
    const PI2 = 2 * Math.PI;

    //Draw plugs
    const points = this.chain.points;

    //Add y speed when dropped
    if(this.dropped) {
      for(let i = 1; i<points.length; i+=2) {
        points[i] += 5;
      }
    }

    ctx.globalAlpha = this.alpha;

    ctx.fillStyle = this.plugColor;
    ctx.beginPath();
    ctx.fillRect(points[0] - 2, points[1] - 2, 4, 4);
    ctx.fillRect(points[points.length-2] - 2, points[points.length-1] - 2, 4, 4);
    ctx.closePath();

    //Draw wire
    ctx.strokeStyle = this.wireColor;
    ctx.lineWidth = Config.CABLE_WIDTH;
    ctx.beginPath();
    Util.curve(ctx, points, .5, 10, false);
    ctx.stroke();
    ctx.closePath();

    ctx.globalAlpha = 1;

    //Debug
    if(Config.DEBUG_DRAW.ENABLED) {

      ctx.lineWidth = 1;
      ctx.globalAlpha = 1;

      //Debug draw ends
      if(Config.DEBUG_DRAW.CABLE_ENDS) {
        ctx.strokeStyle = 'rgba(0, 150, 0, .5)';
        ctx.beginPath();
        ctx.arc(this.order[0].pos.x, this.order[0].pos.y, halfLength, 0, PI2);
        ctx.stroke();
        ctx.closePath();

        ctx.strokeStyle = 'rgba(255, 0, 0, .5)';
        ctx.beginPath();
        ctx.arc(this.order[1].pos.x, this.order[1].pos.y, halfLength, 0, PI2);
        ctx.stroke();
        ctx.closePath();
      }

      //Draw bones
      if(Config.DEBUG_DRAW.CABLE_BONES) {
        ctx.fillStyle = '#000000';
        ctx.strokeStyle = '#000000';
        for(let i = 0; i<this.chain.bones.length; i++) {
          const bone = this.chain.bones[i];
          const worldPos = bone.worldPosition();
          const worldAngle = bone.worldAngle();
          ctx.beginPath();
          ctx.arc(worldPos.x, worldPos.y, 1, 0, PI2);
          ctx.fill();
          ctx.moveTo(worldPos.x, worldPos.y);
          ctx.lineTo(worldPos.x + Math.cos(worldAngle) * bone.length, worldPos.y + Math.sin(worldAngle) * bone.length);
          ctx.stroke();
          ctx.closePath();
        }
      }

      //Draw touch areas
      if(Config.DEBUG_DRAW.CABLE_TOUCH_AREAS) {
        ctx.fillStyle = 'rgba(255, 255, 255, .25)';
        ctx.beginPath();
        ctx.arc(this.endA.pos.x, this.endA.pos.y, Config.WIRE_TOUCH_AREA, 0, PI2);
        ctx.fill();
        ctx.closePath();
        ctx.beginPath();
        ctx.arc(this.endB.pos.x, this.endB.pos.y, Config.WIRE_TOUCH_AREA, 0, PI2);
        ctx.fill();
        ctx.closePath();
      }
    }
  }
}
