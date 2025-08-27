import './App.css'
import { useState } from 'react';
import { PdfViewer } from './PdfViewer';

function App() {

  const [file, setFile] = useState<ArrayBuffer>();

  const uploadFile = async (e: React.FormEvent<HTMLInputElement>) => {
    if (!(e.target instanceof HTMLInputElement && e.target.files)) return
    const file = await e.target.files[0].arrayBuffer()
    setFile(file)
  }

  return (
    <>
      <div>
        <div>
          Logo Sravan
        </div>
        <div>
          <div>Upload new</div>
          <div>
            Search
          </div>
          <div>
            History
          </div>
        </div>
      </div>
      <input onInput={uploadFile} type="file" id="input-file" />
      {
        file && <PdfViewer file={file} />
      }
    </>
  )
}

export default App
