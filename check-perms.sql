SELECT DISTINCT r.name, p.name 
FROM roles r 
JOIN role_permissions rp ON r.id = rp."roleId" 
JOIN permissions p ON rp."permissionId" = p.id 
WHERE p.name = 'dashboard:read' 
ORDER BY r.name;
