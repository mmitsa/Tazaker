const { query } = require('../config/database');
const { success, error } = require('../utils/response');
const logger = require('../utils/logger');

/**
 * Get daily statistics
 */
const getDailyStatistics = async (req, res) => {
  try {
    const { date } = req.query;
    const targetDate = date || new Date().toISOString().split('T')[0];

    const result = await query(
      `SELECT
        COALESCE(COUNT(*), 0) as total_tickets,
        COALESCE(COUNT(*) FILTER (WHERE status = 'completed'), 0) as completed_tickets,
        COALESCE(COUNT(*) FILTER (WHERE status = 'cancelled'), 0) as cancelled_tickets,
        COALESCE(COUNT(*) FILTER (WHERE status = 'no_show'), 0) as no_show_tickets,
        COALESCE(COUNT(*) FILTER (WHERE status = 'waiting'), 0) as waiting_tickets,
        COALESCE(AVG(actual_service_time) FILTER (WHERE actual_service_time IS NOT NULL), 0) as avg_service_time,
        COALESCE(MAX(actual_service_time), 0) as max_service_time,
        COALESCE(MIN(actual_service_time) FILTER (WHERE actual_service_time > 0), 0) as min_service_time
      FROM tickets
      WHERE DATE(issued_at) = $1`,
      [targetDate]
    );

    const stats = result.rows[0];

    return success(res, {
      date: targetDate,
      statistics: {
        total_tickets: parseInt(stats.total_tickets),
        completed_tickets: parseInt(stats.completed_tickets),
        cancelled_tickets: parseInt(stats.cancelled_tickets),
        no_show_tickets: parseInt(stats.no_show_tickets),
        waiting_tickets: parseInt(stats.waiting_tickets),
        avg_service_time: parseFloat(stats.avg_service_time).toFixed(2),
        max_service_time: parseInt(stats.max_service_time),
        min_service_time: parseInt(stats.min_service_time),
      },
    });
  } catch (err) {
    logger.error('Get daily statistics error:', err);
    return error(res, 'Failed to get daily statistics', 500);
  }
};

/**
 * Get clinic performance report
 */
const getClinicPerformance = async (req, res) => {
  try {
    const { clinic_id, start_date, end_date } = req.query;

    let queryText = `
      SELECT
        c.clinic_id,
        c.clinic_name_ar,
        c.clinic_name_en,
        c.clinic_code,
        COUNT(t.ticket_id) as total_tickets,
        COUNT(t.ticket_id) FILTER (WHERE t.status = 'completed') as completed_tickets,
        COUNT(t.ticket_id) FILTER (WHERE t.status = 'cancelled') as cancelled_tickets,
        COUNT(t.ticket_id) FILTER (WHERE t.status = 'no_show') as no_show_tickets,
        AVG(t.actual_service_time) FILTER (WHERE t.actual_service_time IS NOT NULL) as avg_service_time,
        AVG(EXTRACT(EPOCH FROM (t.called_at - t.issued_at)) / 60) FILTER (WHERE t.called_at IS NOT NULL) as avg_wait_time,
        c.average_time_per_patient as estimated_time_per_patient
      FROM clinics c
      LEFT JOIN tickets t ON c.clinic_id = t.clinic_id
    `;

    const params = [];
    const conditions = [];

    if (start_date && end_date) {
      conditions.push(`DATE(t.issued_at) BETWEEN $${params.length + 1} AND $${params.length + 2}`);
      params.push(start_date, end_date);
    }

    if (clinic_id) {
      conditions.push(`c.clinic_id = $${params.length + 1}`);
      params.push(clinic_id);
    }

    if (conditions.length > 0) {
      queryText += ' WHERE ' + conditions.join(' AND ');
    }

    queryText += ' GROUP BY c.clinic_id, c.clinic_name_ar, c.clinic_name_en, c.clinic_code, c.average_time_per_patient ORDER BY total_tickets DESC';

    const result = await query(queryText, params);

    const report = result.rows.map((row) => ({
      clinic_id: row.clinic_id,
      clinic_name_ar: row.clinic_name_ar,
      clinic_name_en: row.clinic_name_en,
      clinic_code: row.clinic_code,
      total_tickets: parseInt(row.total_tickets) || 0,
      completed_tickets: parseInt(row.completed_tickets) || 0,
      cancelled_tickets: parseInt(row.cancelled_tickets) || 0,
      no_show_tickets: parseInt(row.no_show_tickets) || 0,
      avg_service_time: parseFloat(row.avg_service_time || 0).toFixed(2),
      avg_wait_time: parseFloat(row.avg_wait_time || 0).toFixed(2),
      estimated_time_per_patient: row.estimated_time_per_patient,
      completion_rate: row.total_tickets > 0
        ? ((parseInt(row.completed_tickets) / parseInt(row.total_tickets)) * 100).toFixed(2)
        : 0,
    }));

    return success(res, {
      start_date,
      end_date,
      clinics: report,
      count: report.length,
    });
  } catch (err) {
    logger.error('Get clinic performance error:', err);
    return error(res, 'Failed to get clinic performance', 500);
  }
};

