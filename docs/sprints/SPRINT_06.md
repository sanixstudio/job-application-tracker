# Sprint 6 — Email parsing (M4)

**Sprint goal:** User can forward application emails to Trackr; app parses them and suggests "Add application" or "Update status." Part of Milestone M4.  
**Duration:** 2 weeks  
**Milestone:** M4

---

## Sprint backlog

### S6-1 — Inbound endpoint + parser

**Status:** Done

**Description:** Accept inbound emails (webhook or forward), identify user from address, parse subject/body with regex/heuristics, store in `email_tracking` with a parsed suggestion.

**Acceptance criteria:**
- [ ] Inbound endpoint (e.g. `POST /api/inbound/email`) accepts a payload with at least: recipient (to), sender (from), subject, plain-text body.
- [ ] User identification: recipient address contains a user token (e.g. `trackr+TOKEN@...`); token stored in `user_settings.inbound_email_token`. If no token or unknown token, return 200 but do not process (or log).
- [ ] Parser extracts from subject/body: suggested action ("add" | "update" | "ignore"), suggested status (e.g. rejected, interview_1, offer), company name when possible.
- [ ] Store raw email in `email_tracking`; store parser result in `parsed_result` (JSONB). Dedupe by email id (e.g. Message-Id or hash).

### S6-2 — Email suggestions API + dashboard UI

**Status:** Done

**Description:** User can list pending email suggestions and apply them (add as new application or update existing application status).

**Acceptance criteria:**
- [ ] `GET /api/email-suggestions`: returns list of unprocessed emails for current user with parsed suggestion (subject, from, suggested action/status, extracted company).
- [ ] `POST /api/email-suggestions/[id]/apply`: body specifies action ("add" | "update" | "dismiss"). For "add": create application (source: email) with company/title/url if we have them. For "update": require applicationId and new status; update that application and link emailId. For "dismiss": mark processed. All require auth.
- [ ] Dashboard section or card: "Email suggestions" listing pending items with [Add application] [Update status] [Dismiss]. Empty state when none.

---

## Done / not done

| Task | Status       |
|------|--------------|
| S6-1 | Done         |
| S6-2 | Done         |

---

## Order of work

1. **S6-1** — Add `parsed_result` (and optionally `inbound_email_token` on user_settings). Implement parser and inbound route; test with curl.
2. **S6-2** — List and apply APIs; dashboard UI.
