-- Catalog of corporations (electoral corporations / bodies)
INSERT INTO corporations (name, "createdAt", "updatedAt")
SELECT v.name, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM (
    VALUES
        ('Gobernación'),
        ('Alcaldía'),
        ('Concejo Municipal'),
        ('Presidencia'),
        ('Asamblea'),
        ('Edil / JAL')
) AS v(name)
WHERE NOT EXISTS (
    SELECT 1 FROM corporations c WHERE c.name = v.name
);
