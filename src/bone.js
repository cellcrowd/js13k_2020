import Vec2 from './vec2';

export default class Bone {

  constructor(id, x, y, angle, length) {

    this.id = id;
    this.pos = new Vec2(x, y);
    this.length = length;
    this.angle = angle;
    this.parent = null;
  }

  update(target, endPos) {

    const worldPos = this.worldPosition();
    let angleOffset;

    if(endPos) {
      const angleA = worldPos.angle(endPos);
      const angleB = worldPos.angle(target);
      angleOffset = angleB - angleA;
      this.angle += angleOffset;
    }else {
      this.angle = worldPos.angle(target);
    }

    if(this.parent) {
      if(!endPos) endPos = new Vec2(worldPos.x + Math.cos(this.angle) * this.length, worldPos.y + Math.sin(this.angle) * this.length);
      else endPos.rotate(worldPos, -angleOffset);
      this.parent.update(target, endPos);
    }
  }

  worldAngle() {

    if(this.parent) return this.angle + this.parent.worldAngle();
    else return this.angle;
  }

  worldPosition() {

    let worldPos = new Vec2(this.pos.x, this.pos.y);
    if(this.parent) {
      worldPos = this.parent.worldPosition();
      worldPos.x += Math.cos(this.parent.worldAngle()) * this.parent.length;
      worldPos.y += Math.sin(this.parent.worldAngle()) * this.parent.length;
    }
    return worldPos;
  }

  worldEndPosition() {

    const worldPos = this.worldPosition();
    const worldAngle = this.worldAngle();
    return new Vec2(worldPos.x + Math.cos(worldAngle) * this.length, worldPos.y + Math.sin(worldAngle) * this.length);
  }
}
