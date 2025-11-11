-- ============================================
-- Hospital Queue Management System - Seed Data
-- Version: 1.0.0
-- Date: 2025-11-10
-- ============================================

-- Clear existing data (optional - comment out if you want to keep existing data)
TRUNCATE TABLE daily_statistics, audit_logs, sms_notifications, tickets, patients, doctors, clinics, users RESTART IDENTITY CASCADE;

-- ============================================
-- Insert System Settings
-- ============================================
INSERT INTO system_settings (setting_key, setting_value, setting_type, description, is_public) VALUES
('hospital_name_ar', 'مستشفى الملك فيصل التخصصي', 'string', 'Hospital name in Arabic', true),
('hospital_name_en', 'King Faisal Specialist Hospital', 'string', 'Hospital name in English', true),
('sms_provider', 'twilio', 'string', 'SMS provider: twilio or mobily', false),
('reminder_threshold', '3', 'number', 'Number of patients before sending reminder SMS', false),
('auto_refresh_interval', '1000', 'number', 'Display screen auto-refresh interval in milliseconds', true),
('working_hours_start', '08:00', 'string', 'Hospital working hours start time', true),
('working_hours_end', '14:00', 'string', 'Hospital working hours end time', true),
('max_tickets_per_day', '500', 'number', 'Maximum tickets per day per clinic', false),
('enable_sms', 'true', 'boolean', 'Enable SMS notifications', false),
('default_language', 'ar', 'string', 'Default system language (ar/en)', true),
('ticket_validity_hours', '24', 'number', 'Ticket validity period in hours', false),
('allow_priority_tickets', 'true', 'boolean', 'Allow priority and emergency tickets', false);

-- ============================================
-- Insert Users (with bcrypt hashed passwords)
-- Note: All passwords are hashed version of "Admin@123"
-- In production, use proper bcrypt hashing library
-- ============================================

-- Super Admin
INSERT INTO users (username, password_hash, full_name, email, phone, role, is_active) VALUES
('admin', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'مدير النظام', 'admin@hospital.com', '+966501234567', 'super_admin', true);

-- Admin Users
INSERT INTO users (username, password_hash, full_name, email, phone, role, is_active) VALUES
('admin1', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'أحمد الإدارة', 'admin1@hospital.com', '+966501234568', 'admin', true),
('admin2', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'سارة الإدارة', 'admin2@hospital.com', '+966501234569', 'admin', true);

-- Receptionist Users
INSERT INTO users (username, password_hash, full_name, email, phone, role, is_active) VALUES
('receptionist1', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'نورة الاستقبال', 'rec1@hospital.com', '+966501234570', 'receptionist', true),
('receptionist2', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'فاطمة الاستقبال', 'rec2@hospital.com', '+966501234571', 'receptionist', true),
('receptionist3', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'ليلى الاستقبال', 'rec3@hospital.com', '+966501234572', 'receptionist', true);

-- Doctor Users
INSERT INTO users (username, password_hash, full_name, email, phone, role, is_active) VALUES
('doctor1', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'د. أحمد محمد', 'doctor1@hospital.com', '+966501234573', 'doctor', true),
('doctor2', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'د. سارة علي', 'doctor2@hospital.com', '+966501234574', 'doctor', true),
('doctor3', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'د. محمد خالد', 'doctor3@hospital.com', '+966501234575', 'doctor', true),
('doctor4', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'د. فاطمة حسن', 'doctor4@hospital.com', '+966501234576', 'doctor', true),
('doctor5', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'د. عبدالله سعيد', 'doctor5@hospital.com', '+966501234577', 'doctor', true),
('doctor6', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'د. نورة عبدالعزيز', 'doctor6@hospital.com', '+966501234578', 'doctor', true);

