// // src/model/fragment.js

// const crypto = require('crypto');
// const data = require('./data');
// const contentType = require('content-type');

// // Hash helper (SHA-256 -> hex) lives at src/hash.js
// // Adjust the path if your project places it elsewhere.
// const hash = require('../hash');

// // ---------------------- Supported types & helpers ----------------------------

// function normalizeType(value) {
//   return String(value || '')
//     .split(';')[0]
//     .trim()
//     .toLowerCase();
// }

// function isText(type) {
//   return type.startsWith('text/');
// }

// // ------------------------------- Fragment -----------------------------------

// class Fragment {
//   /**
//    * @param {Object} params
//    * @param {string} params.ownerId  // email or user identifier (will be hashed)
//    * @param {string} params.type
//    * @param {string} [params.id]
//    * @param {Date|string} [params.created]
//    * @param {Date|string} [params.updated]
//    * @param {number} [params.size=0]
//    */
//   constructor({ ownerId, type, id, created, updated, size = 0 }) {
//     if (!ownerId) throw new Error('ownerId is required');

//     const norm = normalizeType(type);
//     if (!Fragment.isSupportedType(norm)) {
//       throw new Error(`Unsupported type: ${type}`);
//     }

//     // 🔐 Always store the hashed ownerId (privacy + matches lab expectations)
//     this.ownerId = Fragment.ownerId(ownerId);

//     this._type = norm;
//     this.id = id || Fragment.id();
//     this.created = created ? new Date(created) : new Date();
//     this.updated = updated ? new Date(updated) : new Date();

//     if (typeof size !== 'number' || size < 0) {
//       throw new Error('size must be a non-negative number');
//     }
//     this.size = size;
//   }

//   // Deterministic hash for owner identifiers (e.g., emails)
//   static ownerId(value) {
//     const v = String(value || '');
//     // If it's already a 64-char hex (sha256), use as-is to avoid double-hashing
//     if (/^[0-9a-fA-F]{64}$/.test(v)) return v;
//     return hash(v);
//   }

//   static id() {
//     return crypto.randomUUID();
//   }

//   static isSupportedType(value) {
//     if (!value) return false;
//     const { type } = contentType.parse(value);
//     const supported = ['text/plain', 'text/markdown', 'application/json'];
//     return supported.includes(type);
//   }

//   get type() {
//     return this._type;
//   }
//   set type(v) {
//     const norm = normalizeType(v);
//     if (!Fragment.isSupportedType(norm)) throw new Error(`Unsupported type: ${v}`);
//     this._type = norm;
//   }

//   get mimeType() {
//     return normalizeType(this.type);
//   }
//   get isText() {
//     return isText(this.mimeType);
//   }

//   toJSON() {
//     return {
//       id: this.id,
//       ownerId: this.ownerId, // already hashed
//       created: this.created.toISOString(),
//       updated: this.updated.toISOString(),
//       type: this.type,
//       size: this.size,
//     };
//   }

//   // IMPORTANT: your memory layer expects ONE argument: the serialized fragment
//   async save() {
//     this.updated = new Date();
//     await data.writeFragment(this.toJSON()); // ✅ one argument
//   }
//   async setData(value) {
//     let buf;

//     if (Buffer.isBuffer(value)) {
//       buf = value;
//     } else if (this.mimeType === 'application/json') {
//       // If the body was parsed to an object, serialize it properly
//       const jsonString = typeof value === 'string' ? value : JSON.stringify(value);
//       buf = Buffer.from(jsonString, 'utf-8');
//     } else {
//       // Text & others
//       buf = Buffer.from(String(value ?? ''), 'utf-8');
//     }

//     await data.writeFragmentData(this.ownerId, this.id, buf);
//     this.size = buf.length;
//     this.updated = new Date();
//     await data.writeFragment(this.toJSON());
//   }

//   async getData() {
//     return data.readFragmentData(this.ownerId, this.id);
//   }

//   // ------------------------------- Queries ----------------------------------

//   static async byId(ownerId, id) {
//     const meta = await data.readFragment(Fragment.ownerId(ownerId), id);
//     if (!meta) throw new Error('Fragment not found');
//     return new Fragment(meta);
//   }

