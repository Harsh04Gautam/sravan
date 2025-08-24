import './App.css'

function App() {

  const ping = async () => {
    const socket = new WebSocket("ws://localhost:8000/foo");
    let lastTime = 0;

    socket.addEventListener("open", () => {
      const text = document.getElementsByTagName("input")[0].value
      socket.send(text);
    })

    socket.addEventListener("message", async (event) => {
      const data = new Float32Array(await event.data.arrayBuffer())
      const audioContext = new AudioContext();
      const audioBuffer = audioContext.createBuffer(2, data.length, 16000)

      for (let channel = 0; channel < audioBuffer.numberOfChannels; channel++) {
        audioBuffer.copyToChannel(data, channel);
      }

      const source = audioContext.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(audioContext.destination)
      setTimeout(() => {
        source.start();
        source.stop
      }, lastTime - Date.now())
      lastTime = Date.now() - lastTime + (audioBuffer.duration * 1000)
    })
  }

  return (
    <>
      <input type="text" />
      <button onClick={ping}>get audio</button>
    </>
  )
}

export default App
