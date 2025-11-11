-- ============================================
-- Hospital Queue Management System - Database Schema
-- Version: 1.0.0
-- Date: 2025-11-10
-- ============================================

-- Enable UUID extension (optional, if you want to use UUIDs)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Drop existing tables if they exist (for clean installation)
DROP TABLE IF EXISTS daily_statistics CASCADE;
DROP TABLE IF EXISTS audit_logs CASCADE;
DROP TABLE IF EXISTS system_settings CASCADE;
DROP TABLE IF EXISTS sms_notifications CASCADE;
DROP TABLE IF EXISTS tickets CASCADE;
DROP TABLE IF EXISTS patients CASCADE;
DROP TABLE IF EXISTS doctors CASCADE;
DROP TABLE IF EXISTS clinics CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- ============================================
-- Table 1: users (المستخدمون)
-- ============================================
CREATE TABLE users (
    user_id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE,
    phone VARCHAR(20),
    role VARCHAR(20) NOT NULL CHECK (role IN ('super_admin', 'admin', 'doctor', 'receptionist')),
    is_active BOOLEAN DEFAULT true,
    last_login TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for users table
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_email ON users(email);

-- Comment on users table
COMMENT ON TABLE users IS 'System users with different roles (super_admin, admin, doctor, receptionist)';
COMMENT ON COLUMN users.role IS 'User role: super_admin, admin, doctor, receptionist';

-- ============================================
-- Table 2: clinics (العيادات)
-- ============================================
CREATE TABLE clinics (
    clinic_id SERIAL PRIMARY KEY,
    clinic_name_ar VARCHAR(100) NOT NULL,
    clinic_name_en VARCHAR(100) NOT NULL,
    clinic_code VARCHAR(10) UNIQUE NOT NULL,
    department VARCHAR(50),
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'closed')),
    average_time_per_patient INTEGER DEFAULT 15, -- بالدقائق
    working_hours_start TIME DEFAULT '08:00:00',
    working_hours_end TIME DEFAULT '14:00:00',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for clinics table
CREATE INDEX idx_clinics_status ON clinics(status);
CREATE INDEX idx_clinics_code ON clinics(clinic_code);
CREATE INDEX idx_clinics_department ON clinics(department);

-- Comment on clinics table
COMMENT ON TABLE clinics IS 'Hospital clinics/departments';
COMMENT ON COLUMN clinics.status IS 'Clinic status: active, inactive, closed';
COMMENT ON COLUMN clinics.average_time_per_patient IS 'Average service time per patient in minutes';

