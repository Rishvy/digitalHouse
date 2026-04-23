import express from "express";
import { runPdfGenerationJob } from "@/jobs/pdfGenerationJob";
import { runPreflightValidationJob } from "@/jobs/preflightValidationJob";
import type { PdfGenerationRequest, PreflightValidationRequest } from "@/types";

const app = express();
app.use(express.json({ limit: "10mb" }));

app.get("/health", (_req, res) => {
  res.json({ ok: true, service: "w2p-worker" });
});

app.post("/jobs/pdf-generate", async (req, res) => {
  try {
    const payload = req.body as PdfGenerationRequest;
    const result = await runPdfGenerationJob(payload);
    res.json(result);
  } catch (error) {
    res.status(500).json({
      error: error instanceof Error ? error.message : "Unknown PDF generation error",
    });
  }
});

app.post("/jobs/preflight-validate", async (req, res) => {
  try {
    const payload = req.body as PreflightValidationRequest;
    const result = await runPreflightValidationJob(payload);
    res.json(result);
  } catch (error) {
    res.status(500).json({
      error: error instanceof Error ? error.message : "Unknown preflight validation error",
    });
  }
});

const port = Number(process.env.WORKER_PORT ?? 4010);
app.listen(port, () => {
  // eslint-disable-next-line no-console
  console.log(`Worker listening on ${port}`);
});
