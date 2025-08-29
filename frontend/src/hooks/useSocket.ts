import { useEffect, useRef, useState } from "react";
import { getAudioSource } from "../utils/audio";
import { getRangesAndNextTextElement, highlightText } from "../utils/highlight";
import { readPdfText } from "../utils/readText";

interface ScheduleAudio {
  scheduleFunction: () => void;
  getNewSource: () => AudioBufferSourceNode;
  timeoutId: number | null;
  time: number;
  duration: number;
  timePlayed: number | null;
  currentLastTime: number;
  scheduleCurrentTime: number;
}

export const useSocket = () => {
  const [socket, setSocket] = useState<WebSocket>();
  const sendText =
    useRef<(span: Readonly<HTMLSpanElement | ChildNode | null>) => void>(null);
  const [play, setPlay] = useState(true);
  let htmlTextElement: HTMLElement | ChildNode | null = null;
  let ranges: [Range[]] | null = null;
  let lastTime = Date.now();
  const scheduledAudio = useRef(new Array<ScheduleAudio>());
  const currentSource = useRef<AudioBufferSourceNode>(null);
  let currentScheduledAudio = useRef<ScheduleAudio>(null);

  // const audioEvent = new Event("audio");

  // window.addEventListener("finished-playing", ()=> {
  //   const schedule = scheduledAudio.current.shift();
  //       highlightText(ranges);
  //       const source = getNewSource();
  //       source.start();
  //       currentSource.current = source;
  //
  //       console.log(ranges);
  //       if (ranges && ranges?.length < 5 && sendText.current)
  //         sendText.current(htmlTextElement);
  // })

  useEffect(() => {
    // pause
    if (!play) {
      if (currentSource.current) {
        currentSource.current.stop();
      }
      if (currentScheduledAudio.current) {
        currentScheduledAudio.current.timePlayed =
          currentScheduledAudio.current.currentLastTime -
          Date.now() -
          currentScheduledAudio.current.duration;
      }

      for (const schedule of scheduledAudio.current) {
        schedule.timeoutId && clearTimeout(schedule.timeoutId);
      }
    }
    // play
    else {
      if (currentScheduledAudio.current) {
        const source = currentScheduledAudio.current.getNewSource();
        source.start(0, currentScheduledAudio.current?.timePlayed || 0);
        currentSource.current = source;
      }
      // for (const schedule of scheduledAudio.current) {
      //   const offset = currentScheduledAudio.current?.timePlayed || 0;
      //   setTimeout(schedule.scheduleFunction, schedule.time - offset);
      // }
    }
  }, [play]);

  useEffect(() => {
    const wsCurrent = new WebSocket("ws://localhost:8000/kokoro");
    setSocket(wsCurrent);

    return () => {
      console.log("close");
      wsCurrent?.close();
    };
  }, []);

  useEffect(() => {
    if (!socket) return;

    const handleMessage = async (event: MessageEvent<any>) => {
      const { getNewSource, duration } = await getAudioSource(event.data);
      console.log(play);

      function scheduleFunction() {
        if (currentScheduledAudio.current) {
          currentScheduledAudio.current =
            scheduledAudio.current.shift() || null;
        }
        highlightText(ranges);
        const source = getNewSource();
        source.start();
        currentSource.current = source;

        console.log(ranges);
        if (ranges && ranges?.length < 5 && sendText.current)
          sendText.current(htmlTextElement);
      }
      if (play) {
        const time = lastTime - Date.now();
        const timeoutId = setTimeout(scheduleFunction, time);
        lastTime =
          Date.now() + Math.max(lastTime - Date.now(), 0) + duration * 1000;
        const schedule = {
          scheduleFunction,
          getNewSource,
          timeoutId,
          duration,
          timePlayed: null,
          time,
          currentLastTime: lastTime,
          scheduleCurrentTime: Date.now(),
        };
        if (!currentScheduledAudio.current) {
          currentScheduledAudio.current = schedule;
        }
        scheduledAudio.current.push(schedule);
      } else {
        const time = lastTime - Date.now();
        // const timeoutId = setTimeout(scheduleFunction, time);
        lastTime =
          Date.now() + Math.max(lastTime - Date.now(), 0) + duration * 1000;
        const schedule = {
          scheduleFunction,
          getNewSource,
          timeoutId: null,
          duration,
          timePlayed: null,
          time,
          currentLastTime: lastTime,
          scheduleCurrentTime: Date.now(),
        };
        if (!currentScheduledAudio.current) {
          currentScheduledAudio.current = schedule;
        }
        scheduledAudio.current.push(schedule);
      }
    };

    socket.addEventListener("message", handleMessage);

    sendText.current = (span: Readonly<HTMLSpanElement | ChildNode | null>) => {
      if (!span) return;
      const text = readPdfText(span);

      if (!socket) return;
      let result = getRangesAndNextTextElement(span);
      htmlTextElement = result?.span || null;
      if (ranges) {
        //  @ts-ignore
        ranges = [...ranges, ...result.ranges];
      } else {
        ranges = result?.ranges || null;
      }
      socket.send(text);
    };

    return () => {
      socket.removeEventListener("message", handleMessage);
    };
  }, [socket, play]);

  return { socket, sendText, play, setPlay };
};
