class K {
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
function ne(s) {
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
function se(s, e, t) {
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
const oe = new TextEncoder(), re = 50;
function le(s, e, t) {
  oe.encodeInto(s, e.subarray(t));
}
function ae(s, e, t) {
  s.length > re ? le(s, e, t) : se(s, e, t);
}
new TextDecoder();
class B {
  constructor(e, t) {
    this.type = e, this.data = t;
  }
}
class R extends Error {
  constructor(e) {
    super(e);
    const t = Object.create(R.prototype);
    Object.setPrototypeOf(this, t), Object.defineProperty(this, "name", {
      configurable: !0,
      enumerable: !1,
      value: R.name
    });
  }
}
function ce(s, e, t) {
  const i = t / 4294967296, n = t;
  s.setUint32(e, i), s.setUint32(e + 4, n);
}
function Y(s, e, t) {
  const i = Math.floor(t / 4294967296), n = t;
  s.setUint32(e, i), s.setUint32(e + 4, n);
}
function fe(s, e) {
  const t = s.getInt32(e), i = s.getUint32(e + 4);
  return t * 4294967296 + i;
}
const he = -1, de = 4294967296 - 1, ue = 17179869184 - 1;
function we({ sec: s, nsec: e }) {
  if (s >= 0 && e >= 0 && s <= ue)
    if (e === 0 && s <= de) {
      const t = new Uint8Array(4);
      return new DataView(t.buffer).setUint32(0, s), t;
    } else {
      const t = s / 4294967296, i = s & 4294967295, n = new Uint8Array(8), r = new DataView(n.buffer);
      return r.setUint32(0, e << 2 | t & 3), r.setUint32(4, i), n;
    }
  else {
    const t = new Uint8Array(12), i = new DataView(t.buffer);
    return i.setUint32(0, e), Y(i, 4, s), t;
  }
}
function ge(s) {
  const e = s.getTime(), t = Math.floor(e / 1e3), i = (e - t * 1e3) * 1e6, n = Math.floor(i / 1e9);
  return {
    sec: t + n,
    nsec: i - n * 1e9
  };
}
function xe(s) {
  if (s instanceof Date) {
    const e = ge(s);
    return we(e);
  } else
    return null;
}
function me(s) {
  const e = new DataView(s.buffer, s.byteOffset, s.byteLength);
  switch (s.byteLength) {
    case 4:
      return { sec: e.getUint32(0), nsec: 0 };
    case 8: {
      const t = e.getUint32(0), i = e.getUint32(4), n = (t & 3) * 4294967296 + i, r = t >>> 2;
      return { sec: n, nsec: r };
    }
    case 12: {
      const t = fe(e, 4), i = e.getUint32(0);
      return { sec: t, nsec: i };
    }
    default:
      throw new R(`Unrecognized data size for timestamp (expected 4, 8, or 12): ${s.length}`);
  }
}
function pe(s) {
  const e = me(s);
  return new Date(e.sec * 1e3 + e.nsec / 1e6);
}
const ye = {
  type: he,
  encode: xe,
  decode: pe
};
class O {
  constructor() {
    this.builtInEncoders = [], this.builtInDecoders = [], this.encoders = [], this.decoders = [], this.register(ye);
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
          return new B(o, r);
        }
      }
    }
    for (let i = 0; i < this.encoders.length; i++) {
      const n = this.encoders[i];
      if (n != null) {
        const r = n(e, t);
        if (r != null) {
          const o = i;
          return new B(o, r);
        }
      }
    }
    return e instanceof B ? e : null;
  }
  decode(e, t, i) {
    const n = t < 0 ? this.builtInDecoders[-1 - t] : this.decoders[t];
    return n ? n(e, t, i) : new B(t, e);
  }
}
O.defaultCodec = new O();
function Ue(s) {
  return s instanceof ArrayBuffer || typeof SharedArrayBuffer < "u" && s instanceof SharedArrayBuffer;
}
function Se(s) {
  return s instanceof Uint8Array ? s : ArrayBuffer.isView(s) ? new Uint8Array(s.buffer, s.byteOffset, s.byteLength) : Ue(s) ? new Uint8Array(s) : Uint8Array.from(s);
}
const Ee = 100, ve = 2048;
class $ {
  constructor(e) {
    this.entered = !1, this.extensionCodec = e?.extensionCodec ?? O.defaultCodec, this.context = e?.context, this.useBigInt64 = e?.useBigInt64 ?? !1, this.maxDepth = e?.maxDepth ?? Ee, this.initialBufferSize = e?.initialBufferSize ?? ve, this.sortKeys = e?.sortKeys ?? !1, this.forceFloat32 = e?.forceFloat32 ?? !1, this.ignoreUndefined = e?.ignoreUndefined ?? !1, this.forceIntegerToFloat = e?.forceIntegerToFloat ?? !1, this.pos = 0, this.view = new DataView(new ArrayBuffer(this.initialBufferSize)), this.bytes = new Uint8Array(this.view.buffer);
  }
  clone() {
    return new $({
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
    const i = ne(e);
    this.ensureBufferSizeToWrite(5 + i), this.writeStringHeader(i), ae(e, this.bytes, this.pos), this.pos += i;
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
    const i = Se(e);
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
    this.ensureBufferSizeToWrite(8), ce(this.view, this.pos, e), this.pos += 8;
  }
  writeI64(e) {
    this.ensureBufferSizeToWrite(8), Y(this.view, this.pos, e), this.pos += 8;
  }
  writeBigUint64(e) {
    this.ensureBufferSizeToWrite(8), this.view.setBigUint64(this.pos, e), this.pos += 8;
  }
  writeBigInt64(e) {
    this.ensureBufferSizeToWrite(8), this.view.setBigInt64(this.pos, e), this.pos += 8;
  }
}
function Q(s, e) {
  return new $(e).encodeSharedRef(s);
}
const p = Object.freeze({
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
let y = p.initializing, g = x.dormant;
console.log("Now intended to import ModuleFactory");
const b = await import("/wasm/slrm_module.js"), Ne = await import("/wasm/cd_module.js");
console.log("ModuleFactory: ", b);
console.log("ModuleFactory.default type:", typeof b.default);
if (typeof b.default != "function")
  throw console.error("ModuleFactory.default is not a function:", b.default), new Error("ModuleFactory.default is not a valid function");
const d = await b.default();
if (!d)
  throw console.error("Failed to load SlrmModule"), new Error("SlrmModule could not be loaded");
const T = await Ne.default();
if (!T)
  throw console.error("Failed to load CdModule"), new Error("CdModule could not be loaded");
const _ = {
  [d.CmdVelGeneratorStatus.OK.value]: "OK",
  [d.CmdVelGeneratorStatus.ERROR.value]: "ERROR",
  [d.CmdVelGeneratorStatus.END.value]: "END",
  [d.CmdVelGeneratorStatus.SINGULARITY.value]: "SINGULARITY",
  [d.CmdVelGeneratorStatus.REWIND.value]: "REWIND"
}, Z = 4, q = 0n / BigInt(Z);
let V = null, G = 0n, L = null, I = null, a = null, k = null, E = null, N = null;
const F = [], D = [];
let u = null, U = null, C = null, j = null, M = !1;
function Te(s) {
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
function Ie(s) {
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
let ee = !1, w = null, P = null, W = [], A = null;
function H(s) {
  A = s, w = new WebSocket(A), w.onopen = () => {
    for (console.log("WebSocket connected"); W.length > 0; )
      w.send(W.shift());
  }, w.onclose = (e) => {
    console.log("webSocket closed, will retry...", e.code, e.reason), Me();
  }, w.onerror = (e) => {
    console.error("WebSocket error", e), w.close();
  };
}
function Me() {
  P || (P = setTimeout(() => {
    P = null, A && (console.log("Reconnecting..."), H(A));
  }, 3e3));
}
function X(s, e) {
  function t(o, l) {
    const c = new o.DoubleVector();
    for (let f = 0; f < l.length; ++f)
      c.push_back(l[f]);
    return c;
  }
  function i(o, l) {
    const c = new o.JointModelFlatStructVector();
    for (let f = 0; f < l.length; ++f)
      c.push_back(l[f]);
    return c;
  }
  const n = e.map((o) => {
    const l = o.origin.$.xyz ?? [NaN, NaN, NaN], c = t(
      s,
      Array.isArray(l) && l.length === 3 ? l : [NaN, NaN, NaN]
    ), f = o.origin.$.rpy ?? [NaN, NaN, NaN], h = t(
      s,
      Array.isArray(f) && f.length === 3 ? f : [NaN, NaN, NaN]
    ), v = o.axis.$.xyz ?? [NaN, NaN, NaN], m = t(
      s,
      Array.isArray(v) && v.length === 3 ? v : [NaN, NaN, NaN]
    ), S = new s.JointModelFlatStruct(m, c, h);
    return m.delete(), c.delete(), h.delete(), S;
  });
  return { jointModelVector: i(s, n), jointModelsArray: n };
}
console.log("now setting onmessage");
self.onmessage = function(s) {
  const e = s.data;
  switch (e.type) {
    case "shutdown":
      w && (w.close(), w = null), d && d.delete(), self.postMessage({ type: "shutdown_complete" }), ee = !0;
      break;
    case "init":
      if (y === p.waitingRobotType) {
        y = p.generatorMaking, console.log("constructing CmdVelGenerator with :", e.filename);
        const { makeDoubleVector: t } = Te(d), { makeCdDoubleVector: i, makeConvexShape: n } = Ie(T);
        C = t, j = i, d.setJsLogLevel(2), fetch(e.filename).then((r) => r.json()).then((r) => {
          const o = r.filter((h) => h.$.type === "revolute"), {
            jointModelVector: l,
            jointModelsArray: c
          } = X(d, o);
          if (console.log("type of SlrmModule.CmdVelGen: " + typeof d.CmdVelGenerator), u = new d.CmdVelGenerator(l), console.log("type of jointModels is ", typeof jointModels), c.forEach((h) => h.delete()), l.delete(), u == null) {
            console.error("generation of CmdVelGen instance failed"), u = null;
            return;
          }
          u != null && console.log("CmdVelGen instance created:", u), o.forEach((h) => {
            F.push(h.limit.$.upper), D.push(h.limit.$.lower);
          }), console.log("jointLimits: ", F, D), console.log("Status Definitions: OK:" + d.CmdVelGeneratorStatus.OK.value + ", ERROR:" + d.CmdVelGeneratorStatus.ERROR.value + ", END:" + d.CmdVelGeneratorStatus.END.value), u.setExactSolution(M), u.setLinearVelocityLimit(10), u.setAngularVelocityLimit(2 * Math.PI), u.setAngularGain(20), u.setLinearGain(20);
          const f = t(Array(o.length).fill(Math.PI * 2));
          if (u.setJointVelocityLimit(f), f.delete(), e.linkShapes) {
            T.setJsLogLevel(2);
            const {
              jointModelVector: h,
              jointModelsArray: v
            } = X(T, o), m = i([0, 0, 0]), S = i([1, 0, 0, 0]);
            U = new T.CollisionDetection(
              h,
              m,
              S
            ), h.delete(), v.forEach((z) => z.delete()), m.delete(), S.delete();
          }
          U && fetch(e.linkShapes).then((h) => h.json()).then((h) => {
            if (h.length !== o.length + 2) {
              console.error("リンク形状定義の数がリンクモデルの数(+2)と一致しません。");
              return;
            }
            console.log("linkShapes.length: ", h.length);
            for (let m = 0; m < h.length; ++m) {
              const S = new T.ConvexShapeVector();
              for (const z of h[m]) {
                const J = n(z);
                S.push_back(J), J.delete();
              }
              U.addLinkShape(m, S), S.delete();
            }
            console.log("setting up of link shapes is finished"), U.infoLinkShapes();
            const v = [
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
            U.clearTestPairs();
            for (const m of v)
              U.addTestPair(m[0], m[1]);
          }).catch((h) => {
            console.error("Error fetching or parsing SHAPE file:", h);
          }), e.bridgeUrl && (console.log("recieve bridge URL: ", e.bridgeUrl), H(e.bridgeUrl)), y = p.generatorReady, self.postMessage({ type: "generator_ready" });
        }).catch((r) => {
          console.error("Error fetching or parsing URDF.JSON file:", r);
        });
      }
      break;
    case "set_initial_joints":
      (y === p.generatorReady || y === p.slrmReady) && e.joints && (a = new Float64Array(e.joints.length), a.set(e.joints), L = a.slice(), k = a.slice(), E = new Float64Array(a.length), console.log("Setting initial joints:" + a.map((t) => (t * 57.2958).toFixed(1)).join(", ")), (!I || a.length !== I.length) && (I = Array(a.length).fill(null).map((t, i) => i <= 1 ? new K(5, 1, 0.2, 0.02) : new K(5, 1, 1, 0.0625))), I.forEach((t, i) => {
        t.reset(), t.setX0(L[i]);
      }), y = p.slrmReady, V = [], g = x.moving, console.log("Worker state changed to slrmReady"));
      break;
    case "destination":
      y === p.slrmReady && e.endLinkPose && (V = [...e.endLinkPose], g = x.moving);
      break;
    case "slow_rewind":
      y === p.slrmReady && a && L && I && (e.slowRewind == !0 ? g = x.rewinding : g = x.converged);
      break;
    case "set_end_effector_point":
      if (e.endEffectorPoint && C && e.endEffectorPoint.length === 3 && typeof e.endEffectorPoint[0] == "number" && typeof e.endEffectorPoint[1] == "number" && typeof e.endEffectorPoint[2] == "number") {
        console.debug("Setting end effector point: ", e.endEffectorPoint);
        const t = C(e.endEffectorPoint);
        u.setEndEffectorPosition(t), t.delete();
        const i = g;
        g = x.moving, V = [], te(0), g = i;
      }
      break;
    case "set_exact_solution":
      (y === p.generatorReady || y === p.slrmReady) && e.exactSolution !== void 0 && (e.exactSolution === !0 ? M = !0 : M = !1, u.setExactSolution(M), console.log("Exact solution for singularity set to: ", M));
      break;
  }
};
function te(s) {
  let e = null, t = null, i = null, n = null;
  if (!(!u || !a)) {
    if (y === p.slrmReady && (g === x.moving || g === x.rewinding)) {
      if (g === x.rewinding) {
        const c = I.map((f, h) => f.calcNext(a[h], E[h], s));
        for (let f = 0; f < a.length; f++)
          a[f] = c[f].x, E[f] = c[f].v;
        if (w) {
          const f = {
            topic: "actuator1",
            javascriptStamp: Date.now(),
            header: {},
            position: [...a],
            velocity: [...E],
            normalized: []
          }, h = Q(f);
          w.readyState === WebSocket.OPEN ? w.send(h) : A && (console.log("Not connected, queueing message"), W.push(f), (!w || w.readyState === WebSocket.CLOSED) && H(A));
        }
        V = [];
      } else g === x.converged && E.fill(0);
      if (V === null)
        return;
      const r = C(a), o = C(V), l = u.calcVelocityPQ(r, o);
      if (r.delete(), o.delete(), g !== x.rewinding)
        for (let c = 0; c < E.length; c++)
          E[c] = l.joint_velocities.get(c);
      if (l.joint_velocities.delete(), e = l.status, t = l.other, (!i || !n) && (i = new Float64Array(3), n = new Float64Array(4)), i[0] = l.position.get(0), i[1] = l.position.get(1), i[2] = l.position.get(2), n[0] = l.quaternion.get(0), n[1] = l.quaternion.get(1), n[2] = l.quaternion.get(2), n[3] = l.quaternion.get(3), l.position.delete(), l.quaternion.delete(), g === x.rewinding && l.status.value !== d.CmdVelGeneratorStatus.END.value && l.status.value !== d.CmdVelGeneratorStatus.OK.value && console.warn("CmdVelGenerator returned status other than END or OK during rewinding:", _[l.status.value]), g === x.moving)
        switch (l.status.value) {
          case d.CmdVelGeneratorStatus.OK.value:
            k.set(a);
            for (let c = 0; c < a.length; c++)
              a[c] = a[c] + E[c] * s;
            if (U) {
              const c = j(a);
              U.calcFk(c), c.delete(), U.testCollisionPairs().size() !== 0 && a.set(k);
            }
            break;
          case d.CmdVelGeneratorStatus.END.value:
            g = x.converged;
            break;
          case d.CmdVelGeneratorStatus.SINGULARITY.value:
            console.error("CmdVelGenerator returned SINGULARITY status");
            break;
          case d.CmdVelGeneratorStatus.REWIND.value:
            a.set(k);
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
        a[o] > F[o] && (r[o] = 1, a[o] = F[o] - 1e-3), a[o] < D[o] && (r[o] = -1, a[o] = D[o] + 1e-3);
      self.postMessage({ type: "joints", joints: [...a] }), self.postMessage({
        type: "status",
        status: _[e.value],
        exact_solution: M,
        condition_number: t.condition_number,
        manipulability: t.manipulability,
        sensitivity_scale: t.sensitivity_scale,
        limit_flag: r
      }), self.postMessage({
        type: "pose",
        position: i,
        quaternion: n
      }), G++, q !== 0n && G % q === 0n && (N !== null && a !== null && N.length === a.length && Math.max(...N.map((o, l) => Math.abs(o - a[l]))) > 5e-3 && console.log(
        "counter:",
        G,
        "status: ",
        _[e.value],
        " condition:",
        t.condition_number.toFixed(2),
        " m:",
        t.manipulability.toFixed(3),
        " k:",
        t.sensitivity_scale.toFixed(3) + `
limit flags: ` + r.join(", ")
      ), N || (N = a.slice()), N.set(a));
    }
  }
}
function ie(s = performance.now() - Z) {
  const e = performance.now(), t = e - s;
  if (te(t / 1e3), ee === !0) {
    self.postMessage({ type: "shutdown_complete" }), console.log("main loop was finished"), self.close();
    return;
  }
  if (w) {
    const n = performance.now() - e, r = Math.floor(n / 1e3), o = Math.floor((n - r * 1e3) * 1e6), l = {
      topic: "timeRef",
      javascriptStamp: Date.now(),
      header: { frame_id: "none" },
      time_ref: {
        sec: r,
        nanosec: o
      },
      source: "slrm_and_cd"
    }, c = Q(l);
    w.readyState === WebSocket.OPEN && w.send(c);
  }
  setTimeout(() => ie(e), 0);
}
y = p.waitingRobotType;
self.postMessage({ type: "ready" });
ie();
