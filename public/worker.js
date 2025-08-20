class W {
  constructor(e, t, i, n) {
    this.g1 = e, this.a1 = t, this.v1 = i, this.a2 = n, this.constrained = !1, this.x0 = 0;
  }
  #e(e) {
    const t = this.a1, i = this.v1, n = this.g1, r = e * e;
    let o = 0;
    return r < ((l) => l * l)(t / (n * n)) ? o = -n * e : r < ((l) => l * l)(t / (2 * n * n) + i * i / (2 * t)) ? o = -Math.sqrt(t * (2 * Math.abs(e) - t / (n * n))) * Math.sign(e) : o = -i * Math.sign(e), o;
  }
  setX0(e) {
    this.x0 = e;
  }
  calcNext(e, t, i) {
    const n = e - this.x0;
    if (this.constrained === !0)
      return {
        x: this.x0 + n + t * i,
        v: this.#e(n + t * i),
        constrained: !0
      };
    if (t < this.#e(n)) {
      const r = t + this.a2 * i, o = n + t * i;
      return r < this.#e(o) ? {
        x: this.x0 + o,
        v: r,
        constrained: !1
      } : (this.constrained = !0, {
        x: this.x0 + o,
        v: this.#e(o),
        constrained: !0
      });
    } else {
      const r = t - this.a2 * i, o = n + t * i;
      return r > this.#e(o) ? {
        x: this.x0 + o,
        v: r,
        constrained: !1
      } : (this.constrained = !0, {
        x: this.x0 + o,
        v: this.#e(o),
        constrained: !0
      });
    }
  }
  reset() {
    this.constrained = !1;
  }
}
function Z(s) {
  const e = s.length;
  let t = 0, i = 0;
  for (; i < e; ) {
    let n = s.charCodeAt(i++);
    if (n & 4294967168)
      if (!(n & 4294965248))
        t += 2;
      else {
        if (n >= 55296 && n <= 56319 && i < e) {
          const r = s.charCodeAt(i);
          (r & 64512) === 56320 && (++i, n = ((n & 1023) << 10) + (r & 1023) + 65536);
        }
        n & 4294901760 ? t += 4 : t += 3;
      }
    else {
      t++;
      continue;
    }
  }
  return t;
}
function j(s, e, t) {
  const i = s.length;
  let n = t, r = 0;
  for (; r < i; ) {
    let o = s.charCodeAt(r++);
    if (o & 4294967168)
      if (!(o & 4294965248))
        e[n++] = o >> 6 & 31 | 192;
      else {
        if (o >= 55296 && o <= 56319 && r < i) {
          const l = s.charCodeAt(r);
          (l & 64512) === 56320 && (++r, o = ((o & 1023) << 10) + (l & 1023) + 65536);
        }
        o & 4294901760 ? (e[n++] = o >> 18 & 7 | 240, e[n++] = o >> 12 & 63 | 128, e[n++] = o >> 6 & 63 | 128) : (e[n++] = o >> 12 & 15 | 224, e[n++] = o >> 6 & 63 | 128);
      }
    else {
      e[n++] = o;
      continue;
    }
    e[n++] = o & 63 | 128;
  }
}
const ee = new TextEncoder(), te = 50;
function ie(s, e, t) {
  ee.encodeInto(s, e.subarray(t));
}
function ne(s, e, t) {
  s.length > te ? ie(s, e, t) : j(s, e, t);
}
new TextDecoder();
class F {
  constructor(e, t) {
    this.type = e, this.data = t;
  }
}
class k extends Error {
  constructor(e) {
    super(e);
    const t = Object.create(k.prototype);
    Object.setPrototypeOf(this, t), Object.defineProperty(this, "name", {
      configurable: !0,
      enumerable: !1,
      value: k.name
    });
  }
}
function se(s, e, t) {
  const i = t / 4294967296, n = t;
  s.setUint32(e, i), s.setUint32(e + 4, n);
}
function K(s, e, t) {
  const i = Math.floor(t / 4294967296), n = t;
  s.setUint32(e, i), s.setUint32(e + 4, n);
}
function oe(s, e) {
  const t = s.getInt32(e), i = s.getUint32(e + 4);
  return t * 4294967296 + i;
}
const re = -1, le = 4294967296 - 1, ae = 17179869184 - 1;
function ce({ sec: s, nsec: e }) {
  if (s >= 0 && e >= 0 && s <= ae)
    if (e === 0 && s <= le) {
      const t = new Uint8Array(4);
      return new DataView(t.buffer).setUint32(0, s), t;
    } else {
      const t = s / 4294967296, i = s & 4294967295, n = new Uint8Array(8), r = new DataView(n.buffer);
      return r.setUint32(0, e << 2 | t & 3), r.setUint32(4, i), n;
    }
  else {
    const t = new Uint8Array(12), i = new DataView(t.buffer);
    return i.setUint32(0, e), K(i, 4, s), t;
  }
}
function fe(s) {
  const e = s.getTime(), t = Math.floor(e / 1e3), i = (e - t * 1e3) * 1e6, n = Math.floor(i / 1e9);
  return {
    sec: t + n,
    nsec: i - n * 1e9
  };
}
function he(s) {
  if (s instanceof Date) {
    const e = fe(s);
    return ce(e);
  } else
    return null;
}
function de(s) {
  const e = new DataView(s.buffer, s.byteOffset, s.byteLength);
  switch (s.byteLength) {
    case 4:
      return { sec: e.getUint32(0), nsec: 0 };
    case 8: {
      const t = e.getUint32(0), i = e.getUint32(4), n = (t & 3) * 4294967296 + i, r = t >>> 2;
      return { sec: n, nsec: r };
    }
    case 12: {
      const t = oe(e, 4), i = e.getUint32(0);
      return { sec: t, nsec: i };
    }
    default:
      throw new k(`Unrecognized data size for timestamp (expected 4, 8, or 12): ${s.length}`);
  }
}
function ue(s) {
  const e = de(s);
  return new Date(e.sec * 1e3 + e.nsec / 1e6);
}
const we = {
  type: re,
  encode: he,
  decode: ue
};
class P {
  constructor() {
    this.builtInEncoders = [], this.builtInDecoders = [], this.encoders = [], this.decoders = [], this.register(we);
  }
  register({ type: e, encode: t, decode: i }) {
    if (e >= 0)
      this.encoders[e] = t, this.decoders[e] = i;
    else {
      const n = -1 - e;
      this.builtInEncoders[n] = t, this.builtInDecoders[n] = i;
    }
  }
  tryToEncode(e, t) {
    for (let i = 0; i < this.builtInEncoders.length; i++) {
      const n = this.builtInEncoders[i];
      if (n != null) {
        const r = n(e, t);
        if (r != null) {
          const o = -1 - i;
          return new F(o, r);
        }
      }
    }
    for (let i = 0; i < this.encoders.length; i++) {
      const n = this.encoders[i];
      if (n != null) {
        const r = n(e, t);
        if (r != null) {
          const o = i;
          return new F(o, r);
        }
      }
    }
    return e instanceof F ? e : null;
  }
  decode(e, t, i) {
    const n = t < 0 ? this.builtInDecoders[-1 - t] : this.decoders[t];
    return n ? n(e, t, i) : new F(t, e);
  }
}
P.defaultCodec = new P();
function ge(s) {
  return s instanceof ArrayBuffer || typeof SharedArrayBuffer < "u" && s instanceof SharedArrayBuffer;
}
function xe(s) {
  return s instanceof Uint8Array ? s : ArrayBuffer.isView(s) ? new Uint8Array(s.buffer, s.byteOffset, s.byteLength) : ge(s) ? new Uint8Array(s) : Uint8Array.from(s);
}
const me = 100, pe = 2048;
class L {
  constructor(e) {
    this.entered = !1, this.extensionCodec = e?.extensionCodec ?? P.defaultCodec, this.context = e?.context, this.useBigInt64 = e?.useBigInt64 ?? !1, this.maxDepth = e?.maxDepth ?? me, this.initialBufferSize = e?.initialBufferSize ?? pe, this.sortKeys = e?.sortKeys ?? !1, this.forceFloat32 = e?.forceFloat32 ?? !1, this.ignoreUndefined = e?.ignoreUndefined ?? !1, this.forceIntegerToFloat = e?.forceIntegerToFloat ?? !1, this.pos = 0, this.view = new DataView(new ArrayBuffer(this.initialBufferSize)), this.bytes = new Uint8Array(this.view.buffer);
  }
  clone() {
    return new L({
      extensionCodec: this.extensionCodec,
      context: this.context,
      useBigInt64: this.useBigInt64,
      maxDepth: this.maxDepth,
      initialBufferSize: this.initialBufferSize,
      sortKeys: this.sortKeys,
      forceFloat32: this.forceFloat32,
      ignoreUndefined: this.ignoreUndefined,
      forceIntegerToFloat: this.forceIntegerToFloat
    });
  }
  reinitializeState() {
    this.pos = 0;
  }
  /**
   * This is almost equivalent to {@link Encoder#encode}, but it returns an reference of the encoder's internal buffer and thus much faster than {@link Encoder#encode}.
   *
   * @returns Encodes the object and returns a shared reference the encoder's internal buffer.
   */
  encodeSharedRef(e) {
    if (this.entered)
      return this.clone().encodeSharedRef(e);
    try {
      return this.entered = !0, this.reinitializeState(), this.doEncode(e, 1), this.bytes.subarray(0, this.pos);
    } finally {
      this.entered = !1;
    }
  }
  /**
   * @returns Encodes the object and returns a copy of the encoder's internal buffer.
   */
  encode(e) {
    if (this.entered)
      return this.clone().encode(e);
    try {
      return this.entered = !0, this.reinitializeState(), this.doEncode(e, 1), this.bytes.slice(0, this.pos);
    } finally {
      this.entered = !1;
    }
  }
  doEncode(e, t) {
    if (t > this.maxDepth)
      throw new Error(`Too deep objects in depth ${t}`);
    e == null ? this.encodeNil() : typeof e == "boolean" ? this.encodeBoolean(e) : typeof e == "number" ? this.forceIntegerToFloat ? this.encodeNumberAsFloat(e) : this.encodeNumber(e) : typeof e == "string" ? this.encodeString(e) : this.useBigInt64 && typeof e == "bigint" ? this.encodeBigInt64(e) : this.encodeObject(e, t);
  }
  ensureBufferSizeToWrite(e) {
    const t = this.pos + e;
    this.view.byteLength < t && this.resizeBuffer(t * 2);
  }
  resizeBuffer(e) {
    const t = new ArrayBuffer(e), i = new Uint8Array(t), n = new DataView(t);
    i.set(this.bytes), this.view = n, this.bytes = i;
  }
  encodeNil() {
    this.writeU8(192);
  }
  encodeBoolean(e) {
    e === !1 ? this.writeU8(194) : this.writeU8(195);
  }
  encodeNumber(e) {
    !this.forceIntegerToFloat && Number.isSafeInteger(e) ? e >= 0 ? e < 128 ? this.writeU8(e) : e < 256 ? (this.writeU8(204), this.writeU8(e)) : e < 65536 ? (this.writeU8(205), this.writeU16(e)) : e < 4294967296 ? (this.writeU8(206), this.writeU32(e)) : this.useBigInt64 ? this.encodeNumberAsFloat(e) : (this.writeU8(207), this.writeU64(e)) : e >= -32 ? this.writeU8(224 | e + 32) : e >= -128 ? (this.writeU8(208), this.writeI8(e)) : e >= -32768 ? (this.writeU8(209), this.writeI16(e)) : e >= -2147483648 ? (this.writeU8(210), this.writeI32(e)) : this.useBigInt64 ? this.encodeNumberAsFloat(e) : (this.writeU8(211), this.writeI64(e)) : this.encodeNumberAsFloat(e);
  }
  encodeNumberAsFloat(e) {
    this.forceFloat32 ? (this.writeU8(202), this.writeF32(e)) : (this.writeU8(203), this.writeF64(e));
  }
  encodeBigInt64(e) {
    e >= BigInt(0) ? (this.writeU8(207), this.writeBigUint64(e)) : (this.writeU8(211), this.writeBigInt64(e));
  }
  writeStringHeader(e) {
    if (e < 32)
      this.writeU8(160 + e);
    else if (e < 256)
      this.writeU8(217), this.writeU8(e);
    else if (e < 65536)
      this.writeU8(218), this.writeU16(e);
    else if (e < 4294967296)
      this.writeU8(219), this.writeU32(e);
    else
      throw new Error(`Too long string: ${e} bytes in UTF-8`);
  }
  encodeString(e) {
    const i = Z(e);
    this.ensureBufferSizeToWrite(5 + i), this.writeStringHeader(i), ne(e, this.bytes, this.pos), this.pos += i;
  }
  encodeObject(e, t) {
    const i = this.extensionCodec.tryToEncode(e, this.context);
    if (i != null)
      this.encodeExtension(i);
    else if (Array.isArray(e))
      this.encodeArray(e, t);
    else if (ArrayBuffer.isView(e))
      this.encodeBinary(e);
    else if (typeof e == "object")
      this.encodeMap(e, t);
    else
      throw new Error(`Unrecognized object: ${Object.prototype.toString.apply(e)}`);
  }
  encodeBinary(e) {
    const t = e.byteLength;
    if (t < 256)
      this.writeU8(196), this.writeU8(t);
    else if (t < 65536)
      this.writeU8(197), this.writeU16(t);
    else if (t < 4294967296)
      this.writeU8(198), this.writeU32(t);
    else
      throw new Error(`Too large binary: ${t}`);
    const i = xe(e);
    this.writeU8a(i);
  }
  encodeArray(e, t) {
    const i = e.length;
    if (i < 16)
      this.writeU8(144 + i);
    else if (i < 65536)
      this.writeU8(220), this.writeU16(i);
    else if (i < 4294967296)
      this.writeU8(221), this.writeU32(i);
    else
      throw new Error(`Too large array: ${i}`);
    for (const n of e)
      this.doEncode(n, t + 1);
  }
  countWithoutUndefined(e, t) {
    let i = 0;
    for (const n of t)
      e[n] !== void 0 && i++;
    return i;
  }
  encodeMap(e, t) {
    const i = Object.keys(e);
    this.sortKeys && i.sort();
    const n = this.ignoreUndefined ? this.countWithoutUndefined(e, i) : i.length;
    if (n < 16)
      this.writeU8(128 + n);
    else if (n < 65536)
      this.writeU8(222), this.writeU16(n);
    else if (n < 4294967296)
      this.writeU8(223), this.writeU32(n);
    else
      throw new Error(`Too large map object: ${n}`);
    for (const r of i) {
      const o = e[r];
      this.ignoreUndefined && o === void 0 || (this.encodeString(r), this.doEncode(o, t + 1));
    }
  }
  encodeExtension(e) {
    if (typeof e.data == "function") {
      const i = e.data(this.pos + 6), n = i.length;
      if (n >= 4294967296)
        throw new Error(`Too large extension object: ${n}`);
      this.writeU8(201), this.writeU32(n), this.writeI8(e.type), this.writeU8a(i);
      return;
    }
    const t = e.data.length;
    if (t === 1)
      this.writeU8(212);
    else if (t === 2)
      this.writeU8(213);
    else if (t === 4)
      this.writeU8(214);
    else if (t === 8)
      this.writeU8(215);
    else if (t === 16)
      this.writeU8(216);
    else if (t < 256)
      this.writeU8(199), this.writeU8(t);
    else if (t < 65536)
      this.writeU8(200), this.writeU16(t);
    else if (t < 4294967296)
      this.writeU8(201), this.writeU32(t);
    else
      throw new Error(`Too large extension object: ${t}`);
    this.writeI8(e.type), this.writeU8a(e.data);
  }
  writeU8(e) {
    this.ensureBufferSizeToWrite(1), this.view.setUint8(this.pos, e), this.pos++;
  }
  writeU8a(e) {
    const t = e.length;
    this.ensureBufferSizeToWrite(t), this.bytes.set(e, this.pos), this.pos += t;
  }
  writeI8(e) {
    this.ensureBufferSizeToWrite(1), this.view.setInt8(this.pos, e), this.pos++;
  }
  writeU16(e) {
    this.ensureBufferSizeToWrite(2), this.view.setUint16(this.pos, e), this.pos += 2;
  }
  writeI16(e) {
    this.ensureBufferSizeToWrite(2), this.view.setInt16(this.pos, e), this.pos += 2;
  }
  writeU32(e) {
    this.ensureBufferSizeToWrite(4), this.view.setUint32(this.pos, e), this.pos += 4;
  }
  writeI32(e) {
    this.ensureBufferSizeToWrite(4), this.view.setInt32(this.pos, e), this.pos += 4;
  }
  writeF32(e) {
    this.ensureBufferSizeToWrite(4), this.view.setFloat32(this.pos, e), this.pos += 4;
  }
  writeF64(e) {
    this.ensureBufferSizeToWrite(8), this.view.setFloat64(this.pos, e), this.pos += 8;
  }
  writeU64(e) {
    this.ensureBufferSizeToWrite(8), se(this.view, this.pos, e), this.pos += 8;
  }
  writeI64(e) {
    this.ensureBufferSizeToWrite(8), K(this.view, this.pos, e), this.pos += 8;
  }
  writeBigUint64(e) {
    this.ensureBufferSizeToWrite(8), this.view.setBigUint64(this.pos, e), this.pos += 8;
  }
  writeBigInt64(e) {
    this.ensureBufferSizeToWrite(8), this.view.setBigInt64(this.pos, e), this.pos += 8;
  }
}
function ye(s, e) {
  return new L(e).encodeSharedRef(s);
}
const m = Object.freeze({
  initializing: 1,
  waitingRobotType: 2,
  generatorMaking: 3,
  generatorReady: 4,
  slrmReady: 5
}), x = Object.freeze({
  dormant: 1,
  converged: 2,
  moving: 3,
  rewinding: 4
});
let p = m.initializing, w = x.dormant;
console.log("Now intended to import ModuleFactory");
const C = await import("/wasm/slrm_module.js"), Ue = await import("/wasm/cd_module.js");
console.log("ModuleFactory: ", C);
console.log("ModuleFactory.default type:", typeof C.default);
if (typeof C.default != "function")
  throw console.error("ModuleFactory.default is not a function:", C.default), new Error("ModuleFactory.default is not a valid function");
