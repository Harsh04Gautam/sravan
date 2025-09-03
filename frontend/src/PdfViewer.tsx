import "./PdfViewer.css"
import { useEffect, useRef, useState, type MouseEvent } from 'react';
import { pdfjs, Document, Page } from 'react-pdf';
import { Prev } from './assets/Prev.tsx'
import { Next } from './assets/Next.tsx'
import { Play } from './assets/Play.tsx'
import './AnnotationLayer.css';
import './TextLayer.css';
import { useSocket } from './hooks/useSocket.ts';
import { removeHighlight } from "./utils/highlight.ts";

export const PdfViewer = ({ file }: { file: ArrayBuffer }) => {
  const numPages = useRef(0);
  const [pageNumber, setPageNumber] = useState<number>(1);
  const spanRef = useRef(null);
  const getNextPage = () => {
    play.current = false;
    setPageNumber((p) => Math.min(p + 1, numPages.current))
  }
  const pageRef = useRef<HTMLDivElement>(null);
  const { socket, sendText, play, playPause, highlightElement } = useSocket(getNextPage);

  useEffect(() => {
    highlightElement && highlightElement.current && removeHighlight(highlightElement.current)
  }, [pageNumber])

  pdfjs.GlobalWorkerOptions.workerSrc =
    new URL(
      'pdfjs-dist/build/pdf.worker.min.mjs',
      import.meta.url,
    ).toString();


  function onDocumentLoadSuccess({ numPages: n }: { numPages: number }): void {
    numPages.current = n
  }

  const handleText = (e: MouseEvent<HTMLElement>) => {
    if (!(e.target instanceof HTMLSpanElement)) return
    sendText(e.target, true)
    play.current = true;
  }

  const handlePlayPause = () => {
    if (socket.current) {
      play.current = !play.current
      playPause(play.current)
    } else {
      play.current = true;
      sendText(document.querySelector(".react-pdf__Page__textContent")?.firstChild || null, true)
    }
  }

  const handlePageRender = () => {
    play.current = true;
    sendText(document.querySelector(".react-pdf__Page__textContent")?.firstChild || null, false)
  };

  const handleNext = () => {
    socket.current?.close()
    socket.current = null;
    play.current = false;
    playPause(false);
    setPageNumber(Math.min(pageNumber + 1, numPages.current))
  }

  const handlePrev = () => {
    socket.current?.close()
    socket.current = null;
    play.current = false;
    playPause(false);
    setPageNumber(Math.max(pageNumber - 1, 1))
  }

  return (
    <div className="pdf-control-wrapper">
      <Document ref={spanRef} className="hide-text pdf-wrapper" file={file} onLoadSuccess={onDocumentLoadSuccess}>
        <Page inputRef={pageRef} onRenderTextLayerSuccess={handlePageRender} scale={1.2} onClick={handleText} className={"page-wrapper"} renderTextLayer={true} pageNumber={pageNumber} renderAnnotationLayer={true} />
      </Document>
      <div className="control-container">
        <button onClick={handlePrev}><div className="prev" ><Prev /></div></button>
        <button className="play-button" onClick={handlePlayPause}><div className="play"><Play /></div></button>
        <button onClick={handleNext}><div className="next"><Next /></div></button>
      </div>
    </div>
  )
}
