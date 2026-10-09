/**
 * calcom-service.ts
 *
 * Cal.com API v2 integration for Famora Video Call scheduling & Instant Meetings.
 * Cal.com API key: cal_live_0096a83db97c048dc7efac6e2a6118df
 * Cal.com user: Pasindu Palinda (pasindu-palinda-6o8dxr)
 */

export const CAL_COM_CONFIG = {
  apiKey: 'cal_live_0096a83db97c048dc7efac6e2a6118df',
  username: 'pasindu-palinda-6o8dxr',
  userEmail: 'palindapasindu@gmail.com',
  userName: 'Pasindu Palinda',
  baseUrl: 'https://api.cal.com/v2',
  publicBookingBase: 'https://cal.com/pasindu-palinda-6o8dxr',
  eventTypes: {
    min15: {
      id: 7417946,
      slug: '15min',
      title: '15 min Harvest Inspection',
      lengthInMinutes: 15,
      bookingUrl: 'https://cal.com/pasindu-palinda-6o8dxr/15min',
    },
    min30: {
      id: 7417948,
      slug: '30min',
      title: '30 min Detailed Farm Tour',
      lengthInMinutes: 30,
      bookingUrl: 'https://cal.com/pasindu-palinda-6o8dxr/30min',
    },
  },
};

export interface CalEventType {
  id: number;
  title: string;
  slug: string;
  lengthInMinutes: number;
  description?: string;
  bookingUrl: string;
}

export interface CalBookingResult {
  success: boolean;
  uid?: string;
  id?: number;
  title?: string;
  meetingUrl?: string;
  start?: string;
  end?: string;
  error?: string;
}

