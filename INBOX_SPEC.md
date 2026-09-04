# SalesOS Unified Omnichannel Inbox Specification

## Overview
The Unified Inbox (`/inbox.html`) aggregates customer conversations across all configured channels (Email, WebChat, WhatsApp, SMS, Telephony) into a real-time, responsive console.

## Layout Architecture & Components

```
┌─────────────────┬──────────────────────────┬───────────────────────────────┬───────────────────────────┐
│ Channel Filters │   Conversation Feed      │       Message Timeline        │  Context & AI Copilot     │
├─────────────────┼──────────────────────────┼───────────────────────────────┼───────────────────────────┤
│ • All Inboxes   │ • Lead / Contact Name    │ • Message Bubbles (In/Out)    │ • Customer Dossier        │
│ • WebChat       │ • Channel Icon & Status  │ • Status (Sent/Delivered/Read)│ • Linked Deals & Pipeline │
│ • WhatsApp      │ • Last Message Snippet   │ • Omnichannel Composer        │ • AI Intent & Sentiment   │
│ • SMS           │ • SLA Breach Indicator   │ • Quick Responses / Canned    │ • Copilot Suggestions     │
│ • Email         │ • Assigned Rep           │ • Attachment Uploader         │ • Human Handoff Control   │
│ • Phone Calls   │ • Unread Badge           │ • Action Approval Triggers    │ • Escalation Trigger      │
└─────────────────┴──────────────────────────┴───────────────────────────────┴───────────────────────────┘
```

## Conversation States
- `open` — Active conversation requiring attention or awaiting customer response.
- `waiting` — Awaiting internal agent or escalation response.
- `snoozed` — Temporarily deferred until a specified reminder timestamp.
- `resolved` — Handled and archived.
- `escalated` — High priority breach or sentiment issue transferred to human management.

## SLA & Priority Engine (`sla-service.js`)
- Dynamic first-response SLA calculated per channel (WebChat: 5 min, WhatsApp: 15 min, Email: 60 min).
- Visual SLA badges:
  - 🟢 **Within SLA:** Count-down timer displaying remaining time.
  - 🟡 **Approaching SLA:** Warning badge when < 20% SLA remains.
  - 🔴 **Breached SLA:** Pulsing red indicator; automatically triggers escalation route if enabled.

## AI Copilot Sidebar Integration
1. **Real-Time Classification:** Sentiment score (positive, neutral, negative), purchase intent score (0-100), and extracted customer criteria.
2. **Suggested Replies:** Contextually grounded in tenant knowledge base (`knowledge_chunks`).
3. **One-Click Approval / Edit:** Copilot suggestions include `Insert into Composer` or direct `Approve & Send` if policy allows.
4. **Handoff Manager (`handoff-service.js`):** Instantly transfers control from autonomous bot to live agent, stopping sequence loops and preserving transcript context.

## API Integration & Real-Time Sync
- `GET /api/conversations` — Retrieves tenant conversations with unread counts, SLA indicators, and channel metadata.
- `GET /api/conversations/:id/messages` — Retrieves message thread with attachments and delivery state.
- `POST /api/conversations/:id/messages` — Dispatches message through tenant's active channel connector.
- `POST /api/conversations/:id/handoff` — Initiates agent takeover.
- `POST /api/conversations/:id/status` — Updates status (`open`, `resolved`, `snoozed`).

## UX Refinements & Polish
- Keyboard shortcuts: `Cmd/Ctrl + Enter` to send, `Esc` to close modal, `Up/Down` to navigate conversations.
- Empty states with guided action cards for setting up new connectors or inviting teammates.
- Mobile responsive adaptive drawer: Sidebar collapses into a slide-over sheet on screens `< 900px`.
- Real-time optimistic UI: Sent messages appear instantly with "sending..." checkmark and update to delivered upon socket/HTTP confirmation.
