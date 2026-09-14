CREATE OR REPLACE FUNCTION auth.uuid_eq_text(uuid, text) RETURNS boolean AS $$
SELECT $1::text = $2;
$$ LANGUAGE sql IMMUTABLE;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_operator o 
        JOIN pg_namespace n ON o.oprnamespace = n.oid
        JOIN pg_type t1 ON o.oprleft = t1.oid 
        JOIN pg_type t2 ON o.oprright = t2.oid 
        WHERE n.nspname = 'auth' AND o.oprname = '=' AND t1.typname = 'uuid' AND t2.typname = 'text'
    ) THEN
        CREATE OPERATOR auth.= (
            LEFTARG = uuid,
            RIGHTARG = text,
            PROCEDURE = auth.uuid_eq_text
        );
    END IF;
END $$;
