import React, { useRef, useEffect, useState } from "react";
import * as bodyPix from "@tensorflow-models/body-pix";

const modelConfig = {
  architecture: "MobileNetV1",
  outputStride: 16,
  multiplier: 1,
  quantBytes: 4,
};
export default function Home() {
  let ctx_out, video_in, ctx_tmp, c_tmp, c_out;

  const processedVid = useRef();
  const rawVideo = useRef();
  const startBtn = useRef();
  const closeBtn = useRef();
  const videoDownloadRef = useRef();
  const [model, setModel] = useState(null);

  const segmentationConfig = {
    internalResolution: "full",
    segmentationThreshold: 0.1,
    scoreThreshold: 0.4,
    flipHorizontal: true,
    maxDetections: 1,
  };

  useEffect(() => {
    if (model) return;
    const start_time = Date.now() / 1000;

    bodyPix.load(modelConfig).then((m) => {
      setModel(m);
      const end_time = Date.now() / 1000;
      console.log(`model loaded successfully, ${end_time - start_time}`);
    });
  }, []);

  const startCamHandler = async () => {
    console.log("Starting webcam and mic ..... ");
    localStream = await navigator.mediaDevices.getUserMedia({
      video: true,
      audio: false,
    });

    // console.log(model);

    //populate video element
    rawVideo.current.srcObject = localStream;
    video_in = rawVideo.current;
    rawVideo.current.addEventListener("loadeddata", (ev) => {
      console.log("loaded data.");
      transform();
    });

    mediaRecorder = new MediaRecorder(localStream, options);
    mediaRecorder.ondataavailable = (event) => {
      console.log("data-available");
      if (event.data.size > 0) {
        recordedChunks.push(event.data);
      }
    };
    mediaRecorder.start();
  };

  const stopCamHandler = () => {
    console.log("Hanging up the call ...");
    localStream.getTracks().forEach((track) => track.stop());

    mediaRecorder.onstop = async (event) => {
      let blob = new Blob(recordedChunks, {
        type: "video/webm",
      });

      // Save original video to cloudinary
      await readFile(blob).then((encoded_file) => {
        uploadVideo(encoded_file);
      });

      videoDownloadRef.current.href = URL.createObjectURL(blob);
      videoDownloadRef.current.download =
        new Date().getTime() + "-locastream.webm";
    };
  };

  function readFile(file) {
    console.log("readFile()=>", file);
    return new Promise(function (resolve, reject) {
      let fr = new FileReader();

      fr.onload = function () {
        resolve(fr.result);
      };

      fr.onerror = function () {
        reject(fr);
      };

      fr.readAsDataURL(file);
    });
  }

  const uploadVideo = async (base64) => {
    console.log("uploading to backend...");
    try {
      fetch("/api/upload", {
        method: "POST",
        body: JSON.stringify({ data: base64 }),
        headers: { "Content-Type": "application/json" },
      }).then((response) => {
        console.log("successfull session", response.status);
      });
    } catch (error) {
      console.error(error);
    }
  };

  let transform = () => {
    // let ;
    c_out = processedVid.current;
    ctx_out = c_out.getContext("2d");

    c_tmp = document.createElement("canvas");
    c_tmp.setAttribute("width", 800);
    c_tmp.setAttribute("height", 450);

    ctx_tmp = c_tmp.getContext("2d");

    computeFrame();
  };

  return (
    <div>

    </div>
  )
}