/**
 * Get doctor performance report
 */
const getDoctorPerformance = async (req, res) => {
  try {
    const { doctor_id, clinic_id, start_date, end_date } = req.query;

    let queryText = `
      SELECT
        d.doctor_id,
        d.full_name,
        d.specialization,
        c.clinic_name_ar,
        c.clinic_name_en,
        COUNT(t.ticket_id) as total_patients,
        COUNT(t.ticket_id) FILTER (WHERE t.status = 'completed') as completed_patients,
        COUNT(t.ticket_id) FILTER (WHERE t.status = 'no_show') as no_show_patients,
        AVG(t.actual_service_time) FILTER (WHERE t.actual_service_time IS NOT NULL) as avg_service_time,
        SUM(t.actual_service_time) FILTER (WHERE t.actual_service_time IS NOT NULL) as total_service_time,
        MIN(t.actual_service_time) FILTER (WHERE t.actual_service_time > 0) as min_service_time,
        MAX(t.actual_service_time) as max_service_time
      FROM doctors d
      LEFT JOIN tickets t ON d.doctor_id = t.doctor_id
      LEFT JOIN clinics c ON d.clinic_id = c.clinic_id
    `;

    const params = [];
    const conditions = [];

    if (start_date && end_date) {
      conditions.push(`DATE(t.issued_at) BETWEEN $${params.length + 1} AND $${params.length + 2}`);
      params.push(start_date, end_date);
    }

    if (doctor_id) {
      conditions.push(`d.doctor_id = $${params.length + 1}`);
      params.push(doctor_id);
    }

    if (clinic_id) {
      conditions.push(`d.clinic_id = $${params.length + 1}`);
      params.push(clinic_id);
    }

    if (conditions.length > 0) {
      queryText += ' WHERE ' + conditions.join(' AND ');
    }

    queryText += ' GROUP BY d.doctor_id, d.full_name, d.specialization, c.clinic_name_ar, c.clinic_name_en ORDER BY total_patients DESC';

    const result = await query(queryText, params);

    const report = result.rows.map((row) => ({
      doctor_id: row.doctor_id,
      full_name: row.full_name,
      specialization: row.specialization,
      clinic_name_ar: row.clinic_name_ar,
      clinic_name_en: row.clinic_name_en,
      total_patients: parseInt(row.total_patients) || 0,
      completed_patients: parseInt(row.completed_patients) || 0,
      no_show_patients: parseInt(row.no_show_patients) || 0,
      avg_service_time: parseFloat(row.avg_service_time || 0).toFixed(2),
      total_service_time: parseInt(row.total_service_time) || 0,
      min_service_time: parseInt(row.min_service_time) || 0,
      max_service_time: parseInt(row.max_service_time) || 0,
      completion_rate: row.total_patients > 0
        ? ((parseInt(row.completed_patients) / parseInt(row.total_patients)) * 100).toFixed(2)
        : 0,
    }));

    return success(res, {
      start_date,
      end_date,
      doctors: report,
      count: report.length,
    });
  } catch (err) {
    logger.error('Get doctor performance error:', err);
    return error(res, 'Failed to get doctor performance', 500);
  }
};

