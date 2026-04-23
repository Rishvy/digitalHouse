import { createSupabaseServiceRoleClient } from "@/lib/supabase/service";

export async function persistDeadLetter(params: {
  functionName: string;
  eventName: string;
  payload: unknown;
  errorMessage: string;
}) {
  try {
    const supabase = createSupabaseServiceRoleClient() as any;
    await supabase.from("job_failures").insert({
      function_name: params.functionName,
      event_name: params.eventName,
      payload: params.payload,
      error_message: params.errorMessage,
    });
  } catch {
    // Swallow dead-letter persistence errors to avoid masking root failures.
  }
}