const d = await C.default();
if (!d)
  throw console.error("Failed to load SlrmModule"), new Error("SlrmModule could not be loaded");
const A = await Ue.default();
if (!A)
  throw console.error("Failed to load CdModule"), new Error("CdModule could not be loaded");
const D = {
  [d.CmdVelGeneratorStatus.OK.value]: "OK",
  [d.CmdVelGeneratorStatus.ERROR.value]: "ERROR",
  [d.CmdVelGeneratorStatus.END.value]: "END",
  [d.CmdVelGeneratorStatus.SINGULARITY.value]: "SINGULARITY",
  [d.CmdVelGeneratorStatus.REWIND.value]: "REWIND"
}, J = 4, $ = 0n / BigInt(J);
let V = null, _ = 0n, G = null, N = null, a = null, b = null, v = null, I = null;
const R = [], z = [];
let u = null, y = null, M = null, q = null, T = !1;
function Se(s) {
  function e(t) {
    const i = new s.DoubleVector();
    for (let n = 0; n < t.length; ++n)
      i.push_back(t[n]);
    return i;
  }
  return {
    makeDoubleVector: e
    // ... more helpers
  };
}
function ve(s) {
  function e(i) {
    const n = new s.DoubleVector();
    for (let r = 0; r < i.length; ++r)
      n.push_back(i[r]);
    return n;
  }
  function t(i) {
    const n = new s.ConvexShape();
    for (let r = 0; r < i.length; ++r) {
      const o = i[r];
      n.push_back({ x: o[0], y: o[1], z: o[2] });
    }
    return n;
  }
  return {
    makeCdDoubleVector: e,
    makeConvexShape: t
  };
}
let U = null, X = !1;
function H(s, e) {
  function t(o, l) {
    const f = new o.DoubleVector();
    for (let h = 0; h < l.length; ++h)
      f.push_back(l[h]);
    return f;
  }
  function i(o, l) {
    const f = new o.JointModelFlatStructVector();
    for (let h = 0; h < l.length; ++h)
      f.push_back(l[h]);
    return f;
  }
  const n = e.map((o) => {
    const l = o.origin.$.xyz ?? [NaN, NaN, NaN], f = t(
      s,
      Array.isArray(l) && l.length === 3 ? l : [NaN, NaN, NaN]
    ), h = o.origin.$.rpy ?? [NaN, NaN, NaN], c = t(
      s,
      Array.isArray(h) && h.length === 3 ? h : [NaN, NaN, NaN]
    ), E = o.axis.$.xyz ?? [NaN, NaN, NaN], g = t(
      s,
      Array.isArray(E) && E.length === 3 ? E : [NaN, NaN, NaN]
    ), S = new s.JointModelFlatStruct(g, f, c);
    return g.delete(), f.delete(), c.delete(), S;
  });
  return { jointModelVector: i(s, n), jointModelsArray: n };
}
console.log("now setting onmessage");
self.onmessage = function(s) {
  const e = s.data;
  switch (e.type) {
    case "shutdown":
      U && (U.close(), U = null), d && d.delete(), self.postMessage({ type: "shutdown_complete" }), X = !0;
      break;
    case "init":
      if (p === m.waitingRobotType) {
        p = m.generatorMaking, console.log("constructing CmdVelGenerator with :", e.filename);
        const { makeDoubleVector: t } = Se(d), { makeCdDoubleVector: i, makeConvexShape: n } = ve(A);
        M = t, q = i, d.setJsLogLevel(3), fetch(e.filename).then((r) => r.json()).then((r) => {
          const o = r.filter((c) => c.$.type === "revolute"), {
            jointModelVector: l,
            jointModelsArray: f
          } = H(d, o);
          if (console.log("type of SlrmModule.CmdVelGen: " + typeof d.CmdVelGenerator), u = new d.CmdVelGenerator(l), console.log("type of jointModels is ", typeof jointModels), f.forEach((c) => c.delete()), l.delete(), u == null) {
            console.error("generation of CmdVelGen instance failed"), u = null;
            return;
          }
          u != null && console.log("CmdVelGen instance created:", u), o.forEach((c) => {
            R.push(c.limit.$.upper), z.push(c.limit.$.lower);
          }), console.log("jointLimits: ", R, z), console.log("Status Definitions: OK:" + d.CmdVelGeneratorStatus.OK.value + ", ERROR:" + d.CmdVelGeneratorStatus.ERROR.value + ", END:" + d.CmdVelGeneratorStatus.END.value), u.setExactSolution(T), u.setLinearVelocityLimit(10), u.setAngularVelocityLimit(2 * Math.PI), u.setAngularGain(20), u.setLinearGain(20);
          const h = t(Array(o.length).fill(Math.PI * 2));
          if (u.setJointVelocityLimit(h), h.delete(), e.linkShapes) {
            const {
              jointModelVector: c,
              jointModelsArray: E
            } = H(A, o), g = i([0, 0, 0]), S = i([1, 0, 0, 0]);
            y = new A.CollisionDetection(
              c,
              g,
              S
            ), c.delete(), E.forEach((B) => B.delete()), g.delete(), S.delete();
          }
          y && fetch(e.linkShapes).then((c) => c.json()).then((c) => {
            if (c.length !== o.length + 2) {
              console.error("リンク形状定義の数がリンクモデルの数(+2)と一致しません。");
              return;
            }
            console.log("linkShapes.length: ", c.length);
            for (let g = 0; g < c.length; ++g) {
              console.log(`リンク番号${g} のvector生成`);
              const S = new A.ConvexShapeVector();
              for (const B of c[g]) {
                const O = n(B);
                console.log("size of convex js: ", B.length), S.push_back(O), O.delete();
              }
              y.addLinkShape(g, S), S.delete();
            }
            console.log("setting up of link shapes is finished"), y.infoLinkShapes();
            const E = [
              [0, 2],
              [0, 3],
              [0, 4],
              [0, 5],
              [0, 6],
              [0, 7],
              [1, 3],
              [1, 4],
              [1, 5],
              [1, 6],
              [1, 7],
              [2, 4],
              [2, 5],
              [2, 6],
              [2, 7],
              [3, 5],
              [3, 6],
              [3, 7]
            ];
            y.clearTestPairs();
            for (const g of E)
              y.addTestPair(g[0], g[1]);
          }).catch((c) => {
            console.error("Error fetching or parsing SHAPE file:", c);
          }), e.bridgeUrl && (console.log("recieve bridge URL: ", e.bridgeUrl), U = new WebSocket(e.bridgeUrl), U.onopen = () => {
            console.log("WebSocket connected");
          }, U.onerror = (c) => {
            console.error("WebSocket error", c);
          }), p = m.generatorReady, self.postMessage({ type: "generator_ready" });
        }).catch((r) => {
          console.error("Error fetching or parsing URDF.JSON file:", r);
        });
      }
      break;
    case "set_initial_joints":
      (p === m.generatorReady || p === m.slrmReady) && e.joints && (a = new Float64Array(e.joints.length), a.set(e.joints), G = a.slice(), b = a.slice(), v = new Float64Array(a.length), console.log("Setting initial joints:" + a.map((t) => (t * 57.2958).toFixed(1)).join(", ")), (!N || a.length !== N.length) && (N = Array(a.length).fill(null).map((t, i) => i <= 1 ? new W(5, 1, 0.2, 0.02) : new W(5, 1, 1, 0.0625))), N.forEach((t, i) => {
        t.reset(), t.setX0(G[i]);
      }), p = m.slrmReady, V = [], w = x.moving, console.log("Worker state changed to slrmReady"));
      break;
    case "destination":
      p === m.slrmReady && e.endLinkPose && (V = [...e.endLinkPose], w = x.moving);
      break;
    case "slow_rewind":
      p === m.slrmReady && a && G && N && (e.slowRewind == !0 ? w = x.rewinding : w = x.converged);
      break;
    case "set_end_effector_point":
      if (e.endEffectorPoint && M && e.endEffectorPoint.length === 3 && typeof e.endEffectorPoint[0] == "number" && typeof e.endEffectorPoint[1] == "number" && typeof e.endEffectorPoint[2] == "number") {
        console.debug("Setting end effector point: ", e.endEffectorPoint);
        const t = M(e.endEffectorPoint);
        u.setEndEffectorPosition(t), t.delete();
        const i = w;
        w = x.moving, V = [], Y(0), w = i;
      }
      break;
    case "set_exact_solution":
      (p === m.generatorReady || p === m.slrmReady) && e.exactSolution !== void 0 && (e.exactSolution === !0 ? T = !0 : T = !1, u.setExactSolution(T), console.log("Exact solution for singularity set to: ", T));
      break;
  }
};
function Y(s) {
  let e = null, t = null, i = null, n = null;
  if (!(!u || !a)) {
    if (p === m.slrmReady && (w === x.moving || w === x.rewinding)) {
      if (w === x.rewinding) {
        const f = N.map((h, c) => h.calcNext(a[c], v[c], s));
        for (let h = 0; h < a.length; h++)
          a[h] = f[h].x, v[h] = f[h].v;
        if (U) {
          const h = {
            topic: "actuator1",
            timestamp: Date.now(),
            frame_id: "world",
            position: [...a],
            velocity: [...v],
            normalized: []
          }, c = ye(h);
          U.readyState === WebSocket.OPEN && U.send(c);
        }
        V = [];
      } else w === x.converged && v.fill(0);
      if (V === null)
        return;
      const r = M(a), o = M(V), l = u.calcVelocityPQ(r, o);
      if (r.delete(), o.delete(), w !== x.rewinding)
        for (let f = 0; f < v.length; f++)
          v[f] = l.joint_velocities.get(f);
      if (l.joint_velocities.delete(), e = l.status, t = l.other, (!i || !n) && (i = new Float64Array(3), n = new Float64Array(4)), i[0] = l.position.get(0), i[1] = l.position.get(1), i[2] = l.position.get(2), n[0] = l.quaternion.get(0), n[1] = l.quaternion.get(1), n[2] = l.quaternion.get(2), n[3] = l.quaternion.get(3), l.position.delete(), l.quaternion.delete(), w === x.rewinding && l.status.value !== d.CmdVelGeneratorStatus.END.value && l.status.value !== d.CmdVelGeneratorStatus.OK.value && console.warn("CmdVelGenerator returned status other than END or OK during rewinding:", D[l.status.value]), w === x.moving)
        switch (l.status.value) {
          case d.CmdVelGeneratorStatus.OK.value:
            b.set(a);
            for (let f = 0; f < a.length; f++)
              a[f] = a[f] + v[f] * s;
            if (y) {
              const f = q(a);
              y.calcFk(f), f.delete(), y.testCollisionPairs().size() !== 0 && a.set(b);
            }
            break;
          case d.CmdVelGeneratorStatus.END.value:
            w = x.converged;
            break;
          case d.CmdVelGeneratorStatus.SINGULARITY.value:
            console.error("CmdVelGenerator returned SINGULARITY status");
            break;
          case d.CmdVelGeneratorStatus.REWIND.value:
            a.set(b);
            break;
          case d.CmdVelGeneratorStatus.ERROR.value:
            console.error("CmdVelGenerator returned ERROR status");
            break;
          default:
            console.error("Unknown status from CmdVelGenerator:", l.status.value);
            break;
        }
    }
    if (e !== null && t !== null) {
      let r = Array(a.length).fill(0);
      for (let o = 0; o < a.length; o++)
        a[o] > R[o] && (r[o] = 1, a[o] = R[o] - 1e-3), a[o] < z[o] && (r[o] = -1, a[o] = z[o] + 1e-3);
      self.postMessage({ type: "joints", joints: [...a] }), self.postMessage({
        type: "status",
        status: D[e.value],
        exact_solution: T,
        condition_number: t.condition_number,
        manipulability: t.manipulability,
        sensitivity_scale: t.sensitivity_scale,
        limit_flag: r
      }), self.postMessage({
        type: "pose",
        position: i,
        quaternion: n
      }), _++, $ !== 0n && _ % $ === 0n && (I !== null && a !== null && I.length === a.length && Math.max(...I.map((o, l) => Math.abs(o - a[l]))) > 5e-3 && console.log(
        "counter:",
        _,
        "status: ",
        D[e.value],
        " condition:",
        t.condition_number.toFixed(2),
        " m:",
        t.manipulability.toFixed(3),
        " k:",
        t.sensitivity_scale.toFixed(3) + `
limit flags: ` + r.join(", ")
      ), I || (I = a.slice()), I.set(a));
    }
  }
}
function Q(s = performance.now() - J) {
  const e = performance.now(), t = e - s;
  if (Y(t / 1e3), X === !0) {
    self.postMessage({ type: "shutdown_complete" }), console.log("main loop was finished"), self.close();
    return;
  }
  setTimeout(() => Q(e), 0);
}
p = m.waitingRobotType;
self.postMessage({ type: "ready" });
Q();
