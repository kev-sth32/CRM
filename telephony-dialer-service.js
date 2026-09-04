/**
 * WebRTC CTI Softphone & In-App Dialer Service
 * Implements browser-based click-to-call, live WebRTC states, and automatic activity logging
 */

const activeCalls = new Map();

function initiateCall(tenantId, user, { to_number, lead_id, contact_id, customer_name }) {
  if (!to_number) {
    throw new Error('Destination phone number is required to initiate a call');
  }

  const callId = `call-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
  const callSession = {
    id: callId,
    tenant_id: tenantId,
    user_id: user.id,
    user_name: user.name,
    to_number,
    customer_name: customer_name || 'Customer',
    lead_id: lead_id || null,
    contact_id: contact_id || null,
    status: 'ringing', // initiated, ringing, connected, on_hold, ended
    started_at: new Date().toISOString(),
    connected_at: null,
    ended_at: null,
    duration_seconds: 0,
    disposition: null,
    notes: '',
    recording_url: `https://cdn.salesos.io/recordings/${callId}.mp3`,
    webrtc: {
      room_id: `room-${callId}`,
      ice_servers: [{ urls: 'stun:stun.l.google.com:19302' }],
      audio_codec: 'opus'
    }
  };

  activeCalls.set(callId, callSession);
  return callSession;
}

function updateCallState(callId, status) {
  const session = activeCalls.get(callId);
  if (!session) throw new Error(`Call session '${callId}' not found`);

  session.status = status;
  if (status === 'connected' && !session.connected_at) {
    session.connected_at = new Date().toISOString();
  }
  return session;
}

function endCall(callId, { disposition = 'completed', notes = '', duration_seconds = 0 }) {
  const session = activeCalls.get(callId);
  if (!session) throw new Error(`Call session '${callId}' not found`);

  session.status = 'ended';
  session.ended_at = new Date().toISOString();
  session.disposition = disposition;
  session.notes = notes;
  session.duration_seconds = Number(duration_seconds) || Math.max(1, Math.round((Date.now() - new Date(session.started_at).getTime()) / 1000));

  // Construct CRM Activity record
  const activity = {
    id: `act-${Date.now()}`,
    tenant_id: session.tenant_id,
    user_id: session.user_id,
    type: 'call',
    title: `Outbound Call to ${session.customer_name} (${session.to_number})`,
    lead_id: session.lead_id,
    contact_id: session.contact_id,
    duration_seconds: session.duration_seconds,
    disposition: session.disposition,
    notes: session.notes,
    recording_url: session.recording_url,
    created_at: new Date().toISOString()
  };

  activeCalls.delete(callId);
  return { session, activity };
}

module.exports = {
  initiateCall,
  updateCallState,
  endCall,
  activeCalls
};
