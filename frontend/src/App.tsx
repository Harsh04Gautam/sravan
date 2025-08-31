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

  // <aside className="sidebar">
  //   <div className="logo">SRAVAN</div>
  //
  //   <div className="section">
  //     <button className="menu-item">Upload new</button>
  //   </div>
  //
  //   {/* Search */}
  //   <div className="section">
  //     <button className="menu-item">Search Readings</button>
  //   </div>
  //
  //   {/* History */}
  //   <div className="section">
  //     <h3 className="section-title">History</h3>
  //     <div className="history-list">
  //       <div className="history-item">
  //         <span className="history-date">12.05.2024</span>
  //         <span className="history-title">SRAVAN</span>
  //       </div>
  //       <div className="history-item">
  //         <span className="history-date">11.20.2024</span>
  //         <span className="history-title">The C Programming ...</span>
  //       </div>
  //       <div className="history-item">
  //         <span className="history-date">11.13.2024</span>
  //         <span className="history-title">Attention is all You need</span>
  //       </div>
  //       <div className="history-item">
  //         <span className="history-date">10.23.2024</span>
  //         <span className="history-title">Operating Systems</span>
  //       </div>
  //     </div>
  //   </div>
  //
  //   <footer className="sidebar-footer">
  //     <p>© 2025 Built by Harsh Gautam</p>
  //   </footer>
  // </aside>
  return (
    <>
      <div className="layout">

        {/* Main Content */}
        <main className="content">
          <div className="pdf-view">
            {!file &&
              <div>
                <h1>What are we reading today?</h1>
                <div className="input-wrapper">
                  <input onInput={uploadFile} type="file" required id="input-file" className="input-file" />
                </div>
              </div>}
            {
              file && <PdfViewer file={file} />
            }
          </div>
          <div className="bottom-text">
            <p>One page a day keeps the boredom away.</p>
          </div>
        </main>
      </div>
    </>
  )
}

export default App