/**
 * Get wait time analytics
 */
const getWaitTimeAnalytics = async (req, res) => {
  try {
    const { clinic_id, start_date, end_date } = req.query;

    let queryText = `
      SELECT
        DATE(t.issued_at) as date,
        c.clinic_name_ar,
        c.clinic_name_en,
        COUNT(t.ticket_id) as total_tickets,
        AVG(EXTRACT(EPOCH FROM (t.called_at - t.issued_at)) / 60) FILTER (WHERE t.called_at IS NOT NULL) as avg_wait_time,
        MIN(EXTRACT(EPOCH FROM (t.called_at - t.issued_at)) / 60) FILTER (WHERE t.called_at IS NOT NULL) as min_wait_time,
        MAX(EXTRACT(EPOCH FROM (t.called_at - t.issued_at)) / 60) FILTER (WHERE t.called_at IS NOT NULL) as max_wait_time,
        PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY EXTRACT(EPOCH FROM (t.called_at - t.issued_at)) / 60) FILTER (WHERE t.called_at IS NOT NULL) as median_wait_time
      FROM tickets t
      JOIN clinics c ON t.clinic_id = c.clinic_id
    `;

    const params = [];
    const conditions = [];

    if (start_date && end_date) {
      conditions.push(`DATE(t.issued_at) BETWEEN $${params.length + 1} AND $${params.length + 2}`);
      params.push(start_date, end_date);
    } else {
      // Default to last 7 days
      conditions.push(`DATE(t.issued_at) >= CURRENT_DATE - INTERVAL '7 days'`);
    }

    if (clinic_id) {
      conditions.push(`t.clinic_id = $${params.length + 1}`);
      params.push(clinic_id);
    }

    queryText += ' WHERE ' + conditions.join(' AND ');
    queryText += ' GROUP BY DATE(t.issued_at), c.clinic_name_ar, c.clinic_name_en ORDER BY date DESC';

    const result = await query(queryText, params);

    const analytics = result.rows.map((row) => ({
      date: row.date,
      clinic_name_ar: row.clinic_name_ar,
      clinic_name_en: row.clinic_name_en,
      total_tickets: parseInt(row.total_tickets),
      avg_wait_time: parseFloat(row.avg_wait_time || 0).toFixed(2),
      min_wait_time: parseFloat(row.min_wait_time || 0).toFixed(2),
      max_wait_time: parseFloat(row.max_wait_time || 0).toFixed(2),
      median_wait_time: parseFloat(row.median_wait_time || 0).toFixed(2),
    }));

    return success(res, {
      start_date,
      end_date,
      analytics,
      count: analytics.length,
    });
  } catch (err) {
    logger.error('Get wait time analytics error:', err);
    return error(res, 'Failed to get wait time analytics', 500);
  }
};

/**
 * Get queue analytics
 */
