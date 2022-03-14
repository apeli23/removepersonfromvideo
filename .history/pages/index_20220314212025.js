import React, { useRef, useEffect, useState } from "react";
import * as bodyPix from "@tensorflow-models/body-pix";
import * as tf from "@tensorflow/tfjs";

const modelConfig = {
  architecture: "MobileNetV1",
  outputStride: 16,
  multiplier: 1,
  quantBytes: 4,
};
export default function Home() {
  let ctx_out, video_in, ctx_tmp, c_tmp, c_out, test;

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

  let recordedChunks = [];
  let localStream = null;
  let options = { mimeType: "video/webm; codecs=vp9" };
  let mediaRecorder = null;
  let videoUrl = null;

  const startVideo = async () => {
    console.log("playing video...")
    await rawVideo.current.play().then(() => {
      transform()})
    
    mediaRecorder = new MediaRecorder(localStream, options);
    mediaRecorder.ondataavailable = (event) => {
      console.log("data-available");
      if (event.data.size > 0) {
        recordedChunks.push(event.data);
      }
    };
    mediaRecorder.start();
  }

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

  return (
    <>
      <div className="container">
        <div className="header">
          {/* <h1 className="heading">
              Remove character from websxsxcam
            </h1> */}
        </div>
        <div className="row">
          <div className="column">
            <video
              width="800px"
              src="https://res.cloudinary.com/dogjmmett/video/upload/v1647258414/sample_msf2oe.mp4"
              controls
              autoPlay
              ref={rawVideo}
              loop
            />
          </div>
          <div className="column">
            <canvas className="display" width={800} height={450} ref={processedVid}></canvas>
          </div>
        </div>
        <div className="buttons">
          <button className="button" ref={startBtn} onClick={startVideo}>
            play video
          </button>
          <button className="button" ref={closeBtn}>
            Close and upload original video
          </button>
          <button className="button">
            <a ref={videoDownloadRef}>
              Get Original video
            </a>
          </button>
        </div>
      </div>
    </>
  )
}
