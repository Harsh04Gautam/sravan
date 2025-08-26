import { useEffect, useState, useRef } from "react";

export const useSocket = () => {
  const [socket, setSocket] = useState<WebSocket>();
  const spanRef = useRef<HTMLElement>(null);
  let ranges = useRef<[Range[]]>(null);

  useEffect(() => {
    const s = new WebSocket("ws://localhost:8000/kokoro");
    let lastTime = Date.now();
    s.addEventListener("message", async (event) => {
      const array = await event.data.arrayBuffer();
      const data = new Float32Array(array);
      const audioContext = new AudioContext();
      const audioBuffer = audioContext.createBuffer(2, data.length, 24000);

      for (let channel = 0; channel < audioBuffer.numberOfChannels; channel++) {
        audioBuffer.copyToChannel(data, channel);
      }

      const source = audioContext.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(audioContext.destination);
      setTimeout(() => {
        if (ranges.current && ranges.current?.length > 0) {
          const currentRange = ranges.current.shift();
          if (currentRange) {
            const searchResultsHighlight = new Highlight(
              ...currentRange.flat(),
            );
            CSS.highlights.set("search-results", searchResultsHighlight);
          }
        }

        source.start();
        source.stop;
        CSS.highlights.clear();
      }, lastTime - Date.now());

      lastTime =
        Date.now() +
        Math.max(lastTime - Date.now(), 0) +
        audioBuffer.duration * 1000;
    });
    setSocket(s);

    return () => {
      socket?.close();
    };
  }, []);

  const highlight = (spanRef: React.RefObject<HTMLElement | null>) => {
    CSS.highlights.clear();

    if (!spanRef.current) return;
    const allTextNodes = [];
    let i = 0;
    while (spanRef.current && i < 5) {
      const treeWalker = document.createTreeWalker(
        spanRef.current,
        NodeFilter.SHOW_TEXT,
      );
      let currentNode = treeWalker.nextNode();
      while (currentNode) {
        allTextNodes.push(currentNode);
        currentNode = treeWalker.nextNode();
      }
      if (spanRef.current instanceof HTMLBRElement) {
        i++;
      }
      spanRef.current = spanRef.current?.nextSibling as HTMLElement;
    }

    let str = ".";
    if (allTextNodes.length < 0) return;

    let rn = [[]] as [Range[]];
    let range_num = 0;
    allTextNodes
      .map((el) => ({ el, text: el?.textContent?.toLowerCase() }))
      .map(({ text, el }) => {
        if (!(text && el.textContent)) return;
        let startPos = 0;
        while (startPos < text.length) {
          const index = text.indexOf(str, startPos);
          if (index === -1) {
            const range = new Range();
            range.setStart(el, startPos);
            range.setEnd(el, el.textContent?.length);
            rn[range_num].push(range);
            break;
          }
          const range = new Range();
          range.setStart(el, startPos);
          range.setEnd(el, index);
          rn[range_num++].push(range);
          startPos = index + str.length;
          rn.push([]);
        }
        rn.push([]);
      });

    ranges.current = rn;
  };

  const sendText = (text: string, span: HTMLSpanElement) => {
    if (!socket) return;
    spanRef.current = span;
    highlight(spanRef);
    socket.send(text);
  };

  return { socket, sendText };
};
