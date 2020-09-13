export default class Vec2 {

  //TODO: temp/pool Vec2s so no new ones are being allocated

  constructor(x = 0, y = 0) {

    this.set(x, y);
  }

  set(x, y) {

    this.x = x;
    this.y = y;

    return this;
  }

  add(other) {

    this.x += other.x;
    this.y += other.y;

    return this;
  }

  distance(other) {

    return Math.hypot(other.x - this.x, other.y - this.y);
  }

  angle(other) {

    return Math.atan2(other.y - this.y, other.x - this.x);
  }

  rotate(from, angle) {
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);
    const oX = this.x;
    const oY = this.y;
    this.x = (cos * (oX - from.x)) + (sin * (oY - from.y)) + from.x,
    this.y = (cos * (oY - from.y)) - (sin * (oX - from.x)) + from.y;
  }
}
