import { useRef } from "react";
import { getAudioSource } from "../utils/audio";
import { getRangesAndNextTextElement, highlightText } from "../utils/highlight";
import { readPdfText } from "../utils/readText";

export const useSocket = () => {
  const socket = useRef(new WebSocket("ws://localhost:8000/kokoro"));
  let htmlTextElement: HTMLElement | ChildNode | null = null;
  let ranges: [Range[]] | null = null;
  let lastTime = Date.now();

  socket.current.addEventListener("message", async (event) => {
    const { source, duration } = await getAudioSource(event.data);

    setTimeout(() => {
      highlightText(ranges);
      source.start();
      source.stop;

      if (ranges && ranges?.length < 5) sendText(htmlTextElement);
    }, lastTime - Date.now());

    lastTime =
      Date.now() + Math.max(lastTime - Date.now(), 0) + duration * 1000;
  });

  const sendText = (span: Readonly<HTMLSpanElement | ChildNode | null>) => {
    if (!span) return;
    const text = readPdfText(span);

    if (!socket.current) return;
    let result = getRangesAndNextTextElement(span);
    htmlTextElement = result?.span || null;
    if (ranges) {
      //  @ts-ignore
      ranges = [...ranges, ...result.ranges];
    } else {
      ranges = result?.ranges || null;
    }
    socket.current.send(text);
  };

  return { socket, sendText };
};
