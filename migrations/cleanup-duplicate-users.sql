-- Script para limpiar usuarios duplicados sin .com
-- Mantiene solo los usuarios con .com (o dominios conocidos como gmail, hotmail, digital)

-- Identificar usuarios sin .com que tienen un duplicado con .com
DELETE FROM users 
WHERE id IN (
  SELECT u1.id
  FROM users u1
  WHERE u1.email NOT LIKE '%.com'
  AND u1.email NOT LIKE '%.gmail'
  AND u1.email NOT LIKE '%.hotmail'
  AND u1.email NOT LIKE '%.digital'
  AND EXISTS (
    SELECT 1 FROM users u2 
    WHERE u2.email = CONCAT(u1.email, '.com')
  )
);

-- Verificar resultado
SELECT COUNT(*) as total_usuarios FROM users;
SELECT email FROM users ORDER BY email;
