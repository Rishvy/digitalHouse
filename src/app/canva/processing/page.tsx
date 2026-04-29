"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";

function CanvaProcessingContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [status, setStatus] = useState<"processing" | "success" | "error">("processing");
  const [message, setMessage] = useState("Processing your design...");
  const [progress, setProgress] = useState(0);

  const jobId = searchParams.get("jobId");
  const userId = searchParams.get("userId");
  const productId = searchParams.get("productId");
  const variationId = searchParams.get("variationId");

  useEffect(() => {
    if (!jobId || !userId) {
      setStatus("error");
      setMessage("Missing required parameters");
      return;
    }

    let pollCount = 0;
    const maxPolls = 60; // Poll for up to 60 seconds
    const pollInterval = 1000; // Poll every 1 second

    const pollExportStatus = async () => {
      try {
        const response = await fetch(
          `/api/canva/export-status?jobId=${jobId}&userId=${userId}&productId=${productId || ""}&variationId=${variationId || ""}`
        );

        const data = await response.json();

        if (data.status === "in_progress") {
          pollCount++;
          setProgress(Math.min((pollCount / maxPolls) * 100, 90));
          
          if (pollCount < maxPolls) {
            setTimeout(pollExportStatus, pollInterval);
          } else {
            setStatus("error");
            setMessage("Export is taking longer than expected. Please try again later.");
          }
        } else if (data.status === "success") {
          setProgress(100);
          setStatus("success");
          setMessage("Design exported successfully! Redirecting...");
          
          // Redirect after a short delay
          setTimeout(() => {
            if (data.redirectUrl) {
              router.push(data.redirectUrl);
            } else {
              router.push("/dashboard");
            }
          }, 1500);
        } else if (data.status === "failed") {
          setStatus("error");
          setMessage(data.error || "Export failed. Please try again.");
        }
      } catch (err) {
        console.error("Polling error:", err);
        setStatus("error");
        setMessage("An error occurred while processing your design.");
      }
    };

    // Start polling
    pollExportStatus();
  }, [jobId, userId, productId, variationId, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8">
        <div className="text-center">
          {status === "processing" && (
            <>
              <div className="mb-6">
                <svg
                  className="animate-spin h-16 w-16 mx-auto text-blue-600"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Processing Your Design
              </h2>
              <p className="text-gray-600 mb-6">{message}</p>
              <div className="w-full bg-gray-200 rounded-full h-2.5">
                <div
                  className="bg-blue-600 h-2.5 rounded-full transition-all duration-300"
                  style={{ width: `${progress}%` }}
                ></div>
              </div>
              <p className="text-sm text-gray-500 mt-2">
                {Math.round(progress)}% complete
              </p>
            </>
          )}

          {status === "success" && (
            <>
              <div className="mb-6">
                <svg
                  className="h-16 w-16 mx-auto text-green-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Success!
              </h2>
              <p className="text-gray-600">{message}</p>
            </>
          )}

          {status === "error" && (
            <>
              <div className="mb-6">
                <svg
                  className="h-16 w-16 mx-auto text-red-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Something Went Wrong
              </h2>
              <p className="text-gray-600 mb-6">{message}</p>
              <button
                onClick={() => router.push("/dashboard")}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Go to Dashboard
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default function CanvaProcessingPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8">
          <div className="text-center">
            <div className="mb-6">
              <svg
                className="animate-spin h-16 w-16 mx-auto text-blue-600"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                ></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Loading...</h2>
            <p className="text-gray-600">Please wait</p>
          </div>
        </div>
      </div>
    }>
      <CanvaProcessingContent />
    </Suspense>
  );
}
