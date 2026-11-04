/**
 * Smartwatch heart-rate linking via Web Bluetooth (standard Heart Rate Service).
 *
 * Most wrist wearables (Polar, Garmin, Fitbit, Mi Band, Apple Watch in
 * third-party apps) broadcast the Bluetooth SIG Heart Rate Service
 * (0x180D) with a Heart Rate Measurement characteristic (0x2A37). This
 * module connects over Web Bluetooth and parses the live bpm stream — no
 * vendor SDK, no cloud, no account. It is the real-sensor counterpart to the
 * Pulse Lab's simulated PPG: students see their *actual* pulse while they
 * play, and the Pulse Lab teaches why the wrist optics read it that way.
 *
 * Reality of support: Web Bluetooth ships in Chromium (Chrome/Edge/Android).
 * It is NOT in Safari or Firefox, and it needs a secure context (https or
 * localhost). `isHeartRateSupported()` reports this honestly so the UI can
 * fall back to the camera-only motion readout instead of pretending a watch
 * is connected.
 */

export interface HeartRateReading {
  bpm: number;
  /** True when the measurement carries RR-interval data (beat-to-beat ms). */
  hasRR: boolean;
  rrIntervalsMs: number[];
  at: number;
}

export interface HeartRateConnection {
  deviceName: string;
  disconnect(): void;
  readonly connected: boolean;
}

const HEART_RATE_SERVICE = 0x180d;
const HEART_RATE_MEASUREMENT = 0x2a37;

/** Web Bluetooth availability + Heart Rate support, honestly reported. */
export function isHeartRateSupported(): boolean {
  return (
    typeof navigator !== 'undefined' &&
    'bluetooth' in navigator &&
    typeof (navigator as any).bluetooth?.getAvailability === 'function' &&
    typeof window !== 'undefined' &&
    window.isSecureContext
  );
}

/** Parse a Heart Rate Measurement (0x2A37) value into a reading. */
function parseHeartRate(value: DataView): HeartRateReading {
  const flags = value.getUint8(0);
  const is16bit = (flags & 0x01) !== 0;
  const hasContact = (flags & 0x04) !== 0;
  const hasRR = (flags & 0x10) !== 0;
  let offset = 1;
  const bpm = is16bit ? value.getUint16(offset, true) : value.getUint8(offset);
  offset += is16bit ? 2 : 1;
  if (hasContact) offset += 2; // skip sensor-contact status
  const rrIntervalsMs: number[] = [];
  if (hasRR) {
    while (offset + 1 < value.byteLength) {
      rrIntervalsMs.push(value.getUint16(offset, true) * (1000 / 1024));
      offset += 2;
    }
  }
  return { bpm, hasRR, rrIntervalsMs, at: Date.now() };
}

/**
 * Connect to a nearby heart-rate wearable and subscribe to its bpm stream.
 * Opens the browser's device-picker; resolves once notifications start.
 * `onReading` fires per beat (typically ~1 Hz). Rejects with a readable
 * error if the user cancels, the device lacks the service, or BT is off.
 */
export async function connectHeartRate(
  onReading: (r: HeartRateReading) => void,
  onDisconnect?: () => void
): Promise<HeartRateConnection> {
  const bluetooth = (navigator as any).bluetooth;
  if (!bluetooth) throw new Error('Web Bluetooth is not available in this browser.');

  const device = await bluetooth.requestDevice({
    filters: [{ services: [HEART_RATE_SERVICE] }],
    optionalServices: [HEART_RATE_SERVICE],
  });
  if (!device.gatt) throw new Error('This device does not expose a Bluetooth GATT server.');

  const server = await device.gatt.connect();
  const service = await server.getPrimaryService(HEART_RATE_SERVICE);
  const characteristic = await service.getCharacteristic(HEART_RATE_MEASUREMENT);

  const listener = (event: Event) => {
    const target = event.target as unknown as { value: DataView };
    onReading(parseHeartRate(target.value));
  };
  characteristic.addEventListener('characteristicvaluechanged', listener);
  await characteristic.startNotifications();

  const connection: HeartRateConnection = {
    deviceName: device.name || 'Heart-rate wearable',
    get connected() {
      return device.gatt?.connected ?? false;
    },
    disconnect() {
      try {
        characteristic.removeEventListener('characteristicvaluechanged', listener);
      } catch { /* already removed */ }
      if (device.gatt?.connected) device.gatt.disconnect();
    },
  };

  device.addEventListener('gattserverdisconnected', () => {
    onDisconnect?.();
  });

  return connection;
}
