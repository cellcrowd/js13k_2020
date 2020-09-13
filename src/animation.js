export default class Animation {

  constructor(obj, prop, to, duration, delay, ease, onUpdate, onComplete) {

    this.obj = obj;
    this.prop = prop;
    this.duration = duration;
    this.ease = ease;
    this.from = obj[prop];
    this.to = to;
    this.time = -delay;
    this.per = 0;
    this.onUpdate = onUpdate;
    this.onComplete = onComplete;
  }

  update(deltaTime) {

    this.time += deltaTime;
    this.per = Math.max(0, Math.min(1, this.time / this.duration));
    this.obj[this.prop] = this.from + (this.to - this.from) * this.ease(this.per);
    if(this.onUpdate) this.onUpdate(this.per);
    if(this.per == 1 && this.onComplete) this.onComplete(this);
  }
}

//Easing functions, taken from https://gist.github.com/gre/1650294
Animation.EASE = {
  LINEAR: t => t,
  IN_QUAD: t => t * t,
  OUT_QUAD: t => t * (2 - t),
  INOUT_QUAD: t => t < .5 ? 2 * t * t : -1 + (4 - 2 * t) * t,
  IN_ELASTIC: t => .04 * t / (--t) * Math.sin(25 * t),
  OUT_ELASTIC: t => (.04 - .04 / t) * Math.sin(25 * t) + 1
};
