# 🗄️ Database Documentation

## نظام إدارة التذاكر والعيادات - قاعدة البيانات

---

## 📋 المحتويات

- [schema.sql](#schemasql) - هيكل قاعدة البيانات الكامل
- [seed.sql](#seedsql) - البيانات الأولية
- [التثبيت](#-التثبيت)
- [الجداول](#-الجداول)
- [الدوال والإجراءات](#-الدوال-والإجراءات)
- [الـ Views](#-views)

---

## 📁 الملفات

### schema.sql
يحتوي على:
- ✅ 9 جداول رئيسية
- ✅ جميع الفهارس (Indexes)
- ✅ القيود (Constraints)
- ✅ 3 دوال مخصصة (Functions)
- ✅ 6 Triggers للتحديث التلقائي
- ✅ 2 Views للاستعلامات الشائعة

### seed.sql
يحتوي على:
- ✅ 12 إعداد للنظام
- ✅ 12 مستخدم (1 Super Admin, 2 Admin, 3 Receptionist, 6 Doctor)
- ✅ 6 عيادات
- ✅ 10 مرضى نموذجيين
- ✅ تذاكر نموذجية
- ✅ بيانات إحصائية

---

## 🚀 التثبيت

### المتطلبات
- PostgreSQL 15+ مثبت ويعمل
- صلاحيات إنشاء قاعدة بيانات

### الخطوات

#### 1. إنشاء قاعدة البيانات
```bash
createdb hospital_queue
```

أو من داخل PostgreSQL:
```sql
CREATE DATABASE hospital_queue;
```

#### 2. تنفيذ Schema
```bash
psql -d hospital_queue -f schema.sql
```

**المخرجات المتوقعة:**
```
NOTICE: ============================================
NOTICE: Hospital Queue Management System
NOTICE: Database schema created successfully!
NOTICE: ============================================
NOTICE: Tables created: 9
NOTICE: Indexes created: Multiple
NOTICE: Functions created: 3
NOTICE: Views created: 2
NOTICE: Triggers created: 6
```

#### 3. تنفيذ Seed Data
```bash
psql -d hospital_queue -f seed.sql
```

**المخرجات المتوقعة:**
```
NOTICE: ============================================
NOTICE: Seed data inserted successfully!
NOTICE: Users created: 12
NOTICE: Clinics created: 6
NOTICE: Patients created: 10
NOTICE: Default Login: admin / Admin@123
```

#### 4. التحقق من التثبيت
```bash
psql -d hospital_queue -c "\dt"
```

يجب أن ترى 9 جداول.

---

## 📊 الجداول

### 1. users (المستخدمون)
```sql
user_id         SERIAL PRIMARY KEY
username        VARCHAR(50) UNIQUE NOT NULL
password_hash   VARCHAR(255) NOT NULL
full_name       VARCHAR(100) NOT NULL
email           VARCHAR(100) UNIQUE
phone           VARCHAR(20)
role            VARCHAR(20) -- super_admin, admin, doctor, receptionist
is_active       BOOLEAN DEFAULT true
last_login      TIMESTAMP
created_at      TIMESTAMP
updated_at      TIMESTAMP
```

**الأدوار:**
- `super_admin`: صلاحيات كاملة
- `admin`: إدارة المستخدمين والعيادات
- `doctor`: استدعاء المرضى
- `receptionist`: إصدار التذاكر

---

### 2. clinics (العيادات)
```sql
clinic_id                   SERIAL PRIMARY KEY
clinic_name_ar              VARCHAR(100) NOT NULL
clinic_name_en              VARCHAR(100) NOT NULL
clinic_code                 VARCHAR(10) UNIQUE NOT NULL
department                  VARCHAR(50)
status                      VARCHAR(20) -- active, inactive, closed
average_time_per_patient    INTEGER DEFAULT 15
working_hours_start         TIME
working_hours_end           TIME
created_at                  TIMESTAMP
updated_at                  TIMESTAMP
```

---

### 3. doctors (الأطباء)
```sql
doctor_id           SERIAL PRIMARY KEY
user_id             INTEGER UNIQUE REFERENCES users
clinic_id           INTEGER REFERENCES clinics
specialization      VARCHAR(100)
license_number      VARCHAR(50) UNIQUE
is_available        BOOLEAN DEFAULT false
current_status      VARCHAR(20) -- online, busy, break, offline
created_at          TIMESTAMP
updated_at          TIMESTAMP
```

---

### 4. patients (المرضى)
```sql
patient_id              SERIAL PRIMARY KEY
medical_record_number   VARCHAR(50) UNIQUE
full_name               VARCHAR(100) NOT NULL
phone                   VARCHAR(20) NOT NULL
national_id             VARCHAR(20) UNIQUE
date_of_birth           DATE
gender                  VARCHAR(10) -- male, female
email                   VARCHAR(100)
created_at              TIMESTAMP
updated_at              TIMESTAMP
```

---

### 5. tickets (التذاكر)
```sql
ticket_id               SERIAL PRIMARY KEY
ticket_number           VARCHAR(20) UNIQUE NOT NULL
clinic_id               INTEGER REFERENCES clinics
patient_id              INTEGER REFERENCES patients
doctor_id               INTEGER REFERENCES doctors
issued_by               INTEGER REFERENCES users
status                  VARCHAR(20) -- waiting, called, serving, completed, cancelled, no_show
priority                INTEGER -- 0: عادي, 1: أولوية, 2: طارئ
queue_position          INTEGER
issued_at               TIMESTAMP
called_at               TIMESTAMP
serving_started_at      TIMESTAMP
completed_at            TIMESTAMP
estimated_time          INTEGER
actual_service_time     INTEGER
notes                   TEXT
created_at              TIMESTAMP
updated_at              TIMESTAMP
```

**حالات التذكرة:**
- `waiting`: في قائمة الانتظار
- `called`: تم الاستدعاء
- `serving`: جاري الخدمة
- `completed`: تمت الخدمة
- `cancelled`: ملغية
- `no_show`: لم يحضر

---

### 6. sms_notifications (إشعارات SMS)
```sql
notification_id     SERIAL PRIMARY KEY
ticket_id           INTEGER REFERENCES tickets
phone               VARCHAR(20) NOT NULL
message             TEXT NOT NULL
notification_type   VARCHAR(20) -- issued, reminder, called
status              VARCHAR(20) -- pending, sent, failed
sent_at             TIMESTAMP
error_message       TEXT
created_at          TIMESTAMP
```

---

### 7. audit_logs (سجلات التدقيق)
```sql
log_id          SERIAL PRIMARY KEY
user_id         INTEGER REFERENCES users
action          VARCHAR(50) NOT NULL
entity_type     VARCHAR(50)
entity_id       INTEGER
old_values      JSONB
new_values      JSONB
ip_address      INET
user_agent      TEXT
created_at      TIMESTAMP
```

---

### 8. system_settings (إعدادات النظام)
```sql
setting_id      SERIAL PRIMARY KEY
setting_key     VARCHAR(50) UNIQUE NOT NULL
setting_value   TEXT
setting_type    VARCHAR(20) -- string, number, boolean, json
description     TEXT
is_public       BOOLEAN DEFAULT false
created_at      TIMESTAMP
updated_at      TIMESTAMP
```

---

### 9. daily_statistics (الإحصائيات اليومية)
```sql
stat_id                 SERIAL PRIMARY KEY
stat_date               DATE NOT NULL
clinic_id               INTEGER REFERENCES clinics
doctor_id               INTEGER REFERENCES doctors
total_tickets           INTEGER DEFAULT 0
completed_tickets       INTEGER DEFAULT 0
cancelled_tickets       INTEGER DEFAULT 0
no_show_tickets         INTEGER DEFAULT 0
average_service_time    INTEGER
average_waiting_time    INTEGER
total_patients          INTEGER DEFAULT 0
created_at              TIMESTAMP
UNIQUE(stat_date, clinic_id, doctor_id)
```

---

## 🔧 الدوال والإجراءات

### 1. update_updated_at_column()
تحديث تلقائي لعمود `updated_at` عند أي تعديل

**الاستخدام:**
يتم تطبيقها تلقائياً عبر Triggers على الجداول.

---

### 2. generate_ticket_number(clinic_code)
توليد رقم تذكرة فريد لكل عيادة

**الاستخدام:**
```sql
SELECT generate_ticket_number('INT');
-- Output: INT-001
```

**الصيغة:** `CLINIC_CODE-XXX`
- `INT-001` للتذكرة الأولى في عيادة الباطنية
- `ORTH-012` للتذكرة الثانية عشر في عيادة العظام

---

### 3. calculate_queue_position(clinic_id)
حساب موقع المريض في قائمة الانتظار

**الاستخدام:**
```sql
SELECT calculate_queue_position(1);
-- Output: 5 (يوجد 4 في الانتظار، هذا سيكون الخامس)
```

---

## 👁️ Views

### 1. v_clinic_queue_status
عرض شامل لحالة قائمة الانتظار في كل عيادة

**الأعمدة:**
- معلومات العيادة (ID, الاسم بالعربي والإنجليزي، الكود، الحالة)
- معلومات الطبيب (ID, الاسم، الحالة)
- عدد المنتظرين
- عدد الذين يتم خدمتهم حالياً
- رقم التذكرة الحالية
- رقم التذكرة التالية

**الاستخدام:**
```sql
SELECT * FROM v_clinic_queue_status;
```

**مثال للنتائج:**
```
clinic_id | clinic_name_ar  | waiting_count | current_ticket | next_ticket
----------+-----------------+---------------+----------------+-------------
    1     | عيادة الباطنية  |      5        |    INT-042     |   INT-043
    2     | عيادة العظام    |      3        |    ORTH-018    |   ORTH-019
```

---

### 2. v_today_statistics
إحصائيات اليوم الحالي لكل عيادة

**الأعمدة:**
- معلومات العيادة
- عدد التذاكر المكتملة اليوم
- عدد المنتظرين حالياً
- عدد الذين لم يحضروا
- عدد الملغية
- متوسط وقت الخدمة
- إجمالي التذاكر اليوم

**الاستخدام:**
```sql
SELECT * FROM v_today_statistics;
```

---

## 🔐 البيانات الأولية (Seed Data)

### المستخدمون الافتراضيون

#### Super Admin
- **Username:** `admin`
- **Password:** `Admin@123`
- **الصلاحيات:** كاملة

#### Admin
- `admin1` / `Admin@123`
- `admin2` / `Admin@123`

#### Receptionist
- `receptionist1` / `Admin@123`
- `receptionist2` / `Admin@123`
- `receptionist3` / `Admin@123`

#### Doctors
- `doctor1` / `Admin@123` - د. أحمد محمد (عيادة الباطنية)
- `doctor2` / `Admin@123` - د. سارة علي (عيادة العظام)
- `doctor3` / `Admin@123` - د. محمد خالد (عيادة الأطفال)
- `doctor4` / `Admin@123` - د. فاطمة حسن (عيادة القلب)
- `doctor5` / `Admin@123` - د. عبدالله سعيد (عيادة الجلدية)
- `doctor6` / `Admin@123` - د. نورة عبدالعزيز (عيادة الأنف والأذن)

> ⚠️ **تحذير:** يجب تغيير كلمات المرور الافتراضية في بيئة الإنتاج!

---

### العيادات
1. عيادة الباطنية (INT)
2. عيادة العظام (ORTH)
3. عيادة الأطفال (PED)
4. عيادة القلب (CARD)
5. عيادة الأمراض الجلدية (DERM)
6. عيادة الأنف والأذن والحنجرة (ENT)

---

## 🔍 استعلامات مفيدة

### عرض جميع التذاكر المنتظرة
```sql
SELECT
    t.ticket_number,
    c.clinic_name_ar,
    p.full_name as patient_name,
    t.priority,
    t.issued_at,
    t.estimated_time
FROM tickets t
JOIN clinics c ON t.clinic_id = c.clinic_id
JOIN patients p ON t.patient_id = p.patient_id
WHERE t.status = 'waiting'
ORDER BY c.clinic_id, t.priority DESC, t.issued_at ASC;
```

---

### إحصائيات عيادة محددة لليوم
```sql
SELECT
    c.clinic_name_ar,
    COUNT(*) as total_tickets,
    COUNT(CASE WHEN t.status = 'completed' THEN 1 END) as completed,
    COUNT(CASE WHEN t.status = 'waiting' THEN 1 END) as waiting,
    AVG(CASE WHEN t.actual_service_time IS NOT NULL THEN t.actual_service_time END) as avg_time
FROM tickets t
JOIN clinics c ON t.clinic_id = c.clinic_id
WHERE DATE(t.issued_at) = CURRENT_DATE
  AND c.clinic_id = 1
GROUP BY c.clinic_name_ar;
```

---

### أداء طبيب محدد
```sql
SELECT
    u.full_name as doctor_name,
    COUNT(*) as total_patients,
    COUNT(CASE WHEN t.status = 'completed' THEN 1 END) as completed,
    AVG(t.actual_service_time) as avg_service_time
FROM tickets t
JOIN doctors d ON t.doctor_id = d.doctor_id
JOIN users u ON d.user_id = u.user_id
WHERE DATE(t.issued_at) = CURRENT_DATE
  AND d.doctor_id = 1
GROUP BY u.full_name;
```

---

### آخر الإشعارات المرسلة
```sql
SELECT
    t.ticket_number,
    s.phone,
    s.notification_type,
    s.status,
    s.sent_at
FROM sms_notifications s
JOIN tickets t ON s.ticket_id = t.ticket_id
ORDER BY s.created_at DESC
LIMIT 10;
```

---

## 🔧 الصيانة

### Backup
```bash
# Full backup
pg_dump -U postgres -d hospital_queue > backup_$(date +%Y%m%d_%H%M%S).sql

# Schema only
pg_dump -U postgres -d hospital_queue --schema-only > schema_backup.sql

# Data only
pg_dump -U postgres -d hospital_queue --data-only > data_backup.sql
```

### Restore
```bash
psql -U postgres -d hospital_queue < backup_20251110_120000.sql
```

### Vacuum and Analyze
```sql
VACUUM ANALYZE;
```

---

## 📈 التوسع المستقبلي

يمكن توسعة قاعدة البيانات لتشمل:
- ✨ جدول للمواعيد المسبقة
- ✨ جدول للملفات الطبية والتقارير
- ✨ جدول للأدوية والوصفات
- ✨ جدول للفواتير والمدفوعات
- ✨ جدول للملاحظات الطبية
- ✨ Partitioning للجداول الكبيرة (tickets, audit_logs)

---

## 🆘 استكشاف الأخطاء

### خطأ: "relation already exists"
```bash
# إعادة إنشاء قاعدة البيانات من الصفر
dropdb hospital_queue
createdb hospital_queue
psql -d hospital_queue -f schema.sql
psql -d hospital_queue -f seed.sql
```

### خطأ: "permission denied"
```bash
# تأكد من صلاحيات المستخدم
psql -U postgres -c "GRANT ALL PRIVILEGES ON DATABASE hospital_queue TO your_user;"
```

---

## 📞 الدعم

للمزيد من المعلومات، راجع:
- [hospital_system_plan.md](../hospital_system_plan.md)
- [README.md](../README.md)

---

**تم إنشاء قاعدة البيانات بنجاح! 🎉**
