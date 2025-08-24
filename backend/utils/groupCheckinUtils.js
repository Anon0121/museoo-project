const mysql = require('mysql2/promise');

/**
 * Calculate the group arrival time based on individual visitor check-in times
 * @param {number} bookingId - The booking ID
 * @param {Object} pool - Database connection pool
 * @returns {Object} - Object containing group arrival time and visitor check-in details
 */
async function calculateGroupArrivalTime(bookingId, pool) {
  try {
    // Get all visitor check-in times for this booking
    const [visitors] = await pool.query(`
      SELECT 
        v.visitor_id,
        v.first_name,
        v.last_name,
        v.checkin_time,
        v.is_main_visitor,
        'main' as visitor_type
      FROM visitors v
      WHERE v.booking_id = ? AND v.status = 'visited' AND v.checkin_time IS NOT NULL
      
      UNION ALL
      
      SELECT 
        av.token_id as visitor_id,
        JSON_UNQUOTE(JSON_EXTRACT(av.details, '$.firstName')) as first_name,
        JSON_UNQUOTE(JSON_EXTRACT(av.details, '$.lastName')) as last_name,
        av.checkin_time,
        false as is_main_visitor,
        'additional' as visitor_type
      FROM additional_visitors av
      WHERE av.booking_id = ? AND av.status = 'checked-in' AND av.checkin_time IS NOT NULL
      
      ORDER BY checkin_time ASC
    `, [bookingId, bookingId]);

    if (visitors.length === 0) {
      return {
        groupArrivalTime: null,
        totalVisitors: 0,
        checkedInVisitors: 0,
        visitorCheckins: [],
        message: 'No visitors have checked in yet'
      };
    }

    // Calculate group arrival time (earliest check-in time)
    const groupArrivalTime = new Date(Math.min(...visitors.map(v => new Date(v.checkin_time))));
    
    // Get total expected visitors
    const [bookingInfo] = await pool.query(`
      SELECT 
        (SELECT COUNT(*) FROM visitors WHERE booking_id = ? AND is_main_visitor = true) as main_visitors,
        (SELECT COUNT(*) FROM additional_visitors WHERE booking_id = ?) as additional_visitors
      FROM bookings WHERE booking_id = ?
    `, [bookingId, bookingId, bookingId]);

    const totalVisitors = bookingInfo[0].main_visitors + bookingInfo[0].additional_visitors;
    const checkedInVisitors = visitors.length;

    return {
      groupArrivalTime: groupArrivalTime.toISOString(),
      totalVisitors,
      checkedInVisitors,
      visitorCheckins: visitors.map(v => ({
        visitorId: v.visitor_id,
        name: `${v.first_name} ${v.last_name}`,
        checkinTime: v.checkin_time,
        isMainVisitor: v.is_main_visitor,
        visitorType: v.visitor_type
      })),
      message: `Group arrived at ${groupArrivalTime.toLocaleString()}`
    };
  } catch (error) {
    console.error('Error calculating group arrival time:', error);
    throw error;
  }
}

/**
 * Get detailed check-in information for a group booking
 * @param {number} bookingId - The booking ID
 * @param {Object} pool - Database connection pool
 * @returns {Object} - Detailed check-in information
 */