//   static async byUser(ownerId, expand = false) {
//     const list = await data.listFragments(Fragment.ownerId(ownerId), expand);
//     // expand=false: array of ids; expand=true: array of metadata objects
//     return list;
//   }

//   static async delete(ownerId, id) {
//     if (typeof data.deleteFragment === 'function') {
//       await data.deleteFragment(Fragment.ownerId(ownerId), id);
//     }
//   }
// }

// module.exports = { Fragment, normalizeType };

// // // src/model/fragment.js

// // const crypto = require('crypto');
// // // const contentType = require('content-type');

// // // Use the data strategy wrapper so we can swap backends later (memory/AWS)
// // // If you don't have src/model/data/index.js, create it with:
// // //   module.exports = require('./memory');
// // const data = require('./data');

// // // ---------------------- Supported types & helpers ----------------------------

// // const contentType = require('content-type');

// // function normalizeType(value) {
// //   return String(value || '')
// //     .split(';')[0]
// //     .trim()
// //     .toLowerCase();
// // }

// // function isText(type) {
// //   return type.startsWith('text/');
// // }

// // // ------------------------------- Fragment -----------------------------------

// // class Fragment {
// //   /**
// //    * @param {Object} params
// //    * @param {string} params.ownerId
// //    * @param {string} params.type
// //    * @param {string} [params.id]
// //    * @param {Date|string} [params.created]
// //    * @param {Date|string} [params.updated]
// //    * @param {number} [params.size=0]
// //    */
// //   constructor({ ownerId, type, id, created, updated, size = 0 }) {
// //     if (!ownerId) throw new Error('ownerId is required');

// //     const norm = normalizeType(type);
// //     if (!Fragment.isSupportedType(norm)) {
// //       throw new Error(`Unsupported type: ${type}`);
// //     }

// //     this.ownerId = ownerId;
// //     this._type = norm;
// //     this.id = id || Fragment.id();
// //     this.created = created ? new Date(created) : new Date();
// //     this.updated = updated ? new Date(updated) : new Date();

// //     if (typeof size !== 'number' || size < 0) {
// //       throw new Error('size must be a non-negative number');
// //     }
// //     this.size = size;
// //   }

// //   static id() {
// //     return crypto.randomUUID();
// //   }
// //   static isSupportedType(value) {
// //     if (!value) return false;
// //     const { type } = contentType.parse(value);
// //     const supported = ['text/plain', 'text/markdown', 'application/json'];
// //     return supported.includes(type);
// //   }

// //   get type() {
// //     return this._type;
// //   }
// //   set type(v) {
// //     const norm = normalizeType(v);
// //     if (!Fragment.isSupportedType(norm)) throw new Error(`Unsupported type: ${v}`);
// //     this._type = norm;
// //   }

// //   get mimeType() {
// //     return normalizeType(this.type);
// //   }
// //   get isText() {
// //     return isText(this.mimeType);
// //   }

// //   toJSON() {
// //     return {
// //       id: this.id,
// //       ownerId: this.ownerId,
// //       created: this.created.toISOString(),
// //       updated: this.updated.toISOString(),
// //       type: this.type,
// //       size: this.size,
// //     };
// //   }

// //   // IMPORTANT: your memory layer expects ONE argument: the serialized fragment
// //   async save() {
// //     this.updated = new Date();
// //     await data.writeFragment(this.toJSON()); // ✅ one argument
// //   }

// //   async setData(value) {
// //     const buf = Buffer.isBuffer(value) ? value : Buffer.from(String(value) || '', 'utf-8');
// //     await data.writeFragmentData(this.ownerId, this.id, buf);
// //     this.size = buf.length;
// //     this.updated = new Date();
// //     await data.writeFragment(this.toJSON()); // ✅ one argument
// //   }

// //   async getData() {
// //     return data.readFragmentData(this.ownerId, this.id);
// //   }

// //   // ------------------------------- Queries ----------------------------------

// //   static async byId(ownerId, id) {
// //     const meta = await data.readFragment(ownerId, id);
// //     if (!meta) throw new Error('Fragment not found');
// //     return new Fragment(meta);
// //   }

