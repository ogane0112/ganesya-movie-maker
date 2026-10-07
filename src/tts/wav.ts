// WAV（RIFF/PCM）の最小限の読み書き
export function wavSeconds(buf: Buffer): number {
  if (buf.toString("ascii", 0, 4) !== "RIFF" || buf.toString("ascii", 8, 12) !== "WAVE") {
    throw new Error("WAVファイルではありません");
  }
  let byteRate = 0;
  let offset = 12;
  while (offset + 8 <= buf.length) {
    const id = buf.toString("ascii", offset, offset + 4);
    const size = buf.readUInt32LE(offset + 4);
    if (id === "fmt ") byteRate = buf.readUInt32LE(offset + 16);
    if (id === "data") {
      if (!byteRate) throw new Error("WAVの fmt チャンクがありません");
      return size / byteRate;
    }
    offset += 8 + size + (size % 2);
  }
  throw new Error("WAVの data チャンクがありません");
}

export function silentWav(seconds: number, sampleRate = 24000): Buffer {
  const samples = Math.round(seconds * sampleRate);
  const dataSize = samples * 2;
  const buf = Buffer.alloc(44 + dataSize);
  buf.write("RIFF", 0, "ascii");
  buf.writeUInt32LE(36 + dataSize, 4);
  buf.write("WAVE", 8, "ascii");
  buf.write("fmt ", 12, "ascii");
  buf.writeUInt32LE(16, 16); // fmt チャンクサイズ
  buf.writeUInt16LE(1, 20); // PCM
  buf.writeUInt16LE(1, 22); // モノラル
  buf.writeUInt32LE(sampleRate, 24);
  buf.writeUInt32LE(sampleRate * 2, 28);
  buf.writeUInt16LE(2, 32);
  buf.writeUInt16LE(16, 34);
  buf.write("data", 36, "ascii");
  buf.writeUInt32LE(dataSize, 40);
  return buf;
}

/**
 * 16bit PCM の WAV から「口を開けている区間」を音の大きさで推定する（音素がわからない外部の読み上げ用）。
 * 20ms ごとの音量が、いちばん大きい所の 25% を超える区間を開とし、短い隙間はつなぐ
 */
export function mouthFromWav(buf: Buffer): [number, number][] {
  let rate = 24000;
  let channels = 1;
  let offset = 12;
  let data: Buffer | undefined;
  while (offset + 8 <= buf.length) {
    const id = buf.toString("ascii", offset, offset + 4);
    const size = buf.readUInt32LE(offset + 4);
    if (id === "fmt ") (channels = buf.readUInt16LE(offset + 10)), (rate = buf.readUInt32LE(offset + 12));
    if (id === "data") data = buf.subarray(offset + 8, Math.min(buf.length, offset + 8 + size));
    offset += 8 + size + (size % 2);
  }
  if (!data) return [];
  const step = Math.round(rate * 0.02);
  const samples = Math.floor(data.length / 2 / channels);
  const rms: number[] = [];
  for (let i = 0; i < samples; i += step) {
    let sum = 0;
    const n = Math.min(step, samples - i);
    for (let j = 0; j < n; j++) {
      const v = data.readInt16LE((i + j) * channels * 2) / 32768;
      sum += v * v;
    }
    rms.push(Math.sqrt(sum / n));
  }
  const peak = Math.max(0, ...rms);
  if (peak < 0.01) return [];
  const spans: [number, number][] = [];
  rms.forEach((v, i) => {
    if (v < peak * 0.25) return;
    const a = (i * step) / rate;
    const b = ((i + 1) * step) / rate;
    const last = spans[spans.length - 1];
    if (last && a - last[1] < 0.045) last[1] = b;
    else spans.push([a, b]);
  });
  const r = (x: number) => Math.round(x * 1000) / 1000;
  return spans.filter(([a, b]) => b - a >= 0.04).map(([a, b]) => [r(a), r(b)]);
}
