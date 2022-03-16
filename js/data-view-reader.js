class DataViewReader {
  constructor(dataView, littleEndian) {
    this._dataView = dataView;
    this._littleEndian = littleEndian;
    this._index = 0;
  }

  get index() {
    return this._index;
  }

  set index(value) {
    this._index = value;
  }

  get byteLength() {
    return this._dataView.byteLength;
  }

  getUint8() {
    const value = this._dataView.getUint8(this._index);
    ++this._index;
    return value;
  }

  getUint16() {
    const value = this._dataView.getUint16(this._index, this._littleEndian);
    this._index += 2;
    return value;
  }
}