// //   static async byUser(ownerId, expand = false) {
// //     const list = await data.listFragments(ownerId, expand);
// //     // Your memory layer returns:
// //     // - expand=false: array of ids
// //     // - expand=true: array of metadata objects
// //     return list;
// //   }

// //   static async delete(ownerId, id) {
// //     if (typeof data.deleteFragment === 'function') {
// //       await data.deleteFragment(ownerId, id);
// //     }
// //   }
// // }

// // module.exports = { Fragment, normalizeType };

// src/model/fragment.js
const crypto = require('crypto');
const contentType = require('content-type');
const data = require('./data');

// ---------------------- Helpers ----------------------
function normalizeType(value) {
  return String(value || '')
    .split(';')[0]
    .trim()
    .toLowerCase();
}
function isText(type) {
  return type.startsWith('text/');
}

// ---------------------- Fragment ---------------------
class Fragment {
  /**
   * @param {Object} params
   * @param {string} params.ownerId
   * @param {string} params.type
   * @param {string} [params.id]
   * @param {Date|string} [params.created]
   * @param {Date|string} [params.updated]
   * @param {number} [params.size=0]
   */
  constructor({ ownerId, type, id, created, updated, size = 0 }) {
    if (!ownerId) throw new Error('ownerId is required');

    const norm = normalizeType(type);
    if (!Fragment.isSupportedType(norm)) {
      throw new Error(`Unsupported type: ${type}`);
    }

    // ✅ Do NOT hash ownerId: tests expect the raw value (e.g., "6666")
    this.ownerId = String(ownerId);

    this._type = norm;
    this.id = id || Fragment.id();
    this.created = created ? new Date(created) : new Date();
    this.updated = updated ? new Date(updated) : new Date();

    if (typeof size !== 'number' || size < 0) {
      throw new Error('size must be a non-negative number');
    }
    this.size = size;
  }

  static id() {
    return crypto.randomUUID();
  }

  static isSupportedType(value) {
    if (!value) return false;
    const { type } = contentType.parse(value);
    const supported = ['text/plain', 'text/markdown', 'application/json'];
    return supported.includes(type);
  }

  get type() {
    return this._type;
  }
  set type(v) {
    const norm = normalizeType(v);
    if (!Fragment.isSupportedType(norm)) throw new Error(`Unsupported type: ${v}`);
    this._type = norm;
  }

  get mimeType() {
    return normalizeType(this.type);
  }
  get isText() {
    return isText(this.mimeType);
  }

  toJSON() {
    return {
      id: this.id,
      ownerId: this.ownerId, // ✅ plain ownerId (not hashed)
      created: this.created.toISOString(),
      updated: this.updated.toISOString(),
      type: this.type,
      size: this.size,
    };
  }

  // Persist metadata
  async save() {
    this.updated = new Date();
    await data.writeFragment(this.toJSON());
  }

  // Persist data and update metadata
  async setData(value) {
    let buf;

    if (Buffer.isBuffer(value)) {
      buf = value;
    } else if (this.mimeType === 'application/json') {
      const jsonString = typeof value === 'string' ? value : JSON.stringify(value);
      buf = Buffer.from(jsonString, 'utf-8');
    } else {
      buf = Buffer.from(String(value ?? ''), 'utf-8');
    }

    await data.writeFragmentData(this.ownerId, this.id, buf);
    this.size = buf.length;
    this.updated = new Date();
    await data.writeFragment(this.toJSON());
  }

  async getData() {
    return data.readFragmentData(this.ownerId, this.id);
  }

  // ---------------------- Queries ---------------------
  static async byId(ownerId, id) {
    const meta = await data.readFragment(String(ownerId), id);
    if (!meta) throw new Error('Fragment not found');
    return new Fragment(meta);
  }

  static async byUser(ownerId, expand = false) {
    return data.listFragments(String(ownerId), expand);
  }

  static async delete(ownerId, id) {
    if (typeof data.deleteFragment === 'function') {
      await data.deleteFragment(String(ownerId), id);
    }
  }
}

module.exports = { Fragment, normalizeType };
