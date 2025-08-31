import "./PdfViewer.css"
import { useRef, useState, type MouseEvent } from 'react';
import { pdfjs, Document, Page } from 'react-pdf';
import { Prev } from './assets/Prev.tsx'
import { Next } from './assets/Next.tsx'
import { Play } from './assets/Play.tsx'
import './AnnotationLayer.css';
import './TextLayer.css';
import { useSocket } from './hooks/useSocket.ts';

export const PdfViewer = ({ file }: { file: ArrayBuffer }) => {
  const [numPages, setNumPages] = useState<number>();
  const [pageNumber, setPageNumber] = useState<number>(1);
  const spanRef = useRef(null);
  const { sendText, play, playPause } = useSocket();

  pdfjs.GlobalWorkerOptions.workerSrc =
    new URL(
      'pdfjs-dist/build/pdf.worker.min.mjs',
      import.meta.url,
    ).toString();

  function onDocumentLoadSuccess({ numPages }: { numPages: number }): void {
    setNumPages(() => numPages);
  }

  const handleText = (e: MouseEvent<HTMLElement>) => {
    if (!(e.target instanceof HTMLSpanElement)) return
    sendText(e.target, true)
    play.current = true;
  }

  const handlePlayPause = () => {
    play.current = !play.current
    playPause(play.current)
  }

  return (
    <div className="pdf-control-wrapper">
      <Document ref={spanRef} className="hide-text pdf-wrapper" file={file} onLoadSuccess={onDocumentLoadSuccess}>
        <Page scale={1.2} onClick={handleText} className={"page-wrapper"} renderTextLayer={true} pageNumber={pageNumber} renderAnnotationLayer={true} />
      </Document>
      <div className="control-container">
        <button onClick={() => setPageNumber(p => Math.max(p - 1, 1))}><div className="prev" ><Prev /></div></button>
        <button className="play-button" onClick={handlePlayPause}><div className="play"><Play /></div></button>
        <button onClick={() => setPageNumber(p => Math.min(p + 1, 10000))}><div className="next"><Next /></div></button>
      </div>

    </div>
  )
}