-- ============================================
-- Table 3: doctors (الأطباء)
-- ============================================
CREATE TABLE doctors (
    doctor_id SERIAL PRIMARY KEY,
    user_id INTEGER UNIQUE REFERENCES users(user_id) ON DELETE CASCADE,
    clinic_id INTEGER REFERENCES clinics(clinic_id) ON DELETE SET NULL,
    specialization VARCHAR(100),
    license_number VARCHAR(50) UNIQUE,
    is_available BOOLEAN DEFAULT false,
    current_status VARCHAR(20) DEFAULT 'offline' CHECK (current_status IN ('online', 'busy', 'break', 'offline')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for doctors table
CREATE INDEX idx_doctors_user ON doctors(user_id);
CREATE INDEX idx_doctors_clinic ON doctors(clinic_id);
CREATE INDEX idx_doctors_status ON doctors(current_status);

-- Comment on doctors table
COMMENT ON TABLE doctors IS 'Doctor profiles linked to user accounts';
COMMENT ON COLUMN doctors.current_status IS 'Doctor current status: online, busy, break, offline';

-- ============================================
-- Table 4: patients (المرضى)
-- ============================================
CREATE TABLE patients (
    patient_id SERIAL PRIMARY KEY,
    medical_record_number VARCHAR(50) UNIQUE,
    full_name VARCHAR(100) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    national_id VARCHAR(20) UNIQUE,
    date_of_birth DATE,
    gender VARCHAR(10) CHECK (gender IN ('male', 'female')),
    email VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for patients table
CREATE INDEX idx_patients_mrn ON patients(medical_record_number);
CREATE INDEX idx_patients_phone ON patients(phone);
CREATE INDEX idx_patients_national_id ON patients(national_id);
CREATE INDEX idx_patients_name ON patients(full_name);

-- Comment on patients table
COMMENT ON TABLE patients IS 'Patient information and medical records';
COMMENT ON COLUMN patients.medical_record_number IS 'Unique medical record number (MRN)';

-- ============================================
-- Table 5: tickets (التذاكر)
-- ============================================
CREATE TABLE tickets (
    ticket_id SERIAL PRIMARY KEY,
    ticket_number VARCHAR(20) UNIQUE NOT NULL,
    clinic_id INTEGER NOT NULL REFERENCES clinics(clinic_id) ON DELETE CASCADE,
    patient_id INTEGER NOT NULL REFERENCES patients(patient_id) ON DELETE CASCADE,
    doctor_id INTEGER REFERENCES doctors(doctor_id) ON DELETE SET NULL,
    issued_by INTEGER REFERENCES users(user_id) ON DELETE SET NULL,
    status VARCHAR(20) DEFAULT 'waiting' CHECK (status IN ('waiting', 'called', 'serving', 'completed', 'cancelled', 'no_show')),
    priority INTEGER DEFAULT 0 CHECK (priority >= 0 AND priority <= 2), -- 0: عادي, 1: أولوية, 2: طارئ
    queue_position INTEGER,
    issued_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    called_at TIMESTAMP,
    serving_started_at TIMESTAMP,
    completed_at TIMESTAMP,
    estimated_time INTEGER, -- الوقت المتوقع بالدقائق
    actual_service_time INTEGER, -- الوقت الفعلي بالدقائق
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for tickets table
CREATE INDEX idx_tickets_number ON tickets(ticket_number);
CREATE INDEX idx_tickets_status ON tickets(status);
CREATE INDEX idx_tickets_clinic ON tickets(clinic_id);
CREATE INDEX idx_tickets_patient ON tickets(patient_id);
CREATE INDEX idx_tickets_doctor ON tickets(doctor_id);
CREATE INDEX idx_tickets_date ON tickets(DATE(issued_at));
CREATE INDEX idx_tickets_queue ON tickets(clinic_id, status, priority DESC, issued_at);

-- Comment on tickets table
COMMENT ON TABLE tickets IS 'Patient tickets for clinic queue management';
COMMENT ON COLUMN tickets.status IS 'Ticket status: waiting, called, serving, completed, cancelled, no_show';
COMMENT ON COLUMN tickets.priority IS 'Priority level: 0 (normal), 1 (priority), 2 (emergency)';

-- ============================================
-- Table 6: sms_notifications (إشعارات SMS)
-- ============================================
CREATE TABLE sms_notifications (
    notification_id SERIAL PRIMARY KEY,
    ticket_id INTEGER REFERENCES tickets(ticket_id) ON DELETE CASCADE,
    phone VARCHAR(20) NOT NULL,
    message TEXT NOT NULL,
    notification_type VARCHAR(20) CHECK (notification_type IN ('issued', 'reminder', 'called')),
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed')),
    sent_at TIMESTAMP,
    error_message TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for sms_notifications table
CREATE INDEX idx_sms_ticket ON sms_notifications(ticket_id);
CREATE INDEX idx_sms_status ON sms_notifications(status);
CREATE INDEX idx_sms_type ON sms_notifications(notification_type);
CREATE INDEX idx_sms_created ON sms_notifications(created_at);

-- Comment on sms_notifications table
COMMENT ON TABLE sms_notifications IS 'SMS notification logs and status';
COMMENT ON COLUMN sms_notifications.notification_type IS 'Notification type: issued, reminder, called';
COMMENT ON COLUMN sms_notifications.status IS 'SMS status: pending, sent, failed';

-- ============================================
-- Table 7: audit_logs (سجلات التدقيق)
-- ============================================
CREATE TABLE audit_logs (
    log_id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(user_id) ON DELETE SET NULL,
    action VARCHAR(50) NOT NULL,
    entity_type VARCHAR(50),
    entity_id INTEGER,
    old_values JSONB,
    new_values JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for audit_logs table
CREATE INDEX idx_audit_user ON audit_logs(user_id);
CREATE INDEX idx_audit_action ON audit_logs(action);
CREATE INDEX idx_audit_entity ON audit_logs(entity_type, entity_id);
CREATE INDEX idx_audit_date ON audit_logs(DATE(created_at));

-- Comment on audit_logs table
COMMENT ON TABLE audit_logs IS 'System audit trail for all critical operations';
COMMENT ON COLUMN audit_logs.action IS 'Action performed: CREATE, UPDATE, DELETE, LOGIN, etc.';

-- ============================================
-- Table 8: system_settings (إعدادات النظام)
-- ============================================
CREATE TABLE system_settings (
    setting_id SERIAL PRIMARY KEY,
    setting_key VARCHAR(50) UNIQUE NOT NULL,
    setting_value TEXT,
    setting_type VARCHAR(20) CHECK (setting_type IN ('string', 'number', 'boolean', 'json')),
    description TEXT,
    is_public BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Index for system_settings table
CREATE INDEX idx_settings_key ON system_settings(setting_key);

-- Comment on system_settings table
COMMENT ON TABLE system_settings IS 'System-wide configuration settings';
COMMENT ON COLUMN system_settings.is_public IS 'Whether setting is visible to non-admin users';

-- ============================================
-- Table 9: daily_statistics (الإحصائيات اليومية)
-- ============================================
CREATE TABLE daily_statistics (
    stat_id SERIAL PRIMARY KEY,
    stat_date DATE NOT NULL,
    clinic_id INTEGER REFERENCES clinics(clinic_id) ON DELETE CASCADE,
    doctor_id INTEGER REFERENCES doctors(doctor_id) ON DELETE CASCADE,
    total_tickets INTEGER DEFAULT 0,
    completed_tickets INTEGER DEFAULT 0,
    cancelled_tickets INTEGER DEFAULT 0,
    no_show_tickets INTEGER DEFAULT 0,
    average_service_time INTEGER, -- بالدقائق
    average_waiting_time INTEGER, -- بالدقائق
    total_patients INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(stat_date, clinic_id, doctor_id)
);

-- Indexes for daily_statistics table
CREATE INDEX idx_stats_date ON daily_statistics(stat_date);
CREATE INDEX idx_stats_clinic ON daily_statistics(clinic_id);
CREATE INDEX idx_stats_doctor ON daily_statistics(doctor_id);
CREATE INDEX idx_stats_date_clinic ON daily_statistics(stat_date, clinic_id);

-- Comment on daily_statistics table
COMMENT ON TABLE daily_statistics IS 'Daily aggregated statistics per clinic and doctor';
COMMENT ON COLUMN daily_statistics.average_service_time IS 'Average service time in minutes';
COMMENT ON COLUMN daily_statistics.average_waiting_time IS 'Average waiting time in minutes';

-- ============================================
-- Functions and Triggers
-- ============================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply updated_at trigger to relevant tables
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_clinics_updated_at BEFORE UPDATE ON clinics
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_doctors_updated_at BEFORE UPDATE ON doctors
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_patients_updated_at BEFORE UPDATE ON patients
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tickets_updated_at BEFORE UPDATE ON tickets
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_system_settings_updated_at BEFORE UPDATE ON system_settings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- Function to generate ticket number
-- ============================================
CREATE OR REPLACE FUNCTION generate_ticket_number(clinic_code_param VARCHAR)
RETURNS VARCHAR AS $$
DECLARE
    today_date DATE := CURRENT_DATE;
    ticket_count INTEGER;
    new_ticket_number VARCHAR(20);
BEGIN
    -- Count today's tickets for this clinic
    SELECT COUNT(*) INTO ticket_count
    FROM tickets t
    JOIN clinics c ON t.clinic_id = c.clinic_id
    WHERE c.clinic_code = clinic_code_param
    AND DATE(t.issued_at) = today_date;

    -- Generate ticket number: CLINIC_CODE-SEQUENCE (e.g., INT-001)
    new_ticket_number := clinic_code_param || '-' || LPAD((ticket_count + 1)::TEXT, 3, '0');

    RETURN new_ticket_number;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- Function to calculate queue position
-- ============================================
CREATE OR REPLACE FUNCTION calculate_queue_position(clinic_id_param INTEGER)
RETURNS INTEGER AS $$
DECLARE
    position_count INTEGER;
BEGIN
    -- Count waiting tickets for this clinic
    SELECT COUNT(*) INTO position_count
    FROM tickets
    WHERE clinic_id = clinic_id_param
    AND status = 'waiting';

    RETURN position_count + 1;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- Views for common queries
-- ============================================

-- View: Current queue status for all clinics
CREATE OR REPLACE VIEW v_clinic_queue_status AS
SELECT
    c.clinic_id,
    c.clinic_name_ar,
    c.clinic_name_en,
    c.clinic_code,
    c.status as clinic_status,
    d.doctor_id,
    u.full_name as doctor_name,
    d.current_status as doctor_status,
    COUNT(CASE WHEN t.status = 'waiting' THEN 1 END) as waiting_count,
    COUNT(CASE WHEN t.status = 'serving' THEN 1 END) as serving_count,
    (SELECT ticket_number FROM tickets WHERE clinic_id = c.clinic_id AND status = 'serving' LIMIT 1) as current_ticket,
    (SELECT ticket_number FROM tickets WHERE clinic_id = c.clinic_id AND status = 'waiting' ORDER BY priority DESC, issued_at ASC LIMIT 1) as next_ticket
FROM clinics c
LEFT JOIN doctors d ON c.clinic_id = d.clinic_id
LEFT JOIN users u ON d.user_id = u.user_id
LEFT JOIN tickets t ON c.clinic_id = t.clinic_id AND t.status IN ('waiting', 'serving') AND DATE(t.issued_at) = CURRENT_DATE
GROUP BY c.clinic_id, c.clinic_name_ar, c.clinic_name_en, c.clinic_code, c.status, d.doctor_id, u.full_name, d.current_status;

-- View: Today's statistics summary
CREATE OR REPLACE VIEW v_today_statistics AS
SELECT
    c.clinic_id,
    c.clinic_name_ar,
    c.clinic_name_en,
    COUNT(CASE WHEN t.status = 'completed' THEN 1 END) as completed_today,
    COUNT(CASE WHEN t.status = 'waiting' THEN 1 END) as waiting_now,
    COUNT(CASE WHEN t.status = 'no_show' THEN 1 END) as no_show_today,
    COUNT(CASE WHEN t.status = 'cancelled' THEN 1 END) as cancelled_today,
    AVG(CASE WHEN t.status = 'completed' THEN t.actual_service_time END) as avg_service_time,
    COUNT(*) as total_tickets_today
FROM clinics c
LEFT JOIN tickets t ON c.clinic_id = t.clinic_id AND DATE(t.issued_at) = CURRENT_DATE
GROUP BY c.clinic_id, c.clinic_name_ar, c.clinic_name_en;

-- ============================================
-- Grants and Permissions
-- ============================================

-- Note: Adjust these based on your PostgreSQL users
-- Example: GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO hospital_user;
-- Example: GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO hospital_user;

-- ============================================
-- Success Message
-- ============================================

DO $$
BEGIN
    RAISE NOTICE '============================================';
    RAISE NOTICE 'Hospital Queue Management System';
    RAISE NOTICE 'Database schema created successfully!';
    RAISE NOTICE '============================================';
    RAISE NOTICE 'Tables created: 9';
    RAISE NOTICE 'Indexes created: Multiple';
    RAISE NOTICE 'Functions created: 3';
    RAISE NOTICE 'Views created: 2';
    RAISE NOTICE 'Triggers created: 6';
    RAISE NOTICE '============================================';
    RAISE NOTICE 'Next step: Run seed.sql to populate initial data';
    RAISE NOTICE '============================================';
END $$;