-- ============================================
-- Insert Clinics
-- ============================================
INSERT INTO clinics (clinic_name_ar, clinic_name_en, clinic_code, department, status, average_time_per_patient, working_hours_start, working_hours_end) VALUES
('عيادة الباطنية', 'Internal Medicine', 'INT', 'Internal Medicine', 'active', 15, '08:00:00', '14:00:00'),
('عيادة العظام', 'Orthopedics', 'ORTH', 'Orthopedics', 'active', 20, '08:00:00', '14:00:00'),
('عيادة الأطفال', 'Pediatrics', 'PED', 'Pediatrics', 'active', 12, '08:00:00', '14:00:00'),
('عيادة القلب', 'Cardiology', 'CARD', 'Cardiology', 'active', 18, '08:00:00', '14:00:00'),
('عيادة الأمراض الجلدية', 'Dermatology', 'DERM', 'Dermatology', 'active', 10, '08:00:00', '14:00:00'),
('عيادة الأنف والأذن والحنجرة', 'ENT', 'ENT', 'ENT', 'active', 15, '08:00:00', '14:00:00');

-- ============================================
-- Insert Doctors (linking users to clinics)
-- ============================================
INSERT INTO doctors (user_id, clinic_id, specialization, license_number, is_available, current_status) VALUES
(7, 1, 'Internal Medicine', 'LIC-001', false, 'offline'),  -- د. أحمد محمد - عيادة الباطنية
(8, 2, 'Orthopedics', 'LIC-002', false, 'offline'),        -- د. سارة علي - عيادة العظام
(9, 3, 'Pediatrics', 'LIC-003', false, 'offline'),         -- د. محمد خالد - عيادة الأطفال
(10, 4, 'Cardiology', 'LIC-004', false, 'offline'),        -- د. فاطمة حسن - عيادة القلب
(11, 5, 'Dermatology', 'LIC-005', false, 'offline'),       -- د. عبدالله سعيد - عيادة الجلدية
(12, 6, 'ENT', 'LIC-006', false, 'offline');               -- د. نورة عبدالعزيز - عيادة الأنف والأذن

-- ============================================
-- Insert Sample Patients
-- ============================================
INSERT INTO patients (medical_record_number, full_name, phone, national_id, date_of_birth, gender, email) VALUES
('MRN-000001', 'محمد علي أحمد', '+966501111111', '1012345678', '1985-05-15', 'male', 'mohamed.ali@example.com'),
('MRN-000002', 'فاطمة سعيد محمد', '+966502222222', '1023456789', '1990-08-22', 'female', 'fatima.saeed@example.com'),
('MRN-000003', 'أحمد خالد عبدالله', '+966503333333', '1034567890', '1978-12-10', 'male', 'ahmed.khaled@example.com'),
('MRN-000004', 'سارة محمود حسن', '+966504444444', '1045678901', '1995-03-30', 'female', 'sara.mahmoud@example.com'),
('MRN-000005', 'عبدالله إبراهيم علي', '+966505555555', '1056789012', '1982-07-18', 'male', 'abdullah.ibrahim@example.com'),
('MRN-000006', 'نورة عبدالعزيز سعد', '+966506666666', '1067890123', '1988-11-05', 'female', 'noura.abdulaziz@example.com'),
('MRN-000007', 'خالد محمد أحمد', '+966507777777', '1078901234', '1992-01-25', 'male', 'khaled.mohammed@example.com'),
('MRN-000008', 'ليلى حسن علي', '+966508888888', '1089012345', '1987-09-14', 'female', 'laila.hassan@example.com'),
('MRN-000009', 'يوسف عبدالله محمد', '+966509999999', '1090123456', '1980-04-08', 'male', 'yousef.abdullah@example.com'),
('MRN-000010', 'مريم سعد إبراهيم', '+966500000000', '1001234567', '1993-06-20', 'female', 'mariam.saad@example.com');

-- ============================================
-- Insert Sample Tickets (for demonstration)
-- These are sample tickets for TODAY
-- ============================================

