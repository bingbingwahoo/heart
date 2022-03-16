class HeartRateMonitor {
  constructor(callback) {
    this._callback = callback;
    this._connecting = false;
    this._server = null;
    this._bodySensorLocationCharacteristic = null;
    this._heartRateMeasurementCharacteristic = null;
    this._onHeartRateMeasurementCharacteristicValueChangedBind = null;
  }

  async connect() {
    if (this._connecting || this._server !== null) { return; }
    try {
      this._connecting = true;
      const device = await navigator.bluetooth.requestDevice({
        filters: [
          {services: ['heart_rate']}
        ]
      });
      const server = await device.gatt.connect();
      this._server = server;
      const service = await server.getPrimaryService('heart_rate');
      [
        this._bodySensorLocationCharacteristic,
        this._heartRateMeasurementCharacteristic,
      ] = await Promise.all([
        service.getCharacteristic('body_sensor_location'),
        service.getCharacteristic('heart_rate_measurement'),
      ]);
    } finally {
      this._connecting = false;
    }
  }

  disconnect() {
    if (this._server === null) { return; }
    this._server.disconnect();
    this._server = null;
    this._bodySensorLocationCharacteristic = null;
    this._heartRateMeasurementCharacteristic = null;
  }

  async getBodySensorLocation() {
    const data = await this._createCharacteristicReader(this._bodySensorLocationCharacteristic);
    switch (data.getUint8()) {
      case 0: return 'Other';
      case 1: return 'Chest';
      case 2: return 'Wrist';
      case 3: return 'Finger';
      case 4: return 'Hand';
      case 5: return 'Ear Lobe';
      case 6: return 'Foot';
      default: return 'Unknown';
    }
  }

  async start() {
    if (this._onHeartRateMeasurementCharacteristicValueChangedBind !== null) { return; }
    await this._heartRateMeasurementCharacteristic.startNotifications();
    this._onHeartRateMeasurementCharacteristicValueChangedBind = this._onHeartRateMeasurementCharacteristicValueChanged.bind(this);
    this._heartRateMeasurementCharacteristic.addEventListener('characteristicvaluechanged', this._onHeartRateMeasurementCharacteristicValueChangedBind);
  }

  async stop() {
    if (this._onHeartRateMeasurementCharacteristicValueChangedBind === null) { return; }
    this._heartRateMeasurementCharacteristic.removeEventListener('characteristicvaluechanged', this._onHeartRateMeasurementCharacteristicValueChangedBind);
    this._onHeartRateMeasurementCharacteristicValueChangedBind = null;
    await this._heartRateMeasurementCharacteristic.stopNotifications();
  }

  _onHeartRateMeasurementCharacteristicValueChanged(event) {
    const value = this._parseHeartRateMeasurement(event.target.value);
    if (typeof this._callback === 'function') {
      this._callback(value);
    }
  }

  async _createCharacteristicReader(characteristic) {
    return this._createValueReader(await characteristic.readValue());
  }

  _createValueReader(value) {
    return new DataViewReader(value.buffer ? value : new DataView(value), true);
  }

  _parseHeartRateMeasurement(value) {
    const reader = this._createValueReader(value);
    const flags = reader.getUint8();
    const heartRate = ((flags & 0x1) !== 0) ? reader.getUint16() : reader.getUint8();
    const contactDetected = ((flags & 0x4) !== 0) ? ((flags & 0x2) !== 0) : null;
    const energyExpended = ((flags & 0x8) !== 0) ? reader.getUint16() : null;
    let rrIntervals = null;
    if ((flags & 0x10) !== 0) {
      rrIntervals = [];
      while (reader.index + 2 <= reader.byteLength) {
        rrIntervals.push(reader.getUint16());
      }
    }
    return {heartRate, contactDetected, energyExpended, rrIntervals};
  }
}
