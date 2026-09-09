SELECT COUNT(*) as total, COUNT(DISTINCT "createdByUserId") as distinct_creators FROM voters;
SELECT * FROM voters LIMIT 5;