-- Tickets for Internal Medicine Clinic (عيادة الباطنية)
INSERT INTO tickets (ticket_number, clinic_id, patient_id, issued_by, status, priority, queue_position, issued_at, estimated_time) VALUES
('INT-001', 1, 1, 4, 'completed', 0, 1, CURRENT_TIMESTAMP - INTERVAL '3 hours', 15),
('INT-002', 1, 2, 4, 'completed', 0, 2, CURRENT_TIMESTAMP - INTERVAL '2 hours 45 minutes', 15),
('INT-003', 1, 3, 4, 'waiting', 0, 3, CURRENT_TIMESTAMP - INTERVAL '30 minutes', 15),
('INT-004', 1, 4, 4, 'waiting', 1, 4, CURRENT_TIMESTAMP - INTERVAL '25 minutes', 15);

-- Tickets for Orthopedics Clinic (عيادة العظام)
INSERT INTO tickets (ticket_number, clinic_id, patient_id, issued_by, status, priority, queue_position, issued_at, estimated_time) VALUES
('ORTH-001', 2, 5, 5, 'completed', 0, 1, CURRENT_TIMESTAMP - INTERVAL '2 hours 30 minutes', 20),
('ORTH-002', 2, 6, 5, 'waiting', 0, 2, CURRENT_TIMESTAMP - INTERVAL '45 minutes', 20),
('ORTH-003', 2, 7, 5, 'waiting', 0, 3, CURRENT_TIMESTAMP - INTERVAL '20 minutes', 20);

-- Tickets for Pediatrics Clinic (عيادة الأطفال)
INSERT INTO tickets (ticket_number, clinic_id, patient_id, issued_by, status, priority, queue_position, issued_at, estimated_time) VALUES
('PED-001', 3, 8, 6, 'completed', 0, 1, CURRENT_TIMESTAMP - INTERVAL '2 hours', 12),
('PED-002', 3, 9, 6, 'completed', 0, 2, CURRENT_TIMESTAMP - INTERVAL '1 hour 45 minutes', 12),
('PED-003', 3, 10, 6, 'waiting', 2, 3, CURRENT_TIMESTAMP - INTERVAL '15 minutes', 12);

-- Tickets for Cardiology Clinic (عيادة القلب)
INSERT INTO tickets (ticket_number, clinic_id, patient_id, issued_by, status, priority, queue_position, issued_at, estimated_time) VALUES
('CARD-001', 4, 1, 4, 'completed', 0, 1, CURRENT_TIMESTAMP - INTERVAL '3 hours 30 minutes', 18),
('CARD-002', 4, 3, 4, 'waiting', 0, 2, CURRENT_TIMESTAMP - INTERVAL '1 hour', 18);

-- ============================================
-- Insert Sample SMS Notifications
-- ============================================
INSERT INTO sms_notifications (ticket_id, phone, message, notification_type, status, sent_at) VALUES
(1, '+966501111111', 'مرحباً محمد علي. تم إصدار تذكرة INT-001 لعيادة الباطنية. موقعك في القائمة: 1', 'issued', 'sent', CURRENT_TIMESTAMP - INTERVAL '3 hours'),
(2, '+966502222222', 'مرحباً فاطمة سعيد. تم إصدار تذكرة INT-002 لعيادة الباطنية. موقعك في القائمة: 2', 'issued', 'sent', CURRENT_TIMESTAMP - INTERVAL '2 hours 45 minutes'),
(3, '+966503333333', 'مرحباً أحمد خالد. تم إصدار تذكرة INT-003 لعيادة الباطنية. موقعك في القائمة: 3', 'issued', 'sent', CURRENT_TIMESTAMP - INTERVAL '30 minutes'),
(4, '+966504444444', 'مرحباً سارة محمود. تم إصدار تذكرة INT-004 لعيادة الباطنية. موقعك في القائمة: 4', 'issued', 'sent', CURRENT_TIMESTAMP - INTERVAL '25 minutes');

