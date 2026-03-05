/**
 * Heuristic parser for application-related emails.
 * Extracts suggested action (add/update/dismiss), status, and company/title from subject and body.
 */

import type { ApplicationStatus } from "@/types";

export interface ParsedEmailResult {
  suggestedAction: "add" | "update" | "dismiss";
  suggestedStatus?: ApplicationStatus;
  companyName?: string;
  jobTitle?: string;
}

/** Common phrases that indicate rejection (case-insensitive). */
const REJECTION_PATTERNS = [
  /\b(?:we've decided to move forward with other|unfortunately we (?:will not|won't)|not moving forward with your application|not selected for (?:the )?position|we have chosen to pursue other)\b/i,
  /\b(?:rejected|rejection|unsuccessful|other candidates?)\b/i,
  /\b(?:thank you for your interest|at this time we)\b/i,
];

/** Phrases that suggest interview invite. */
const INTERVIEW_PATTERNS = [
  /\b(?:invite you (?:to )?an? interview|schedule (?:an? )?interview|next (?:steps? )?(?:in the )?interview)\b/i,
  /\b(?:interview (?:invitation|scheduled)|would like to (?:schedule|invite))\b/i,
];

/** Phrases that suggest offer. */
const OFFER_PATTERNS = [
  /\b(?:we are pleased to (?:offer|extend)|offer (?:of )?employment|job offer)\b/i,
  /\b(?:extend (?:you )?an? offer|offer you the position)\b/i,
];

/** "Application received" / acknowledgment. */
const RECEIVED_PATTERNS = [
  /\b(?:we've received your application|application (?:has been )?received|thank you for applying)\b/i,
  /\b(?:your application (?:to|for)|received your (?:application|resume))\b/i,
];

/** Extract company name: "Your application to Company Name" or "Company Name - ..." or "Re: Role at Company". */
function extractCompany(subject: string, text: string): string | undefined {
  const combined = `${subject} ${text}`.slice(0, 2000);
  // "application to X" or "application for X"
  const m1 = combined.match(/\b(?:application|applied)\s+(?:to|at|for)\s+([A-Za-z0-9&\s.-]{2,60}?)(?:\s+[-–—]|\s*$|\.|,)/i);
  if (m1) return m1[1].trim();
  // "at X" (company)
  const m2 = combined.match(/\b(?:position|role|job)\s+at\s+([A-Za-z0-9&\s.-]{2,60}?)(?:\s+[-–—]|\s*$|\.|,)/i);
  if (m2) return m2[1].trim();
  // "X - Rejection" or "X - Interview"
  const m3 = subject.match(/^([A-Za-z0-9&\s.-]{2,60}?)\s*[-–—]\s*(?:rejection|interview|offer|application)/i);
  if (m3) return m3[1].trim();
  return undefined;
}

/** Extract job title when present. */
function extractJobTitle(subject: string, text: string): string | undefined {
  const combined = `${subject} ${text}`.slice(0, 1500);
  const m = combined.match(/\b(?:position|role|application)\s+(?:of|for|as)?\s*[: -]*\s*([A-Za-z0-9\s,&.-]{3,80}?)(?:\s+at\s+|\s*$|\.|,)/i);
  return m ? m[1].trim() : undefined;
}

/**
 * Parse subject and plain-text body to suggest an action and optional status/company/title.
 */
export function parseEmailContent(subject: string, text: string): ParsedEmailResult {
  const sub = subject.trim();
  const body = (text || "").trim();
  const combined = `${sub} ${body}`.slice(0, 5000);

  for (const re of REJECTION_PATTERNS) {
    if (re.test(combined)) {
      return {
        suggestedAction: "update",
        suggestedStatus: "rejected",
        companyName: extractCompany(sub, body),
        jobTitle: extractJobTitle(sub, body),
      };
    }
  }

  for (const re of OFFER_PATTERNS) {
    if (re.test(combined)) {
      return {
        suggestedAction: "update",
        suggestedStatus: "offer",
        companyName: extractCompany(sub, body),
        jobTitle: extractJobTitle(sub, body),
      };
    }
  }

  for (const re of INTERVIEW_PATTERNS) {
    if (re.test(combined)) {
      return {
        suggestedAction: "update",
        suggestedStatus: "interview_1",
        companyName: extractCompany(sub, body),
        jobTitle: extractJobTitle(sub, body),
      };
    }
  }

  for (const re of RECEIVED_PATTERNS) {
    if (re.test(combined)) {
      return {
        suggestedAction: "add",
        companyName: extractCompany(sub, body),
        jobTitle: extractJobTitle(sub, body),
      };
    }
  }

  return { suggestedAction: "dismiss" };
}
