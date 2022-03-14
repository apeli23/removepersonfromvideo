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
  const [link, setLink] = useState("");
  const [blob, setBlob] = useState();

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

    c_out = processedVid.current;
    console.log(c_out)
  }, []);

  const startVideo = async () => {
    console.log("playing video...")
    video_in = rawVideo.current;
    await rawVideo.current.play().then(() => {
      transform()
    })




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
      await readFile(blob).then((encoded_file) => {
        try {
          fetch('/api/upload', {
            method: 'POST',
            body: JSON.stringify({ data: encoded_file }),
            headers: { 'Content-Type': 'application/json' },
          })
            .then((response) => response.json())
            .then((data) => {
              setComputed(true);
              setLink(data.data);
            });
        } catch (error) {
          console.error(error);
        }
      });
    };

    function transform() {
      // let ;
     
     
      console.log(c_out)
    };

    let computeFrame = () => {
      console.log(video_in.videoWidth)
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

      const chunks = [];
      const cnv = canvasRef.current;
      const stream = cnv.captureStream();
      const rec = new MediaRecorder(stream);
      rec.ondataavailable = e => chunks.push(e.data);
      rec.onstop = e => setBlob(new Blob(chunks, { type: 'video/webm' }));
      rec.start();
      setTimeout(() => rec.stop(), 10000);
    }
  };

  return (
    <>
      <div className="container">
        <div className="header">
          <h1 className="heading">
            Remove character from video
          </h1>
        </div>
        <div className="row">
          <div className="column">
            <video
              width="800px"
              src="sample.mp4"
              autoPlay
              ref={rawVideo}
              loop
            />
          </div>
          <div className="column">
            {link ? <h4><a href={link}>Link</a></h4> :
              <img id="loading" width="50" height="30" src="https://mir-s3-cdn-cf.behance.net/project_modules/disp/f1055231234507.564a1d234bfb6.gif" />
            }<br />
            <canvas className="display" width={800} height={450} ref={processedVid}></canvas>
          </div>
        </div>
        <div className="buttons">
          <button className="button" ref={startBtn} onClick={startVideo}>
            Process Video
          </button>
          <button className="button"  >
            <a ref={videoDownloadRef}>
              Get Copy
            </a>
          </button>
        </div>
      </div>
    </>
  )
}
