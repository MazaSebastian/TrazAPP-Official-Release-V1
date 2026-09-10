/**
 * audioConverter.ts
 * Utility to convert browser recorded audio Blobs (webm, mp4, etc.)
 * to 16kHz 16-bit Mono WAV format natively using Web Audio API.
 * Optimized for hardware playback on microcontrollers (ESP-32 I2S DACs).
 */

export async function convertBlobTo16kHzWav(audioBlob: Blob): Promise<Blob> {
    const arrayBuffer = await audioBlob.arrayBuffer();
    const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
    
    // Decode compressed audio data (webm/ogg/mp4)
    const audioBuffer = await audioCtx.decodeAudioData(arrayBuffer);

    // Target sample rate for ESP32 I2S DAC: 16000 Hz Mono
    const targetSampleRate = 16000;
    const numberOfChannels = 1; // Mono
    const frameCount = Math.ceil(audioBuffer.duration * targetSampleRate);

    // Resample using OfflineAudioContext
    const offlineCtx = new OfflineAudioContext(
        numberOfChannels,
        frameCount,
        targetSampleRate
    );

    const source = offlineCtx.createBufferSource();
    source.buffer = audioBuffer;
    source.connect(offlineCtx.destination);
    source.start(0);

    const renderedBuffer = await offlineCtx.startRendering();
    const channelData = renderedBuffer.getChannelData(0);

    // Build 16-bit PCM WAV ArrayBuffer
    const wavBuffer = createWavBuffer(channelData, targetSampleRate);
    
    // Close audio context to free browser memory
    await audioCtx.close();

    return new Blob([wavBuffer], { type: 'audio/wav' });
}

function createWavBuffer(samples: Float32Array, sampleRate: number): ArrayBuffer {
    const buffer = new ArrayBuffer(44 + samples.length * 2);
    const view = new DataView(buffer);

    // RIFF identifier
    writeString(view, 0, 'RIFF');
    // RIFF chunk length
    view.setUint32(4, 36 + samples.length * 2, true);
    // RIFF type
    writeString(view, 8, 'WAVE');
    // format chunk identifier
    writeString(view, 12, 'fmt ');
    // format chunk length
    view.setUint32(16, 16, true); // Subchunk1Size (16 for PCM)
    // sample format (1 = PCM)
    view.setUint16(20, 1, true);
    // channel count (1 = Mono)
    view.setUint16(22, 1, true);
    // sample rate
    view.setUint32(24, sampleRate, true);
    // byte rate (sampleRate * 1 channel * 2 bytes)
    view.setUint32(28, sampleRate * 2, true);
    // block align (1 channel * 2 bytes)
    view.setUint16(32, 2, true);
    // bits per sample
    view.setUint16(34, 16, true);
    // data chunk identifier
    writeString(view, 36, 'data');
    // data chunk length
    view.setUint32(40, samples.length * 2, true);

    // Write PCM 16-bit samples
    let offset = 44;
    for (let i = 0; i < samples.length; i++, offset += 2) {
        const s = Math.max(-1, Math.min(1, samples[i]));
        view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7FFF, true);
    }

    return buffer;
}

function writeString(view: DataView, offset: number, string: string) {
    for (let i = 0; i < string.length; i++) {
        view.setUint8(offset + i, string.charCodeAt(i));
    }
}
