import * as Config from './config';
import Vec2 from './vec2';
import Bone from './bone';

export default class Chain {

  constructor(at, length) {

    this.bones = [];
    this.points = [];

    const boneLength = length / Config.BONE_COUNT;
    for(let i = 0; i<Config.BONE_COUNT; i++) this.bones.push(new Bone(i, 0, 0, Math.random() * 360, boneLength));

    this.firstBone().pos.set(at.x, at.y);

    this.updateParents();
    this.updatePoints();
  }

  reverse(target) {

    const PI2 = Math.PI * 2;

    let firstBone = this.firstBone();
    let lastBone = this.lastBone();
    const endPos = lastBone.worldEndPosition();
    const startAngle = (lastBone.worldAngle() + Math.PI) % PI2;

    const angles = this.bones.map(bone => {
      return bone.angle;
    });

    this.bones.reverse();
    this.updateParents();

    firstBone = this.firstBone();
    lastBone = this.lastBone();

    firstBone.pos.set(endPos.x, endPos.y);
    firstBone.angle = startAngle;

    for(let i = 1; i<Config.BONE_COUNT-1; i++) {
      const bone = this.bones[i];
      bone.angle = -angles[Config.BONE_COUNT-i];
    }

    //Correct last bone angle
    lastBone.angle += lastBone.worldPosition().angle(target) - lastBone.worldAngle();
  }

  update(target) {

    //Update the IK bone chain
    const lastBone = this.lastBone();
    lastBone.update(target);

    //Correct last bone angle
    lastBone.angle += lastBone.worldPosition().angle(target) - lastBone.worldAngle();

    this.updatePoints();
  }

  updateParents() {

    for(let i = 1; i<Config.BONE_COUNT; i++) this.bones[i].parent = this.bones[i-1];
    this.firstBone().parent = null;
  }

  updatePoints() {

    //Get curve points, TODO: cache this inside cable
    this.points = this.bones.reduce((points, bone) => {
      const boneWorldPos = bone.worldPosition();
      points.push(boneWorldPos.x, boneWorldPos.y);
      return points;
    }, []);

    const lastBoneWorldEndPos = this.lastBone().worldEndPosition();
    this.points.push(lastBoneWorldEndPos.x, lastBoneWorldEndPos.y);
  }

  firstBone() {

    return this.bones[0];
  }

  lastBone() {

    return this.bones[Config.BONE_COUNT-1];
  }
}