const getQueueAnalytics = async (req, res) => {
  try {
    const { clinic_id } = req.query;

    let queryText = `
      SELECT
        c.clinic_id,
        c.clinic_name_ar,
        c.clinic_name_en,
        c.clinic_code,
        COUNT(t.ticket_id) FILTER (WHERE t.status = 'waiting' AND DATE(t.issued_at) = CURRENT_DATE) as current_waiting,
        COUNT(t.ticket_id) FILTER (WHERE t.status = 'called' AND DATE(t.issued_at) = CURRENT_DATE) as currently_called,
        COUNT(t.ticket_id) FILTER (WHERE t.status = 'serving' AND DATE(t.issued_at) = CURRENT_DATE) as currently_serving,
        COUNT(t.ticket_id) FILTER (WHERE t.status = 'completed' AND DATE(t.issued_at) = CURRENT_DATE) as completed_today,
        AVG(t.queue_position) FILTER (WHERE DATE(t.issued_at) = CURRENT_DATE) as avg_queue_position,
        MAX(t.queue_position) FILTER (WHERE DATE(t.issued_at) = CURRENT_DATE) as max_queue_position
      FROM clinics c
      LEFT JOIN tickets t ON c.clinic_id = t.clinic_id
    `;

    const params = [];
    if (clinic_id) {
      queryText += ' WHERE c.clinic_id = $1';
      params.push(clinic_id);
    }

    queryText += ' GROUP BY c.clinic_id, c.clinic_name_ar, c.clinic_name_en, c.clinic_code';

    const result = await query(queryText, params);

    const analytics = result.rows.map((row) => ({
      clinic_id: row.clinic_id,
      clinic_name_ar: row.clinic_name_ar,
      clinic_name_en: row.clinic_name_en,
      clinic_code: row.clinic_code,
      current_waiting: parseInt(row.current_waiting) || 0,
      currently_called: parseInt(row.currently_called) || 0,
      currently_serving: parseInt(row.currently_serving) || 0,
      completed_today: parseInt(row.completed_today) || 0,
      avg_queue_position: parseFloat(row.avg_queue_position || 0).toFixed(2),
      max_queue_position: parseInt(row.max_queue_position) || 0,
    }));

    return success(res, {
      date: new Date().toISOString().split('T')[0],
      clinics: analytics,
      count: analytics.length,
    });
  } catch (err) {
    logger.error('Get queue analytics error:', err);
    return error(res, 'Failed to get queue analytics', 500);
  }
};

/**
 * Get SMS notification statistics
 */
const getSMSStatistics = async (req, res) => {
  try {
    const { start_date, end_date, notification_type } = req.query;

    let queryText = `
      SELECT
        notification_type,
        COUNT(*) as total_sent,
        COUNT(*) FILTER (WHERE status = 'sent') as successful,
        COUNT(*) FILTER (WHERE status = 'failed') as failed,
        COUNT(*) FILTER (WHERE status = 'pending') as pending
      FROM sms_notifications
    `;

    const params = [];
    const conditions = [];

    if (start_date && end_date) {
      conditions.push(`DATE(created_at) BETWEEN $${params.length + 1} AND $${params.length + 2}`);
      params.push(start_date, end_date);
    }

    if (notification_type) {
      conditions.push(`notification_type = $${params.length + 1}`);
      params.push(notification_type);
    }

    if (conditions.length > 0) {
      queryText += ' WHERE ' + conditions.join(' AND ');
    }

    queryText += ' GROUP BY notification_type';

    const result = await query(queryText, params);

    const statistics = result.rows.map((row) => ({
      notification_type: row.notification_type,
      total_sent: parseInt(row.total_sent),
      successful: parseInt(row.successful),
      failed: parseInt(row.failed),
      pending: parseInt(row.pending),
      success_rate: row.total_sent > 0
        ? ((parseInt(row.successful) / parseInt(row.total_sent)) * 100).toFixed(2)
        : 0,
    }));

    return success(res, {
      start_date,
      end_date,
      statistics,
      total: statistics.reduce((sum, stat) => sum + stat.total_sent, 0),
    });
  } catch (err) {
    logger.error('Get SMS statistics error:', err);
    return error(res, 'Failed to get SMS statistics', 500);
  }
};

/**
 * Get patient visit history
 */
