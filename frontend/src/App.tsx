import './App.css'
import { useState } from 'react';
import { PdfViewer } from './PdfViewer';

function App() {

  const [file, setFile] = useState<ArrayBuffer>();

  const kokoro = async () => {
    const socket = new WebSocket("ws://localhost:8000/kokoro");
    let lastTime = Date.now();

    socket.addEventListener("open", () => {
      const text = document.getElementById("input-text-kokoro")
      if (text && text instanceof HTMLInputElement)
        socket.send(text.value);
    })

    socket.addEventListener("message", async (event) => {
      const array = await event.data.arrayBuffer();
      const data = new Float32Array(array)
      const audioContext = new AudioContext();
      const audioBuffer = audioContext.createBuffer(2, data.length, 24000)

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

      lastTime = Date.now() + Math.max(lastTime - Date.now(), 0) + (audioBuffer.duration * 1000)
    })
  }

  const sendFile = async () => {
    const formData = new FormData();
    formData.append("username", "Harsh");
    formData.append("accountNum", "123456");

    const input = document.getElementById("input-file")
    if (!(input && input instanceof HTMLInputElement && input.files))
      return
    formData.append("file", input.files[0])
    const file = await input.files[0].arrayBuffer();

    setFile(file)

    const response = await fetch("http://localhost:8000/file", {
      method: "POST",
      body: formData
    });

    console.log(await response.json());
    return formData
  }

  return (
    <>
      <input type="file" id="input-file" />
      <button onClick={sendFile}>send file</button>
      <input type="text" id="input-text-kokoro" />
      <button onClick={kokoro}>get audio</button>
      {
        file && <PdfViewer file={file} />
      }
    </>
  )
}

export default App
