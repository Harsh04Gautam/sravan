export const getAudioSource = async (audioArray: Blob) => {
  const array = await audioArray.arrayBuffer();
  const data = new Float32Array(array);
  const audioContext = new AudioContext();
  const audioBuffer = audioContext.createBuffer(2, data.length, 24000);

  for (let channel = 0; channel < audioBuffer.numberOfChannels; channel++) {
    audioBuffer.copyToChannel(data, channel);
  }

  const source = audioContext.createBufferSource();
  source.buffer = audioBuffer;
  source.connect(audioContext.destination);
  return { source, duration: audioBuffer.duration };
};
