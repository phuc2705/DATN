USE housekeeping_service;

-- Kiểm tra tổng số records
SELECT
    (SELECT COUNT(*) FROM users) AS total_users,
    (SELECT COUNT(*) FROM customers) AS total_customers,
    (SELECT COUNT(*) FROM helpers) AS total_helpers,
    (SELECT COUNT(*) FROM services) AS total_services,
    (SELECT COUNT(*) FROM helper_services) AS total_helper_services,
    (SELECT COUNT(*) FROM schedules) AS total_schedules;

-- Xem danh sách 12 người giúp việc
SELECT
    h.helper_id,
    u.full_name,
    h.address,
    h.experience_years,
    h.rating_average,
    h.hourly_rate,
    h.is_available
FROM helpers h
JOIN users u ON h.user_id = u.user_id
ORDER BY h.helper_id;

-- Kiểm tra các dịch vụ của helpers
SELECT
    u.full_name AS helper_name,
    COUNT(hs.service_id) AS total_services
FROM helpers h
JOIN users u ON h.user_id = u.user_id
LEFT JOIN helper_services hs ON h.helper_id = hs.helper_id
GROUP BY h.helper_id, u.full_name
ORDER BY h.helper_id;
