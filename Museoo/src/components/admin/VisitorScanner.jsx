import React, { useEffect, useRef, useState } from "react";
import { Html5Qrcode } from "html5-qrcode";

const VisitorScanner = () => {
  const [scanned, setScanned] = useState("");
  const [visitor, setVisitor] = useState(null);
  const [error, setError] = useState("");
  const scannerRef = useRef(null);
  const html5QrCodeRef = useRef(null);

  useEffect(() => {
    if (!scannerRef.current) return;
    let stopped = false;
    try {
      html5QrCodeRef.current = new Html5Qrcode(scannerRef.current.id);
      html5QrCodeRef.current
        .start(
          { facingMode: "environment" },
          {
            fps: 10,
            qrbox: 250,
          },
          async (decodedText) => {
            if (stopped) return;
            setScanned(decodedText);
            html5QrCodeRef.current.stop();
            // If the QR code is a check-in URL, fetch visitor info
            if (decodedText.includes("/api/visit/checkin/")) {
              try {
                const res = await fetch(decodedText);
                const json = await res.json();
                setVisitor(json.visitor || json);
              } catch (err) {
                setError("Failed to fetch visitor info");
              }
            }
          },
          (err) => {
            // ignore scan errors
          }
        )
        .catch((err) => setError("Camera error: " + err));
    } catch (err) {
      setError("Failed to initialize scanner: " + err.message);
    }
    return () => {
      stopped = true;
      if (html5QrCodeRef.current) {
        html5QrCodeRef.current.stop().catch(() => {});
        html5QrCodeRef.current.clear();
      }
    };
  }, []);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 p-6">
      <h1 className="text-2xl font-bold mb-4">Visitor QR Scanner</h1>
      <div id="reader" ref={scannerRef} style={{ width: 300, height: 300, background: '#eee' }} />
      <div className="mt-4">
        {scanned && <div className="text-sm text-gray-700">Scanned: {scanned}</div>}
        {visitor && (
          <div className="mt-2 p-2 bg-green-100 rounded">
            <div className="font-semibold">Visitor Info:</div>
            <pre className="text-xs whitespace-pre-wrap">{JSON.stringify(visitor, null, 2)}</pre>
          </div>
        )}
        {error && <div className="text-red-500">{error}</div>}
      </div>
    </div>
  );
};

export default VisitorScanner; 