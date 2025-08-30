import "./PdfViewer.css"
import { useRef, useState, type MouseEvent } from 'react';
import { pdfjs, Document, Page } from 'react-pdf';
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

  const getPage = () => {
    const input = document.getElementById("page-number")
    if (input && input instanceof HTMLInputElement)
      setPageNumber(input.valueAsNumber)
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
    <div>
      <Document ref={spanRef} className="hide-text" file={file} onLoadSuccess={onDocumentLoadSuccess}>
        <Page onClick={handleText} renderTextLayer={true} pageNumber={pageNumber} renderAnnotationLayer={true} />
      </Document>
      <button onClick={() => setPageNumber(p => Math.max(p - 1, 1))}>prev</button>
      <p>
        Page {pageNumber} of {numPages}
      </p>
      <button onClick={() => setPageNumber(p => Math.min(p + 1, 10000))}>next</button>
      <input type="number" id="page-number" />
      <button onClick={getPage}>get page</button>
      <button onClick={handlePlayPause}>play/pause</button>
    </div>
  )
}
