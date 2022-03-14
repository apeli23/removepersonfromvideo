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
    //populate video element
    rawVideo.current.srcObject = "https://res.cloudinary.com/dogjmmett/video/upload/v1647258414/sample_msf2oe.mp4";
    video_in = rawVideo.current;
    test = document.getElementById("original")
    test.addEventListener("play", (ev) => {
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

  let computeFrame = () => {
    ctx_tmp.drawImage(
      video_in,
      0,
      0,
      video_in.videoWidth,
      video_in.videoHeight
    );

    let frame = ctx_tmp.getImageData(
      0,
      0,
      video_in.videoWidth,
      video_in.videoHeight
    );

    model.segmentPerson(frame, segmentationConfig).then((segmentation) => {
      let output_img = ctx_out.getImageData(
        0,
        0,
        video_in.videoWidth,
        video_in.videoHeight
      );

      for (let x = 0; x < video_in.videoWidth; x++) {
        for (let y = 0; y < video_in.videoHeight; y++) {
          let n = x + y * video_in.videoWidth;
          if (segmentation.data[n] == 0) {
            output_img.data[n * 4] = frame.data[n * 4]; // R
            output_img.data[n * 4 + 1] = frame.data[n * 4 + 1]; // G
            output_img.data[n * 4 + 2] = frame.data[n * 4 + 2]; // B
            output_img.data[n * 4 + 3] = frame.data[n * 4 + 3]; // A
          }
        }
      }
      // console.log(segmentation);
      ctx_out.putImageData(output_img, 0, 0);
      setTimeout(computeFrame, 30);
    });
  };

  return (
    <>
      {model && (
        <div className="container">
          <div className="header">
            <h1 className="heading">
              Remove character from webcam
            </h1>
          </div>
          <div className="row">
            <div className="column">
              <video
                className="display"
                width={800}
                id="original"
                height={450}
                ref={rawVideo}
                autoPlay
                playsInline
                controls
              ></video>
            </div>
            <div className="column">
              <canvas className="display" width={800} height={450} ref={processedVid}></canvas>
            </div>
          </div>
          <div className="buttons">
            <button className="button" onClick={startCamHandler} ref={startBtn}>
              Start Webcam
            </button>
            <button className="button" onClick={stopCamHandler} ref={closeBtn}>
              Close and upload original video
            </button>
            <button className="button">
              <a ref={videoDownloadRef} href={videoUrl}>
                Get Original video
              </a>
            </button>
          </div>
        </div>
      )}
      {!model && <div>Loading machine learning models...</div>}
    </>
  )
}