const getPatientVisitHistory = async (req, res) => {
  try {
    const { patient_id } = req.params;
    const { limit = 50, offset = 0 } = req.query;

    const result = await query(
      `SELECT
        t.ticket_id,
        t.ticket_number,
        t.status,
        t.issued_at,
        t.called_at,
        t.completed_at,
        t.actual_service_time,
        t.priority,
        t.notes,
        c.clinic_name_ar,
        c.clinic_name_en,
        d.full_name as doctor_name,
        d.specialization
      FROM tickets t
      LEFT JOIN clinics c ON t.clinic_id = c.clinic_id
      LEFT JOIN doctors d ON t.doctor_id = d.doctor_id
      WHERE t.patient_id = $1
      ORDER BY t.issued_at DESC
      LIMIT $2 OFFSET $3`,
      [patient_id, limit, offset]
    );

    const countResult = await query(
      'SELECT COUNT(*) as total FROM tickets WHERE patient_id = $1',
      [patient_id]
    );

    return success(res, {
      patient_id: parseInt(patient_id),
      visits: result.rows,
      count: result.rows.length,
      total: parseInt(countResult.rows[0].total),
    });
  } catch (err) {
    logger.error('Get patient visit history error:', err);
    return error(res, 'Failed to get patient visit history', 500);
  }
};

/**
 * Get system overview (dashboard summary)
 */
const getSystemOverview = async (req, res) => {
  try {
    // Today's statistics
    const todayStats = await query(
      `SELECT
        COUNT(*) FILTER (WHERE DATE(issued_at) = CURRENT_DATE) as today_tickets,
        COUNT(*) FILTER (WHERE status = 'waiting' AND DATE(issued_at) = CURRENT_DATE) as currently_waiting,
        COUNT(*) FILTER (WHERE status = 'completed' AND DATE(issued_at) = CURRENT_DATE) as completed_today,
        COUNT(DISTINCT clinic_id) FILTER (WHERE DATE(issued_at) = CURRENT_DATE) as active_clinics,
        COUNT(DISTINCT doctor_id) FILTER (WHERE doctor_id IS NOT NULL AND DATE(issued_at) = CURRENT_DATE) as active_doctors
      FROM tickets`
    );

    // Average wait time today
    const waitTimeResult = await query(
      `SELECT AVG(EXTRACT(EPOCH FROM (called_at - issued_at)) / 60) as avg_wait_time
       FROM tickets
       WHERE DATE(issued_at) = CURRENT_DATE AND called_at IS NOT NULL`
    );

    // Active doctors count
    const activeDoctorsResult = await query(
      `SELECT COUNT(*) as count FROM doctors WHERE is_available = true AND current_status = 'online'`
    );

    // Total patients in system
    const totalPatientsResult = await query(
      `SELECT COUNT(*) as count FROM patients`
    );

    // Total clinics
    const totalClinicsResult = await query(
      `SELECT COUNT(*) as count FROM clinics WHERE status = 'active'`
    );

    const overview = {
      today: {
        total_tickets: parseInt(todayStats.rows[0].today_tickets) || 0,
        currently_waiting: parseInt(todayStats.rows[0].currently_waiting) || 0,
        completed_today: parseInt(todayStats.rows[0].completed_today) || 0,
        avg_wait_time: parseFloat(waitTimeResult.rows[0].avg_wait_time || 0).toFixed(2),
      },
      system: {
        total_patients: parseInt(totalPatientsResult.rows[0].count) || 0,
        total_clinics: parseInt(totalClinicsResult.rows[0].count) || 0,
        active_doctors: parseInt(activeDoctorsResult.rows[0].count) || 0,
        active_clinics_today: parseInt(todayStats.rows[0].active_clinics) || 0,
      },
      timestamp: new Date().toISOString(),
    };

    return success(res, overview);
  } catch (err) {
    logger.error('Get system overview error:', err);
    return error(res, 'Failed to get system overview', 500);
  }
};

module.exports = {
  getDailyStatistics,
  getClinicPerformance,
  getDoctorPerformance,
  getWaitTimeAnalytics,
  getQueueAnalytics,
  getSMSStatistics,
  getPatientVisitHistory,
  getSystemOverview,
};
