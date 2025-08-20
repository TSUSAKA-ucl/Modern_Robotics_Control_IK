// This code defines a TrapVelocGenerator class that simulates a trapezoidal velocity profile.
export class TrapVelocGenerator {
  constructor(gain, dec, vmax, acc) {
    this.g1 = gain;
    this.a1 = dec;
    this.v1 = vmax;
    this.a2 = acc;
    this.constrained = false;
    this.x0 = 0;
  }
  #vsFunc(x) {
    const a1 = this.a1;
    const v1 = this.v1;
    const g1 = this.g1;

    const xSq = x * x;
    let vs = 0;
    if (xSq < (x => x * x)(a1 / (g1 * g1))) {
      vs = -g1 * x;
    } else if (xSq < (x => x * x)(a1 / (2 * g1 * g1) + v1 * v1 / (2 * a1))) {
      vs = -Math.sqrt(a1 * (2 * Math.abs(x) - a1 / (g1 * g1))) * Math.sign(x);
    } else {
      vs = -v1 * Math.sign(x);
    }
    return vs;
  }
  setX0(x) {
    this.x0 = x;
  }
  calcNext(xt2, vt, deltaT) {
    const xt = xt2 - this.x0;
    if (this.constrained === true) {
      return {x: this.x0 + xt + vt * deltaT,
	      v: this.#vsFunc(xt + vt * deltaT),
	      constrained: true};
    } else {
      if (vt < this.#vsFunc(xt)) {
	const vt1 = vt + this.a2 * deltaT;
	const xt1 = xt + vt * deltaT;
	if (vt1 < this.#vsFunc(xt1)) {
	  return {x: this.x0 + xt1, v: vt1,
		  constrained: false};
	} else {
	  this.constrained = true;
	  return {x: this.x0 + xt1, v: this.#vsFunc(xt1),
		  constrained: true};
	}
      } else {
	const vt1 = vt - this.a2 * deltaT;
	const xt1 = xt + vt * deltaT;
	if (vt1 > this.#vsFunc(xt1)) {
	  return {x: this.x0 + xt1, v: vt1,
		  constrained: false};
	} else {
	  this.constrained = true;
	  return {x: this.x0 + xt1, v: this.#vsFunc(xt1),
		  constrained: true};
	}
      }
    }
  }
  reset() {
    this.constrained = false;
  }
}