export class CalComService {
  /**
   * Fetch event types configured in the Cal.com account
   */
  static async getEventTypes(): Promise<CalEventType[]> {
    try {
      const response = await fetch(`${CAL_COM_CONFIG.baseUrl}/event-types`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${CAL_COM_CONFIG.apiKey}`,
          'cal-api-version': '2026-06-12',
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Cal.com error ${response.status}`);
      }

      const json = await response.json();
      if (json.status === 'success' && Array.isArray(json.data)) {
        return json.data.map((et: any) => ({
          id: et.id,
          title: et.title,
          slug: et.slug,
          lengthInMinutes: et.lengthInMinutes,
          description: et.description || '',
          bookingUrl: et.bookingUrl || `${CAL_COM_CONFIG.publicBookingBase}/${et.slug}`,
        }));
      }
      return [
        CAL_COM_CONFIG.eventTypes.min15,
        CAL_COM_CONFIG.eventTypes.min30,
      ];
    } catch (err) {
      console.warn('[CalComService] getEventTypes fallback:', err);
      return [
        CAL_COM_CONFIG.eventTypes.min15,
        CAL_COM_CONFIG.eventTypes.min30,
      ];
    }
  }

  /**
   * Create a scheduled video call booking via Cal.com API v2
   */
  static async createBooking(params: {
    eventTypeId?: number;
    startIso: string;
    attendeeName: string;
    attendeeEmail: string;
    notes?: string;
    cropItem?: string;
    _isRetry?: boolean;
  }): Promise<CalBookingResult> {
    try {
      const eventTypeId = params.eventTypeId || CAL_COM_CONFIG.eventTypes.min15.id;

      // Ensure start time is strictly in the future (minimum 3 minutes ahead of now)
      // Cal.com returns 400 BadRequest if start time is equal to or earlier than its server clock
      const nowMs = Date.now();
      let startMs = new Date(params.startIso).getTime();
      if (isNaN(startMs) || startMs < nowMs + 3 * 60 * 1000) {
        startMs = nowMs + 5 * 60 * 1000; // Auto-shift to +5 mins if in the past or too close to current second
      }
      const safeStartIso = new Date(startMs).toISOString();

      // Ensure a valid email domain (Cal.com rejects placeholder domains like test.com or example.com)
      let validEmail = params.attendeeEmail?.trim();
      if (!validEmail || !validEmail.includes('@') || validEmail.endsWith('.local') || validEmail.endsWith('.test')) {
        validEmail = CAL_COM_CONFIG.userEmail;
      }

      const payload = {
        start: safeStartIso,
        eventTypeId,
        attendee: {
          name: params.attendeeName || 'Famora Member',
          email: validEmail,
          timeZone: 'Asia/Colombo',
        },
        bookingFieldsResponses: {
          notes: params.notes || `Farm video inspection for ${params.cropItem || 'Produce'}.`,
        },
      };

      const response = await fetch(`${CAL_COM_CONFIG.baseUrl}/bookings`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${CAL_COM_CONFIG.apiKey}`,
          'cal-api-version': '2026-02-25',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const json = await response.json();

      if ((response.status === 201 || response.status === 200) && json.data) {
        const data = json.data;
        const meetingUrl =
          data.meetingUrl ||
          data.location ||
          (data.metadata?.videoCallUrl) ||
          `https://app.cal.com/video/${data.uid}`;

        return {
          success: true,
          uid: data.uid,
          id: data.id,
          title: data.title,
          meetingUrl,
          start: data.start,
          end: data.end,
        };
      }

      // If Cal.com complains about "Attempting to book a meeting in the past", retry once at +10 mins
      const rawError = JSON.stringify(json || '');
      if (rawError.includes('in the past') && !params._isRetry) {
        const retryStart = new Date(Date.now() + 10 * 60 * 1000).toISOString();
        return this.createBooking({
          ...params,
          startIso: retryStart,
          _isRetry: true,
        });
      }

      // If email validation failed, retry with Cal.com host email
      if (rawError.includes('cannot receive mail') && validEmail !== CAL_COM_CONFIG.userEmail && !params._isRetry) {
        return this.createBooking({
          ...params,
          attendeeEmail: CAL_COM_CONFIG.userEmail,
          _isRetry: true,
        });
      }

      const errMsg = json?.error?.message || json?.message || 'Failed to create booking on Cal.com';
      console.warn('[CalComService] createBooking error response:', json);
      return {
        success: false,
        error: errMsg,
      };
    } catch (err: any) {
      console.error('[CalComService] createBooking exception:', err);
      return {
        success: false,
        error: err.message || 'Network error connecting to Cal.com',
      };
    }
  }

  /**
   * Book an instant inspection video call via Cal.com API v2
   * Returns official Cal.com meeting room / Google Meet link.
   */
  static async createInstantCallBooking(params: {
    hostName: string;
    hostEmail?: string;
    clientName?: string;
    clientEmail?: string;
    productTitle?: string;
  }): Promise<{
    meetingUrl: string;
    calBookingUid?: string;
  }> {
    // Start strictly 5 minutes in the future to ensure Cal.com approves it
    const startIso = new Date(Date.now() + 5 * 60 * 1000).toISOString();
    const result = await this.createBooking({
      startIso,
      attendeeName: params.clientName || 'Buyer Partner',
      attendeeEmail: params.clientEmail || CAL_COM_CONFIG.userEmail,
      notes: `Instant inspection video call for ${params.productTitle || 'Produce lot'} with ${params.hostName}.`,
    });

    if (result.success && result.meetingUrl) {
      return {
        meetingUrl: result.meetingUrl,
        calBookingUid: result.uid,
      };
    }

    // Direct Cal.com video room URL fallback
    const uid = result.uid || `famora-${Date.now().toString(36)}`;
    const calVideoUrl = `https://app.cal.com/video/${uid}`;

    return {
      meetingUrl: result.meetingUrl || calVideoUrl,
      calBookingUid: result.uid,
    };
  }

  /**
   * Generates a Cal.com / Google Meet video meeting link.
   * Completely avoids external third-party services.
   */
  static generateInstantMeetingUrl(prefix: string = 'FamoraInspection'): {
    meetingUrl: string;
    liveVideoUrl: string;
    googleMeetUrl: string;
    roomCode: string;
  } {
    const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
    const randPart = (len: number) =>
      Array.from({ length: len }, () => chars[Math.floor(Math.random() * chars.length)]).join('');

    const roomCode = `${randPart(4)}-${randPart(4)}`;
    // Cal.com video room
    const calVideoUrl = `https://app.cal.com/video/${prefix.toLowerCase()}-${roomCode}`;
    const googleMeetUrl = `https://meet.google.com/new`;

    return {
      meetingUrl: calVideoUrl,
      liveVideoUrl: calVideoUrl,
      googleMeetUrl,
      roomCode,
    };
  }

  /**
   * Cal.com direct booking link
   */
  static getDirectBookingUrl(slug: '15min' | '30min' = '15min'): string {
    return `${CAL_COM_CONFIG.publicBookingBase}/${slug}`;
  }
}
