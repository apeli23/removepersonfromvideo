import React, { useRef, useEffect, useState } from "react";
import * as bodyPix from "@tensorflow-models/body-pix";

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
                width= "800px"
                 src="https://res.cloudinary.com/dogjmmett/video/upload/v1647258414/sample_msf2oe.mp4"
                 controls
              />
            </div>
            <div className="column">
              <canvas className="display" width={800} height={450} ref={processedVid}></canvas>
            </div>
          </div>
          <div className="buttons">
            <button className="button"   ref={startBtn}>
              Start Webcam
            </button>
            <button className="button"  ref={closeBtn}>
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
