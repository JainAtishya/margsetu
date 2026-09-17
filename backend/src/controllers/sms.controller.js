const TripService = require('../services/trip.service');

class SmsController {
    
    // Receives payloads from the physical Gateway phone in the Operator's office
    static async handleIncoming(req, res) {
        try {
            const { from, message } = req.body;

            if (!message) {
                return res.status(400).json({ error: 'Message body is required' });
            }

            // Example format: MSLOC|+919876543210|26.4499|74.6399|2026-09-17T10:00:00Z
            const parts = message.split('|');
            const prefix = parts[0];

            if (prefix === 'MSLOC') {
                // It's a Driver GPS Update
                if (parts.length !== 5) {
                    return res.status(400).json({ error: 'Invalid MSLOC format' });
                }

                const phone = parts[1];
                const lat = parseFloat(parts[2]);
                const lon = parseFloat(parts[3]);
                const timestamp = parts[4];

                const result = await TripService.submitLocationByPhone(phone, lat, lon, timestamp);
                return res.status(200).json({ status: 'Processed Driver Location', data: result });
            } 
            
            // TODO: Later we can add passenger SMS queries here (e.g. prefix === 'BUS RJ-14')

            return res.status(400).json({ error: 'Unknown SMS format' });

        } catch (error) {
            if (error.message === 'NO_ACTIVE_TRIP_FOR_PHONE') {
                return res.status(404).json({ error: 'No active trip found for this phone number' });
            }
            if (error.message === 'UNAUTHORIZED_OR_NOT_ACTIVE') {
                // This shouldn't theoretically happen because of our DB lookup, but good to catch
                return res.status(403).json({ error: 'Trip is not active' });
            }
            console.error('[ERROR] SMS Controller:', error);
            return res.status(500).json({ error: 'Internal server error' });
        }
    }
}

module.exports = SmsController;