-- ============================================
-- Insert Sample Audit Logs
-- ============================================
INSERT INTO audit_logs (user_id, action, entity_type, entity_id, new_values, ip_address, user_agent) VALUES
(1, 'LOGIN', 'user', 1, '{"role": "super_admin"}', '192.168.1.100', 'Mozilla/5.0'),
(4, 'CREATE', 'ticket', 1, '{"ticket_number": "INT-001", "status": "waiting"}', '192.168.1.101', 'Mozilla/5.0'),
(4, 'CREATE', 'ticket', 2, '{"ticket_number": "INT-002", "status": "waiting"}', '192.168.1.101', 'Mozilla/5.0'),
(7, 'LOGIN', 'user', 7, '{"role": "doctor"}', '192.168.1.102', 'Mozilla/5.0'),
(7, 'UPDATE', 'ticket', 1, '{"status": "completed"}', '192.168.1.102', 'Mozilla/5.0');

-- ============================================
-- Insert Sample Daily Statistics
-- ============================================
INSERT INTO daily_statistics (stat_date, clinic_id, doctor_id, total_tickets, completed_tickets, cancelled_tickets, no_show_tickets, average_service_time, average_waiting_time, total_patients) VALUES
(CURRENT_DATE - INTERVAL '1 day', 1, 1, 25, 22, 1, 2, 16, 28, 22),
(CURRENT_DATE - INTERVAL '1 day', 2, 2, 18, 16, 1, 1, 21, 35, 16),
(CURRENT_DATE - INTERVAL '1 day', 3, 3, 30, 28, 0, 2, 13, 20, 28),
(CURRENT_DATE - INTERVAL '1 day', 4, 4, 15, 14, 1, 0, 19, 32, 14),
(CURRENT_DATE - INTERVAL '1 day', 5, 5, 20, 18, 1, 1, 11, 25, 18),
(CURRENT_DATE - INTERVAL '1 day', 6, 6, 22, 20, 2, 0, 16, 30, 20);

-- ============================================
-- Update Sequences
-- ============================================
-- This ensures that auto-increment IDs continue from the correct value
SELECT setval('users_user_id_seq', (SELECT MAX(user_id) FROM users));
SELECT setval('clinics_clinic_id_seq', (SELECT MAX(clinic_id) FROM clinics));
SELECT setval('doctors_doctor_id_seq', (SELECT MAX(doctor_id) FROM doctors));
SELECT setval('patients_patient_id_seq', (SELECT MAX(patient_id) FROM patients));
SELECT setval('tickets_ticket_id_seq', (SELECT MAX(ticket_id) FROM tickets));
SELECT setval('sms_notifications_notification_id_seq', (SELECT MAX(notification_id) FROM sms_notifications));
SELECT setval('audit_logs_log_id_seq', (SELECT MAX(log_id) FROM audit_logs));
SELECT setval('system_settings_setting_id_seq', (SELECT MAX(setting_id) FROM system_settings));
SELECT setval('daily_statistics_stat_id_seq', (SELECT MAX(stat_id) FROM daily_statistics));

-- ============================================
-- Success Message
-- ============================================
DO $$
BEGIN
    RAISE NOTICE '============================================';
    RAISE NOTICE 'Hospital Queue Management System';
    RAISE NOTICE 'Seed data inserted successfully!';
    RAISE NOTICE '============================================';
    RAISE NOTICE 'Users created: 12';
    RAISE NOTICE '  - Super Admin: 1';
    RAISE NOTICE '  - Admin: 2';
    RAISE NOTICE '  - Receptionist: 3';
    RAISE NOTICE '  - Doctor: 6';
    RAISE NOTICE 'Clinics created: 6';
    RAISE NOTICE 'Patients created: 10';
    RAISE NOTICE 'Sample tickets: 11';
    RAISE NOTICE 'System settings: 12';
    RAISE NOTICE '============================================';
    RAISE NOTICE 'Default Login Credentials:';
    RAISE NOTICE 'Username: admin';
    RAISE NOTICE 'Password: Admin@123';
    RAISE NOTICE '============================================';
    RAISE NOTICE 'All passwords are: Admin@123';
    RAISE NOTICE 'Please change default passwords in production!';
    RAISE NOTICE '============================================';
END $$;