async function getGroupCheckinDetails(bookingId, pool) {
  try {
    // Get booking information
    const [bookingRows] = await pool.query(`
      SELECT * FROM bookings WHERE booking_id = ?
    `, [bookingId]);

    if (bookingRows.length === 0) {
      throw new Error('Booking not found');
    }

    const booking = bookingRows[0];

    // Get main visitors
    const [mainVisitors] = await pool.query(`
      SELECT 
        visitor_id,
        first_name,
        last_name,
        email,
        gender,
        visitor_type,
        address,
        purpose,
        institution,
        status,
        checkin_time,
        created_at
      FROM visitors 
      WHERE booking_id = ? AND is_main_visitor = true
      ORDER BY checkin_time ASC
    `, [bookingId]);

    // Get additional visitors
    const [additionalVisitors] = await pool.query(`
      SELECT 
        token_id,
        email,
        details,
        status,
        checkin_time,
        created_at
      FROM additional_visitors 
      WHERE booking_id = ?
      ORDER BY checkin_time ASC
    `, [bookingId]);

    // Calculate group arrival time
    const arrivalInfo = await calculateGroupArrivalTime(bookingId, pool);

    return {
      booking: {
        id: booking.booking_id,
        name: `${booking.first_name} ${booking.last_name}`,
        date: booking.date,
        timeSlot: booking.time_slot,
        type: booking.type,
        status: booking.status,
        totalVisitors: booking.total_visitors
      },
      groupArrival: arrivalInfo,
      mainVisitors: mainVisitors.map(v => ({
        ...v,
        name: `${v.first_name} ${v.last_name}`,
        checkinTimeFormatted: v.checkin_time ? new Date(v.checkin_time).toLocaleString() : null
      })),
      additionalVisitors: additionalVisitors.map(av => {
        const details = av.details ? JSON.parse(av.details) : {};
        return {
          ...av,
          firstName: details.firstName || '',
          lastName: details.lastName || '',
          name: `${details.firstName || ''} ${details.lastName || ''}`.trim(),
          gender: details.gender || '',
          visitorType: details.visitorType || '',
          address: details.address || '',
          institution: details.institution || '',
          checkinTimeFormatted: av.checkin_time ? new Date(av.checkin_time).toLocaleString() : null
        };
      }),
      summary: {
        totalExpected: arrivalInfo.totalVisitors,
        totalCheckedIn: arrivalInfo.checkedInVisitors,
        checkinProgress: `${arrivalInfo.checkedInVisitors}/${arrivalInfo.totalVisitors} visitors checked in`,
        isComplete: arrivalInfo.checkedInVisitors >= arrivalInfo.totalVisitors
      }
    };
  } catch (error) {
    console.error('Error getting group check-in details:', error);
    throw error;
  }
}

/**
 * Get check-in statistics for a specific date range
 * @param {Date} startDate - Start date
 * @param {Date} endDate - End date
 * @param {Object} pool - Database connection pool
 * @returns {Object} - Check-in statistics
 */
async function getCheckinStatistics(startDate, endDate, pool) {
  try {
    const [stats] = await pool.query(`
      SELECT 
        DATE(checkin_time) as checkin_date,
        COUNT(*) as total_checkins,
        COUNT(DISTINCT booking_id) as unique_groups,
        MIN(checkin_time) as first_checkin,
        MAX(checkin_time) as last_checkin,
        AVG(TIME_TO_SEC(TIME(checkin_time))) as avg_checkin_time_seconds
      FROM (
        SELECT booking_id, checkin_time FROM visitors 
        WHERE checkin_time BETWEEN ? AND ? AND status = 'visited'
        UNION ALL
        SELECT booking_id, checkin_time FROM additional_visitors 
        WHERE checkin_time BETWEEN ? AND ? AND status = 'checked-in'
      ) all_checkins
      GROUP BY DATE(checkin_time)
      ORDER BY checkin_date DESC
    `, [startDate, endDate, startDate, endDate]);

    return stats.map(row => ({
      ...row,
      avgCheckinTime: row.avg_checkin_time_seconds ? 
        new Date(row.avg_checkin_time_seconds * 1000).toTimeString().split(' ')[0] : null
    }));
  } catch (error) {
    console.error('Error getting check-in statistics:', error);
    throw error;
  }
}

/**
 * Export check-in data for a group booking
 * @param {number} bookingId - The booking ID
 * @param {Object} pool - Database connection pool
 * @returns {Object} - Export-ready data
 */
async function exportGroupCheckinData(bookingId, pool) {
  try {
    const details = await getGroupCheckinDetails(bookingId, pool);
    
    return {
      exportDate: new Date().toISOString(),
      bookingInfo: details.booking,
      groupArrival: details.groupArrival.groupArrivalTime,
      visitors: [
        ...details.mainVisitors.map(v => ({
          type: 'Main Visitor',
          name: v.name,
          email: v.email,
          checkinTime: v.checkin_time,
          status: v.status
        })),
        ...details.additionalVisitors.map(av => ({
          type: 'Additional Visitor',
          name: av.name,
          email: av.email,
          checkinTime: av.checkin_time,
          status: av.status
        }))
      ].sort((a, b) => new Date(a.checkinTime) - new Date(b.checkinTime)),
      summary: details.summary
    };
  } catch (error) {
    console.error('Error exporting group check-in data:', error);
    throw error;
  }
}

module.exports = {
  calculateGroupArrivalTime,
  getGroupCheckinDetails,
  getCheckinStatistics,
  exportGroupCheckinData
};
