import psycopg2
from psycopg2 import pool

class PostgreSQL():
    def __init__(self, db_host, db_port, db_name, db_user, db_password):
        self.db_host, self.db_port, self.db_name = db_host, db_port, db_name
        self.db_user, self.db_password = db_user, db_password

        self.pool = psycopg2.pool.SimpleConnectionPool(
            1,
            20,
            host=self.db_host,
            port=self.db_port,
            dbname=self.db_name,
            user=self.db_user,
            password=self.db_password
        )

    def create_connection(self):
        return self.pool.getconn()

    def execute_query(self, query, params=None, fetchall=False, fetchone=False, commit=False):
        conn = self.create_connection()
        cur = conn.cursor()

        try:
            cur.execute(query, params)

            if commit:
                conn.commit()

            if cur.description is None:
                return [] if fetchall else None

            if fetchall:
                return cur.fetchall()
            elif fetchone:
                return cur.fetchone()
            else:
                return cur.rowcount

        except Exception as e:
            conn.rollback()
            raise e

        finally:
            cur.close()
            self.pool.putconn(conn)

    def close_connection(self, commit=False):
        #self.pool.closeall()
        pass