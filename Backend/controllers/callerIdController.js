// controllers/callerIdController.js
const TicketRequest = require('../models/TicketRequest');
const AuthRecord = require('../models/AuthRecord');
const { CallDescription } = require('../models/CallDescription');

/**
 * Caller ID Lookup — searches across CRM data by phone number
 * Returns customer name, email, recent bookings, call history
 */
const lookupCallerId = async (req, res) => {
  try {
    const { phone } = req.params;
    if (!phone || phone.length < 7) {
      return res.status(400).json({ message: 'Valid phone number required' });
    }

    // Normalize: strip +, spaces, dashes, parens
    const raw = phone.replace(/[\s\-\(\)\+]/g, '');
    // Build variations: full number, last 10 digits, with leading 1
    const variations = [raw];
    if (raw.length === 11 && raw.startsWith('1')) {
      variations.push(raw.slice(1)); // 10-digit without country code
    }
    if (raw.length === 10) {
      variations.push('1' + raw); // with US country code
    }

    // Build regex pattern to match any variation
    const regexPatterns = variations.map(v => new RegExp(v.replace(/\D/g, '').split('').join('[\\s\\-\\(\\)]*'), 'i'));
    // Simple exact-ish match patterns
    const orConditions = variations.flatMap(v => [
      { $regex: v, $options: 'i' },
    ]);

    // 1) Search TicketRequest by phoneNumber or billingPhone
    const ticketResults = await TicketRequest.find({
      $or: [
        { phoneNumber: { $in: variations } },
        { billingPhone: { $in: variations } },
        ...variations.map(v => ({ phoneNumber: { $regex: v, $options: 'i' } })),
        ...variations.map(v => ({ billingPhone: { $regex: v, $options: 'i' } })),
      ]
    })
      .sort({ createdAt: -1 })
      .limit(5)
      .select('passengerName passengerEmail phoneNumber billingPhone confirmationCode airlineCode ticketType requestFor status createdAt consultant')
      .lean();

    // 2) Search AuthRecord by contactNo
    const authResults = await AuthRecord.find({
      $or: [
        { contactNo: { $in: variations } },
        ...variations.map(v => ({ contactNo: { $regex: v, $options: 'i' } })),
      ]
    })
      .sort({ createdAt: -1 })
      .limit(5)
      .select('cardholderName customerEmail contactNo bookingReference companyName status amount sentAt')
      .lean();

    // 3) Search CallDescription by sourceNumber
    const callResults = await CallDescription.find({
      $or: [
        { sourceNumber: { $in: variations } },
        ...variations.map(v => ({ sourceNumber: { $regex: v, $options: 'i' } })),
      ]
    })
      .sort({ createdAt: -1 })
      .limit(10)
      .select('sourceNumber destination callDuration status callConversation date user createdAt')
      .lean();

    // Determine best name from results
    let customerName = '';
    let customerEmail = '';
    let customerPhone = phone;

    if (ticketResults.length > 0) {
      customerName = ticketResults[0].passengerName || '';
      customerEmail = ticketResults[0].passengerEmail || '';
      customerPhone = ticketResults[0].phoneNumber || phone;
    } else if (authResults.length > 0) {
      customerName = authResults[0].cardholderName || '';
      customerEmail = authResults[0].customerEmail || '';
      customerPhone = authResults[0].contactNo || phone;
    }

    const found = ticketResults.length > 0 || authResults.length > 0 || callResults.length > 0;

    return res.json({
      found,
      customerName,
      customerEmail,
      customerPhone,
      totalBookings: ticketResults.length,
      totalAuthRecords: authResults.length,
      totalCalls: callResults.length,
      bookings: ticketResults.map(t => ({
        id: t._id,
        name: t.passengerName,
        email: t.passengerEmail,
        confirmationCode: t.confirmationCode,
        airline: t.airlineCode,
        type: t.ticketType,
        requestFor: t.requestFor,
        status: t.status,
        consultant: t.consultant,
        date: t.createdAt,
      })),
      authRecords: authResults.map(a => ({
        id: a._id,
        name: a.cardholderName,
        email: a.customerEmail,
        bookingRef: a.bookingReference,
        company: a.companyName,
        amount: a.amount,
        status: a.status,
        date: a.sentAt,
      })),
      recentCalls: callResults.map(c => ({
        id: c._id,
        source: c.sourceNumber,
        destination: c.destination,
        duration: c.callDuration,
        status: c.status,
        notes: c.callConversation,
        agent: c.user,
        date: c.createdAt,
      })),
    });
  } catch (error) {
    console.error('Caller ID lookup error:', error);
    return res.status(500).json({ message: 'Caller ID lookup failed', error: error.message });
  }
};

module.exports = { lookupCallerId };
