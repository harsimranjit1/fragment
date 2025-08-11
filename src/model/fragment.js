const { randomUUID } = require('crypto');
const contentType = require('content-type');

// Import database helper functions
const {
  readFragment,
  writeFragment,
  readFragmentData,
  writeFragmentData,
  listFragments,
  deleteFragment,
} = require('./data/memory');

class Fragment {
  constructor({ id, ownerId, created, updated, type, size = 0 }) {
    // Validate required fields
    if (!ownerId) throw new Error('ownerId is required');
    if (!type) throw new Error('type is required');
    if (!Fragment.isSupportedType(type)) throw new Error(`Unsupported type: ${type}`);
    if (typeof size !== 'number' || size < 0) throw new Error('Size must be a non-negative number');

    this.id = id || randomUUID();
    this.ownerId = ownerId;
    this.created = created || new Date().toISOString();
    this.updated = updated || new Date().toISOString();
    this.type = type;
    this.size = size;
  }

  /**
   * Get all fragments for a user
   */
  static async byUser(ownerId, expand = false) {
    const fragments = await listFragments(ownerId);
    if (!fragments || fragments.length === 0) return [];

    if (expand) {
      return Promise.all(fragments.map((f) => this.byId(ownerId, f)));
    }
    return fragments;
  }

  /**
   * Get a fragment by user and id
   */
  static async byId(ownerId, id) {
    const data = await readFragment(ownerId, id);
    if (!data) throw new Error(`Fragment ${id} not found`);
    return new Fragment(data);
  }

  /**
   * Delete fragment metadata and data
   */
  static async delete(ownerId, id) {
    await deleteFragment(ownerId, id);
  }

  /**
   * Save metadata
   */
  async save() {
    this.updated = new Date().toISOString();
    await writeFragment(this);
  }

  /**
   * Get data
   */
  async getData() {
    const data = await readFragmentData(this.ownerId, this.id);
    return data;
  }

  /**
   * Set data and update size and timestamp
   */
  async setData(data) {
    if (!Buffer.isBuffer(data)) throw new Error('Data must be a Buffer');
    await writeFragmentData(this.ownerId, this.id, data);
    this.size = data.length;
    this.updated = new Date().toISOString();
    await this.save();
  }

  /**
   * Return mime type only
   */
  get mimeType() {
    const { type } = contentType.parse(this.type);
    return type;
  }

  /**
   * Return true if text/*
   */
  get isText() {
    return this.mimeType.startsWith('text/');
  }

  /**
   * Supported output formats for this fragment type
   */
  get formats() {
    if (this.mimeType === 'text/plain') return ['text/plain'];
    return [this.mimeType];
  }

  /**
   * Validate supported types
   */
  static isSupportedType(value) {
    if (!value) return false;
    const { type } = contentType.parse(value);
    const supported = ['text/plain']; // extend later
    return supported.includes(type);
  }
}

module.exports.Fragment = Fragment;
