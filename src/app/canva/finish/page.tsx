"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

type ProcessingStep = {
  label: string;
  status: "pending" | "active" | "complete" | "error";
};

export default function CanvaFinishPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const correlationJwt = searchParams.get("correlation_jwt");
  const designId = searchParams.get("designId");
  const productId = searchParams.get("productId");
  const variationId = searchParams.get("variationId");
  const error = searchParams.get("error");
  
  const [progress, setProgress] = useState(0);
  const [message, setMessage] = useState("Preparing your design...");
  const [steps, setSteps] = useState<ProcessingStep[]>([
    { label: "Receiving design from Canva", status: "active" },
    { label: "Creating export job", status: "pending" },
    { label: "Exporting high-quality image", status: "pending" },
    { label: "Preparing preview", status: "pending" },
  ]);
  const [hasError, setHasError] = useState(false);

  const updateStep = (index: number, status: ProcessingStep["status"]) => {
    setSteps((prev) =>
      prev.map((step, i) => (i === index ? { ...step, status } : step))
    );
  };

  useEffect(() => {
    if (!correlationJwt && !error) return;

    let cancelled = false;
    let pollCount = 0;
    const maxPolls = 60;

    async function processDesign() {
      try {
        // Step 1: Receive design from Canva (10%)
        setProgress(10);
        updateStep(0, "complete");
        updateStep(1, "active");
        setMessage("Processing your design...");

        if (error && designId) {
          // Recovery flow
          const supabase = createSupabaseBrowserClient();
          const { data } = await supabase.auth.getSession();
          const userId = data.session?.user?.id;

          if (!userId) {
            throw new Error("Please log in again to continue.");
          }

          const response = await fetch("/api/canva/export-design", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              designId,
              userId,
              productId: productId || undefined,
              variationId: variationId || undefined,
            }),
          });

          const result = await response.json();
          if (!response.ok || !result.jobId) {
            throw new Error(result?.error || "Failed to create export job");
          }

          // Continue with polling
          await pollExportStatus(result.jobId, userId);
        } else if (correlationJwt) {
          // Normal flow: Process the JWT and create export job
          const processResponse = await fetch(
            `/api/canva/return-nav-process?correlation_jwt=${encodeURIComponent(correlationJwt)}`
          );

          const processData = await processResponse.json();

          if (!processResponse.ok || !processData.jobId) {
            throw new Error(processData.error || "Failed to process design");
          }

          // Step 2: Export job created (25%)
          if (cancelled) return;
          setProgress(25);
          updateStep(1, "complete");
          updateStep(2, "active");
          setMessage("Exporting high-quality image...");

          // Step 3: Poll for export completion
          await pollExportStatus(
            processData.jobId,
            processData.userId,
            processData.productId,
            processData.variationId
          );
        }
      } catch (err: any) {
        if (!cancelled) {
          console.error("Processing error:", err);
          setHasError(true);
          setMessage(err.message || "An error occurred. Please try again.");
          steps.forEach((_, i) => updateStep(i, "error"));
        }
      }
    }

    async function pollExportStatus(
      jobId: string,
      userId: string,
      prodId?: string,
      varId?: string
    ) {
      const pollInterval = 1000;

      const poll = async (): Promise<void> => {
        if (cancelled) return;

        try {
          const response = await fetch(
            `/api/canva/export-status?jobId=${jobId}&userId=${userId}&productId=${prodId || ""}&variationId=${varId || ""}`
          );

          const data = await response.json();

          if (data.status === "in_progress") {
            pollCount++;
            // Progress from 25% to 90% during polling
            const pollProgress = 25 + Math.min((pollCount / maxPolls) * 65, 65);
            setProgress(pollProgress);

            if (pollCount < maxPolls) {
              setTimeout(poll, pollInterval);
            } else {
              throw new Error("Export is taking longer than expected. Please try again later.");
            }
          } else if (data.status === "success") {
            if (cancelled) return;
            
            // Step 3: Complete (90%)
            setProgress(90);
            updateStep(2, "complete");
            updateStep(3, "active");
            setMessage("Finalizing your design...");

            // Step 4: Complete (100%)
            setTimeout(() => {
              if (cancelled) return;
              setProgress(100);
              updateStep(3, "complete");
              setMessage("Success! Redirecting...");

              // Redirect to final page
              setTimeout(() => {
                if (cancelled) return;
                if (data.redirectUrl) {
                  router.push(data.redirectUrl);
                } else {
                  router.push("/dashboard");
                }
              }, 500);
            }, 500);
          } else if (data.status === "failed") {
            throw new Error(data.error || "Export failed. Please try again.");
          }
        } catch (err: any) {
          if (!cancelled) {
            throw err;
          }
        }
      };

      await poll();
    }

    processDesign();

    return () => {
      cancelled = true;
    };
  }, [correlationJwt, designId, error, productId, variationId, router]);

  return (
    <section className="mx-auto w-full max-w-3xl px-4 py-10 md:px-8">
      <div className="rounded-2xl bg-surface-container p-8">
        <div className="text-center">
          {!hasError && (
            <div className="mx-auto mb-6 h-16 w-16">
              <svg
                className="animate-spin h-16 w-16 text-primary"
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
          )}

          {hasError && (
            <div className="mx-auto mb-6 h-16 w-16">
              <svg
                className="h-16 w-16 text-red-600"
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
          )}

          <h1 className="text-2xl font-bold">
            {hasError ? "Something Went Wrong" : "Returning To Digital House"}
          </h1>
          <p className="mt-2 text-sm text-on-surface/70">{message}</p>

          {/* Progress Bar */}
          <div className="mt-6 w-full">
            <div className="w-full bg-surface-container-high rounded-full h-2.5">
              <div
                className="bg-primary h-2.5 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              ></div>
            </div>
            <p className="text-sm text-on-surface/60 mt-2">{Math.round(progress)}% complete</p>
          </div>

          {/* Processing Steps */}
          <div className="mt-8 space-y-3 text-left">
            {steps.map((step, index) => (
              <div key={index} className="flex items-center gap-3">
                {step.status === "complete" && (
                  <svg
                    className="h-5 w-5 text-green-600 flex-shrink-0"
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
                )}
                {step.status === "active" && (
                  <div className="h-5 w-5 flex-shrink-0">
                    <div className="h-5 w-5 rounded-full border-2 border-primary border-t-transparent animate-spin"></div>
                  </div>
                )}
                {step.status === "pending" && (
                  <div className="h-5 w-5 rounded-full border-2 border-on-surface/20 flex-shrink-0"></div>
                )}
                {step.status === "error" && (
                  <svg
                    className="h-5 w-5 text-red-600 flex-shrink-0"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                )}
                <span
                  className={`text-sm ${
                    step.status === "complete"
                      ? "text-green-600"
                      : step.status === "active"
                      ? "text-primary font-medium"
                      : step.status === "error"
                      ? "text-red-600"
                      : "text-on-surface/50"
                  }`}
                >
                  {step.label}
                </span>
              </div>
            ))}
          </div>

          {hasError && (
            <button
              onClick={() => router.push("/dashboard")}
              className="mt-6 px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
            >
              Go to Dashboard
            </button>
          )}
        </div>
      </div>
    </section>
  );
}
