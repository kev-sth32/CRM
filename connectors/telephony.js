/**
 * Telephony & AI Call Intelligence Connector Adapter
 * Conforms to connectors/README.md interface
 * Implements PRD Section 19 (AI Call Intelligence)
 */

class TelephonyConnector {
  constructor(config = {}) {
    this.provider = config.provider || 'generic_telephony';
    this.webhookSecret = config.webhookSecret || process.env.CALL_WEBHOOK_SECRET || '';
  }

  getCapabilities() {
    return {
      call_logging: true,
      recording_ingestion: true,
      transcript_processing: true,
      ai_objection_extraction: true
    };
  }

  /**
   * Analyzes call transcript using heuristic NLP to extract key sales intelligence
   */
  analyzeTranscript(transcript = '') {
    const text = transcript.toLowerCase();

    // 1. Sentiment analysis
    let sentiment = 'Neutral';
    const positiveWords = ['great', 'excellent', 'perfect', 'interested', 'buy', 'purchase', 'agree', 'deal', 'love', 'yes'];
    const negativeWords = ['expensive', 'budget', 'cancel', 'disappointed', 'issue', 'unhappy', 'problem', 'no', 'reject'];

    let posCount = 0;
    let negCount = 0;
    positiveWords.forEach(w => { if (text.includes(w)) posCount++; });
    negativeWords.forEach(w => { if (text.includes(w)) negCount++; });

    if (posCount > negCount + 1) sentiment = 'Positive';
    else if (negCount > posCount) sentiment = 'Negative';

    // 2. Objection extraction
    const objections = [];
    if (text.includes('expensive') || text.includes('high price') || text.includes('budget') || text.includes('cost too much')) {
      objections.push('Budget / Price Sensitivity');
    }
    if (text.includes('competitor') || text.includes('already using') || text.includes('alternative')) {
      objections.push('Existing Competitor Relationship');
    }
    if (text.includes('need to talk to') || text.includes('manager') || text.includes('boss') || text.includes('partner') || text.includes('board')) {
      objections.push('Decision Maker Authority');
    }
    if (text.includes('next quarter') || text.includes('next year') || text.includes('later') || text.includes('not ready')) {
      objections.push('Timeline / Implementation Timing');
    }

    // 3. Buying Signals
    const buyingSignals = [];
    if (text.includes('quote') || text.includes('quotation') || text.includes('pricing sheet')) {
      buyingSignals.push('Requested formal pricing proposal');
    }
    if (text.includes('demo') || text.includes('presentation') || text.includes('meeting')) {
      buyingSignals.push('Requested product demo or stakeholder meeting');
    }
    if (text.includes('contract') || text.includes('sign') || text.includes('agreement')) {
      buyingSignals.push('Discussed closing contract / agreement');
    }

    // 4. Action items extraction
    const actionItems = [];
    if (text.includes('send') || text.includes('email me') || text.includes('proposal')) {
      actionItems.push('Send formal proposal and quote details via email');
    }
    if (text.includes('call back') || text.includes('follow up') || text.includes('schedule')) {
      actionItems.push('Schedule follow-up call with stakeholder');
    }

    // 5. Executive Summary
    const summary = transcript.length > 0 
      ? `Call completed (${transcript.split(' ').length} words). Sentiment: ${sentiment}. Key topics: ${objections.length ? objections.join(', ') : 'Standard discovery'}.`
      : 'Inbound/outbound call completed without transcription.';

    return {
      sentiment,
      objections,
      buyingSignals,
      actionItems,
      summary
    };
  }

  /**
   * Normalizes inbound call webhook event from Twilio, VAPI, or generic PBX
   */
  receiveEvent(body = {}) {
    const callId = body.call_id || body.CallSid || `call-${Date.now()}`;
    const from = body.from || body.From || body.caller;
    const to = body.to || body.To || body.callee;
    const duration = Number(body.duration_seconds || body.CallDuration || 0);
    const recordingUrl = body.recording_url || body.RecordingUrl || null;
    const transcriptText = body.transcript || body.TranscriptionText || '';
    const direction = body.direction || body.Direction || 'outbound';

    const intelligence = this.analyzeTranscript(transcriptText);

    return {
      channel: 'phone_call',
      call_id: callId,
      from,
      to,
      direction,
      duration_seconds: duration,
      recording_url: recordingUrl,
      transcript: transcriptText,
      analysis: intelligence,
      occurred_at: new Date().toISOString()
    };
  }
}

module.exports = TelephonyConnector;
